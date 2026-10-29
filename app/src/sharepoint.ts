import { useEffect, useState } from "react";
import { BD_Agentes_PalhativaService, type BD_Agentes_PalhativaModel } from "./generated";
import { municipiosOficiaisAngola } from "./dados/municipiosAngola";
import { resolverProvinciaCatalogo } from "./dados/provinciasAngola";
import { descobrirGrafiasConsultor, mesmaPessoa, mesmaPessoaQue, valoresExactosConsultor } from "./identidade";
import { ERRO_FORA_DO_HOST, dentroDoPowerApps } from "./powerHost";

/**
 * Espelha a lista SharePoint real "BD_Agentes_Palhativa"
 * (site https://zapcoao.sharepoint.com/sites/AgentesAO). Os valores de
 * TipoAgente e Estado são os que realmente existem nos ~3700 registos —
 * não há ciclo de vida Captado→Activo nesta lista, só este "Status".
 */
export const TIPOS_AGENTE = [
  "Agente Produto com rappel",
  "Agente Produto sem rappel",
  "Agente Zapadinha com rappel",
  "Agente Zapadinha sem Rappel",
] as const;
export type TipoAgente = (typeof TIPOS_AGENTE)[number];

export type TipoAgenteBase = "Produto" | "Zapadinha";

export function baseTipoAgente(tipo: TipoAgente): TipoAgenteBase {
  return tipo.includes("Produto") ? "Produto" : "Zapadinha";
}

export function temRappel(tipo: TipoAgente): boolean {
  return /com rappel/i.test(tipo);
}

export const STATUS_AGENTE = ["Ag-C-Investimentos", "Ag-S-Investimentos"] as const;
export type EstadoAgente = (typeof STATUS_AGENTE)[number];
export type OrigemLocalizacao = "gps" | "pesquisa" | "mapa";

export function badgeClassAgente(estado: EstadoAgente): string {
  return estado === "Ag-C-Investimentos" ? "badge-verde" : "badge-cinza";
}

/** Telefone ou e-mail conhecido na BD (notas comerciais field_13 ou Email). */
export function contactoPrincipalAgente(agente: Agente): string {
  return [agente.contacto, agente.contactoAlt, agente.email].find((v) => v?.trim())?.trim() ?? "";
}

export function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function formatarData(data: string): string {
  return data ? new Date(data).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

/** Equivalente ao formato "[$-pt-PT]# ##0,00" usado na app canvas. */
export function formatarMoeda(valor: number): string {
  return `${valor.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AOA`;
}

export function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-PT");
}

export interface Agente {
  id: number;
  /** Número puro — a lista real não usa o formato "AGT-000001". */
  codigoAgente: number;
  nome: string;
  provincia: string;
  municipio: string;
  email?: string;
  tipoAgente: TipoAgente;
  estado: EstadoAgente;
  dataCaptacao: string;
  utilizadorCaptacao: string;
  emailCaptacao?: string;
  dataActualizacao: string;
  utilizadorActualizacao?: string;
  emailActualizacao?: string;
  consultor?: string;
  coordenador?: string;
  regiao?: string;
  zona?: string;
  eixo?: string;
  perfil?: string;
  unidadeGestao?: string;
  contacto?: string;
  contactoAlt?: string;
  morada?: string;
  latitude?: number;
  longitude?: number;
  origemLocalizacao?: OrigemLocalizacao;
  outraOperadora?: boolean;
  operadora?: string;
  capitalPrimeiraCompra?: number;
  anexos?: string[];
  temAnexos?: boolean;
}

function paraTipoAgente(valor?: string): TipoAgente {
  return (TIPOS_AGENTE as readonly string[]).includes(valor ?? "") ? (valor as TipoAgente) : TIPOS_AGENTE[0];
}

function paraEstado(valor?: string): EstadoAgente {
  return (STATUS_AGENTE as readonly string[]).includes(valor ?? "") ? (valor as EstadoAgente) : STATUS_AGENTE[1];
}

function parseOrigem(valor?: string): OrigemLocalizacao | undefined {
  return valor === "gps" || valor === "pesquisa" || valor === "mapa" ? valor : undefined;
}

function parseNotasComerciais(texto?: string): Pick<Agente, "contacto" | "contactoAlt" | "outraOperadora" | "operadora" | "capitalPrimeiraCompra" | "anexos"> {
  if (!texto) return {};
  const resto = texto.replace(/Tel2\s+([^·]+)/i, "").trim();
  const contactoAlt = texto.match(/Tel2\s+([^·]+)/i)?.[1]?.trim();
  const contacto = resto.match(/Tel\s+([^·]+)/i)?.[1]?.trim();
  const opRaw = texto.match(/Operadora:\s*([^·]+)/i)?.[1]?.trim();
  const capitalRaw = texto.match(/1ª compra\s+([\d\s.,]+)/i)?.[1];
  const anexosRaw = texto.match(/Anexos:\s*(.+)$/i)?.[1];
  const capital = capitalRaw ? Number(capitalRaw.replace(/\s/g, "").replace(",", ".")) : undefined;
  return {
    contacto,
    contactoAlt,
    outraOperadora: opRaw ? !/^n[aã]o$/i.test(opRaw) : undefined,
    operadora: opRaw && !/^n[aã]o$/i.test(opRaw) ? opRaw : undefined,
    capitalPrimeiraCompra: capital != null && Number.isFinite(capital) ? capital : undefined,
    anexos: anexosRaw ? anexosRaw.split(",").map((n) => n.trim()).filter(Boolean) : undefined,
  };
}

function parseNotasLocal(texto?: string): Pick<Agente, "morada" | "latitude" | "longitude" | "origemLocalizacao"> {
  if (!texto) return {};
  const gps = texto.match(/GPS\s+(-?\d+[.,]\d+)\s*,\s*(-?\d+[.,]\d+)(?:\s+(gps|pesquisa|mapa))?/i);
  const morada = texto.replace(/\s*·\s*GPS\s+.+$/i, "").trim();
  return {
    morada: morada || undefined,
    latitude: gps ? Number(gps[1].replace(",", ".")) : undefined,
    longitude: gps ? Number(gps[2].replace(",", ".")) : undefined,
    origemLocalizacao: parseOrigem(gps?.[3]?.toLowerCase()),
  };
}

function mapearAgente(raw: BD_Agentes_PalhativaModel.BD_Agentes_PalhativaRead): Agente {
  const comerciais = parseNotasComerciais(raw.field_13);
  const local = parseNotasLocal(raw.field_15);
  return {
    id: raw.ID ?? 0,
    codigoAgente: Number(raw.Title) || 0,
    nome: raw.field_1?.trim() || "(sem nome)",
    provincia: raw.field_2 ?? "",
    municipio: raw.field_3 ?? "",
    tipoAgente: paraTipoAgente(raw.field_4),
    estado: paraEstado(raw.field_17),
    email: raw.Email || undefined,
    dataCaptacao: raw.field_16 ?? raw.Created ?? "",
    utilizadorCaptacao: raw.Author?.DisplayName ?? "",
    emailCaptacao: raw.Author?.Email || undefined,
    dataActualizacao: raw.Modified ?? raw.Created ?? "",
    utilizadorActualizacao: raw.Editor?.DisplayName || undefined,
    emailActualizacao: raw.Editor?.Email || undefined,
    consultor: raw.field_5 || undefined,
    coordenador: raw.field_6 || undefined,
    regiao: raw.field_8 || undefined,
    zona: raw.field_9 || undefined,
    eixo: raw.field_10 || undefined,
    perfil: raw.field_12 || undefined,
    unidadeGestao: raw.field_14 || undefined,
    temAnexos: raw["{HasAttachments}"] || Boolean(comerciais.anexos?.length),
    ...comerciais,
    ...local,
  };
}

/** Páginas mais pequenas = 1.ª resposta mais rápida em redes móveis. */
const TAMANHO_PAGINA = 200;
const MAX_PAGINAS = 40;
const TIMEOUT_PAGINA_MS = 25000;

/** Campos mínimos para listagens — evita payload pesado no telemóvel. */
const CAMPOS_AGENTE_LISTA = [
  "ID",
  "Title",
  "field_1",
  "field_2",
  "field_3",
  "field_4",
  "field_5",
  "field_8",
  "field_9",
  "field_10",
  "field_13",
  "field_15",
  "field_16",
  "field_17",
  "Email",
  "Created",
  "Modified",
  "{HasAttachments}",
] as const;

function escaparOData(texto: string): string {
  return texto.replace(/'/g, "''");
}

export type UtilizadorConsultor = { nome: string; email: string };

/** Valores do campo Consultor (field_5) aceites no filtro, incluindo grafias descobertas. */
function valoresConsultorField5(utilizador: UtilizadorConsultor): string[] {
  const valores = new Set(valoresExactosConsultor(utilizador));
  grafiasConsultorDescobertas.get(chaveUtilizador(utilizador))?.forEach((v) => valores.add(v));
  return [...valores];
}

function chaveUtilizador(utilizador: UtilizadorConsultor): string {
  return `${utilizador.nome}\0${utilizador.email}`;
}

/** Grafia real do field_5 (ex.: com acentos) confirmada para o utilizador. */
const grafiasConsultorDescobertas = new Map<string, Set<string>>();
const promessasGrafiaConsultor = new Map<string, Promise<void>>();

/** Filtro OData sobre o campo Consultor (field_5) na BD_Agentes_Palhativa. */
export function filtroConsultorField5(utilizador: UtilizadorConsultor): string | undefined {
  const valores = valoresConsultorField5(utilizador);
  if (!valores.length) return undefined;
  const partes = valores.map((v) => `field_5 eq '${escaparOData(v)}'`);
  return partes.length === 1 ? partes[0] : `(${partes.join(" or ")})`;
}

/**
 * O SharePoint compara texto sem distinguir maiúsculas mas distingue acentos:
 * "sebastiao pongo" (Entra ID) não encontra "Sebastião Pongo" (field_5).
 * As grafias descobertas (validadas por mesmaPessoaQue) passam a integrar o
 * filtro exacto da carteira, da pesquisa por código e das sugestões.
 */
async function descobrirGrafiaConsultor(utilizador: UtilizadorConsultor): Promise<void> {
  const encontrados = await descobrirGrafiasConsultor(
    utilizador,
    valoresExactosConsultor(utilizador),
    async ({ prefixos, excluir, top }) => {
      const comeca = `(${prefixos.map((p) => `startswith(field_5,'${escaparOData(p)}')`).join(" or ")})`;
      const exclusao = excluir.map((v) => ` and field_5 ne '${escaparOData(v)}'`).join("");
      const resultado = await comTimeout(
        BD_Agentes_PalhativaService.getAll({ top, filter: `${comeca}${exclusao}`, select: ["ID", "field_5"] }),
        TIMEOUT_PAGINA_MS,
      );
      if (!resultado.success) throw resultado.error ?? new Error("Falha ao identificar o consultor");
      return resultado.data.map((r) => r.field_5);
    },
  );
  if (encontrados.length) grafiasConsultorDescobertas.set(chaveUtilizador(utilizador), new Set(encontrados));
}

/** Filtro do consultor depois de resolvida a grafia real em field_5. */
async function resolverFiltroConsultor(utilizador: UtilizadorConsultor): Promise<string | undefined> {
  const chave = chaveUtilizador(utilizador);
  let promessa = promessasGrafiaConsultor.get(chave);
  if (!promessa) {
    promessa = descobrirGrafiaConsultor(utilizador).catch((erro) => {
      promessasGrafiaConsultor.delete(chave);
      throw erro;
    });
    promessasGrafiaConsultor.set(chave, promessa);
  }
  await promessa;
  return filtroConsultorField5(utilizador);
}

function fundirAgentesCache(novos: Agente[]) {
  if (!novos.length) return;
  const porId = new Map(agentesEmCache.map((a) => [a.id, a]));
  for (const a of novos) porId.set(a.id, a);
  agentesEmCache = [...porId.values()];
  notificarPagina(agentesEmCache);
}

function comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promessa,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Tempo esgotado ao carregar dados")), ms)),
  ]);
}

let promessaCarteira: Promise<Agente[]> | null = null;
let chaveCarteiraAtiva = "";
let agentesEmCache: Agente[] = [];
let carteiraPronta = false;
const ouvintesAgentes = new Set<() => void>();
const ouvintesPagina = new Set<(agentes: Agente[]) => void>();
const ouvintesCarteira = new Set<(estado: { carregando: boolean; erro: boolean }) => void>();

function notificarPagina(agentes: Agente[]) {
  agentesEmCache = [...agentes];
  ouvintesPagina.forEach((fn) => fn(agentesEmCache));
}

function substituirCacheCarteira(agentes: Agente[]) {
  agentesEmCache = [...agentes];
  ouvintesPagina.forEach((fn) => fn(agentesEmCache));
}

async function buscarPaginaAgentes(filtro?: string, ultimoId = 0): Promise<Agente[]> {
  const filtroId = ultimoId > 0 ? `ID gt ${ultimoId}` : "";
  const filter = filtro && filtroId ? `${filtro} and ${filtroId}` : filtro || filtroId || undefined;
  const resultado = await comTimeout(
    BD_Agentes_PalhativaService.getAll({
      top: TAMANHO_PAGINA,
      orderBy: ["ID asc"],
      filter,
      select: [...CAMPOS_AGENTE_LISTA],
    }),
    TIMEOUT_PAGINA_MS,
  );
  if (!resultado.success) throw resultado.error ?? new Error("Falha ao carregar agentes");
  return resultado.data.map(mapearAgente);
}

async function buscarAgentesCarteira(utilizador: UtilizadorConsultor): Promise<Agente[]> {
  if (!dentroDoPowerApps()) throw new Error(ERRO_FORA_DO_HOST);

  const filtroConsultor = await resolverFiltroConsultor(utilizador);
  if (!filtroConsultor) return [];

  const porId = new Map<number, Agente>();
  let ultimoId = 0;
  for (let pag = 0; pag < MAX_PAGINAS; pag += 1) {
    const pagina = await buscarPaginaAgentes(filtroConsultor, ultimoId);
    if (!pagina.length) break;
    for (const a of pagina) {
      if (agenteNaCarteiraConsultor(a, utilizador)) porId.set(a.id, a);
    }
    ultimoId = pagina.reduce((max, a) => Math.max(max, a.id), ultimoId);
    const listaParcial = [...porId.values()];
    // Só refresca a UI na 1.ª página e no fim — evita centenas de re-renders no telemóvel.
    if (pag === 0 || pagina.length < TAMANHO_PAGINA) {
      substituirCacheCarteira(listaParcial);
    }
    if (pagina.length < TAMANHO_PAGINA) break;
  }

  const final = [...porId.values()];
  substituirCacheCarteira(final);
  return final;
}

function carregarCarteira(utilizador: UtilizadorConsultor): Promise<Agente[]> {
  const chave = `${utilizador.nome}\0${utilizador.email}`;
  if (promessaCarteira && chaveCarteiraAtiva === chave) return promessaCarteira;
  if (chaveCarteiraAtiva !== chave) {
    substituirCacheCarteira([]);
    carteiraPronta = false;
  }
  chaveCarteiraAtiva = chave;
  carteiraPronta = false;
  ouvintesCarteira.forEach((fn) => fn({ carregando: true, erro: false }));

  promessaCarteira = buscarAgentesCarteira(utilizador)
    .catch(() => buscarAgentesCarteira(utilizador))
    .then((lista) => {
      substituirCacheCarteira(lista);
      carteiraPronta = true;
      ouvintesCarteira.forEach((fn) => fn({ carregando: false, erro: false }));
      return lista;
    })
    .catch((erro) => {
      promessaCarteira = null;
      carteiraPronta = false;
      ouvintesCarteira.forEach((fn) => fn({ carregando: false, erro: true }));
      throw erro;
    });

  return promessaCarteira;
}

/** Carteira do consultor — não descarrega os ~3700 agentes da rede. */
export function usePrecarregarCarteira(utilizador: { nome: string; email: string } | null) {
  useEffect(() => {
    if (!utilizador?.nome && !utilizador?.email) return;
    carregarCarteira(utilizador).catch(() => undefined);
  }, [utilizador?.nome, utilizador?.email]);
}

interface EstadoAgentesReais {
  agentes: Agente[];
  carregando: boolean;
  progresso: number;
  erro: boolean;
  tentarNovamente: () => void;
  catalogoCompleto: boolean;
}

/** Só agentes da carteira do consultor (field_5) — nunca a base completa. */
export function useAgentesReais(
  utilizador?: UtilizadorConsultor | null,
  opcoes?: { activo?: boolean },
): EstadoAgentesReais {
  const activo = opcoes?.activo ?? Boolean(utilizador?.nome?.trim() || utilizador?.email?.trim());
  const [agentes, setAgentes] = useState<Agente[]>(() => agentesEmCache);
  const [carregando, setCarregando] = useState(() => !carteiraPronta && !agentesEmCache.length);
  const [progresso, setProgresso] = useState(() => agentesEmCache.length);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    const aoReceberPagina = (parcial: Agente[]) => {
      if (!cancelado) {
        setAgentes(parcial);
        setProgresso(parcial.length);
      }
    };
    const aoCarteira = (estado: { carregando: boolean; erro: boolean }) => {
      if (cancelado) return;
      setCarregando(estado.carregando);
      if (estado.erro) setErro(true);
      if (!estado.carregando && !estado.erro) {
        setAgentes(agentesEmCache);
        setProgresso(agentesEmCache.length);
      }
    };
    if (agentesEmCache.length) {
      setAgentes(agentesEmCache);
      setProgresso(agentesEmCache.length);
    }
    ouvintesPagina.add(aoReceberPagina);
    ouvintesCarteira.add(aoCarteira);

    if (!activo) {
      if (agentesEmCache.length) {
        setAgentes(agentesEmCache);
        setProgresso(agentesEmCache.length);
      }
      setCarregando(false);
      setErro(false);
    } else if (utilizador?.nome || utilizador?.email) {
      carregarCarteira(utilizador)
        .then(() => {
          if (!cancelado) {
            setAgentes(agentesEmCache);
            setProgresso(agentesEmCache.length);
            setCarregando(false);
          }
        })
        .catch(() => {
          if (!cancelado) {
            setErro(true);
            setCarregando(false);
          }
        });
    } else {
      setCarregando(false);
      setAgentes([]);
      setProgresso(0);
    }

    return () => {
      cancelado = true;
      ouvintesPagina.delete(aoReceberPagina);
      ouvintesCarteira.delete(aoCarteira);
    };
  }, [activo, tentativa, utilizador?.nome, utilizador?.email]);

  useEffect(() => {
    const ouvinte = () => {
      setCarregando(true);
      setProgresso(0);
      setErro(false);
      setTentativa((t) => t + 1);
    };
    ouvintesAgentes.add(ouvinte);
    return () => {
      ouvintesAgentes.delete(ouvinte);
    };
  }, []);

  function tentarNovamente() {
    setCarregando(true);
    setProgresso(0);
    setErro(false);
    promessaCarteira = null;
    carteiraPronta = false;
    setTentativa((t) => t + 1);
  }

  return { agentes, carregando, progresso, erro, tentarNovamente, catalogoCompleto: false };
}

/** Contagem e estado da carteira — sem subscrever actualizações página a página (header). */
export function useEstadoCarteira(
  utilizador?: UtilizadorConsultor | null,
  opcoes?: { activo?: boolean },
): { total: number; carregando: boolean; erro: boolean } {
  const activo = opcoes?.activo ?? Boolean(utilizador?.nome?.trim() || utilizador?.email?.trim());
  const [total, setTotal] = useState(() => agentesEmCache.length);
  const [carregando, setCarregando] = useState(() => !carteiraPronta && !agentesEmCache.length);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    const aoCarteira = (estado: { carregando: boolean; erro: boolean }) => {
      if (cancelado) return;
      setCarregando(estado.carregando);
      if (estado.erro) setErro(true);
      if (!estado.carregando && !estado.erro) {
        setTotal(agentesEmCache.length);
      }
    };
    setTotal(agentesEmCache.length);
    ouvintesCarteira.add(aoCarteira);

    if (!activo) {
      setTotal(agentesEmCache.length);
      setCarregando(false);
    } else if (utilizador?.nome || utilizador?.email) {
      carregarCarteira(utilizador)
        .then(() => {
          if (!cancelado) {
            setTotal(agentesEmCache.length);
            setCarregando(false);
          }
        })
        .catch(() => {
          if (!cancelado) {
            setErro(true);
            setCarregando(false);
          }
        });
    } else {
      setCarregando(false);
      setTotal(0);
    }

    return () => {
      cancelado = true;
      ouvintesCarteira.delete(aoCarteira);
    };
  }, [activo, tentativa, utilizador?.nome, utilizador?.email]);

  useEffect(() => {
    const ouvinte = () => setTentativa((t) => t + 1);
    ouvintesAgentes.add(ouvinte);
    return () => {
      ouvintesAgentes.delete(ouvinte);
    };
  }, []);

  return { total, carregando, erro };
}

/** Title na lista é o código do agente (número em texto). */
export async function buscarAgentePorCodigo(
  codigo: number,
  utilizador?: UtilizadorConsultor | null,
): Promise<Agente | null> {
  if (!codigo || !dentroDoPowerApps()) return null;
  let filtroConsultor: string | undefined;
  try {
    filtroConsultor = utilizador ? await resolverFiltroConsultor(utilizador) : undefined;
  } catch {
    return null;
  }
  const filter = filtroConsultor ? `Title eq '${codigo}' and ${filtroConsultor}` : `Title eq '${codigo}'`;
  const resultado = await comTimeout(
    BD_Agentes_PalhativaService.getAll({
      top: 10,
      filter,
    }),
    15000,
  );
  if (!resultado.success) return null;
  const agente = resultado.data.map(mapearAgente).find((a) => a.codigoAgente === codigo) ?? null;
  if (!agente) return null;
  if (utilizador && !agenteNaCarteiraConsultor(agente, utilizador)) return null;
  fundirAgentesCache([agente]);
  return agente;
}

/** Sugestões enquanto se escreve o código (Title) ou o nome (field_1). */
export async function buscarAgentesPorPrefixo(
  prefixo: string,
  utilizador: UtilizadorConsultor,
): Promise<Agente[]> {
  const limpo = prefixo.trim().replace(/'/g, "");
  if (!limpo || !dentroDoPowerApps()) return [];
  let filtroConsultor: string | undefined;
  try {
    filtroConsultor = await resolverFiltroConsultor(utilizador);
  } catch {
    return [];
  }
  if (!filtroConsultor) return [];
  const soNumero = /^\d+$/.test(limpo);
  const filtroTexto = soNumero ? `startswith(Title,'${limpo}')` : `startswith(field_1,'${limpo}')`;
  const filter = `${filtroTexto} and ${filtroConsultor}`;
  const resultado = await comTimeout(
    BD_Agentes_PalhativaService.getAll({
      top: 20,
      orderBy: soNumero ? ["Title asc"] : ["field_1 asc"],
      filter,
    }),
    12000,
  );
  if (!resultado.success) return [];
  return resultado.data
    .map(mapearAgente)
    .filter((a) => agenteNaCarteiraConsultor(a, utilizador));
}

export function invalidarCacheAgentes() {
  promessaCarteira = null;
  chaveCarteiraAtiva = "";
  agentesEmCache = [];
  carteiraPronta = false;
  ouvintesAgentes.forEach((fn) => fn());
}

/** Próximo código sem descarregar toda a lista. */
export async function obterProximoCodigoAgente(): Promise<number> {
  if (!dentroDoPowerApps()) return 1;
  let maximo = 0;
  let ultimoId = 0;
  for (let pag = 0; pag < 4; pag += 1) {
    const resultado = await comTimeout(
      BD_Agentes_PalhativaService.getAll({
        top: TAMANHO_PAGINA,
        orderBy: ["ID desc"],
        filter: ultimoId > 0 ? `ID lt ${ultimoId}` : undefined,
        select: ["ID", "Title"],
      }),
      12000,
    );
    if (!resultado.success || !resultado.data.length) break;
    for (const raw of resultado.data) {
      maximo = Math.max(maximo, Number(raw.Title) || 0);
    }
    const ids = resultado.data.map((r) => r.ID ?? 0).filter((id) => id > 0);
    if (!ids.length) break;
    ultimoId = Math.min(...ids);
    if (resultado.data.length < TAMANHO_PAGINA) break;
  }
  return maximo + 1;
}

export function agenteEmCache(codigoAgente: number): Agente | undefined {
  return agentesEmCache.find((a) => a.codigoAgente === codigoAgente);
}

export interface DadosNovoAgente {
  codigoAgente: number;
  nome: string;
  provincia: string;
  municipio: string;
  tipoAgente: TipoAgente;
  email?: string;
  contacto?: string;
  contactoAlt?: string;
  zona?: string;
  eixo?: string;
  regiao?: string;
  morada?: string;
  latitude?: number;
  longitude?: number;
  origemLocalizacao?: OrigemLocalizacao;
  outraOperadora?: boolean;
  operadora?: string;
  capitalPrimeiraCompra?: number;
  consultor?: string;
  anexos?: string[];
}

const LIMITE_CAMPO_TEXTO = 255;

function cortarCampo(texto: string, max = LIMITE_CAMPO_TEXTO): string {
  const t = texto.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function textoNotasComerciais(
  dados: Pick<DadosNovoAgente, "contacto" | "contactoAlt" | "outraOperadora" | "operadora" | "capitalPrimeiraCompra" | "anexos">,
): string {
  const partes: string[] = [];
  if (dados.contacto) partes.push(`Tel ${dados.contacto}`);
  if (dados.contactoAlt) partes.push(`Tel2 ${dados.contactoAlt}`);
  if (dados.outraOperadora) partes.push(`Operadora: ${dados.operadora?.trim() || "sim"}`);
  else if (dados.outraOperadora === false) partes.push("Operadora: não");
  if (dados.capitalPrimeiraCompra != null && Number.isFinite(dados.capitalPrimeiraCompra)) {
    partes.push(`1ª compra ${dados.capitalPrimeiraCompra} AOA`);
  }
  if (dados.anexos?.length) partes.push(`Anexos: ${dados.anexos.join(", ")}`);
  return partes.join(" · ");
}

function textoNotasLocal(
  dados: Pick<DadosNovoAgente, "morada" | "latitude" | "longitude" | "origemLocalizacao">,
): string {
  const partes: string[] = [];
  if (dados.morada?.trim()) partes.push(dados.morada.trim());
  if (dados.latitude != null && dados.longitude != null) {
    const origem = dados.origemLocalizacao ? ` ${dados.origemLocalizacao}` : "";
    partes.push(`GPS ${dados.latitude.toFixed(5)},${dados.longitude.toFixed(5)}${origem}`);
  }
  return partes.join(" · ");
}

/** Valida campos de notas antes de gravar — evita truncamento silencioso no SharePoint. */
export function validarCamposNotasAgente(
  dados: Pick<
    DadosNovoAgente,
    "contacto" | "contactoAlt" | "outraOperadora" | "operadora" | "capitalPrimeiraCompra" | "anexos" | "morada" | "latitude" | "longitude" | "origemLocalizacao"
  >,
): string | null {
  const comercial = textoNotasComerciais(dados);
  const local = textoNotasLocal(dados);
  if (comercial.length > LIMITE_CAMPO_TEXTO) {
    return "Resumo comercial demasiado longo (telefones, operadora ou lista de anexos). Reduza o texto ou remova anexos da lista.";
  }
  if (local.length > LIMITE_CAMPO_TEXTO) {
    return "Morada ou localização demasiado longa para a lista. Encurte a morada.";
  }
  return null;
}

function notasComerciais(dados: Pick<DadosNovoAgente, "contacto" | "contactoAlt" | "outraOperadora" | "operadora" | "capitalPrimeiraCompra" | "anexos">): string | undefined {
  const texto = textoNotasComerciais(dados);
  return texto ? cortarCampo(texto) : undefined;
}

function notasLocal(dados: Pick<DadosNovoAgente, "morada" | "latitude" | "longitude" | "origemLocalizacao">): string | undefined {
  const texto = textoNotasLocal(dados);
  return texto ? cortarCampo(texto) : undefined;
}

export async function criarAgente(dados: DadosNovoAgente): Promise<Agente> {
  const erroNotas = validarCamposNotasAgente(dados);
  if (erroNotas) throw new Error(erroNotas);

  let codigoAgente = dados.codigoAgente;
  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    const ocupado = await buscarAgentePorCodigo(codigoAgente);
    if (!ocupado) break;
    codigoAgente += 1;
  }

  const agora = new Date().toISOString();
  const resultado = await BD_Agentes_PalhativaService.create({
    Title: String(codigoAgente),
    field_1: dados.nome.trim(),
    field_2: dados.provincia,
    field_3: dados.municipio,
    field_4: dados.tipoAgente,
    field_5: dados.consultor?.trim() || undefined,
    field_8: dados.regiao?.trim() || undefined,
    field_9: dados.zona?.trim() || undefined,
    field_10: dados.eixo?.trim() || undefined,
    field_13: notasComerciais(dados),
    field_15: notasLocal(dados),
    field_17: STATUS_AGENTE[1],
    field_16: agora,
    Email: dados.email?.trim() || undefined,
  });
  if (!resultado.success || !resultado.data) {
    throw resultado.error ?? new Error("Não foi possível gravar o agente no SharePoint.");
  }
  invalidarCacheAgentes();
  const agente = mapearAgente(resultado.data);
  return agente;
}

/** Cria o agente e anexa ficheiros ao item SharePoint (se fornecidos). */
export async function criarAgenteComAnexos(
  dados: DadosNovoAgente,
  ficheiros?: File[],
): Promise<{ agente: Agente; anexosGravados: number }> {
  const agente = await criarAgente(dados);
  if (!ficheiros?.length) return { agente, anexosGravados: 0 };
  const { anexarFicheirosAoAgente } = await import("./anexosAgente");
  const anexosGravados = await anexarFicheirosAoAgente(agente.id, ficheiros);
  return { agente, anexosGravados };
}

export async function actualizarAgente(id: number, dados: Omit<DadosNovoAgente, "codigoAgente" | "consultor">): Promise<Agente> {
  const erroNotas = validarCamposNotasAgente(dados);
  if (erroNotas) throw new Error(erroNotas);

  const resultado = await BD_Agentes_PalhativaService.update(String(id), {
    field_1: dados.nome.trim(),
    field_2: dados.provincia,
    field_3: dados.municipio,
    field_4: dados.tipoAgente,
    field_8: dados.regiao?.trim() || undefined,
    field_9: dados.zona?.trim() || undefined,
    field_10: dados.eixo?.trim() || undefined,
    field_13: notasComerciais(dados),
    field_15: notasLocal(dados),
    Email: dados.email?.trim() || undefined,
  });
  if (!resultado.success || !resultado.data) {
    throw resultado.error ?? new Error("Não foi possível actualizar o agente no SharePoint.");
  }
  invalidarCacheAgentes();
  return mapearAgente(resultado.data);
}

export function proximoCodigoAgente(agentes: Agente[]): number {
  const maximo = agentes.reduce((max, a) => Math.max(max, a.codigoAgente), 0);
  return maximo + 1;
}

export function tempoRelativo(iso: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff) || diff < 0) return formatarData(iso);
  const minutos = Math.round(diff / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.round(horas / 24);
  if (dias < 30) return `há ${dias}d`;
  return formatarData(iso);
}

function noMes(iso: string, ano: number, mes: number): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === ano && d.getMonth() === mes;
}

export interface ContagemProvincia {
  provincia: string;
  total: number;
}

export function contarPorProvincia(agentes: Agente[]): ContagemProvincia[] {
  const mapa = new Map<string, number>();
  for (const a of agentes) {
    const nome = a.provincia.trim() || "(sem província)";
    mapa.set(nome, (mapa.get(nome) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([provincia, total]) => ({ provincia, total }))
    .sort((a, b) => b.total - a.total || a.provincia.localeCompare(b.provincia, "pt"));
}

export function provincasDosAgentes(agentes: Agente[]): string[] {
  return [...new Set(agentes.map((a) => a.provincia.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt"));
}

function provinciaCoincide(agenteProvincia: string, provincia: string): boolean {
  return resolverProvinciaCatalogo(agenteProvincia) === resolverProvinciaCatalogo(provincia);
}

/** Catálogo oficial + municípios já usados na BD para a província. */
export function municipiosDaProvincia(agentes: Agente[], provincia: string): string[] {
  const conjunto = new Set(municipiosOficiaisAngola(provincia));
  for (const a of agentes) {
    if (provinciaCoincide(a.provincia, provincia) && a.municipio.trim()) {
      conjunto.add(a.municipio.trim());
    }
  }
  return [...conjunto].sort((a, b) => a.localeCompare(b, "pt"));
}

export function zonasDaProvincia(agentes: Agente[], provincia: string): string[] {
  return [...new Set(agentes.filter((a) => provinciaCoincide(a.provincia, provincia)).map((a) => a.zona?.trim()).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b, "pt"),
  );
}

export function eixosDosAgentes(agentes: Agente[], provincia?: string): string[] {
  const lista = provincia ? agentes.filter((a) => provinciaCoincide(a.provincia, provincia)) : agentes;
  return [...new Set(lista.map((a) => a.eixo?.trim()).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt"));
}

/** Eixos usados na BD para a combinação província + zona. */
export function eixosDaZona(agentes: Agente[], provincia: string, zona: string): string[] {
  const z = zona.trim();
  if (!z) return [];
  return [
    ...new Set(
      agentes
        .filter((a) => provinciaCoincide(a.provincia, provincia) && a.zona?.trim() === z)
        .map((a) => a.eixo?.trim())
        .filter(Boolean) as string[],
    ),
  ].sort((a, b) => a.localeCompare(b, "pt"));
}

export interface GeoProvinciaBd {
  municipios: string[];
  zonas: string[];
  eixoPorZona: Record<string, string[]>;
}

function escaparODataTexto(valor: string): string {
  return valor.replace(/'/g, "''");
}

/** Municípios, zonas e eixos por zona na BD (sem filtro de consultor). */
export async function buscarGeoProvinciaBd(provincia: string): Promise<GeoProvinciaBd> {
  const chave = resolverProvinciaCatalogo(provincia);
  const municipios = new Set(municipiosOficiaisAngola(chave));
  const zonas = new Set<string>();
  const eixoPorZona: Record<string, Set<string>> = {};

  if (!chave || !dentroDoPowerApps()) {
    return { municipios: [...municipios].sort((a, b) => a.localeCompare(b, "pt")), zonas: [], eixoPorZona: {} };
  }

  const variantes = [...new Set([chave, provincia.trim()].filter(Boolean))];
  for (const variante of variantes) {
    let ultimoId = 0;
    for (let pag = 0; pag < 3; pag += 1) {
      const filter = `field_2 eq '${escaparODataTexto(variante)}'${ultimoId > 0 ? ` and ID lt ${ultimoId}` : ""}`;
      const resultado = await comTimeout(
        BD_Agentes_PalhativaService.getAll({
          top: 200,
          filter,
          select: ["ID", "field_2", "field_3", "field_9", "field_10"],
        }),
        15000,
      );
      if (!resultado.success || !resultado.data.length) break;
      for (const raw of resultado.data) {
        const mun = String(raw.field_3 ?? "").trim();
        if (mun) municipios.add(mun);
        const zona = String(raw.field_9 ?? "").trim();
        const eixo = String(raw.field_10 ?? "").trim();
        if (zona) {
          zonas.add(zona);
          if (eixo) {
            if (!eixoPorZona[zona]) eixoPorZona[zona] = new Set();
            eixoPorZona[zona].add(eixo);
          }
        }
      }
      const ids = resultado.data.map((r) => r.ID ?? 0).filter((id) => id > 0);
      if (!ids.length) break;
      ultimoId = Math.min(...ids);
      if (resultado.data.length < TAMANHO_PAGINA) break;
    }
  }

  const eixoPorZonaLista: Record<string, string[]> = {};
  for (const [zona, conjunto] of Object.entries(eixoPorZona)) {
    eixoPorZonaLista[zona] = [...conjunto].sort((a, b) => a.localeCompare(b, "pt"));
  }

  return {
    municipios: [...municipios].sort((a, b) => a.localeCompare(b, "pt")),
    zonas: [...zonas].sort((a, b) => a.localeCompare(b, "pt")),
    eixoPorZona: eixoPorZonaLista,
  };
}

export function regioesDosAgentes(agentes: Agente[], provincia?: string): string[] {
  const lista = provincia ? agentes.filter((a) => a.provincia === provincia) : agentes;
  return [...new Set(lista.map((a) => a.regiao?.trim()).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt"));
}

export type TipoActividade = "captado" | "actualizado";

export interface ActividadeRecente {
  id: number;
  codigoAgente: number;
  tipo: TipoActividade;
  titulo: string;
  subtitulo: string;
  quando: string;
}

export function agenteDoUtilizador(
  agente: Agente,
  utilizador: { nome: string; email: string },
): boolean {
  const actorNome = agente.utilizadorActualizacao || agente.utilizadorCaptacao;
  const actorEmail = agente.emailActualizacao || agente.emailCaptacao;
  return (
    mesmaPessoa(actorNome, utilizador.nome) ||
    mesmaPessoa(actorEmail, utilizador.email) ||
    mesmaPessoa(agente.utilizadorCaptacao, utilizador.nome) ||
    mesmaPessoa(agente.emailCaptacao, utilizador.email) ||
    mesmaPessoa(agente.consultor, utilizador.nome) ||
    mesmaPessoa(agente.consultor, utilizador.email)
  );
}

export const actividadeDoUtilizador = agenteDoUtilizador;

export function agentesDoUtilizador(
  agentes: Agente[],
  utilizador?: { nome: string; email: string } | null,
): Agente[] {
  if (!utilizador?.nome && !utilizador?.email) return [];
  return agentes.filter((a) => agenteDoUtilizador(a, utilizador));
}

export { mesmaPessoaQue };

/** Carteira = agentes cujo Consultor (field_5) corresponde ao utilizador logado. */
export function agenteNaCarteiraConsultor(
  agente: Agente,
  utilizador: UtilizadorConsultor,
): boolean {
  return mesmaPessoaQue(agente.consultor, utilizador);
}

export function actividadeRecente(
  agentes: Agente[],
  utilizador?: { nome: string; email: string } | null,
  limite = 8,
): ActividadeRecente[] {
  return [...agentesDoUtilizador(agentes, utilizador)]
    .sort((a, b) => new Date(b.dataActualizacao).getTime() - new Date(a.dataActualizacao).getTime())
    .slice(0, limite)
    .map((a) => {
      const criado = new Date(a.dataCaptacao).getTime();
      const modificado = new Date(a.dataActualizacao).getTime();
      const captado = !a.dataCaptacao || Math.abs(modificado - criado) < 60 * 60 * 1000;
      return {
        id: a.id,
        codigoAgente: a.codigoAgente,
        tipo: captado ? "captado" : "actualizado",
        titulo: captado ? `Agente captado · ${a.codigoAgente}` : `Agente actualizado · ${a.codigoAgente}`,
        subtitulo: [a.nome, a.municipio, a.provincia].filter(Boolean).join(" · "),
        quando: tempoRelativo(a.dataActualizacao),
      };
    });
}

export function indicadoresDashboard(agentes: Agente[]) {
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();
  const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
  const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

  const comInvestimentos = agentes.filter((a) => a.estado === "Ag-C-Investimentos").length;
  const semInvestimentos = agentes.filter((a) => a.estado === "Ag-S-Investimentos").length;
  const novosEsteMes = agentes.filter((a) => noMes(a.dataCaptacao, anoAtual, mesAtual)).length;
  const novosMesAnterior = agentes.filter((a) => noMes(a.dataCaptacao, anoMesAnterior, mesAnterior)).length;
  const produto = agentes.filter((a) => baseTipoAgente(a.tipoAgente) === "Produto").length;
  const zapadinha = agentes.filter((a) => baseTipoAgente(a.tipoAgente) === "Zapadinha").length;

  return {
    total: agentes.length,
    comInvestimentos,
    semInvestimentos,
    novosEsteMes,
    novosMesAnterior,
    produto,
    zapadinha,
    deltaNovos: novosEsteMes - novosMesAnterior,
  };
}

/**
 * Campos reais da lista "Controlo de visitas Agentes" (site AgentesAO) —
 * é uma única lista que junta os dados da visita e do checklist.
 */
export type TipoAgenteVisita = "Agente Zapadinha" | "Agente Producto" | "Sub-Agente";
export const TIPOS_AGENTE_VISITA: TipoAgenteVisita[] = ["Agente Producto", "Agente Zapadinha", "Sub-Agente"];

export const TIPOS_VISITA = [
  "Visita de cortezia",
  "Visita de formação",
  "visita de incentivo de investimento",
  "Visita para verificar comunicação na loja de agente",
  "Visita para acompanhar atendimento do Agente",
  "Visita para aconpanhar divulgação da campanha",
  "Visita de suporte ao aplicativo",
] as const;
export type TipoVisita = (typeof TIPOS_VISITA)[number];

export function tipoAgenteVisitaPadrao(tipo: TipoAgente): TipoAgenteVisita {
  return baseTipoAgente(tipo) === "Produto" ? "Agente Producto" : "Agente Zapadinha";
}

export const OPCOES_FLYBANNER = ["Sim", "Não", "Danificado"] as const;
export const OPCOES_MERCHANDISING = ["Tem", "Não tem", "Desatualizados"] as const;
export const OPCOES_PLACA_PONTO_ZAP = ["Tem", "Não tem", "Danificado"] as const;
export const OPCOES_TEM_NAO_TEM = ["Tem", "Não tem"] as const;
export const OPCOES_STOCK_BOXES = ["+5", "-10", "-50", "+50", "N/A"] as const;
export const OPCOES_ZAPADINHAS_PONTOS = ["150 pts", "300 pts", "600 pts", "Pontos"] as const;
export const OPCOES_USA_MOBILE = ["Sim", "Não usa"] as const;

/**
 * Escala de comissionamento oficial do rappel. Os limites são de PVP (valor
 * com IVA) e a percentagem não depende do tipo de agente — só do PVP. A
 * comissão incide sobre o montante sem IVA. Agentes "sem rappel" não têm
 * comissão.
 */
export interface EscalaRappel {
  volumeMinimo: number;
  volumeMaximo: number;
  percentagem: number;
}

export const RAPPEL_TAXA_IVA = 0.14;
export const RAPPEL_PVP_MINIMO = 50500;

export const ESCALAS_RAPPEL: EscalaRappel[] = [
  { volumeMinimo: RAPPEL_PVP_MINIMO, volumeMaximo: 502228.13, percentagem: 4 },
  { volumeMinimo: 502228.14, volumeMaximo: 1597996.13, percentagem: 6 },
  { volumeMinimo: 1597996.14, volumeMaximo: 3195991.13, percentagem: 7 },
  { volumeMinimo: 3195991.14, volumeMaximo: 6255010.13, percentagem: 8 },
  { volumeMinimo: 6255010.14, volumeMaximo: 102591280.13, percentagem: 8.5 },
  { volumeMinimo: 102591280.14, volumeMaximo: Infinity, percentagem: 9 },
];

export function montanteSemIva(montantePvp: number): number {
  return montantePvp / (1 + RAPPEL_TAXA_IVA);
}

/**
 * Procura da faixa mais alta para a mais baixa: os limites da tabela têm só
 * duas casas decimais, pelo que um PVP entre 502 228,13 e 502 228,14 não
 * pertence a nenhuma faixa e ficaria sem comissão.
 */
export function escalaRappel(montantePvp: number): EscalaRappel | undefined {
  for (let i = ESCALAS_RAPPEL.length - 1; i >= 0; i--) {
    if (montantePvp >= ESCALAS_RAPPEL[i].volumeMinimo) return ESCALAS_RAPPEL[i];
  }
  return undefined;
}

export function calcularRappel(tipoAgente: TipoAgente, montantePvp: number) {
  const semIva = montanteSemIva(montantePvp);
  if (!temRappel(tipoAgente)) {
    return { elegivel: false as const, percentagem: 0, semIva, comissao: 0, escalas: [] as EscalaRappel[] };
  }
  const escala = escalaRappel(montantePvp);
  return {
    elegivel: true as const,
    percentagem: escala?.percentagem ?? 0,
    semIva,
    comissao: escala ? (semIva * escala.percentagem) / 100 : 0,
    escalas: ESCALAS_RAPPEL,
    escalaAplicada: escala,
  };
}
