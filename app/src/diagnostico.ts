/** Estado do arranque, mostrado no ecrã quando o carregamento demora. */
export interface DiagnosticoArranque {
  etapa: string;
  erro: string;
  desde: number;
}

let estado: DiagnosticoArranque = { etapa: "", erro: "", desde: Date.now() };

export function registarEtapa(etapa: string): void {
  estado = { ...estado, etapa, desde: Date.now() };
}

export function registarErro(contexto: string, erro: unknown): void {
  estado = { ...estado, erro: `${contexto}: ${mensagemDeErro(erro)}` };
}

export function lerDiagnostico(): DiagnosticoArranque {
  return estado;
}

export function mensagemDeErro(erro: unknown): string {
  if (!erro) return "erro desconhecido";
  if (erro instanceof Error) return erro.message;
  if (typeof erro === "string") return erro;
  const msg = (erro as { message?: unknown }).message;
  if (typeof msg === "string") return msg;
  try {
    return JSON.stringify(erro).slice(0, 200);
  } catch {
    return String(erro);
  }
}
