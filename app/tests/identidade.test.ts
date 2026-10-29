import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mesmaPessoa,
  mesmaPessoaQue,
  normalizarIdentidade,
  prefixosPesquisaConsultor,
} from "../src/identidade.ts";

const sebastiaoEntra = { nome: "sebastiao pongo", email: "sebastiao.pongo@zap.co.ao" };

/** Cópia da regra anterior (sharepoint.ts antes da correcção), para reproduzir a falha. */
function mesmaPessoaAntiga(a?: string, b?: string): boolean {
  const n = (v: string) => v.trim().toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ");
  const na = n(a ?? "");
  const nb = n(b ?? "");
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ta = na.split(" ").filter(Boolean).sort().join(" ");
  const tb = nb.split(" ").filter(Boolean).sort().join(" ");
  return ta.length > 0 && ta === tb;
}

test("reprodução: regra antiga rejeita Sebastião Pongo vs sebastiao pongo", () => {
  assert.equal(mesmaPessoaAntiga("Sebastião Pongo", sebastiaoEntra.nome), false);
});

test("Sebastião Pongo (SharePoint) corresponde a sebastiao pongo (Entra ID)", () => {
  assert.equal(mesmaPessoaQue("Sebastião Pongo", sebastiaoEntra), true);
  assert.equal(mesmaPessoaQue("Pongo, Sebastião", sebastiaoEntra), true);
  assert.equal(mesmaPessoaQue("  SEBASTIÃO   pongo ", sebastiaoEntra), true);
});

test("corresponde pelo nome derivado do e-mail quando o nome Entra difere", () => {
  assert.equal(mesmaPessoaQue("Sebastião Pongo", { nome: "S. Pongo", email: "sebastiao.pongo@zap.co.ao" }), true);
});

test("outros consultores continuam a corresponder como antes", () => {
  const paulino = { nome: "Paulino Quicassa", email: "paulino.quicassa@zap.co.ao" };
  assert.equal(mesmaPessoaQue("Paulino Quicassa", paulino), true);
  assert.equal(mesmaPessoaQue("Quicassa, Paulino", paulino), true);
  assert.equal(mesmaPessoaQue("paulino.quicassa@zap.co.ao", paulino), true);
  assert.equal(mesmaPessoa("José Mário", "jose mario"), true);
});

test("segurança: nomes parciais ou de outras pessoas não correspondem", () => {
  assert.equal(mesmaPessoaQue("Sebastião", sebastiaoEntra), false);
  assert.equal(mesmaPessoaQue("Pongo", sebastiaoEntra), false);
  assert.equal(mesmaPessoaQue("Sebastião Pongo Júnior", sebastiaoEntra), false);
  assert.equal(mesmaPessoaQue("Sebastiana Pongo", sebastiaoEntra), false);
  assert.equal(mesmaPessoaQue("Paulino Quicassa", sebastiaoEntra), false);
  assert.equal(mesmaPessoaQue("", sebastiaoEntra), false);
  assert.equal(mesmaPessoaQue(undefined, sebastiaoEntra), false);
});

test("normalização remove diacríticos e espaços", () => {
  assert.equal(normalizarIdentidade("  João  Ção, Ângela "), "joao cao angela");
});

test("prefixos de pesquisa cobrem a grafia acentuada do SharePoint", () => {
  const prefixos = prefixosPesquisaConsultor(sebastiaoEntra);
  assert.ok(prefixos.includes("seb"));
  assert.ok(prefixos.includes("pon"));
  const angela = prefixosPesquisaConsultor({ nome: "angela silva", email: "" });
  assert.ok(angela.includes("âng"));
  assert.ok(prefixosPesquisaConsultor({ nome: "julio", email: "" }).includes("júl"));
});
