import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getContext, type IContext } from "@microsoft/power-apps/app";
import { dentroDoPowerApps, marcarHostPowerApps } from "./powerHost";

export interface UtilizadorSessao {
  nome: string;
  email: string;
  objectId?: string;
  tenantId?: string;
}

export type FaseAuth = "loading" | "ready" | "error";

interface AuthContextValue {
  fase: FaseAuth;
  utilizador: UtilizadorSessao | null;
  tentarIdentificar: () => void;
}

const CACHE_SESSAO = "agente360-sessao-v1";

const AuthContext = createContext<AuthContextValue>({
  fase: "loading",
  utilizador: null,
  tentarIdentificar: () => undefined,
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sessaoDeContexto(ctx: IContext): UtilizadorSessao | null {
  const nome = ctx.user.fullName?.trim() || ctx.user.userPrincipalName?.trim();
  if (!nome) return null;
  return {
    nome,
    email: ctx.user.userPrincipalName?.trim() ?? "",
    objectId: ctx.user.objectId,
    tenantId: ctx.user.tenantId,
  };
}

function lerCacheSessao(): UtilizadorSessao | null {
  try {
    const bruto = sessionStorage.getItem(CACHE_SESSAO);
    if (!bruto) return null;
    const parsed = JSON.parse(bruto) as UtilizadorSessao;
    if (!parsed?.nome?.trim() && !parsed?.email?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function gravarCacheSessao(sessao: UtilizadorSessao) {
  try {
    sessionStorage.setItem(CACHE_SESSAO, JSON.stringify(sessao));
  } catch {
    /* quota / modo privado */
  }
}

/** Uma única promessa partilhada — evita corrida do getContext() no arranque (telemóvel). */
let promessaIdentificacao: Promise<UtilizadorSessao | null> | null = null;

/**
 * Abre o canal com o player o mais cedo possível. O player Power Apps só tira
 * o ecrã "A abrir…" depois deste aperto de mão, por isso não pode depender
 * de detectar o host pelo URL.
 */
export function iniciarLigacaoHost(): void {
  getContext()
    .then(() => marcarHostPowerApps())
    .catch(() => undefined);
}

async function identificarUtilizadorHost(): Promise<UtilizadorSessao | null> {
  const noHost = dentroDoPowerApps();
  const atrasosMs = noHost ? [0, 300, 800, 1600, 3200] : [0];
  const esperaMs = noHost ? 20000 : 6000;
  for (const atraso of atrasosMs) {
    if (atraso > 0) await sleep(atraso);
    try {
      const ctx = await Promise.race([
        getContext(),
        sleep(esperaMs).then(() => null as IContext | null),
      ]);
      if (!ctx) continue;
      marcarHostPowerApps();
      const sessao = sessaoDeContexto(ctx);
      if (sessao) {
        gravarCacheSessao(sessao);
        return sessao;
      }
    } catch {
      /* host ainda a inicializar — tentar de novo */
    }
  }
  return null;
}

function obterSessao(): Promise<UtilizadorSessao | null> {
  if (!promessaIdentificacao) {
    promessaIdentificacao = identificarUtilizadorHost().finally(() => {
      promessaIdentificacao = null;
    });
  }
  return promessaIdentificacao;
}

export function UtilizadorProvider({ children }: { children: ReactNode }) {
  const cacheInicial = useMemo(() => (dentroDoPowerApps() ? lerCacheSessao() : null), []);
  const [fase, setFase] = useState<FaseAuth>(() => (cacheInicial ? "ready" : "loading"));
  const [utilizador, setUtilizador] = useState<UtilizadorSessao | null>(() => cacheInicial);
  const [versao, setVersao] = useState(0);

  const tentarIdentificar = useCallback(() => {
    promessaIdentificacao = null;
    if (!lerCacheSessao()) setFase("loading");
    setVersao((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelado = false;
    const tinhaSessaoLocal = Boolean(lerCacheSessao());

    if (!tinhaSessaoLocal) setFase("loading");

    obterSessao()
      .then((sessao) => {
        if (cancelado) return;
        if (sessao) {
          setUtilizador(sessao);
          setFase("ready");
        } else if (!tinhaSessaoLocal) {
          setFase("error");
        }
      })
      .catch(() => {
        if (!cancelado && !tinhaSessaoLocal) setFase("error");
      });

    return () => {
      cancelado = true;
    };
  }, [versao]);

  const valor = useMemo(
    () => ({ fase, utilizador, tentarIdentificar }),
    [fase, utilizador, tentarIdentificar],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useEstadoAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/** Compatível com código existente — null enquanto loading ou erro. */
export function useUtilizadorAtual(): UtilizadorSessao | null {
  const { fase, utilizador } = useContext(AuthContext);
  return fase === "ready" ? utilizador : null;
}
