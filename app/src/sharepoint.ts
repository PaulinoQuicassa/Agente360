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
  dataActualizacao: string;
  consultor?: string;
  coordenador?: string;
  regiao?: string;
  zona?: string;
  perfil?: string;
  unidadeGestao?: string;
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
    consultor: raw.field_5 || undefined,
    coordenador: raw.field_6 || undefined,
    regiao: raw.field_8 || undefined,
    zona: raw.field_9 || undefined,
    perfil: raw.field_12 || undefined,
    unidadeGestao: raw.field_14 || undefined,
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

let promessaAgentes: Promise<Agente[]> | null = null;
const ouvintesAgentes = new Set<() => void>();
const ouvintesPagina = new Set<(agentes: Agente[]) => void>();

function notificarPagina(agentes: Agente[]) {
  const copia = [...agentes];
  ouvintesPagina.forEach((fn) => fn(copia));
}

async function buscarTodosAgentes(): Promise<Agente[]> {
  const agentes: Agente[] = [];
  let ultimoId = 0;
  let paginas = 0;

  while (paginas < MAX_PAGINAS) {
    const resultado = await comTimeout(
      BD_Agentes_PalhativaService.getAll({
        top: TAMANHO_PAGINA,
        orderBy: ["ID asc"],
        filter: ultimoId > 0 ? `ID gt ${ultimoId}` : undefined,
      }),
      20000
    );
    if (!resultado.success) {
      throw resultado.error ?? new Error("Falha ao carregar agentes");
    }
    const pagina = resultado.data.map(mapearAgente);
    if (pagina.length === 0) break;
    agentes.push(...pagina);
    ultimoId = pagina.reduce((max, a) => Math.max(max, a.id), ultimoId);
    paginas += 1;
    notificarPagina(agentes);
    if (pagina.length < TAMANHO_PAGINA) break;
  }

  return agentes;
}

function carregarAgentes(): Promise<Agente[]> {
  if (!promessaAgentes) {
    promessaAgentes = buscarTodosAgentes().catch((erro) => {
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
    const aoReceberPagina = (parcial: Agente[]) => {
      if (!cancelado) {
        setAgentes(parcial);
        setProgresso(parcial.length);
      }
    };
    ouvintesPagina.add(aoReceberPagina);
    carregarAgentes()
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
      ouvintesPagina.delete(aoReceberPagina);
    };
  }, [tentativa]);

  function tentarNovamente() {
    setCarregando(true);
    setProgresso(0);
    setErro(false);
    setTentativa((t) => t + 1);
  }

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

  return { agentes, carregando, progresso, erro, tentarNovamente };
}

export function invalidarCacheAgentes() {
  promessaAgentes = null;
  ouvintesAgentes.forEach((fn) => fn());
}

export async function criarAgente(dados: {
  codigoAgente: number;
  nome: string;
  provincia: string;
  municipio: string;
  tipoAgente: TipoAgente;
  email?: string;
}): Promise<Agente> {
  const agora = new Date().toISOString();
  const resultado = await BD_Agentes_PalhativaService.create({
    Title: String(dados.codigoAgente),
    field_1: dados.nome.trim(),
    field_2: dados.provincia,
    field_3: dados.municipio,
    field_4: dados.tipoAgente,
    field_17: STATUS_AGENTE[1],
    field_16: agora,
    Email: dados.email?.trim() || undefined,
  });
  if (!resultado.success || !resultado.data) {
    throw resultado.error ?? new Error("Não foi possível gravar o agente no SharePoint.");
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

export function municipiosDaProvincia(agentes: Agente[], provincia: string): string[] {
  return [...new Set(agentes.filter((a) => a.provincia === provincia).map((a) => a.municipio.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt"),
  );
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

export function actividadeRecente(agentes: Agente[], limite = 8): ActividadeRecente[] {
  return [...agentes]
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
