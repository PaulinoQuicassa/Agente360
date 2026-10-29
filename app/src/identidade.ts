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

/** Valores de field_5 pesquisados com igualdade exacta a partir do nome e e-mail Entra ID. */
export function valoresExactosConsultor(utilizador: UtilizadorIdentidade): string[] {
  const valores = new Set<string>();
  const nome = utilizador.nome.trim();
  const email = utilizador.email.trim();
  if (nome) {
    valores.add(nome);
    const partes = nome.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      const primeiro = partes[0];
      const ultimo = partes[partes.length - 1];
      valores.add(`${ultimo}, ${primeiro}`);
      valores.add(`${primeiro} ${ultimo}`);
    }
  }
  if (email) {
    valores.add(email);
    const local = email.split("@")[0]?.trim();
    if (local) {
      valores.add(local);
      const doEmail = nomeAPartirDoEmail(email);
      if (doEmail) valores.add(doEmail);
    }
  }
  return [...valores].filter(Boolean);
}

/** Mesma regra usada no filtro do servidor e na validação no cliente. */
export function mesmaPessoaQue(valor: string | undefined, utilizador: UtilizadorIdentidade): boolean {
  if (!valor?.trim()) return false;
  if (mesmaPessoa(valor, utilizador.nome) || mesmaPessoa(valor, utilizador.email)) return true;
  const doEmail = utilizador.email ? nomeAPartirDoEmail(utilizador.email) : "";
  return Boolean(doEmail) && mesmaPessoa(valor, doEmail);
}

/** Consulta ao field_5: começa por um dos prefixos e não é nenhum dos valores excluídos. */
export interface ConsultaGrafias {
  prefixos: string[];
  excluir: string[];
  top: number;
}

/**
 * Descobre no SharePoint todas as grafias de field_5 que correspondem ao
 * utilizador mas que o filtro exacto não apanha (ex.: com acentos). Corre
 * sempre, mesmo que já existam linhas com a grafia exacta — uma lista pode
 * ter as duas grafias para o mesmo consultor. Cada valor visto (do
 * utilizador ou de outro consultor) é excluído na consulta seguinte, para
 * não percorrer as carteiras inteiras.
 */
export async function descobrirGrafiasConsultor(
  utilizador: UtilizadorIdentidade,
  valoresExactos: string[],
  consultar: (consulta: ConsultaGrafias) => Promise<(string | undefined | null)[]>,
  opcoes: { top?: number; maxConsultas?: number } = {},
): Promise<string[]> {
  const top = opcoes.top ?? 100;
  const maxConsultas = opcoes.maxConsultas ?? 8;
  const prefixos = prefixosPesquisaConsultor(utilizador);
  if (!prefixos.length) return [];

  const excluir = new Set(valoresExactos.filter(Boolean));
  const encontrados = new Set<string>();
  for (let i = 0; i < maxConsultas; i += 1) {
    const valores = await consultar({ prefixos, excluir: [...excluir], top });
    let novos = 0;
    for (const valor of valores) {
      if (!valor) continue;
      if (!excluir.has(valor)) {
        excluir.add(valor);
        novos += 1;
      }
      if (mesmaPessoaQue(valor, utilizador)) encontrados.add(valor);
    }
    if (valores.length < top || novos === 0) break;
  }
  return [...encontrados];
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
