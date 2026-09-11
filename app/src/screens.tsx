import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "./Icon";
import {
  OPCOES_FLYBANNER,
  OPCOES_MERCHANDISING,
  OPCOES_PLACA_PONTO_ZAP,
  OPCOES_STOCK_BOXES,
  OPCOES_TEM_NAO_TEM,
  OPCOES_USA_MOBILE,
  OPCOES_ZAPADINHAS_PONTOS,
  TIPOS_AGENTE,
  TIPOS_AGENTE_VISITA,
  TIPOS_VISITA,
  badgeClassAgente,
  calcularRappel,
  formatarData,
  formatarMoeda,
  iniciais,
  tipoAgenteVisitaPadrao,
  useAgentesReais,
  type Agente,
  type EstadoAgente,
  type TipoAgente,
  type TipoAgenteVisita,
  type TipoVisita,
} from "./sharepoint";

const municipios: Record<string, string[]> = {
  Luanda: ["Luanda", "Cazenga", "Cacuaco", "Talatona", "Viana", "Belas", "Icolo e Bengo", "Kilamba Kiaxi"],
  Benguela: ["Benguela", "Lobito", "Catumbela", "Baía Farta", "Cubal"],
  "Huíla": ["Lubango", "Matala", "Humpata", "Caconda", "Chibia"],
  Huambo: ["Huambo", "Caála", "Bailundo", "Londuimbali"],
};

const provincas = ["Luanda", "Benguela", "Huíla", "Huambo", "Cabinda", "Bengo", "Bié", "Cuando Cubango", "Cuanza Norte", "Cuanza Sul", "Cunene", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"];

function Carregando({ mensagem = "A carregar…" }: { mensagem?: string }) {
  return <div className="empty-state">{mensagem}</div>;
}

function ErroCarregamento({ tentarNovamente }: { tentarNovamente: () => void }) {
  return (
    <div className="empty-state">
      Não foi possível carregar os dados. Verifique a ligação e tente novamente.
      <div style={{ marginTop: 12 }}>
        <button className="btn-secondary" style={{ width: "auto", marginTop: 0, padding: "8px 16px" }} onClick={tentarNovamente}>
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <>
      <div className="section-title">Indicadores<span className="link link-chev">Este mês <Icon name="chevron" /></span></div>
      <div className="kpi-scroll">
        <div className="kpi-card"><div className="kpi-icon kpi-azul" style={{ background: "#E5F3FB" }}><Icon name="people" /></div><div className="num">1 284</div><div className="label">Total de Agentes</div><div className="delta up">▲ +42 vs. mês ant.</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-verde" style={{ background: "#E6F4E6" }}><Icon name="user-check" /></div><div className="num">967</div><div className="label">Agentes Activos</div><div className="delta up">▲ +18</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-amarelo" style={{ background: "#FFF7D6" }}><Icon name="user-plus" /></div><div className="num">56</div><div className="label">Novos Captados</div><div className="delta up">▲ +9</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-magenta" style={{ background: "#FBE4EF" }}><Icon name="clipboard" /></div><div className="num">83</div><div className="label">Em Análise</div><div className="delta down">▼ -5</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-vermelho" style={{ background: "#FBE7E8" }}><Icon name="file" /></div><div className="num">31</div><div className="label">Doc. Pendente</div><div className="delta down">▼ -2</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-azul" style={{ background: "#E5F3FB" }}><Icon name="pin" /></div><div className="num">412</div><div className="label">Visitas Realizadas</div><div className="delta up">▲ +64</div></div>
      </div>
      <div className="cta-row">
        <Link to="/captar" className="cta cta-captar"><Icon name="plus" /><span className="cta-label">CAPTAR</span><span className="cta-sub">Novo agente para a rede</span></Link>
        <Link to="/visitar" className="cta cta-visitar"><Icon name="pin" /><span className="cta-label">VISITAR</span><span className="cta-sub">Registar visita a agente</span></Link>
      </div>
      <div className="section-title">Agentes por Província<Link to="/agentes" className="link">Ver todos</Link></div>
      <div className="card">
        <div className="bar-row"><div className="prov">Luanda</div><div className="bar-track"><div className="bar-fill" style={{ width: "82%" }} /></div><div className="val">612</div></div>
        <div className="bar-row"><div className="prov">Benguela</div><div className="bar-track"><div className="bar-fill" style={{ width: "46%", background: "var(--cor-magenta)" }} /></div><div className="val">241</div></div>
        <div className="bar-row"><div className="prov">Huíla</div><div className="bar-track"><div className="bar-fill" style={{ width: "32%", background: "var(--cor-amarelo-escuro)" }} /></div><div className="val">168</div></div>
        <div className="bar-row"><div className="prov">Huambo</div><div className="bar-track"><div className="bar-fill" style={{ width: "20%" }} /></div><div className="val">96</div></div>
      </div>
      <div className="section-title">Actividade Recente<span className="link">Ver tudo</span></div>
      <div className="card">
        <div className="activity-item"><div className="activity-icon activity-add" style={{ background: "#FFF7D6" }}><Icon name="user-plus" /></div><div><div className="activity-title">Agente captado · 1000077</div><div className="activity-sub">Joana Kizua · Luanda, Cazenga</div></div><div className="activity-time">há 12 min</div></div>
        <div className="activity-item"><div className="activity-icon activity-pin" style={{ background: "#E5F3FB" }}><Icon name="pin" /></div><div><div className="activity-title">Visita registada</div><div className="activity-sub">Manuel Sozinho · Talatona</div></div><div className="activity-time">há 47 min</div></div>
        <div className="activity-item"><div className="activity-icon activity-doc" style={{ background: "#FBE7E8" }}><Icon name="file" /></div><div><div className="activity-title">Documentação pendente</div><div className="activity-sub">Rosa Ngueve · Benguela</div></div><div className="activity-time">há 2h</div></div>
      </div>
    </>
  );
}

interface DadosCaptar {
  nome: string;
  provincia: string;
  municipio: string;
  endereco: string;
  contacto: string;
  email: string;
  tipoAgente: TipoAgente;
}

export function Captar() {
  const navigate = useNavigate();
  const [form, setForm] = useState<DadosCaptar>({
    nome: "",
    provincia: "",
    municipio: "",
    endereco: "",
    contacto: "",
    email: "",
    tipoAgente: TIPOS_AGENTE[0],
  });
  const [erros, setErros] = useState<Partial<Record<keyof DadosCaptar, string>>>({});
  const munList = municipios[form.provincia];

  function actualizar<K extends keyof DadosCaptar>(campo: K, valor: DadosCaptar[K]) {
    setForm((f) => ({ ...f, [campo]: valor, ...(campo === "provincia" ? { municipio: "" } : {}) }));
  }

  function submeter(e: FormEvent) {
    e.preventDefault();
    const novosErros: typeof erros = {};
    if (!form.nome.trim()) novosErros.nome = "Indique o nome do agente.";
    if (!form.provincia) novosErros.provincia = "Seleccione a província.";
    if (!form.municipio) novosErros.municipio = "Seleccione o município.";
    if (!form.endereco.trim()) novosErros.endereco = "Indique o endereço.";
    if (!form.contacto.trim()) novosErros.contacto = "Indique um contacto.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) novosErros.email = "Email inválido.";
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const codigoAgente = Math.floor(1000000 + Math.random() * 8999999);
    navigate("/confirm", { state: { ...form, codigoAgente, estado: "Ag-S-Investimentos" as EstadoAgente } });
  }

  return (
    <form onSubmit={submeter} noValidate>
      <div className="section-title" style={{ marginTop: 2 }}>Dados do agente</div>
      <div className="field">
        <label>Nome <span className="req">*</span></label>
        <input type="text" placeholder="Nome completo" value={form.nome} onChange={(e) => actualizar("nome", e.target.value)} />
        {erros.nome && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.nome}</div>}
      </div>
      <div className="field">
        <label>Província <span className="req">*</span></label>
        <select value={form.provincia} onChange={(e) => actualizar("provincia", e.target.value)}>
          <option value="">Selecione a província</option>
          {provincas.map((p) => <option key={p}>{p}</option>)}
        </select>
        {erros.provincia && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.provincia}</div>}
      </div>
      <div className="field">
        <label>Município <span className="req">*</span></label>
        <select value={form.municipio} disabled={!form.provincia} onChange={(e) => actualizar("municipio", e.target.value)}>
          <option value="">{form.provincia ? "Selecione o município" : "Selecione primeiro a província"}</option>
          {(munList ?? (form.provincia ? ["Sede Municipal"] : [])).map((m) => <option key={m}>{m}</option>)}
        </select>
        {erros.municipio && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.municipio}</div>}
      </div>
      <div className="field">
        <label>Endereço <span className="req">*</span></label>
        <input type="text" placeholder="Rua, bairro, referência" value={form.endereco} onChange={(e) => actualizar("endereco", e.target.value)} />
        {erros.endereco && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.endereco}</div>}
      </div>
      <div className="field">
        <label>Contacto <span className="req">*</span></label>
        <input type="tel" placeholder="9XX XXX XXX" value={form.contacto} onChange={(e) => actualizar("contacto", e.target.value)} />
        {erros.contacto && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.contacto}</div>}
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" placeholder="opcional@exemplo.com" value={form.email} onChange={(e) => actualizar("email", e.target.value)} />
        {erros.email ? <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.email}</div> : <div className="hint">Opcional — validado automaticamente se preenchido.</div>}
      </div>
      <div className="field">
        <label>Tipo de Agente</label>
        <select value={form.tipoAgente} onChange={(e) => actualizar("tipoAgente", e.target.value as TipoAgente)}>
          {TIPOS_AGENTE.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="section-title">Documentação</div>
      <div className="upload-box"><Icon name="upload" /><b>Toca para associar documentos</b><br />BI, comprovativo de morada ou outros (PDF, JPG)</div>
      <button type="submit" className="btn-primary">Captar Agente</button>
    </form>
  );
}

interface EstadoConfirm extends DadosCaptar {
  codigoAgente: number;
  estado: EstadoAgente;
}

export function Confirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const dados = location.state as EstadoConfirm | null;

  if (!dados) {
    return (
      <div className="confirm-wrap">
        <p>Nenhuma captação recente para confirmar.</p>
        <button className="btn-primary" onClick={() => navigate("/captar")}>Ir para Captar</button>
      </div>
    );
  }

  return (
    <div className="confirm-wrap">
      <div className="check-circle"><Icon name="check" /></div>
      <h2>Agente captado com sucesso</h2>
      <p>O agente foi registado na base de dados da rede.</p>
      <div className="card confirm-card">
        <div className="info-row"><span className="k">Código do agente</span><span className="v">{dados.codigoAgente}</span></div>
        <div className="info-row"><span className="k">Nome</span><span className="v">{dados.nome}</span></div>
        <div className="info-row"><span className="k">Tipo</span><span className="v">{dados.tipoAgente}</span></div>
        <div className="info-row"><span className="k">Estado</span><span className="v"><span className={`badge ${badgeClassAgente(dados.estado)}`}>{dados.estado}</span></span></div>
      </div>
      <button className="btn-primary" onClick={() => navigate("/agentes")}>Ver lista de Agentes</button>
      <button className="btn-secondary" onClick={() => navigate("/captar")}>Captar outro agente</button>
    </div>
  );
}

type FiltroEstado = "Todos" | "Com investimentos" | "Sem investimentos";
const FILTROS: FiltroEstado[] = ["Todos", "Com investimentos", "Sem investimentos"];

function correspondeAoFiltro(estado: EstadoAgente, filtro: FiltroEstado): boolean {
  if (filtro === "Todos") return true;
  if (filtro === "Com investimentos") return estado === "Ag-C-Investimentos";
  return estado === "Ag-S-Investimentos";
}

export function Agentes() {
  const { agentes, carregando, progresso, erro, tentarNovamente } = useAgentesReais();
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("Todos");

  const filtrados = useMemo(
    () =>
      agentes
        .filter((a) => correspondeAoFiltro(a.estado, filtro))
        .filter((a) => {
          const termo = pesquisa.trim().toLowerCase();
          return !termo || a.nome.toLowerCase().includes(termo) || String(a.codigoAgente).includes(termo);
        }),
    [agentes, pesquisa, filtro]
  );

  return (
    <>
      <div className="search-bar"><Icon name="search" /><input type="text" placeholder="Pesquisar por nome ou código..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} /></div>
      <div className="filter-chips">
        {FILTROS.map((f) => (
          <button key={f} className={`chip${filtro === f ? " active" : ""}`} onClick={() => setFiltro(f)}>{f}</button>
        ))}
      </div>
      {carregando && <Carregando mensagem={progresso > 0 ? `A carregar agentes… (${progresso})` : "A carregar agentes…"} />}
      {!carregando && erro && <ErroCarregamento tentarNovamente={tentarNovamente} />}
      {!carregando && !erro && filtrados.length === 0 && <div className="empty-state">Nenhum agente encontrado com estes critérios.</div>}
      {!carregando && !erro && filtrados.map((a) => (
        <Link to={`/perfil?agente=${a.codigoAgente}`} key={a.id} className="agent-item">
          <div className="agent-avatar">{iniciais(a.nome)}</div>
          <div><div className="agent-name">{a.nome}</div><div className="agent-meta">{a.codigoAgente} · {a.municipio}, {a.provincia}</div></div>
          <div className="agent-right"><span className={`badge ${badgeClassAgente(a.estado)}`}>{a.estado}</span><span style={{ fontSize: 10, color: "var(--cor-texto-secundario)" }}>{formatarData(a.dataActualizacao)}</span></div>
        </Link>
      ))}
    </>
  );
}

export function Perfil() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agenteParam = searchParams.get("agente");
  const { agentes, carregando, erro, tentarNovamente } = useAgentesReais();
  const [tab, setTab] = useState("resumo");

  if (carregando) return <Carregando mensagem="A carregar agente…" />;
  if (erro) return <ErroCarregamento tentarNovamente={tentarNovamente} />;

  const agente = agentes.find((a) => a.codigoAgente === Number(agenteParam));
  if (!agente) return <div className="empty-state">Agente {agenteParam} não encontrado.</div>;

  return (
    <>
      <div className="profile-hero">
        <div className="top">
          <div className="avatar-lg">{iniciais(agente.nome)}</div>
          <div>
            <div className="pname">{agente.nome}</div>
            <div className="pid">{agente.codigoAgente} · {agente.tipoAgente}</div>
            <span className={`badge ${badgeClassAgente(agente.estado)}`} style={{ marginTop: 6 }}>{agente.estado}</span>
          </div>
        </div>
        <div className="profile-stats">
          <div className="pstat"><div className="pnum">{formatarData(agente.dataCaptacao)}</div><div className="plabel">Data de captação</div></div>
          <div className="pstat"><div className="pnum">—</div><div className="plabel">Última visita</div></div>
          <div className="pstat"><div className="pnum">0</div><div className="plabel">Nº de visitas</div></div>
          <div className="pstat"><div className="pnum">1/2</div><div className="plabel">Documentos</div></div>
        </div>
      </div>
      <div className="tabs-scroll">
        {([
          ["resumo", "Resumo"],
          ["visitas", "Visitas"],
          ["checklist", "Checklist"],
          ["docs", "Documentos"],
          ["rappel", "Rappel"],
          ["pagamentos", "Pagamentos"],
        ] as const).map(([id, label]) => (
          <button key={id} className={`tab-btn${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "resumo" && (
        <>
          <div className="card">
            <div className="info-row"><span className="k">Contacto</span><span className="v">{agente.contacto ?? "—"}</span></div>
            <div className="info-row"><span className="k">Email</span><span className="v">{agente.email ?? "—"}</span></div>
            <div className="info-row"><span className="k">Endereço</span><span className="v">{agente.endereco ?? "—"}</span></div>
            <div className="info-row"><span className="k">Município</span><span className="v">{agente.municipio}, {agente.provincia}</span></div>
          </div>
          <button className="btn-primary" onClick={() => navigate(`/visitar?agente=${agente.codigoAgente}`)}>Iniciar Visita a este Agente</button>
        </>
      )}
      {tab === "visitas" && <div className="card empty-state">Ainda sem visitas registadas para este agente.</div>}
      {tab === "checklist" && <div className="card empty-state">Sem checklists associados.</div>}
      {tab === "docs" && (
        <div className="card">
          <div className="info-row"><span className="k">Bilhete de Identidade</span><span className="v"><span className="badge badge-vermelho">Em falta</span></span></div>
          <div className="info-row"><span className="k">Comprovativo de morada</span><span className="v"><span className="badge badge-vermelho">Em falta</span></span></div>
        </div>
      )}
      {tab === "rappel" && <div className="card empty-state">Sem volume registado neste período.</div>}
      {tab === "pagamentos" && <div className="card empty-state">Sem pagamentos processados ainda.</div>}
    </>
  );
}

export function Visitar() {
  const [searchParams] = useSearchParams();
  const agenteParam = searchParams.get("agente");
  const { agentes, carregando, erro, tentarNovamente } = useAgentesReais();

  if (carregando) return <Carregando mensagem="A carregar agentes…" />;
  if (erro) return <ErroCarregamento tentarNovamente={tentarNovamente} />;

  const agente = agentes.find((a) => a.codigoAgente === Number(agenteParam)) ?? agentes[0];
  if (!agente) return <div className="empty-state">Sem agentes disponíveis para visitar.</div>;

  return <VisitarForm agente={agente} />;
}

type EstadoGps = "a_obter" | "obtida" | "erro";

function VisitarForm({ agente }: { agente: Agente }) {
  const navigate = useNavigate();
  const [estadoGps, setEstadoGps] = useState<EstadoGps>("obtida");
  const [localizacao] = useState({ latitude: -8.8368, longitude: 13.2343 });
  const [tipoVisita, setTipoVisita] = useState<TipoVisita>(TIPOS_VISITA[0]);
  const [tipoAgenteVisita, setTipoAgenteVisita] = useState<TipoAgenteVisita>(tipoAgenteVisitaPadrao(agente.tipoAgente));
  const [codigoAgente, setCodigoAgente] = useState(agente.codigoAgente);
  const [contactoAgente, setContactoAgente] = useState((agente.contacto ?? "").replace(/\D/g, ""));
  const [nomeParceiro, setNomeParceiro] = useState("");
  const [pontosVenda, setPontosVenda] = useState("");
  const [observacoes, setObservacoes] = useState("");

  function obterLocalizacao() {
    if (!("geolocation" in navigator)) {
      setEstadoGps("erro");
      return;
    }
    setEstadoGps("a_obter");
    navigator.geolocation.getCurrentPosition(
      () => setEstadoGps("obtida"),
      () => setEstadoGps("erro"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function submeter(e: FormEvent) {
    e.preventDefault();
    if (estadoGps !== "obtida") return;
    navigate(`/checklist?agente=${agente.codigoAgente}`);
  }

  return (
    <form onSubmit={submeter}>
      <div className="section-title" style={{ marginTop: 2 }}>Agente seleccionado</div>
      <div className="agent-item" style={{ cursor: "default" }}>
        <div className="agent-avatar">{iniciais(agente.nome)}</div>
        <div><div className="agent-name">{agente.nome}</div><div className="agent-meta">{agente.codigoAgente} · {agente.municipio}, {agente.provincia}</div></div>
        <div className="agent-right"><span className="link" style={{ color: "var(--cor-azul)", fontSize: 11, fontWeight: 700 }} onClick={() => navigate("/agentes")}>Trocar</span></div>
      </div>
      {estadoGps === "obtida" && (
        <div className="gps-card">
          <div className="gps-icon"><Icon name="pin" /></div>
          <div className="gps-text"><b>Localização obtida</b><span>Lat {localizacao.latitude.toFixed(4)} · Long {localizacao.longitude.toFixed(4)} · há instantes</span></div>
        </div>
      )}
      {estadoGps === "a_obter" && (
        <div className="gps-card"><div className="gps-icon"><Icon name="pin" /></div><div className="gps-text"><b>A obter localização…</b><span>Aguarde um instante</span></div></div>
      )}
      {estadoGps === "erro" && (
        <div className="gps-card gps-erro">
          <div className="gps-icon"><Icon name="alert" /></div>
          <div className="gps-text"><b>Não foi possível obter a localização.</b><span>Active a localização do dispositivo e tente novamente.</span></div>
          <button type="button" className="btn-secondary" style={{ marginTop: 0, width: "auto", padding: "8px 12px" }} onClick={obterLocalizacao}>Tentar novamente</button>
        </div>
      )}
      <div className="field">
        <label>Tipo de visita <span className="req">*</span></label>
        <select value={tipoVisita} onChange={(e) => setTipoVisita(e.target.value as TipoVisita)}>
          {TIPOS_VISITA.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="field"><label>Data e hora</label><input type="text" value={new Date().toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} disabled style={{ background: "var(--cor-fundo)", color: "var(--cor-texto-secundario)" }} /><div className="hint">Preenchido automaticamente ao guardar.</div></div>
      <div className="field">
        <label>Tipo de agente</label>
        <select value={tipoAgenteVisita} onChange={(e) => setTipoAgenteVisita(e.target.value as TipoAgenteVisita)}>
          {TIPOS_AGENTE_VISITA.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="field"><label>Código do Agente</label><input type="number" value={codigoAgente} onChange={(e) => setCodigoAgente(Number(e.target.value) || 0)} /><div className="hint">Guardado como número na lista SharePoint "Controlo de visitas Agentes".</div></div>
      <div className="field"><label>Contacto do Agente</label><input type="tel" placeholder="9XX XXX XXX" value={contactoAgente} onChange={(e) => setContactoAgente(e.target.value)} /></div>
      <div className="field"><label>Nome do parceiro</label><input type="text" placeholder="Responsável no local" value={nomeParceiro} onChange={(e) => setNomeParceiro(e.target.value)} /></div>
      <div className="field"><label>Nº de pontos de venda</label><input type="number" placeholder="0" value={pontosVenda} onChange={(e) => setPontosVenda(e.target.value)} /></div>
      <div className="field"><label>Observações</label><textarea rows={3} placeholder="Notas sobre a visita..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></div>
      <button type="submit" className="btn-primary" disabled={estadoGps !== "obtida"}>Guardar e Continuar para Checklist</button>
    </form>
  );
}

const hoje = new Date().toISOString().slice(0, 10);
const SERVICOS = [
  { key: "ussd", label: "Usa Meio de carregamento USSD", inicial: true },
  { key: "antigoMobile", label: "Usa o antigo Zap Agentes Mobile", inicial: false },
  { key: "novoMobile", label: "Usa o novo Zap Agentes Mobile", inicial: true },
  { key: "web", label: "Usa Zap Agentes Web", inicial: false },
];

export function Checklist() {
  const navigate = useNavigate();
  const [flybanner, setFlybanner] = useState<(typeof OPCOES_FLYBANNER)[number]>("Sim");
  const [merchandising, setMerchandising] = useState<(typeof OPCOES_MERCHANDISING)[number]>("Tem");
  const [placaPontoZap, setPlacaPontoZap] = useState<(typeof OPCOES_PLACA_PONTO_ZAP)[number]>("Tem");
  const [pendurantes, setPendurantes] = useState<(typeof OPCOES_TEM_NAO_TEM)[number]>("Tem");
  const [boxeDemonstracao, setBoxeDemonstracao] = useState<(typeof OPCOES_TEM_NAO_TEM)[number]>("Não tem");
  const [pinturaParede, setPinturaParede] = useState<(typeof OPCOES_TEM_NAO_TEM)[number]>("Não tem");
  const [stockDeBoxes, setStockDeBoxes] = useState<(typeof OPCOES_STOCK_BOXES)[number]>("N/A");
  const [zapadinhasPontos, setZapadinhasPontos] = useState<(typeof OPCOES_ZAPADINHAS_PONTOS)[number]>("Pontos");
  const [usaZapAgentesMobile, setUsaZapAgentesMobile] = useState<(typeof OPCOES_USA_MOBILE)[number]>("Sim");
  const [servicos, setServicos] = useState<Record<string, boolean>>(Object.fromEntries(SERVICOS.map((s) => [s.key, s.inicial])));
  const [observacao, setObservacao] = useState("");
  const [proximaVisita, setProximaVisita] = useState("");

  function submeter(e: FormEvent) {
    e.preventDefault();
    navigate("/");
  }

  return (
    <form onSubmit={submeter}>
      <div className="section-title" style={{ marginTop: 2 }}>Materiais de Marketing</div>
      <div className="field"><label>Flybanner</label><select value={flybanner} onChange={(e) => setFlybanner(e.target.value as typeof flybanner)}>{OPCOES_FLYBANNER.map((o) => <option key={o}>{o}</option>)}</select></div>
      <div className="field"><label>Merchandising</label><select value={merchandising} onChange={(e) => setMerchandising(e.target.value as typeof merchandising)}>{OPCOES_MERCHANDISING.map((o) => <option key={o}>{o}</option>)}</select></div>
      <div className="field"><label>Placa Ponto ZAP</label><select value={placaPontoZap} onChange={(e) => setPlacaPontoZap(e.target.value as typeof placaPontoZap)}>{OPCOES_PLACA_PONTO_ZAP.map((o) => <option key={o}>{o}</option>)}</select></div>
      <div className="field"><label>Pendurantes Aberto e Fechado</label><select value={pendurantes} onChange={(e) => setPendurantes(e.target.value as typeof pendurantes)}>{OPCOES_TEM_NAO_TEM.map((o) => <option key={o}>{o}</option>)}</select></div>
      <div className="field"><label>Boxe Demonstração</label><select value={boxeDemonstracao} onChange={(e) => setBoxeDemonstracao(e.target.value as typeof boxeDemonstracao)}>{OPCOES_TEM_NAO_TEM.map((o) => <option key={o}>{o}</option>)}</select></div>
      <div className="field"><label>Pintura de Parede</label><select value={pinturaParede} onChange={(e) => setPinturaParede(e.target.value as typeof pinturaParede)}>{OPCOES_TEM_NAO_TEM.map((o) => <option key={o}>{o}</option>)}</select></div>
      <div className="field"><label>Stock de Boxes</label><select value={stockDeBoxes} onChange={(e) => setStockDeBoxes(e.target.value as typeof stockDeBoxes)}>{OPCOES_STOCK_BOXES.map((o) => <option key={o}>{o}</option>)}</select></div>
      <div className="field"><label>Zapadinhas / Pontos</label><select value={zapadinhasPontos} onChange={(e) => setZapadinhasPontos(e.target.value as typeof zapadinhasPontos)}>{OPCOES_ZAPADINHAS_PONTOS.map((o) => <option key={o}>{o}</option>)}</select></div>
      <div className="section-title">Serviços Utilizados</div>
      <div className="card">
        <div className="toggle-row"><span className="t-label">Usa Zap Agentes Mobile</span><button type="button" className={`switch${usaZapAgentesMobile === "Sim" ? " active" : ""}`} onClick={() => setUsaZapAgentesMobile((v) => (v === "Sim" ? "Não usa" : "Sim"))} /></div>
        {SERVICOS.map((s) => (
          <div className="toggle-row" key={s.key}><span className="t-label">{s.label}</span><button type="button" className={`switch${servicos[s.key] ? " active" : ""}`} onClick={() => setServicos((v) => ({ ...v, [s.key]: !v[s.key] }))} /></div>
        ))}
      </div>
      <div className="field" style={{ marginTop: 16 }}><label>Observação</label><textarea rows={3} placeholder="Detalhes adicionais do checklist..." value={observacao} onChange={(e) => setObservacao(e.target.value)} /></div>
      <div className="field"><label>Data da próxima visita</label><input type="date" min={hoje} value={proximaVisita} onChange={(e) => setProximaVisita(e.target.value)} /></div>
      <button type="submit" className="btn-primary">Guardar Checklist</button>
    </form>
  );
}

export function Rappel() {
  const [idAgente, setIdAgente] = useState(1000236);
  const [tipoAgente, setTipoAgente] = useState<TipoAgente>("Agente Produto com rappel");
  const [nomeAgente, setNomeAgente] = useState("Manuel Sozinho");
  const [pvp, setPvp] = useState(1250000);
  const [semIva, setSemIva] = useState(1059322);
  const resultado = useMemo(() => calcularRappel(tipoAgente, semIva), [tipoAgente, semIva]);

  return (
    <div className="rappel-screen">
      <div className="section-title" style={{ marginTop: 2, color: "#fff" }}>Simulador de Rappel</div>
      <div className="field"><label>Código do Agente</label><input type="number" value={idAgente} onChange={(e) => setIdAgente(Number(e.target.value) || 0)} /></div>
      <div className="field"><label>Tipo de Agente</label><select value={tipoAgente} onChange={(e) => setTipoAgente(e.target.value as TipoAgente)}>{TIPOS_AGENTE.map((t) => <option key={t}>{t}</option>)}</select></div>
      <div className="field"><label>Nome do Agente</label><input type="text" value={nomeAgente} onChange={(e) => setNomeAgente(e.target.value)} /></div>
      <div className="field"><label>Montante PVP AOA</label><input type="number" value={pvp} onChange={(e) => setPvp(Number(e.target.value) || 0)} /></div>
      <div className="field"><label>Montante sem IVA</label><input type="number" value={semIva} onChange={(e) => setSemIva(Number(e.target.value) || 0)} /></div>
      {resultado.elegivel ? (
        <div className="rappel-result">
          <div className="rlabel">Comissão estimada</div>
          <div className="rval">{formatarMoeda(resultado.comissao)}</div>
          <div className="rscale">Escala aplicada: <span>{resultado.escalaAplicada ? `${resultado.escalaAplicada.percentagem}%` : "—"}</span></div>
        </div>
      ) : (
        <div className="rappel-result">
          <div className="rlabel">Comissão estimada</div>
          <div className="rval">—</div>
          <div className="rscale">Este tipo de agente não tem rappel.</div>
        </div>
      )}
      <span className="example-tag"><Icon name="alert" /> Dados de exemplo — escalas reais configuráveis na lista SharePoint "EscalasRappel"</span>
      {resultado.elegivel && (
        <table className="scale-table">
          <thead><tr><th>Faixa de Volume (AOA)</th><th>Percentagem</th></tr></thead>
          <tbody>
            {resultado.escalas.map((e) => (
              <tr key={`${e.volumeMinimo}-${e.volumeMaximo}`} className={resultado.escalaAplicada === e ? "hl" : ""}>
                <td>{e.volumeMaximo === Infinity ? `Acima de ${e.volumeMinimo.toLocaleString("pt-PT")}` : e.volumeMinimo === 0 ? `Até ${e.volumeMaximo.toLocaleString("pt-PT")}` : `${e.volumeMinimo.toLocaleString("pt-PT")} — ${e.volumeMaximo.toLocaleString("pt-PT")}`}</td>
                <td>{e.percentagem}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function Mais() {
  const [tab, setTab] = useState<"comm" | "pag">("comm");
  return (
    <>
      <div className="tabs-scroll">
        <button className={`tab-btn${tab === "comm" ? " active" : ""}`} onClick={() => setTab("comm")}>Comunicações</button>
        <button className={`tab-btn${tab === "pag" ? " active" : ""}`} onClick={() => setTab("pag")}>Pagamentos</button>
      </div>
      {tab === "comm" ? (
        <>
          <div className="comm-card">
            <div className="comm-img"><Icon name="megaphone" />CAMPANHA</div>
            <div className="comm-body"><div className="comm-cat">Rede de Agentes</div><div className="comm-title">Nova escala de rappel entra em vigor em Outubro</div><div className="comm-date">09 Set 2026</div></div>
          </div>
          <div className="comm-card">
            <div className="comm-img" style={{ background: "linear-gradient(135deg,var(--cor-amarelo-escuro),var(--cor-azul))" }}><Icon name="book" />FORMAÇÃO</div>
            <div className="comm-body"><div className="comm-cat">Capacitação</div><div className="comm-title">Como preencher correctamente o checklist de visita</div><div className="comm-date">02 Set 2026</div></div>
          </div>
        </>
      ) : (
        <>
          <div className="filter-chips" style={{ marginBottom: 16 }}>
            <div className="chip active">Todos os períodos</div>
            <div className="chip">Estado <Icon name="chevron" /></div>
          </div>
          <div className="pay-item">
            <div className="pay-ico kpi-verde" style={{ background: "#E6F4E6" }}><Icon name="wallet" /></div>
            <div className="pinfo"><div className="pperiod">Agosto 2026</div><div className="pdate">Pago em 05/09/2026</div></div>
            <div className="pval">63 559 Kz</div>
            <span className="badge badge-verde">Pago</span>
          </div>
          <div className="pay-item">
            <div className="pay-ico kpi-amarelo" style={{ background: "#FFF7D6" }}><Icon name="wallet" /></div>
            <div className="pinfo"><div className="pperiod">Setembro 2026</div><div className="pdate">Em processamento</div></div>
            <div className="pval">—</div>
            <span className="badge badge-amarelo">Pendente</span>
          </div>
        </>
      )}
    </>
  );
}
