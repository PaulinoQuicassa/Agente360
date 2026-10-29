import { test } from "node:test";
import assert from "node:assert/strict";
import {
  descobrirGrafiasConsultor,
  mesmaPessoaQue,
  valoresExactosConsultor,
  type ConsultaGrafias,
  type UtilizadorIdentidade,
} from "../src/identidade.ts";

/**
 * Simula a BD_Agentes_Palhativa com a regra de texto do SharePoint:
 * ignora maiúsculas, distingue acentos (confirmado: tirar o til à linha
 * fez o agente aparecer).
 */
type Linha = { codigo: number; consultor: string };

const igualSp = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const comecaSp = (a: string, p: string) => a.toLowerCase().startsWith(p.toLowerCase());

function sharePoint(linhas: Linha[]) {
  let consultas = 0;
  return {
    get consultas() {
      return consultas;
    },
    /** Consulta de descoberta: startswith(prefixos) and field_5 ne (excluídos). */
    async grafias({ prefixos, excluir, top }: ConsultaGrafias) {
      consultas += 1;
      return linhas
        .filter((l) => prefixos.some((p) => comecaSp(l.consultor, p)))
        .filter((l) => excluir.every((v) => !igualSp(l.consultor, v)))
        .slice(0, top)
        .map((l) => l.consultor);
    },
    /** Filtro da carteira / por código: field_5 eq (valores) [and Title eq código]. */
    porConsultor(valores: string[], codigo?: number) {
      return linhas.filter(
        (l) => valores.some((v) => igualSp(l.consultor, v)) && (codigo == null || l.codigo === codigo),
      );
    },
  };
}

/** Mesmo encadeamento de sharepoint.ts: descobrir → filtro eq no servidor → validação no cliente. */
async function carteira(sp: ReturnType<typeof sharePoint>, u: UtilizadorIdentidade) {
  const exactos = valoresExactosConsultor(u);
  const descobertos = await descobrirGrafiasConsultor(u, exactos, (c) => sp.grafias(c));
  const valores = [...new Set([...exactos, ...descobertos])];
  return {
    agentes: sp.porConsultor(valores).filter((l) => mesmaPessoaQue(l.consultor, u)).map((l) => l.codigo).sort(),
    porCodigo: (codigo: number) =>
      sp.porConsultor(valores, codigo).find((l) => mesmaPessoaQue(l.consultor, u))?.codigo ?? null,
  };
}

const sebastiao = { nome: "sebastiao pongo", email: "sebastiao.pongo@zap.co.ao" };
const paulino = { nome: "Paulino Quicassa", email: "paulino.quicassa@zap.co.ao" };

const dados: Linha[] = [
  { codigo: 101, consultor: "Sebastião Pongo" },
  { codigo: 102, consultor: "Sebastião Pongo" },
  { codigo: 103, consultor: "Sebastião Pongo " },
  { codigo: 104, consultor: "Sebastiao Pongo" }, // linha corrigida à mão (til removido)
  { codigo: 105, consultor: "Pongo, Sebastião" },
  { codigo: 201, consultor: "Paulino Quicassa" },
  { codigo: 202, consultor: "Paulino Quicassa" },
  { codigo: 301, consultor: "Sebastiana Pongo" },
  { codigo: 302, consultor: "Seberino Alves" },
  { codigo: 303, consultor: "Sebastião Pongo Júnior" },
];

test("reprodução: só a igualdade exacta encontra apenas a linha sem til", () => {
  const sp = sharePoint(dados);
  const soExacto = sp.porConsultor(valoresExactosConsultor(sebastiao)).map((l) => l.codigo);
  assert.deepEqual(soExacto, [104]);
});

test("Sebastião Pongo vs sebastiao pongo: todos os agentes dele aparecem, com dados mistos", async () => {
  const { agentes } = await carteira(sharePoint(dados), sebastiao);
  assert.deepEqual(agentes, [101, 102, 103, 104, 105]);
});

test("Sebastião Pongo vs sebastiao pongo: aparece sem nenhuma linha corrigida à mão", async () => {
  const semCorreccao = dados.map((l) => (l.codigo === 104 ? { ...l, consultor: "Sebastião Pongo" } : l));
  const { agentes } = await carteira(sharePoint(semCorreccao), sebastiao);
  assert.deepEqual(agentes, [101, 102, 103, 104, 105]);
});

test("marcar visita: a pesquisa por código encontra o agente de Sebastião", async () => {
  const { porCodigo } = await carteira(sharePoint(dados), sebastiao);
  assert.equal(porCodigo(101), 101);
  assert.equal(porCodigo(104), 104);
});

test("segurança: Sebastião não vê agentes de outros consultores", async () => {
  const { agentes, porCodigo } = await carteira(sharePoint(dados), sebastiao);
  for (const alheio of [201, 202, 301, 302, 303]) {
    assert.ok(!agentes.includes(alheio), `agente ${alheio} não devia aparecer`);
    assert.equal(porCodigo(alheio), null);
  }
});

test("outros consultores continuam iguais", async () => {
  const sp = sharePoint(dados);
  const { agentes, porCodigo } = await carteira(sp, paulino);
  assert.deepEqual(agentes, [201, 202]);
  assert.equal(porCodigo(201), 201);
  assert.equal(porCodigo(101), null);
});

test("descoberta não percorre carteiras inteiras (valores vistos são excluídos)", async () => {
  const muitos: Linha[] = [
    ...Array.from({ length: 900 }, (_, i) => ({ codigo: 1000 + i, consultor: "Paulino Quicassa" })),
    ...Array.from({ length: 900 }, (_, i) => ({ codigo: 3000 + i, consultor: "Pedro Quintas" })),
  ];
  const sp = sharePoint(muitos);
  const { agentes } = await carteira(sp, paulino);
  assert.equal(agentes.length, 900);
  assert.ok(sp.consultas <= 2, `fez ${sp.consultas} consultas de descoberta`);
});
