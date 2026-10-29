/** Destinatário do pedido de criação/validação do agente captado. */
export const EMAIL_SUPORTE_COMERCIAL =
  (import.meta.env.VITE_EMAIL_SUPORTE_COMERCIAL as string | undefined)?.trim() || "suportecomercial@zap.co.ao";

export function urlItemAgenteSharePoint(id: number): string {
  return `https://zapcoao.sharepoint.com/sites/AgentesAO/Lists/BD_Agentes_Palhativa/DispForm.aspx?ID=${id}`;
}

export interface ResumoEmailCaptacao {
  codigoAgente: number;
  nome: string;
  provincia: string;
  municipio: string;
  tipoAgente: string;
  email?: string;
  consultor?: string;
  idSharePoint: number;
  quantidadeAnexos: number;
}

/** Abre o Outlook (Web) com e-mail pré-preenchido para o suporte comercial. */
export function abrirEmailSuporteCaptacao(resumo: ResumoEmailCaptacao): void {
  const linhas = [
    "Olá, Suporte Comercial,",
    "",
    "Foi registada uma nova captação de agente na app Agente 360. Solicitamos a criação/validação do agente na rede.",
    "",
    `Código (Title): ${resumo.codigoAgente}`,
    `Nome: ${resumo.nome}`,
    `Província: ${resumo.provincia}`,
    `Município: ${resumo.municipio}`,
    `Tipo de agente: ${resumo.tipoAgente}`,
    resumo.email ? `Email do agente: ${resumo.email}` : "",
    resumo.consultor ? `Consultor (captador): ${resumo.consultor}` : "",
    `Registo SharePoint (ID ${resumo.idSharePoint}): ${urlItemAgenteSharePoint(resumo.idSharePoint)}`,
    resumo.quantidadeAnexos > 0
      ? `Documentos: ${resumo.quantidadeAnexos} ficheiro(s) anexado(s) ao item na lista BD_Agentes_Palhativa.`
      : "Documentos: nenhum anexo.",
    "",
    "Com os melhores cumprimentos,",
    "Agente 360",
  ].filter(Boolean);

  const deeplink = new URL("https://outlook.office.com/mail/deeplink/compose");
  deeplink.searchParams.set("to", EMAIL_SUPORTE_COMERCIAL);
  deeplink.searchParams.set("subject", `Captação Agente 360 — ${resumo.codigoAgente} — ${resumo.nome}`);
  deeplink.searchParams.set("body", linhas.join("\r\n"));

  window.open(deeplink.toString(), "_blank", "noopener,noreferrer");
}
