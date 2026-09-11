import { useEffect, useState } from "react";
import { BD_Agentes_PalhativaService, type BD_Agentes_PalhativaModel } from "./generated";

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

export function badgeClassAgente(estado: EstadoAgente): string {
  return estado === "Ag-C-Investimentos" ? "badge-verde" : "badge-cinza";
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

export function formatarMoeda(valor: number): string {
  return `${Math.round(valor).toLocaleString("pt-PT")} AOA`;
}

export interface Agente {
  id: number;
  /** Número puro — a lista real não usa o formato "AGT-000001". */
  codigoAgente: number;
  nome: string;
  provincia: string;
  municipio: string;
  endereco?: string;
  contacto?: string;
  email?: string;
  tipoAgente: TipoAgente;
  estado: EstadoAgente;
  dataCaptacao: string;
  utilizadorCaptacao: string;
  dataActualizacao: string;
}

function paraTipoAgente(valor?: string): TipoAgente {
  return (TIPOS_AGENTE as readonly string[]).includes(valor ?? "") ? (valor as TipoAgente) : TIPOS_AGENTE[0];
}

function paraEstado(valor?: string): EstadoAgente {
  return (STATUS_AGENTE as readonly string[]).includes(valor ?? "") ? (valor as EstadoAgente) : STATUS_AGENTE[1];
}

function mapearAgente(raw: BD_Agentes_PalhativaModel.BD_Agentes_PalhativaRead): Agente {
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
    dataActualizacao: raw.Modified ?? raw.Created ?? "",
  };
}

const TAMANHO_PAGINA = 500;
const MAX_PAGINAS = 20;

function comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promessa,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Tempo esgotado ao carregar dados")), ms)),
  ]);
}

async function buscarTodosAgentes(aoReceberPagina?: (totalAteAgora: number) => void): Promise<Agente[]> {
  const agentes: Agente[] = [];
  let skipToken: string | undefined;
  let paginas = 0;

  do {
    const resultado = await comTimeout(
      BD_Agentes_PalhativaService.getAll({ top: TAMANHO_PAGINA, orderBy: ["Modified desc"], skipToken }),
      20000
    );
    if (!resultado.success) {
      throw resultado.error ?? new Error("Falha ao carregar agentes");
    }
    agentes.push(...resultado.data.map(mapearAgente));
    skipToken = resultado.skipToken;
    paginas += 1;
    aoReceberPagina?.(agentes.length);
  } while (skipToken && paginas < MAX_PAGINAS);

  return agentes;
}

let promessaAgentes: Promise<Agente[]> | null = null;

function carregarAgentes(aoReceberPagina?: (totalAteAgora: number) => void): Promise<Agente[]> {
  if (!promessaAgentes) {
    promessaAgentes = buscarTodosAgentes(aoReceberPagina).catch((erro) => {
      promessaAgentes = null;
      throw erro;
    });
  }
  return promessaAgentes;
}

interface EstadoAgentesReais {
  agentes: Agente[];
  carregando: boolean;
  progresso: number;
  erro: boolean;
  tentarNovamente: () => void;
}

export function useAgentesReais(): EstadoAgentesReais {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    carregarAgentes((totalAteAgora) => {
      if (!cancelado) setProgresso(totalAteAgora);
    })
      .then((dados) => {
        if (!cancelado) {
          setAgentes(dados);
          setCarregando(false);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setErro(true);
          setCarregando(false);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  function tentarNovamente() {
    setCarregando(true);
    setProgresso(0);
    setErro(false);
    setTentativa((t) => t + 1);
  }

  return { agentes, carregando, progresso, erro, tentarNovamente };
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
 * Escalas de rappel — dados de exemplo (a spec proíbe inventar
 * percentagens reais; substituir pela lista SharePoint "EscalasRappel"
 * quando existir). Agentes "sem rappel" não têm comissão.
 */
export interface EscalaRappel {
  tipoAgente: TipoAgenteBase;
  volumeMinimo: number;
  volumeMaximo: number;
  percentagem: number;
}

export const ESCALAS_RAPPEL: EscalaRappel[] = [
  { tipoAgente: "Produto", volumeMinimo: 0, volumeMaximo: 500000, percentagem: 3 },
  { tipoAgente: "Produto", volumeMinimo: 500001, volumeMaximo: 1000000, percentagem: 4.5 },
  { tipoAgente: "Produto", volumeMinimo: 1000001, volumeMaximo: 1500000, percentagem: 6 },
  { tipoAgente: "Produto", volumeMinimo: 1500001, volumeMaximo: Infinity, percentagem: 7.5 },
  { tipoAgente: "Zapadinha", volumeMinimo: 0, volumeMaximo: 500000, percentagem: 2 },
  { tipoAgente: "Zapadinha", volumeMinimo: 500001, volumeMaximo: 1000000, percentagem: 3.5 },
  { tipoAgente: "Zapadinha", volumeMinimo: 1000001, volumeMaximo: 1500000, percentagem: 5 },
  { tipoAgente: "Zapadinha", volumeMinimo: 1500001, volumeMaximo: Infinity, percentagem: 6.5 },
];

export function calcularRappel(tipoAgente: TipoAgente, montanteSemIva: number) {
  if (!temRappel(tipoAgente)) {
    return { elegivel: false as const, percentagem: 0, comissao: 0, escalas: [] as EscalaRappel[] };
  }
  const base = baseTipoAgente(tipoAgente);
  const escalas = ESCALAS_RAPPEL.filter((e) => e.tipoAgente === base);
  const escala = escalas.find((e) => montanteSemIva >= e.volumeMinimo && montanteSemIva <= e.volumeMaximo);
  return {
    elegivel: true as const,
    percentagem: escala?.percentagem ?? 0,
    comissao: escala ? Math.round((montanteSemIva * escala.percentagem) / 100) : 0,
    escalas,
    escalaAplicada: escala,
  };
}
