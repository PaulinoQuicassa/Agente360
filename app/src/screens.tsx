import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  actividadeRecente,
  badgeClassAgente,
  calcularRappel,
  contarPorProvincia,
  criarAgente,
  formatarData,
  formatarMoeda,
  formatarNumero,
  indicadoresDashboard,
  iniciais,
  municipiosDaProvincia,
  provincasDosAgentes,
  proximoCodigoAgente,
  RAPPEL_PVP_MINIMO,
  temRappel,
  tipoAgenteVisitaPadrao,
  useAgentesReais,
  type Agente,
  type EstadoAgente,
  type TipoAgente,
  type TipoAgenteVisita,
  type TipoVisita,
} from "./sharepoint";
import {
  MENSAGEM_ERRO_GRAVACAO,
  criarVisita,
  guardarChecklist,
  useResumoVisitas,
  useVisitasDoAgente,
  type Visita,
} from "./visitas";

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

const CORES_BARRA = ["var(--cor-azul)", "var(--cor-magenta)", "var(--cor-amarelo-escuro)"];

function Delta({ valor, sufixo = "vs. mês ant." }: { valor: number; sufixo?: string }) {
  if (valor > 0) return <div className="delta up">▲ +{formatarNumero(valor)} {sufixo}</div>;
  if (valor < 0) return <div className="delta down">▼ {formatarNumero(valor)} {sufixo}</div>;
  return <div className="delta">= {sufixo}</div>;
}

function Carregando({ mensagem = "A carregar…" }: { mensagem?: string }) {
  return <div className="empty-state">{mensagem}</div>;
}

function IndicadoresVisitas() {
  const { resumo, carregando, erro } = useResumoVisitas();
  if (erro) return null;

  const valor = (n?: number) => (carregando || n === undefined ? "…" : formatarNumero(n));
  return (
    <>
      <div className="section-title">Visitas<span className="link">{carregando ? "A carregar…" : "Últimos 2 meses"}</span></div>
      <div className="kpi-scroll">
        <div className="kpi-card"><div className="kpi-icon kpi-azul" style={{ background: "#E5F3FB" }}><Icon name="pin" /></div><div className="num">{valor(resumo?.hoje)}</div><div className="label">Visitas hoje</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-verde" style={{ background: "#E6F4E6" }}><Icon name="clipboard" /></div><div className="num">{valor(resumo?.esteMes)}</div><div className="label">Visitas este mês</div>{resumo && <Delta valor={resumo.esteMes - resumo.mesAnterior} sufixo="vs. período igual" />}</div>
        <div className="kpi-card"><div className="kpi-icon kpi-magenta" style={{ background: "#FBE4EF" }}><Icon name="pin" /></div><div className="num">{valor(resumo?.proximos7Dias)}</div><div className="label">Agendadas 7 dias</div></div>
      </div>
    </>
  );
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
  const { agentes, carregando, progresso, erro, tentarNovamente } = useAgentesReais();
  const indicadores = useMemo(() => indicadoresDashboard(agentes), [agentes]);
  const provincias = useMemo(() => contarPorProvincia(agentes), [agentes]);
  const actividades = useMemo(() => actividadeRecente(agentes), [agentes]);
  const maxProvincia = provincias[0]?.total ?? 0;

  if (erro && agentes.length === 0) return <ErroCarregamento tentarNovamente={tentarNovamente} />;
  if (carregando && agentes.length === 0) {
    return <Carregando mensagem={progresso > 0 ? `A carregar agentes… (${formatarNumero(progresso)})` : "A carregar agentes…"} />;
  }

  return (
    <>
      <div className="section-title">
        Indicadores
        <span className="link">{carregando ? `A carregar… (${formatarNumero(agentes.length)})` : "Este mês"}</span>
      </div>
      <div className="kpi-scroll">
        <div className="kpi-card"><div className="kpi-icon kpi-azul" style={{ background: "#E5F3FB" }}><Icon name="people" /></div><div className="num">{formatarNumero(indicadores.total)}</div><div className="label">Total de Agentes</div><Delta valor={indicadores.novosEsteMes} sufixo="este mês" /></div>
        <div className="kpi-card"><div className="kpi-icon kpi-verde" style={{ background: "#E6F4E6" }}><Icon name="user-check" /></div><div className="num">{formatarNumero(indicadores.comInvestimentos)}</div><div className="label">Com investimentos</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-amarelo" style={{ background: "#FFF7D6" }}><Icon name="user-plus" /></div><div className="num">{formatarNumero(indicadores.novosEsteMes)}</div><div className="label">Novos este mês</div><Delta valor={indicadores.deltaNovos} /></div>
        <div className="kpi-card"><div className="kpi-icon kpi-magenta" style={{ background: "#FBE4EF" }}><Icon name="clipboard" /></div><div className="num">{formatarNumero(indicadores.semInvestimentos)}</div><div className="label">Sem investimentos</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-azul" style={{ background: "#E5F3FB" }}><Icon name="people" /></div><div className="num">{formatarNumero(indicadores.produto)}</div><div className="label">Agentes Produto</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-amarelo" style={{ background: "#FFF7D6" }}><Icon name="people" /></div><div className="num">{formatarNumero(indicadores.zapadinha)}</div><div className="label">Agentes Zapadinha</div></div>
      </div>
      <IndicadoresVisitas />
      <div className="cta-row">
        <Link to="/captar" className="cta cta-captar"><Icon name="plus" /><span className="cta-label">CAPTAR</span><span className="cta-sub">Novo agente para a rede</span></Link>
        <Link to="/visitar" className="cta cta-visitar"><Icon name="pin" /><span className="cta-label">VISITAR</span><span className="cta-sub">Registar visita a agente</span></Link>
      </div>
      <div className="cta-row">
        <Link to="/rappel" className="cta cta-rappel"><Icon name="wallet" /><span className="cta-label">SIMULADOR DE RAPPEL</span><span className="cta-sub">Calcular comissão do agente</span></Link>
      </div>
      <div className="section-title">Agentes por Província<Link to="/agentes" className="link">Ver todos</Link></div>
      <div className="card prov-list">
        {provincias.length === 0 && <div className="empty-state" style={{ padding: 8 }}>Sem agentes na lista.</div>}
        {provincias.map((p, i) => (
          <div className="bar-row" key={p.provincia}>
            <div className="prov" title={p.provincia}>{p.provincia}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${maxProvincia ? (p.total / maxProvincia) * 100 : 0}%`, background: CORES_BARRA[i % CORES_BARRA.length] }} />
            </div>
            <div className="val">{formatarNumero(p.total)}</div>
          </div>
        ))}
      </div>
      <div className="section-title">Actividade Recente<Link to="/agentes" className="link">Ver todos</Link></div>
      <div className="card">
        {actividades.length === 0 && <div className="empty-state" style={{ padding: 8 }}>Sem alterações recentes.</div>}
        {actividades.map((item) => (
          <Link to={`/perfil?agente=${item.codigoAgente}`} key={item.id} className="activity-item">
            <div className="activity-icon activity-add" style={{ background: item.tipo === "captado" ? "#FFF7D6" : "#E5F3FB", color: item.tipo === "captado" ? "#8A6D00" : "var(--cor-azul)" }}>
              <Icon name={item.tipo === "captado" ? "user-plus" : "user-check"} />
            </div>
            <div>
              <div className="activity-title">{item.titulo}</div>
              <div className="activity-sub">{item.subtitulo}</div>
            </div>
            <div className="activity-time">{item.quando}</div>
          </Link>
        ))}
      </div>
    </>
  );
}

interface DadosCaptar {
  nome: string;
  provincia: string;
  municipio: string;
  email: string;
  tipoAgente: TipoAgente;
}

export function Captar() {
  const navigate = useNavigate();
  const { agentes, carregando } = useAgentesReais();
  const [form, setForm] = useState<DadosCaptar>({
    nome: "",
    provincia: "",
    municipio: "",
    email: "",
    tipoAgente: TIPOS_AGENTE[0],
  });
  const [erros, setErros] = useState<Partial<Record<keyof DadosCaptar, string>>>({});
  const [aGravar, setAGravar] = useState(false);
  const [erroGravacao, setErroGravacao] = useState("");

  const provincias = useMemo(() => {
    const conjunto = new Set([...PROVINCIAS_ANGOLA, ...provincasDosAgentes(agentes)]);
    return [...conjunto].sort((a, b) => a.localeCompare(b, "pt"));
  }, [agentes]);
  const munList = municipiosDaProvincia(agentes, form.provincia);

  function actualizar<K extends keyof DadosCaptar>(campo: K, valor: DadosCaptar[K]) {
    setForm((f) => ({ ...f, [campo]: valor, ...(campo === "provincia" ? { municipio: "" } : {}) }));
  }

  async function submeter(e: FormEvent) {
    e.preventDefault();
    const novosErros: typeof erros = {};
    if (!form.nome.trim()) novosErros.nome = "Indique o nome do agente.";
    if (!form.provincia) novosErros.provincia = "Seleccione a província.";
    if (!form.municipio.trim()) novosErros.municipio = "Indique o município.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) novosErros.email = "Email inválido.";
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setAGravar(true);
    setErroGravacao("");
    try {
      const criado = await criarAgente({
        codigoAgente: proximoCodigoAgente(agentes),
        nome: form.nome,
        provincia: form.provincia,
        municipio: form.municipio,
        tipoAgente: form.tipoAgente,
        email: form.email,
      });
      navigate("/confirm", { state: { ...form, codigoAgente: criado.codigoAgente, estado: criado.estado } });
    } catch {
      setErroGravacao("Não foi possível gravar o agente no SharePoint. Tente novamente.");
    } finally {
      setAGravar(false);
    }
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
          {provincias.map((p) => <option key={p}>{p}</option>)}
        </select>
        {erros.provincia && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.provincia}</div>}
      </div>
      <div className="field">
        <label>Município <span className="req">*</span></label>
        <input
          type="text"
          list="municipios-reais"
          placeholder={form.provincia ? "Município" : "Selecione primeiro a província"}
          disabled={!form.provincia}
          value={form.municipio}
          onChange={(e) => actualizar("municipio", e.target.value)}
        />
        <datalist id="municipios-reais">
          {munList.map((m) => <option key={m} value={m} />)}
        </datalist>
        {erros.municipio && <div className="hint" style={{ color: "var(--cor-erro)" }}>{erros.municipio}</div>}
        {form.provincia && munList.length > 0 && <div className="hint">Sugestões a partir dos municípios já existentes nesta província.</div>}
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
      {erroGravacao && <div className="hint" style={{ color: "var(--cor-erro)", marginBottom: 12 }}>{erroGravacao}</div>}
      <button type="submit" className="btn-primary" disabled={aGravar || carregando}>
        {aGravar ? "A gravar no SharePoint…" : "Captar Agente"}
      </button>
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

interface EstadoVisitaConcluida {
  idVisita: number;
  codigoAgente: number;
  nomeAgente: string;
  tipoVisita: string;
  proximaVisita: string;
}

export function VisitaConcluida() {
  const navigate = useNavigate();
  const location = useLocation();
  const dados = location.state as EstadoVisitaConcluida | null;

  if (!dados) {
    return (
      <div className="confirm-wrap">
        <p>Nenhuma visita recente para confirmar.</p>
        <button className="btn-primary" onClick={() => navigate("/visitar")}>Ir para Visitar</button>
      </div>
    );
  }

  return (
    <div className="confirm-wrap">
      <div className="check-circle"><Icon name="check" /></div>
      <h2>Visita guardada com sucesso</h2>
      <p>A visita e o checklist ficaram registados na lista de controlo de visitas.</p>
      <div className="card confirm-card">
        <div className="info-row"><span className="k">Registo</span><span className="v">#{dados.idVisita}</span></div>
        {dados.nomeAgente && <div className="info-row"><span className="k">Agente</span><span className="v">{dados.nomeAgente}</span></div>}
        <div className="info-row"><span className="k">Código do agente</span><span className="v">{dados.codigoAgente}</span></div>
        {dados.tipoVisita && <div className="info-row"><span className="k">Tipo de visita</span><span className="v">{dados.tipoVisita}</span></div>}
        <div className="info-row"><span className="k">Data</span><span className="v">{formatarData(new Date().toISOString())}</span></div>
        {dados.proximaVisita && <div className="info-row"><span className="k">Próxima visita</span><span className="v">{formatarData(dados.proximaVisita)}</span></div>}
      </div>
      <button className="btn-primary" onClick={() => navigate(`/perfil?agente=${dados.codigoAgente}`)}>Ver Visão 360º do agente</button>
      <button className="btn-secondary" onClick={() => navigate("/visitar")}>Registar outra visita</button>
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
      {carregando && agentes.length === 0 && <Carregando mensagem={progresso > 0 ? `A carregar agentes… (${formatarNumero(progresso)})` : "A carregar agentes…"} />}
      {carregando && agentes.length > 0 && <div className="empty-state" style={{ padding: "8px 0 14px" }}>A carregar mais agentes… ({formatarNumero(progresso)})</div>}
      {!carregando && erro && agentes.length === 0 && <ErroCarregamento tentarNovamente={tentarNovamente} />}
      {!carregando && !erro && filtrados.length === 0 && <div className="empty-state">Nenhum agente encontrado com estes critérios.</div>}
      {filtrados.map((a) => (
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
          <div className="pstat"><div className="pnum">{formatarData(agente.dataActualizacao)}</div><div className="plabel">Última actualização</div></div>
          <div className="pstat"><div className="pnum">—</div><div className="plabel">Última visita</div></div>
          <div className="pstat"><div className="pnum">—</div><div className="plabel">Documentos</div></div>
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
            <div className="info-row"><span className="k">Email</span><span className="v">{agente.email ?? "—"}</span></div>
            <div className="info-row"><span className="k">Município</span><span className="v">{[agente.municipio, agente.provincia].filter(Boolean).join(", ") || "—"}</span></div>
            <div className="info-row"><span className="k">Região</span><span className="v">{agente.regiao ?? "—"}</span></div>
            <div className="info-row"><span className="k">Zona</span><span className="v">{agente.zona ?? "—"}</span></div>
            <div className="info-row"><span className="k">Consultor</span><span className="v">{agente.consultor ?? "—"}</span></div>
            <div className="info-row"><span className="k">Coordenador</span><span className="v">{agente.coordenador ?? "—"}</span></div>
            <div className="info-row"><span className="k">Perfil</span><span className="v">{agente.perfil ?? "—"}</span></div>
            <div className="info-row"><span className="k">Unidade de gestão</span><span className="v">{agente.unidadeGestao ?? "—"}</span></div>
            <div className="info-row"><span className="k">Captado por</span><span className="v">{agente.utilizadorCaptacao || "—"}</span></div>
          </div>
          <button className="btn-primary" onClick={() => navigate(`/visitar?agente=${agente.codigoAgente}`)}>Iniciar Visita a este Agente</button>
        </>
      )}
      {tab === "visitas" && <VisitasDoAgente codigoAgente={agente.codigoAgente} />}
      {tab === "checklist" && <ChecklistDoAgente codigoAgente={agente.codigoAgente} />}
      {tab === "docs" && <div className="card empty-state">A lista de agentes não tem documentos associados.</div>}
      {tab === "rappel" && <div className="card empty-state">Sem volume registado neste período.</div>}
      {tab === "pagamentos" && <div className="card empty-state">Sem pagamentos processados ainda.</div>}
    </>
  );
}

function CartaoVisita({ visita }: { visita: Visita }) {
  return (
    <div className="card">
      <div className="info-row">
        <span className="k">{formatarData(visita.dataVisita)}</span>
        <span className="v">{visita.tiposVisita.join(" · ") || "—"}</span>
      </div>
      {visita.nomeParceiro && <div className="info-row"><span className="k">Parceiro</span><span className="v">{visita.nomeParceiro}</span></div>}
      {visita.utilizador && <div className="info-row"><span className="k">Registada por</span><span className="v">{visita.utilizador}</span></div>}
      {visita.latitude !== undefined && visita.longitude !== undefined && (
        <div className="info-row"><span className="k">Localização</span><span className="v">{visita.latitude.toFixed(4)}, {visita.longitude.toFixed(4)}</span></div>
      )}
      {visita.proximaVisita && <div className="info-row"><span className="k">Próxima visita</span><span className="v">{formatarData(visita.proximaVisita)}</span></div>}
      {visita.observacao && <div className="info-row"><span className="k">Observação</span><span className="v">{visita.observacao}</span></div>}
      {!visita.temChecklist && <span className="badge badge-cinza" style={{ marginTop: 8 }}>Checklist por preencher</span>}
    </div>
  );
}

function VisitasDoAgente({ codigoAgente }: { codigoAgente: number }) {
  const { visitas, carregando, erro, tentarNovamente } = useVisitasDoAgente(codigoAgente);
  if (carregando) return <Carregando mensagem="A carregar visitas…" />;
  if (erro) return <ErroCarregamento tentarNovamente={tentarNovamente} />;
  if (visitas.length === 0) return <div className="card empty-state">Ainda sem visitas registadas para este agente.</div>;
  return <>{visitas.map((v) => <CartaoVisita key={v.id} visita={v} />)}</>;
}

function ChecklistDoAgente({ codigoAgente }: { codigoAgente: number }) {
  const { visitas, carregando, erro, tentarNovamente } = useVisitasDoAgente(codigoAgente);
  if (carregando) return <Carregando mensagem="A carregar checklist…" />;
  if (erro) return <ErroCarregamento tentarNovamente={tentarNovamente} />;

  const ultima = visitas.find((v) => v.temChecklist);
  if (!ultima) return <div className="card empty-state">Sem checklists associados.</div>;

  const linhas: [string, string][] = [
    ["Flybanner", ultima.flybanner],
    ["Merchandising", ultima.merchandising],
    ["Placa Ponto ZAP", ultima.placaPontoZap],
    ["Pendurantes", ultima.pendurantes],
    ["Boxe demonstração", ultima.boxeDemonstracao],
    ["Pintura de parede", ultima.pinturaParede],
    ["Stock de boxes", ultima.stockDeBoxes],
    ["Zapadinhas / pontos", ultima.zapadinhas.join(", ")],
    ["Usa Zap Agentes Mobile", ultima.usaZapAgentesMobile.join(", ")],
    ["Carregamento USSD", ultima.ussd ? "Sim" : "Não"],
    ["Zap Agentes Web", ultima.web ? "Sim" : "Não"],
    ["Novo Zap Agentes Mobile", ultima.novoMobile ? "Sim" : "Não"],
    ["Antigo Zap Agentes Mobile", ultima.antigoMobile ? "Sim" : "Não"],
  ];

  return (
    <>
      <div className="section-title" style={{ marginTop: 2 }}>Checklist de {formatarData(ultima.dataVisita)}</div>
      <div className="card">
        {linhas.map(([k, v]) => <div className="info-row" key={k}><span className="k">{k}</span><span className="v">{v || "—"}</span></div>)}
      </div>
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
  const [estadoGps, setEstadoGps] = useState<EstadoGps>("a_obter");
  const [localizacao, setLocalizacao] = useState<{ latitude: number; longitude: number } | null>(null);
  const [tipoVisita, setTipoVisita] = useState<TipoVisita>(TIPOS_VISITA[0]);
  const [tipoAgenteVisita, setTipoAgenteVisita] = useState<TipoAgenteVisita>(tipoAgenteVisitaPadrao(agente.tipoAgente));
  const [codigoAgente, setCodigoAgente] = useState(agente.codigoAgente);
  const [contactoAgente, setContactoAgente] = useState("");
  const [nomeParceiro, setNomeParceiro] = useState("");
  const [pontosVenda, setPontosVenda] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [aGravar, setAGravar] = useState(false);
  const [erroGravacao, setErroGravacao] = useState("");

  function obterLocalizacao() {
    if (!("geolocation" in navigator)) {
      setEstadoGps("erro");
      return;
    }
    setEstadoGps("a_obter");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalizacao({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setEstadoGps("obtida");
      },
      () => setEstadoGps("erro"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    obterLocalizacao();
  }, []);

  async function submeter(e: FormEvent) {
    e.preventDefault();
    if (estadoGps !== "obtida" || !localizacao || aGravar) return;
    setAGravar(true);
    setErroGravacao("");
    try {
      const idVisita = await criarVisita({
        codigoAgente,
        tipoAgente: tipoAgenteVisita,
        tipoVisita,
        nomeParceiro,
        contactoAgente,
        pontosVenda,
        observacoes,
        latitude: localizacao.latitude,
        longitude: localizacao.longitude,
      });
      navigate(`/checklist?agente=${codigoAgente}&visita=${idVisita}`, {
        state: { nomeAgente: agente.nome, tipoVisita },
      });
    } catch {
      setErroGravacao(MENSAGEM_ERRO_GRAVACAO);
      setAGravar(false);
    }
  }

  return (
    <form onSubmit={submeter}>
      <div className="section-title" style={{ marginTop: 2 }}>Agente seleccionado</div>
      <div className="agent-item" style={{ cursor: "default" }}>
        <div className="agent-avatar">{iniciais(agente.nome)}</div>
        <div><div className="agent-name">{agente.nome}</div><div className="agent-meta">{agente.codigoAgente} · {agente.municipio}, {agente.provincia}</div></div>
        <div className="agent-right"><span className="link" style={{ color: "var(--cor-azul)", fontSize: 11, fontWeight: 700 }} onClick={() => navigate("/agentes")}>Trocar</span></div>
      </div>
      {estadoGps === "obtida" && localizacao && (
        <div className="gps-card">
          <div className="gps-icon"><Icon name="pin" /></div>
          <div className="gps-text"><b>Localização obtida</b><span>Lat {localizacao.latitude.toFixed(4)} · Long {localizacao.longitude.toFixed(4)}</span></div>
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
      <div className="field"><label>Contacto do Agente</label><input type="tel" placeholder="9XX XXX XXX" value={contactoAgente} onChange={(e) => setContactoAgente(e.target.value)} /><div className="hint">A lista de agentes não tem campo de telefone — indique o contacto no local.</div></div>
      <div className="field"><label>Nome do parceiro</label><input type="text" placeholder="Responsável no local" value={nomeParceiro} onChange={(e) => setNomeParceiro(e.target.value)} /></div>
      <div className="field"><label>Nº de pontos de venda</label><input type="number" placeholder="0" value={pontosVenda} onChange={(e) => setPontosVenda(e.target.value)} /></div>
      <div className="field"><label>Observações</label><textarea rows={3} placeholder="Notas sobre a visita..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></div>
      {erroGravacao && <div className="aviso-erro">{erroGravacao}</div>}
      <button type="submit" className="btn-primary" disabled={estadoGps !== "obtida" || aGravar}>
        {aGravar ? "A guardar…" : "Guardar e Continuar para Checklist"}
      </button>
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
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const contexto = location.state as { nomeAgente?: string; tipoVisita?: string } | null;
  const idVisita = Number(searchParams.get("visita")) || 0;
  const codigoAgente = Number(searchParams.get("agente")) || 0;
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
  const [aGravar, setAGravar] = useState(false);
  const [erroGravacao, setErroGravacao] = useState("");

  async function submeter(e: FormEvent) {
    e.preventDefault();
    if (!idVisita || aGravar) return;
    setAGravar(true);
    setErroGravacao("");
    try {
      await guardarChecklist(idVisita, {
        flybanner,
        merchandising,
        placaPontoZap,
        pendurantes,
        boxeDemonstracao,
        pinturaParede,
        stockDeBoxes,
        zapadinhasPontos,
        usaZapAgentesMobile,
        ussd: Boolean(servicos.ussd),
        antigoMobile: Boolean(servicos.antigoMobile),
        novoMobile: Boolean(servicos.novoMobile),
        web: Boolean(servicos.web),
        observacao,
        proximaVisita,
      });
      navigate("/visita-concluida", {
        state: {
          idVisita,
          codigoAgente,
          nomeAgente: contexto?.nomeAgente ?? "",
          tipoVisita: contexto?.tipoVisita ?? "",
          proximaVisita,
        },
      });
    } catch {
      setErroGravacao(MENSAGEM_ERRO_GRAVACAO);
      setAGravar(false);
    }
  }

  if (!idVisita) {
    return (
      <div className="card empty-state">
        O checklist pertence a uma visita. Comece pelo ecrã Visitar para registar a localização e depois preencha o checklist.
        <button type="button" className="btn-primary" style={{ marginTop: 14 }} onClick={() => navigate("/visitar")}>Ir para Visitar</button>
      </div>
    );
  }

  return (
    <form onSubmit={submeter}>
      <div className="aviso-sucesso">
        <Icon name="check" />
        <span>Visita registada com a localização. Preencha o checklist para a concluir.</span>
      </div>
      <div className="section-title">Materiais de Marketing</div>
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
      {erroGravacao && <div className="aviso-erro">{erroGravacao}</div>}
      <button type="submit" className="btn-primary" disabled={aGravar}>{aGravar ? "A guardar…" : "Guardar Checklist"}</button>
    </form>
  );
}

const faixaRappel = (valor: number) => valor.toLocaleString("pt-PT", { maximumFractionDigits: 2 });
const montante2 = (valor: number) => valor.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Rappel() {
  const { agentes, carregando, erro, tentarNovamente } = useAgentesReais();
  const [idAgente, setIdAgente] = useState(0);
  const [pvp, setPvp] = useState(0);

  useEffect(() => {
    if (idAgente === 0 && agentes.length > 0) {
      const comRappel = agentes.find((a) => temRappel(a.tipoAgente)) ?? agentes[0];
      setIdAgente(comRappel.codigoAgente);
    }
  }, [agentes, idAgente]);

  const agente = agentes.find((a) => a.codigoAgente === idAgente);
  const tipoAgente = agente?.tipoAgente ?? TIPOS_AGENTE[0];
  const resultado = useMemo(() => calcularRappel(tipoAgente, pvp), [tipoAgente, pvp]);

  if (carregando) return <Carregando mensagem="A carregar agentes…" />;
  if (erro) return <ErroCarregamento tentarNovamente={tentarNovamente} />;

  return (
    <div className="rappel-screen">
      <div className="section-title" style={{ marginTop: 2, color: "#fff" }}>Simulador de Rappel</div>
      <div className="field"><label>Código do Agente</label><input type="number" value={idAgente || ""} onChange={(e) => setIdAgente(Number(e.target.value) || 0)} /></div>
      <div className="field"><label>Nome do Agente</label><input type="text" value={agente?.nome ?? ""} disabled placeholder={idAgente ? "Agente não encontrado" : "Indique o código"} /></div>
      <div className="field"><label>Tipo de Agente</label><input type="text" value={agente?.tipoAgente ?? ""} disabled /></div>
      <div className="field"><label>Montante PVP AOA</label><input type="number" value={pvp || ""} placeholder="0" onChange={(e) => setPvp(Number(e.target.value) || 0)} /><div className="hint">Define a faixa da escala de comissionamento.</div></div>
      <div className="field"><label>Montante sem IVA</label><input type="text" value={pvp ? montante2(resultado.semIva) : ""} placeholder="0,00" disabled /><div className="hint">PVP ÷ 1,14 — é sobre este valor que a comissão incide.</div></div>
      {!agente && idAgente > 0 && <div className="hint" style={{ color: "#ffd3d3", marginBottom: 12 }}>Não existe agente com o código {idAgente} na lista.</div>}
      {resultado.elegivel ? (
        <div className="rappel-result">
          <div className="rlabel">Comissão estimada</div>
          <div className="rval">{resultado.escalaAplicada ? formatarMoeda(resultado.comissao) : "—"}</div>
          <div className="rscale">
            {resultado.escalaAplicada
              ? <>Escala aplicada: <span>{resultado.escalaAplicada.percentagem}%</span></>
              : `Sem rappel para PVP abaixo de ${formatarMoeda(RAPPEL_PVP_MINIMO)}`}
          </div>
        </div>
      ) : (
        <div className="rappel-result">
          <div className="rlabel">Comissão estimada</div>
          <div className="rval">—</div>
          <div className="rscale">{agente ? "Este tipo de agente não tem rappel." : "Seleccione um agente para simular."}</div>
        </div>
      )}
      <span className="example-tag"><Icon name="alert" /> A faixa é determinada pelo PVP; a comissão incide sobre o montante sem IVA</span>
      {resultado.elegivel && (
        <table className="scale-table">
          <thead><tr><th>Faixa de PVP (AOA)</th><th>Comissão</th></tr></thead>
          <tbody>
            {resultado.escalas.map((e) => (
              <tr key={`${e.volumeMinimo}-${e.volumeMaximo}`} className={resultado.escalaAplicada === e ? "hl" : ""}>
                <td>{e.volumeMaximo === Infinity ? `Acima de ${faixaRappel(e.volumeMinimo)}` : `${faixaRappel(e.volumeMinimo)} — ${faixaRappel(e.volumeMaximo)}`}</td>
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
  return (
    <>
      <div className="section-title" style={{ marginTop: 2 }}>Comunicações</div>
      <div className="card empty-state">Ainda não há comunicações ligadas ao SharePoint.</div>
    </>
  );
}
