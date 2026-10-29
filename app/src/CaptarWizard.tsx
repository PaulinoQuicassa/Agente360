import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AnexosCaptacao } from "./AnexosCaptacao";
import { abrirEmailSuporteCaptacao } from "./captacaoConfig";
import { resolverProvinciaCatalogo } from "./dados/provinciasAngola";
import { useUtilizadorAtual } from "./auth";
import {
  TIPOS_AGENTE,
  buscarGeoProvinciaBd,
  criarAgenteComAnexos,
  eixosDaZona,
  formatarMoeda,
  municipiosDaProvincia,
  proximoCodigoAgente,
  provincasDosAgentes,
  type GeoProvinciaBd,
  type TipoAgente,
  useAgentesReais,
} from "./sharepoint";

const PROVINCIAS_ANGOLA = [
  "Bengo",
  "Benguela",
  "Bié",
  "Cabinda",
  "Cuando Cubango",
  "Cuanza Norte",
  "Cuanza Sul",
  "Cunene",
  "Huambo",
  "Huíla",
  "Luanda",
  "Lunda Norte",
  "Lunda Sul",
  "Malanje",
  "Moxico",
  "Namibe",
  "Uíge",
  "Zaire",
];

const ETAPAS = [
  { id: "dados", titulo: "Dados" },
  { id: "local", titulo: "Localização" },
  { id: "rede", titulo: "Zona / Eixo" },
  { id: "contacto", titulo: "Contacto" },
  { id: "comercial", titulo: "Comercial" },
  { id: "anexos", titulo: "Anexos" },
  { id: "resumo", titulo: "Resumo" },
] as const;

export interface DadosCaptarCompleto {
  nome: string;
  provincia: string;
  municipio: string;
  morada: string;
  regiao: string;
  zona: string;
  eixo: string;
  email: string;
  contacto: string;
  contactoAlt: string;
  tipoAgente: TipoAgente;
  outraOperadora: "" | "sim" | "nao";
  operadora: string;
  capitalPrimeiraCompra: string;
}

const FORM_INICIAL: DadosCaptarCompleto = {
  nome: "",
  provincia: "",
  municipio: "",
  morada: "",
  regiao: "",
  zona: "",
  eixo: "",
  email: "",
  contacto: "",
  contactoAlt: "",
  tipoAgente: TIPOS_AGENTE[0],
  outraOperadora: "",
  operadora: "",
  capitalPrimeiraCompra: "",
};

function bloquearEnterAvanco(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter") return;
  const alvo = e.target as HTMLElement;
  if (alvo.tagName === "TEXTAREA") return;
  e.preventDefault();
}

function fundirListas(...listas: string[][]): string[] {
  return [...new Set(listas.flat().map((s) => s.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt"));
}

export function CaptarWizard() {
  const navigate = useNavigate();
  const utilizador = useUtilizadorAtual();
  const { agentes, carregando } = useAgentesReais(utilizador);
  const [etapa, setEtapa] = useState(0);
  const [form, setForm] = useState<DadosCaptarCompleto>(FORM_INICIAL);
  const [erros, setErros] = useState<Partial<Record<keyof DadosCaptarCompleto | "geral", string>>>({});
  const [aGravar, setAGravar] = useState(false);
  const [erroGravacao, setErroGravacao] = useState("");
  const [anexos, setAnexos] = useState<File[]>([]);
  const [geoBd, setGeoBd] = useState<GeoProvinciaBd | null>(null);
  const [geoCarregando, setGeoCarregando] = useState(false);

  const provincias = useMemo(() => {
    const conjunto = new Set<string>();
    for (const p of PROVINCIAS_ANGOLA) conjunto.add(resolverProvinciaCatalogo(p));
    for (const p of provincasDosAgentes(agentes)) conjunto.add(resolverProvinciaCatalogo(p));
    return [...conjunto].sort((a, b) => a.localeCompare(b, "pt"));
  }, [agentes]);

  useEffect(() => {
    let cancelado = false;
    if (!form.provincia.trim()) {
      setGeoBd(null);
      return;
    }
    setGeoCarregando(true);
    buscarGeoProvinciaBd(form.provincia)
      .then((geo) => {
        if (!cancelado) setGeoBd(geo);
      })
      .finally(() => {
        if (!cancelado) setGeoCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [form.provincia]);

  const munList = useMemo(
    () => fundirListas(municipiosDaProvincia(agentes, form.provincia), geoBd?.municipios ?? []),
    [agentes, form.provincia, geoBd],
  );

  const zonasList = useMemo(
    () => fundirListas(
      agentes.filter((a) => resolverProvinciaCatalogo(a.provincia) === resolverProvinciaCatalogo(form.provincia)).map((a) => a.zona ?? ""),
      geoBd?.zonas ?? [],
    ),
    [agentes, form.provincia, geoBd],
  );

  const eixosList = useMemo(() => {
    if (!form.zona.trim()) return [];
    const daBd = eixosDaZona(agentes, form.provincia, form.zona);
    const daGeo = geoBd?.eixoPorZona[form.zona.trim()] ?? [];
    return fundirListas(daBd, daGeo);
  }, [agentes, form.provincia, form.zona, geoBd]);

  function actualizar<K extends keyof DadosCaptarCompleto>(campo: K, valor: DadosCaptarCompleto[K]) {
    setForm((f) => {
      const next = { ...f, [campo]: valor };
      if (campo === "provincia") {
        next.municipio = "";
        next.zona = "";
        next.eixo = "";
      }
      if (campo === "zona") next.eixo = "";
      return next;
    });
  }

  function validarEtapa(indice: number): boolean {
    const novos: typeof erros = {};
    if (indice === 0) {
      if (!form.nome.trim()) novos.nome = "Indique o nome do agente.";
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) novos.email = "Email inválido.";
    }
    if (indice === 1) {
      if (!form.provincia) novos.provincia = "Seleccione a província.";
      if (!form.municipio.trim()) novos.municipio = "Seleccione o município.";
    }
    if (indice === 3) {
      if (!form.contacto.trim()) novos.contacto = "Indique o contacto principal.";
    }
    if (indice === 4) {
      if (!form.outraOperadora) novos.outraOperadora = "Indique se trabalha com outra operadora.";
      if (form.outraOperadora === "sim" && !form.operadora.trim()) novos.operadora = "Indique qual operadora.";
      if (form.capitalPrimeiraCompra.trim()) {
        const n = Number(form.capitalPrimeiraCompra.replace(/\s/g, "").replace(",", "."));
        if (!Number.isFinite(n) || n < 0) novos.capitalPrimeiraCompra = "Valor inválido.";
      }
    }
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  function irPara(indice: number) {
    if (indice >= 0 && indice < ETAPAS.length) setEtapa(indice);
  }

  function seguinte() {
    if (!validarEtapa(etapa)) return;
    irPara(Math.min(etapa + 1, ETAPAS.length - 1));
  }

  function anterior() {
    irPara(Math.max(etapa - 1, 0));
  }

  async function submeter(e: FormEvent) {
    e.preventDefault();
    for (let i = 0; i < ETAPAS.length - 1; i += 1) {
      if (!validarEtapa(i)) {
        setEtapa(i);
        return;
      }
    }

    setAGravar(true);
    setErroGravacao("");
    const capital =
      form.capitalPrimeiraCompra.trim() ?
        Number(form.capitalPrimeiraCompra.replace(/\s/g, "").replace(",", "."))
      : undefined;

    try {
      const provinciaGravar = resolverProvinciaCatalogo(form.provincia) || form.provincia;
      const { agente: criado, anexosGravados } = await criarAgenteComAnexos(
        {
          codigoAgente: proximoCodigoAgente(agentes),
          nome: form.nome,
          provincia: provinciaGravar,
          municipio: form.municipio,
          tipoAgente: form.tipoAgente,
          email: form.email,
          contacto: form.contacto.trim(),
          contactoAlt: form.contactoAlt.trim() || undefined,
          morada: form.morada.trim() || undefined,
          regiao: form.regiao.trim() || undefined,
          zona: form.zona.trim() || undefined,
          eixo: form.eixo.trim() || undefined,
          outraOperadora: form.outraOperadora === "sim" ? true : form.outraOperadora === "nao" ? false : undefined,
          operadora: form.outraOperadora === "sim" ? form.operadora.trim() : undefined,
          capitalPrimeiraCompra: capital != null && Number.isFinite(capital) ? capital : undefined,
          consultor: utilizador?.nome?.trim() || utilizador?.email?.trim(),
        },
        anexos,
      );
      abrirEmailSuporteCaptacao({
        codigoAgente: criado.codigoAgente,
        nome: criado.nome,
        provincia: criado.provincia,
        municipio: criado.municipio,
        tipoAgente: criado.tipoAgente,
        email: form.email || undefined,
        consultor: utilizador?.nome?.trim() || utilizador?.email?.trim(),
        idSharePoint: criado.id,
        quantidadeAnexos: anexosGravados,
      });
      navigate("/confirm", {
        state: {
          ...form,
          codigoAgente: criado.codigoAgente,
          estado: criado.estado,
          anexosGravados,
          emailEnviado: true,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setErroGravacao(msg || "Não foi possível gravar o agente no SharePoint. Tente novamente.");
    } finally {
      setAGravar(false);
    }
  }

  const capitalPreview =
    form.capitalPrimeiraCompra.trim() ?
      Number(form.capitalPrimeiraCompra.replace(/\s/g, "").replace(",", "."))
    : undefined;

  return (
    <form onSubmit={submeter} onKeyDown={bloquearEnterAvanco} noValidate>
      <nav className="wizard-steps" aria-label="Etapas de captação">
        {ETAPAS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={`wizard-step${i === etapa ? " wizard-step-ativa" : ""}`}
            onClick={() => irPara(i)}
          >
            <span className="wizard-step-num">{i + 1}</span>
            <span className="wizard-step-titulo">{item.titulo}</span>
          </button>
        ))}
      </nav>

      {etapa === 0 && (
        <>
          <div className="section-title" style={{ marginTop: 2 }}>Dados do agente</div>
          <div className="field">
            <label>Nome <span className="req">*</span></label>
            <input type="text" placeholder="Nome completo" value={form.nome} onChange={(e) => actualizar("nome", e.target.value)} />
            {erros.nome && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.nome}</div>}
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="opcional@exemplo.com" value={form.email} onChange={(e) => actualizar("email", e.target.value)} />
            {erros.email ?
              <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.email}</div>
            : <div className="hint">Opcional.</div>}
          </div>
          <div className="field">
            <label>Tipo de agente</label>
            <select value={form.tipoAgente} onChange={(e) => actualizar("tipoAgente", e.target.value as TipoAgente)}>
              {TIPOS_AGENTE.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </>
      )}

      {etapa === 1 && (
        <>
          <div className="section-title" style={{ marginTop: 2 }}>Localização</div>
          <div className="field">
            <label>Província <span className="req">*</span></label>
            <select value={form.provincia} onChange={(e) => actualizar("provincia", e.target.value)}>
              <option value="">Selecione a província</option>
              {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {erros.provincia && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.provincia}</div>}
          </div>
          <div className="field">
            <label>Município <span className="req">*</span></label>
            <select value={form.municipio} disabled={!form.provincia} onChange={(e) => actualizar("municipio", e.target.value)}>
              <option value="">{form.provincia ? "Selecione o município" : "Selecione primeiro a província"}</option>
              {munList.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {erros.municipio && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.municipio}</div>}
            {form.provincia && (
              <div className="hint">
                {geoCarregando ? "A actualizar municípios…" : `${munList.length} municípios para ${form.provincia}.`}
              </div>
            )}
          </div>
          <div className="field">
            <label>Morada</label>
            <input type="text" placeholder="Rua, bairro, referência…" value={form.morada} onChange={(e) => actualizar("morada", e.target.value)} />
          </div>
        </>
      )}

      {etapa === 2 && (
        <>
          <div className="section-title" style={{ marginTop: 2 }}>Rede comercial</div>
          <div className="field">
            <label>Região</label>
            <input type="text" placeholder="Opcional" value={form.regiao} onChange={(e) => actualizar("regiao", e.target.value)} />
          </div>
          <div className="field">
            <label>Zona</label>
            <select value={form.zona} disabled={!form.provincia} onChange={(e) => actualizar("zona", e.target.value)}>
              <option value="">{form.provincia ? "Selecione a zona (opcional)" : "Defina a província na etapa anterior"}</option>
              {zonasList.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Eixo</label>
            <select
              value={form.eixo}
              disabled={!form.zona.trim()}
              onChange={(e) => actualizar("eixo", e.target.value)}
            >
              <option value="">{form.zona ? "Selecione o eixo (opcional)" : "Selecione primeiro a zona"}</option>
              {eixosList.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
            </select>
            {form.zona && eixosList.length === 0 && (
              <div className="hint">Sem eixos registados para esta zona — pode deixar em branco.</div>
            )}
          </div>
        </>
      )}

      {etapa === 3 && (
        <>
          <div className="section-title" style={{ marginTop: 2 }}>Contactos</div>
          <div className="field">
            <label>Contacto principal <span className="req">*</span></label>
            <input type="tel" placeholder="9XX XXX XXX" value={form.contacto} onChange={(e) => actualizar("contacto", e.target.value)} />
            {erros.contacto && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.contacto}</div>}
            <div className="hint">Este número aparece nas visitas (campo Contacto do agente).</div>
          </div>
          <div className="field">
            <label>Contacto alternativo</label>
            <input type="tel" placeholder="Opcional" value={form.contactoAlt} onChange={(e) => actualizar("contactoAlt", e.target.value)} />
          </div>
        </>
      )}

      {etapa === 4 && (
        <>
          <div className="section-title" style={{ marginTop: 2 }}>Informação comercial</div>
          <div className="field">
            <label>Trabalha com outra operadora? <span className="req">*</span></label>
            <div className="wizard-opcoes">
              <label className="wizard-radio">
                <input
                  type="radio"
                  name="outraOperadora"
                  checked={form.outraOperadora === "sim"}
                  onChange={() => actualizar("outraOperadora", "sim")}
                />
                Sim
              </label>
              <label className="wizard-radio">
                <input
                  type="radio"
                  name="outraOperadora"
                  checked={form.outraOperadora === "nao"}
                  onChange={() => actualizar("outraOperadora", "nao")}
                />
                Não
              </label>
            </div>
            {erros.outraOperadora && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.outraOperadora}</div>}
          </div>
          {form.outraOperadora === "sim" && (
            <div className="field">
              <label>Qual operadora? <span className="req">*</span></label>
              <input type="text" value={form.operadora} onChange={(e) => actualizar("operadora", e.target.value)} />
              {erros.operadora && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.operadora}</div>}
            </div>
          )}
          <div className="field">
            <label>Primeiro investimento (1ª compra)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ex.: 50000"
              value={form.capitalPrimeiraCompra}
              onChange={(e) => actualizar("capitalPrimeiraCompra", e.target.value)}
            />
            {erros.capitalPrimeiraCompra && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.capitalPrimeiraCompra}</div>}
            <div className="hint">Opcional — use Seguinte para avançar (não avança ao digitar).</div>
          </div>
        </>
      )}

      {etapa === 5 && (
        <>
          <div className="section-title" style={{ marginTop: 2 }}>Documentos</div>
          <AnexosCaptacao ficheiros={anexos} onChange={setAnexos} disabled={aGravar} />
        </>
      )}

      {etapa === 6 && (
        <>
          <div className="section-title" style={{ marginTop: 2 }}>Confirmar</div>
          <div className="resumo-captacao">
            <p><b>{form.nome}</b> · {form.tipoAgente}</p>
            <p>{form.municipio}, {form.provincia}{form.zona ? ` · ${form.zona}` : ""}{form.eixo ? ` / ${form.eixo}` : ""}</p>
            <p>Contacto: {form.contacto}{form.contactoAlt ? ` · ${form.contactoAlt}` : ""}</p>
            {form.email && <p>Email: {form.email}</p>}
            <p>
              Outra operadora: {form.outraOperadora === "sim" ? form.operadora || "Sim" : form.outraOperadora === "nao" ? "Não" : "—"}
            </p>
            {capitalPreview != null && Number.isFinite(capitalPreview) && (
              <p>1ª compra: {formatarMoeda(capitalPreview)}</p>
            )}
            {anexos.length > 0 && <p>{anexos.length} ficheiro(s) anexo(s)</p>}
          </div>
        </>
      )}

      {erroGravacao && <div className="hint" style={{ color: "var(--cor-erro)", marginBottom: 12 }}>{erroGravacao}</div>}

      <div className="wizard-nav">
        {etapa > 0 && (
          <button type="button" className="btn-secondary" onClick={anterior} disabled={aGravar}>
            Anterior
          </button>
        )}
        {etapa < ETAPAS.length - 1 && (
          <button type="button" className="btn-primary" onClick={seguinte} disabled={aGravar || carregando}>
            Seguinte
          </button>
        )}
        {etapa === ETAPAS.length - 1 && (
          <button type="submit" className="btn-primary" disabled={aGravar || carregando}>
            {aGravar ? "A gravar no SharePoint…" : "Captar agente"}
          </button>
        )}
      </div>
    </form>
  );
}
