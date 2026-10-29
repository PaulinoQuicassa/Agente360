/** Normaliza o nome da província para a chave do catálogo de municípios. */
const ALIAS_PROVINCIA: Record<string, string> = {
  "kwanza sul": "Cuanza Sul",
  "cuanza sul": "Cuanza Sul",
  "cuanza-sul": "Cuanza Sul",
  "kwanza-sul": "Cuanza Sul",
  "kwanza norte": "Cuanza Norte",
  "cuanza norte": "Cuanza Norte",
  "cuanza-norte": "Cuanza Norte",
  "kuando kubango": "Cuando Cubango",
  "cuando cubango": "Cuando Cubango",
  "cuando-cubango": "Cuando Cubango",
  "kuando-cubango": "Cuando Cubango",
  "lunda norte": "Lunda Norte",
  "lunda-norte": "Lunda Norte",
  "lunda sul": "Lunda Sul",
  "lunda-sul": "Lunda Sul",
  "moxico leste": "Moxico",
  "ícolo e bengo": "Luanda",
  "icolo e bengo": "Luanda",
};

export function resolverProvinciaCatalogo(provincia: string): string {
  const limpo = provincia.trim().replace(/\s+/g, " ");
  if (!limpo) return "";
  const alias = ALIAS_PROVINCIA[limpo.toLowerCase()];
  return alias ?? limpo;
}
