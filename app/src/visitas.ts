import { useEffect, useState } from "react";
import { ControlodevisitasAgentesService } from "./generated";
import type {
  OPCOES_FLYBANNER,
  OPCOES_MERCHANDISING,
  OPCOES_PLACA_PONTO_ZAP,
  OPCOES_STOCK_BOXES,
  OPCOES_TEM_NAO_TEM,
  OPCOES_USA_MOBILE,
  OPCOES_ZAPADINHAS_PONTOS,
  TipoAgenteVisita,
  TipoVisita,
} from "./sharepoint";

/**
 * Lista SharePoint "Controlo de visitas Agentes" (site AgentesAO): ~56 000
 * registos em uso diário, onde cada item é a visita e o checklist juntos.
 * Só "Datadavisita", "Created" e "Modified" estão indexadas — qualquer filtro
 * tem de começar por uma delas ou o SharePoint recusa acima dos 5000 itens.
 */
export const MENSAGEM_ERRO_GRAVACAO = "Não foi possível guardar os dados. Verifique a ligação e tente novamente.";

type Flybanner = (typeof OPCOES_FLYBANNER)[number];
type Merchandising = (typeof OPCOES_MERCHANDISING)[number];
type PlacaPontoZap = (typeof OPCOES_PLACA_PONTO_ZAP)[number];
type TemNaoTem = (typeof OPCOES_TEM_NAO_TEM)[number];
type StockBoxes = (typeof OPCOES_STOCK_BOXES)[number];
type ZapadinhasPontos = (typeof OPCOES_ZAPADINHAS_PONTOS)[number];
type UsaMobile = (typeof OPCOES_USA_MOBILE)[number];

export interface DadosVisita {
  codigoAgente: number;
  tipoAgente: TipoAgenteVisita;
  tipoVisita: TipoVisita;
  nomeParceiro: string;
  contactoAgente: string;
  pontosVenda: string;
  observacoes: string;
  latitude: number;
  longitude: number;
}

export interface DadosChecklist {
  flybanner: Flybanner;
  merchandising: Merchandising;
  placaPontoZap: PlacaPontoZap;
  pendurantes: TemNaoTem;
  boxeDemonstracao: TemNaoTem;
  pinturaParede: TemNaoTem;
  stockDeBoxes: StockBoxes;
  zapadinhasPontos: ZapadinhasPontos;
  usaZapAgentesMobile: UsaMobile;
  ussd: boolean;
  antigoMobile: boolean;
  novoMobile: boolean;
  web: boolean;
  observacao: string;
  proximaVisita: string;
}

export interface Visita {
  id: number;
  codigoAgente: number;
  nomeParceiro: string;
  tipoAgente: string;
  tiposVisita: string[];
  dataVisita: string;
  proximaVisita: string;
  latitude?: number;
  longitude?: number;
  contactoAgente?: number;
  pontosVenda?: number;
  observacao: string;
  utilizador: string;
  flybanner: string;
  merchandising: string;
  placaPontoZap: string;
  pendurantes: string;
  boxeDemonstracao: string;
  pinturaParede: string;
  stockDeBoxes: string;
  zapadinhas: string[];
  usaZapAgentesMobile: string[];
  ussd: boolean;
  antigoMobile: boolean;
  novoMobile: boolean;
  web: boolean;
  /** Um item sem nenhuma resposta de checklist é uma visita por completar. */
  temChecklist: boolean;
}

/** O conector devolve escolhas como {Value, Id}; o REST puro devolve a string. */
function valorEscolha(bruto: unknown): string {
  if (typeof bruto === "string") return bruto;
  if (bruto && typeof bruto === "object" && "Value" in bruto) {
    return String((bruto as { Value?: unknown }).Value ?? "");
  }
  return "";
}

function valoresEscolha(bruto: unknown): string[] {
  if (Array.isArray(bruto)) return bruto.map(valorEscolha).filter(Boolean);
  const unico = valorEscolha(bruto);
  return unico ? [unico] : [];
}

function apenasData(iso: string): string {
  return iso.slice(0, 10);
}

function mapearVisita(bruto: Record<string, unknown>): Visita {
  const flybanner = valorEscolha(bruto.Flybanner);
  const merchandising = valorEscolha(bruto.Marchadising);
  const placaPontoZap = valorEscolha(bruto.PlacapontoZap);
  const stockDeBoxes = valorEscolha(bruto.StockdeBoxes);
  const zapadinhas = valoresEscolha(bruto.Zapadinhas);
  const autor = bruto.Author as { DisplayName?: string } | undefined;

  return {
    id: Number(bruto.ID) || 0,
    codigoAgente: Number(bruto.Codigo) || 0,
    nomeParceiro: String(bruto.Nomedoparceiro ?? ""),
    tipoAgente: valorEscolha(bruto.Agente),
    tiposVisita: valoresEscolha(bruto.TiposdeVisitas),
    dataVisita: String(bruto.Datadavisita ?? bruto.Created ?? ""),
    proximaVisita: String(bruto.DatadaPr_x00f3_ximaVisita ?? ""),
    latitude: typeof bruto.Latitude === "number" ? bruto.Latitude : undefined,
    longitude: typeof bruto.Longitude === "number" ? bruto.Longitude : undefined,
    contactoAgente: typeof bruto.ContactodoAgente === "number" ? bruto.ContactodoAgente : undefined,
    pontosVenda: typeof bruto.N_x00ba_depontosdevenda === "number" ? bruto.N_x00ba_depontosdevenda : undefined,
    observacao: String(bruto.Observa_x00e7__x00e3_o ?? ""),
    utilizador: autor?.DisplayName ?? "",
    flybanner,
    merchandising,
    placaPontoZap,
    pendurantes: valorEscolha(bruto.PendurantesAbertoefechado),
    boxeDemonstracao: valorEscolha(bruto.Boxedemostra_x00e7__x00e3_o),
    pinturaParede: valorEscolha(bruto.PinturadeParede),
    stockDeBoxes,
    zapadinhas,
    usaZapAgentesMobile: valoresEscolha(bruto.MeiosdigitaisusadopeloAgente),
    ussd: bruto.UsaMeiodecarregamentoUSSD === true,
    antigoMobile: bruto.UsaoantigoZapAgentesMobile === true,
    novoMobile: bruto.UsaonovoZapAgentesMobile === true,
    web: bruto.UsaZapAgentesWeb === true,
    temChecklist: Boolean(flybanner || merchandising || placaPontoZap || stockDeBoxes || zapadinhas.length),
  };
}

/**
 * As colunas de escolha múltipla exigem a anotação de tipo do conector; sem
 * ela o SharePoint rejeita o array. Os tipos gerados declaram estes campos
 * como objecto único, pelo que o payload é montado à parte e convertido no
 * ponto de chamada.
 */
const TIPO_COLECCAO_ESCOLHA = "#Collection(Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference)";

function escolhaMultipla(campo: string, valores: readonly string[]): Record<string, unknown> {
  return {
    [`${campo}@odata.type`]: TIPO_COLECCAO_ESCOLHA,
    [campo]: valores.map((Value) => ({ Value })),
  };
}

function numeroOuIndefinido(texto: string): number | undefined {
  const limpo = texto.replace(/\s/g, "");
  if (!limpo) return undefined;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Cria o item logo na submissão do ecrã Visitar, para que a localização e a
 * hora reais do local fiquem gravadas mesmo que o checklist não chegue a ser
 * preenchido. Os quatro booleanos são obrigatórios na lista e ficam a falso
 * até o checklist os confirmar.
 */
export async function criarVisita(dados: DadosVisita): Promise<number> {
  const hoje = apenasData(new Date().toISOString());
  const payload: Record<string, unknown> = {
    Codigo: dados.codigoAgente,
    Nomedoparceiro: dados.nomeParceiro.trim() || undefined,
    Agente: dados.tipoAgente,
    Datadavisita: hoje,
    Latitude: dados.latitude,
    Longitude: dados.longitude,
    ContactodoAgente: numeroOuIndefinido(dados.contactoAgente),
    N_x00ba_depontosdevenda: numeroOuIndefinido(dados.pontosVenda),
    Observa_x00e7__x00e3_o: dados.observacoes.trim() || undefined,
    UsaMeiodecarregamentoUSSD: false,
    UsaZapAgentesWeb: false,
    UsaonovoZapAgentesMobile: false,
    UsaoantigoZapAgentesMobile: false,
    ...escolhaMultipla("TiposdeVisitas", [dados.tipoVisita]),
  };

  const resultado = await ControlodevisitasAgentesService.create(payload as never);
  if (!resultado.success || !resultado.data) {
    throw resultado.error ?? new Error(MENSAGEM_ERRO_GRAVACAO);
  }
  return Number(resultado.data.ID) || 0;
}

/**
 * Completa o item criado pelo ecrã Visitar. A lista só tem um campo de
 * observação, por isso a nota do checklist é acrescentada à da visita em vez
 * de a substituir.
 */
export async function guardarChecklist(idVisita: number, dados: DadosChecklist): Promise<void> {
  const existente = await ControlodevisitasAgentesService.get(String(idVisita));
  const observacaoVisita = existente.success ? String(existente.data?.Observa_x00e7__x00e3_o ?? "") : "";
  const nota = dados.observacao.trim();
  const observacao = [observacaoVisita.trim(), nota].filter(Boolean).join("\n");

  const payload: Record<string, unknown> = {
    Flybanner: dados.flybanner,
    Marchadising: dados.merchandising,
    PlacapontoZap: dados.placaPontoZap,
    PendurantesAbertoefechado: dados.pendurantes,
    Boxedemostra_x00e7__x00e3_o: dados.boxeDemonstracao,
    PinturadeParede: dados.pinturaParede,
    StockdeBoxes: dados.stockDeBoxes,
    UsaMeiodecarregamentoUSSD: dados.ussd,
    UsaoantigoZapAgentesMobile: dados.antigoMobile,
    UsaonovoZapAgentesMobile: dados.novoMobile,
    UsaZapAgentesWeb: dados.web,
    DatadaPr_x00f3_ximaVisita: dados.proximaVisita || undefined,
    Observa_x00e7__x00e3_o: observacao || undefined,
    ...escolhaMultipla("Zapadinhas", [dados.zapadinhasPontos]),
    ...escolhaMultipla("MeiosdigitaisusadopeloAgente", [dados.usaZapAgentesMobile]),
  };

  const resultado = await ControlodevisitasAgentesService.update(String(idVisita), payload as never);
  if (!resultado.success) {
    throw resultado.error ?? new Error(MENSAGEM_ERRO_GRAVACAO);
  }
}

/**
 * "Codigo" não está indexada e o SharePoint recusa indexá-la enquanto a lista
 * estiver acima do limite de 5000 itens. A alternativa é atacar sempre pela
 * "Datadavisita", que está indexada: um mês de visitas cabe folgadamente no
 * limite, e as janelas correm em paralelo para custarem um só tempo de ida e
 * volta.
 */
const MESES_HISTORICO = 12;

function primeiroDiaDoMes(base: Date, deslocamento: number): string {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + deslocamento, 1)).toISOString().slice(0, 10);
}

function filtroPeriodo(inicio: string, fim: string): string {
  return `Datadavisita ge '${inicio}T00:00:00Z' and Datadavisita lt '${fim}T00:00:00Z'`;
}

async function porJanelasMensais(
  meses: number,
  filtroExtra: string,
  campos?: string[],
): Promise<Visita[]> {
  const hoje = new Date();
  const janelas = Array.from({ length: meses }, (_, i) => [primeiroDiaDoMes(hoje, -i), primeiroDiaDoMes(hoje, 1 - i)]);

  const paginas = await Promise.all(
    janelas.map(([inicio, fim]) =>
      ControlodevisitasAgentesService.getAll({
        top: 4000,
        orderBy: ["Datadavisita desc"],
        select: campos,
        filter: filtroExtra ? `${filtroPeriodo(inicio, fim)} and ${filtroExtra}` : filtroPeriodo(inicio, fim),
      }),
    ),
  );

  if (paginas.every((p) => !p.success)) {
    throw paginas[0]?.error ?? new Error("Falha ao carregar visitas");
  }

  return paginas
    .filter((p) => p.success)
    .flatMap((p) => p.data.map((r) => mapearVisita(r as unknown as Record<string, unknown>)))
    .sort((a, b) => b.dataVisita.localeCompare(a.dataVisita));
}

export function visitasDoAgente(codigoAgente: number): Promise<Visita[]> {
  return porJanelasMensais(MESES_HISTORICO, `Codigo eq ${codigoAgente}`);
}

const CAMPOS_RESUMO = ["ID", "Codigo", "Datadavisita", "DatadaPr_x00f3_ximaVisita"];

export interface ResumoVisitas {
  hoje: number;
  esteMes: number;
  mesAnterior: number;
  proximos7Dias: number;
}

/**
 * Duas janelas chegam: o mês corrente dá as contagens e o anterior a
 * comparação, truncada ao mesmo dia do mês para não medir onze dias contra
 * trinta. As próximas visitas saem das datas agendadas nesses registos,
 * porque "DatadaPróximaVisita" também não está indexada e não pode liderar
 * um filtro.
 */
export async function resumoVisitas(): Promise<ResumoVisitas> {
  const visitas = await porJanelasMensais(2, "", CAMPOS_RESUMO);
  const agora = new Date();
  const hoje = apenasData(agora.toISOString());
  const inicioMes = primeiroDiaDoMes(agora, 0);
  const inicioMesAnterior = primeiroDiaDoMes(agora, -1);
  const mesmoDiaMesAnterior = `${inicioMesAnterior.slice(0, 8)}${hoje.slice(8)}`;
  const daqui7Dias = apenasData(new Date(Date.now() + 7 * 86400000).toISOString());

  return {
    hoje: visitas.filter((v) => apenasData(v.dataVisita) === hoje).length,
    esteMes: visitas.filter((v) => apenasData(v.dataVisita) >= inicioMes).length,
    mesAnterior: visitas.filter((v) => {
      const d = apenasData(v.dataVisita);
      return d >= inicioMesAnterior && d <= mesmoDiaMesAnterior;
    }).length,
    proximos7Dias: visitas.filter((v) => {
      const d = apenasData(v.proximaVisita);
      return d >= hoje && d <= daqui7Dias;
    }).length,
  };
}

export function useResumoVisitas(): { resumo: ResumoVisitas | null; carregando: boolean; erro: boolean } {
  const [resumo, setResumo] = useState<ResumoVisitas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    resumoVisitas()
      .then((dados) => {
        if (!cancelado) {
          setResumo(dados);
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
  }, []);

  return { resumo, carregando, erro };
}

interface EstadoVisitas {
  visitas: Visita[];
  carregando: boolean;
  erro: boolean;
  tentarNovamente: () => void;
}

export function useVisitasDoAgente(codigoAgente: number): EstadoVisitas {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(false);
    visitasDoAgente(codigoAgente)
      .then((dados) => {
        if (!cancelado) {
          setVisitas(dados);
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
  }, [codigoAgente, tentativa]);

  return { visitas, carregando, erro, tentarNovamente: () => setTentativa((t) => t + 1) };
}
