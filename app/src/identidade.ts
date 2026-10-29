/**
 * Comparação de identidade entre o utilizador Microsoft Entra ID e o texto
 * do campo Consultor (field_5) / Author das listas SharePoint.
 *
 * Só aceita correspondência quando o conjunto completo de palavras do nome
 * coincide depois de normalizado — nunca correspondência parcial.
 */

export type UtilizadorIdentidade = { nome: string; email: string };

/** Minúsculas, sem diacríticos, vírgulas/pontuação de nomes como espaço, espaços colapsados. */
export function normalizarIdentidade(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[,;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensOrdenados(valorNormalizado: string): string {
  return valorNormalizado.split(" ").filter(Boolean).sort().join(" ");
}

export function mesmaPessoa(a?: string, b?: string): boolean {
  const na = normalizarIdentidade(a ?? "");
  const nb = normalizarIdentidade(b ?? "");
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ta = tokensOrdenados(na);
  return ta.length > 0 && ta === tokensOrdenados(nb);
}

/** "sebastiao.pongo@zap.co.ao" → "Sebastiao Pongo". */
export function nomeAPartirDoEmail(email: string): string {
  const local = email.trim().split("@")[0]?.trim() ?? "";
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

/** Mesma regra usada no filtro do servidor e na validação no cliente. */
export function mesmaPessoaQue(valor: string | undefined, utilizador: UtilizadorIdentidade): boolean {
  if (!valor?.trim()) return false;
  if (mesmaPessoa(valor, utilizador.nome) || mesmaPessoa(valor, utilizador.email)) return true;
  const doEmail = utilizador.email ? nomeAPartirDoEmail(utilizador.email) : "";
  return Boolean(doEmail) && mesmaPessoa(valor, doEmail);
}

const VARIANTES_LETRA: Record<string, string[]> = {
  a: ["a", "á", "à", "â", "ã"],
  e: ["e", "é", "ê"],
  i: ["i", "í"],
  o: ["o", "ó", "ô", "õ"],
  u: ["u", "ú"],
  c: ["c", "ç"],
};

/**
 * Prefixos (com e sem acento) das palavras do nome, para descobrir no
 * SharePoint a grafia real do consultor quando a comparação exacta falha.
 * O SharePoint compara texto sem distinguir maiúsculas mas distingue acentos.
 */
export function prefixosPesquisaConsultor(utilizador: UtilizadorIdentidade, tamanho = 3, maxPorPalavra = 24): string[] {
  const palavras = new Set<string>();
  for (const origem of [utilizador.nome, nomeAPartirDoEmail(utilizador.email)]) {
    for (const p of normalizarIdentidade(origem).split(" ")) {
      if (p.length >= 2) palavras.add(p);
    }
  }

  const prefixos = new Set<string>();
  for (const palavra of palavras) {
    let variantes = [""];
    for (const letra of palavra.slice(0, tamanho)) {
      const opcoes = VARIANTES_LETRA[letra] ?? [letra];
      variantes = variantes.flatMap((v) => opcoes.map((o) => v + o));
      if (variantes.length > maxPorPalavra) {
        variantes = variantes.slice(0, maxPorPalavra);
      }
    }
    variantes.forEach((v) => prefixos.add(v));
  }
  return [...prefixos];
}
