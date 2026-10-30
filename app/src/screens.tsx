import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CaptarWizard, type DadosCaptarCompleto } from "./CaptarWizard";
import { EscolherAgentePorCodigo } from "./EscolherAgentePorCodigo";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEstadoAuth, useUtilizadorAtual } from "./auth";
import { irParaListaDeApps } from "./powerHost";
import { BotaoVoltarConteudo } from "./BotaoVoltar";
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
  contactoPrincipalAgente,
  contarPorProvincia,
  buscarAgentePorCodigo,
  formatarData,
  formatarMoeda,
  formatarNumero,
  indicadoresDashboard,
  iniciais,
  invalidarCacheAgentes,
  RAPPEL_PVP_MINIMO,
  tipoAgenteVisitaPadrao,
  useAgentesReais,
  type Agente,
  type EstadoAgente,
  type TipoAgenteVisita,
  type TipoVisita,
} from "./sharepoint";
import {
  MENSAGEM_ERRO_GRAVACAO,
  criarVisita,
  guardarChecklist,
  agentesPorVisitar,
  useResumoVisitas,
  useVisitasDoAgente,
  type Visita,
} from "./visitas";
import { obterGeolocalizacaoVisita } from "./geolocalizacao";
import { lerDiagnostico } from "./diagnostico";

const CORES_BARRA = ["var(--cor-azul)", "var(--cor-magenta)", "var(--cor-amarelo-escuro)"];

function Delta({ valor, sufixo = "vs. mês ant." }: { valor: number; sufixo?: string }) {
  if (valor > 0) return <div className="delta up">▲ +{formatarNumero(valor)} {sufixo}</div>;
  if (valor < 0) return <div className="delta down">▼ {formatarNumero(valor)} {sufixo}</div>;
  return <div className="delta">= {sufixo}</div>;
}

const LIMITE_CARREGAMENTO_LENTO_MS = 15000;

function Carregando({ mensagem = "A carregar…", tentarNovamente }: { mensagem?: string; tentarNovamente?: () => void }) {
  const { utilizador } = useEstadoAuth();
  const [inicio] = useState(() => Date.now());
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const decorrido = agora - inicio;
  if (decorrido < LIMITE_CARREGAMENTO_LENTO_MS) return <div className="empty-state">{mensagem}</div>;

  const diag = lerDiagnostico();
  return (
    <div className="empty-state">
      {mensagem}
      <div className="diagnostico-arranque">
        <b>Está a demorar mais do que o normal ({Math.round(decorrido / 1000)} s).</b>
        <div>Passo: {diag.etapa || "—"}</div>
        {diag.erro && <div>Último erro: {diag.erro}</div>}
        <div>Utilizador: {utilizador ? `${utilizador.nome} · ${utilizador.email || "sem e-mail"}` : "ainda não identificado"}</div>
      </div>
      <button
        type="button"
        className="btn-secondary"
        style={{ width: "auto", marginTop: 12, padding: "8px 16px" }}
        onClick={tentarNovamente ?? (() => window.location.reload())}
      >
        Tentar novamente
      </button>
    </div>
  );
}

function IndicadoresVisitas() {
  const { fase: faseAuth, utilizador } = useEstadoAuth();
  const authPronto = faseAuth === "ready";
  const { agentes } = useAgentesReais(utilizador, { activo: authPronto });
  const { resumo, carregando, erro } = useResumoVisitas(utilizador, { activo: authPronto, adiarMs: 1500 });
  const porVisitar =
    resumo && agentes.length > 0 ? agentesPorVisitar(agentes.length, resumo.agentesVisitadosEsteMes) : undefined;
  if (erro) {
    return (
      <div className="hint" style={{ marginBottom: 12 }}>
        Não foi possível carregar visitas da lista Controlo de visitas Agentes.
      </div>
    );
  }

  const valor = (n?: number) => (carregando || n === undefined ? "…" : formatarNumero(n));
  return (
    <>
      <div className="section-title">Visitas<span className="link">{carregando ? "A carregar…" : "As suas visitas · 2 meses"}</span></div>
      <div className="kpi-scroll">
        <div className="kpi-card"><div className="kpi-icon kpi-azul" style={{ background: "#E5F3FB" }}><Icon name="pin" /></div><div className="num">{valor(resumo?.hoje)}</div><div className="label">Visitas hoje</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-verde" style={{ background: "#E6F4E6" }}><Icon name="clipboard" /></div><div className="num">{valor(resumo?.esteMes)}</div><div className="label">Visitas este mês</div>{resumo && <Delta valor={resumo.esteMes - resumo.mesAnterior} sufixo="vs. período igual" />}</div>
        <div className="kpi-card"><div className="kpi-icon kpi-magenta" style={{ background: "#FBE4EF" }}><Icon name="pin" /></div><div className="num">{valor(resumo?.agendadosHoje)}</div><div className="label">Agendadas hoje</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-amarelo" style={{ background: "#FFF7D6" }}><Icon name="people" /></div><div className="num">{valor(porVisitar)}</div><div className="label">Por visitar (mês)</div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-azul" style={{ background: "#E5F3FB" }}><Icon name="pin" /></div><div className="num">{valor(resumo?.proximos7Dias)}</div><div className="label">Agendadas 7 dias</div></div>
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

function ErroIdentificacaoConsultor({ tentar }: { tentar: () => void }) {
  return (
    <div className="empty-state">
      Não foi possível identificar o consultor no Power Apps. Feche a app, abra de novo ou use o botão abaixo.
      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn-secondary" style={{ width: "auto", marginTop: 0, padding: "8px 16px" }} onClick={tentar}>
          Tentar identificar
        </button>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { fase: faseAuth, utilizador, tentarIdentificar } = useEstadoAuth();
  const authPronto = faseAuth === "ready";
  const { agentes, carregando, progresso, erro, tentarNovamente } = useAgentesReais(utilizador, { activo: authPronto });
  const indicadores = useMemo(() => indicadoresDashboard(agentes), [agentes]);
  const provincias = useMemo(() => contarPorProvincia(agentes), [agentes]);
  const actividades = useMemo(() => actividadeRecente(agentes, utilizador), [agentes, utilizador]);
  const maxProvincia = provincias[0]?.total ?? 0;

  if (faseAuth === "loading" && !utilizador) {
    return <Carregando mensagem="A identificar o consultor no Power Apps…" />;
  }
  if (faseAuth === "error" && !utilizador) {
    return <ErroIdentificacaoConsultor tentar={tentarIdentificar} />;
  }
  if (erro && agentes.length === 0) return <ErroCarregamento tentarNovamente={tentarNovamente} />;
  if (carregando && agentes.length === 0) {
    return (
      <Carregando
        mensagem={
          progresso > 0
            ? `A carregar a sua carteira… (${formatarNumero(progresso)})`
            : "A carregar a sua carteira…"
        }
      />
    );
  }

  return (
    <>
      <div className="section-title">
        Indicadores da carteira
        <span className="link">{carregando ? `${formatarNumero(agentes.length)} agentes` : `${formatarNumero(agentes.length)} na carteira`}</span>
      </div>
      <div className="kpi-scroll">
        <div className="kpi-card"><div className="kpi-icon kpi-azul" style={{ background: "#E5F3FB" }}><Icon name="people" /></div><div className="num">{formatarNumero(indicadores.total)}</div><div className="label">Agentes na carteira</div><Delta valor={indicadores.novosEsteMes} sufixo="este mês" /></div>
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

export function Captar() {
  return <CaptarWizard />;
}

interface EstadoConfirm extends DadosCaptarCompleto {
  codigoAgente: number;
  estado: EstadoAgente;
  anexosGravados?: number;
  emailEnviado?: boolean;
}

export function Confirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const dados = location.state as EstadoConfirm | null;

  if (!dados) {
    return (
      <div className="confirm-wrap">
        <BotaoVoltarConteudo para="/agentes" />
        <p>Nenhuma captação recente para confirmar.</p>
        <button className="btn-primary" onClick={() => navigate("/captar")}>Ir para Captar</button>
      </div>
    );
  }

  return (
    <div className="confirm-wrap">
      <div className="check-circle"><Icon name="check" /></div>
      <h2>Agente captado com sucesso</h2>
      <p>O agente foi registado na BD_Agentes_Palhativa. Foi aberto o e-mail para o suporte comercial concluir a criação na rede.</p>
      <div className="card confirm-card">
        <div className="info-row"><span className="k">Código do agente</span><span className="v">{dados.codigoAgente}</span></div>
        <div className="info-row"><span className="k">Nome</span><span className="v">{dados.nome}</span></div>
        <div className="info-row"><span className="k">Tipo</span><span className="v">{dados.tipoAgente}</span></div>
        <div className="info-row"><span className="k">Estado</span><span className="v"><span className={`badge ${badgeClassAgente(dados.estado)}`}>{dados.estado}</span></span></div>
        {dados.anexosGravados != null && dados.anexosGravados > 0 && (
          <div className="info-row"><span className="k">Anexos</span><span className="v">{dados.anexosGravados} ficheiro(s) na lista</span></div>
        )}
        {dados.emailEnviado && (
          <div className="info-row"><span className="k">Suporte comercial</span><span className="v">E-mail de notificação preparado</span></div>
        )}
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
        <BotaoVoltarConteudo para="/visitar" />
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
  const utilizador = useUtilizadorAtual();
  const { agentes, carregando, progresso, erro, tentarNovamente } = useAgentesReais(utilizador);
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
  const utilizador = useUtilizadorAtual();
  const { agentes, carregando, erro, tentarNovamente } = useAgentesReais(utilizador);
  const [tab, setTab] = useState("resumo");

  if (carregando && agentes.length === 0) return <Carregando mensagem="A carregar agente…" />;
  if (erro && agentes.length === 0) return <ErroCarregamento tentarNovamente={tentarNovamente} />;

  const agente = agentes.find((a) => a.codigoAgente === Number(agenteParam));
  if (!agente) {
    return (
      <div className="empty-state">
        <BotaoVoltarConteudo para="/agentes" />
        Agente {agenteParam} não encontrado.
      </div>
    );
  }

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
  const utilizador = useUtilizadorAtual();
  const { visitas, carregando, erro, tentarNovamente } = useVisitasDoAgente(codigoAgente, utilizador);
  if (carregando) return <Carregando mensagem="A carregar visitas…" />;
  if (erro) return <ErroCarregamento tentarNovamente={tentarNovamente} />;
  if (visitas.length === 0) return <div className="card empty-state">Ainda sem visitas registadas para este agente.</div>;
  return <>{visitas.map((v) => <CartaoVisita key={v.id} visita={v} />)}</>;
}

function ChecklistDoAgente({ codigoAgente }: { codigoAgente: number }) {
  const utilizador = useUtilizadorAtual();
  const { visitas, carregando, erro, tentarNovamente } = useVisitasDoAgente(codigoAgente, utilizador);
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
  const codigoParam = Number(searchParams.get("agente")) || 0;
  const utilizador = useUtilizadorAtual();
  const { agentes, carregando, erro, tentarNovamente } = useAgentesReais(utilizador);

  const agenteInicial = useMemo(
    () => (codigoParam ? agentes.find((a) => a.codigoAgente === codigoParam) ?? null : null),
    [codigoParam, agentes],
  );

  if (erro) return <ErroCarregamento tentarNovamente={tentarNovamente} />;

  return (
    <>
      {carregando && agentes.length === 0 && <Carregando mensagem="A carregar a sua carteira…" />}
      <VisitarForm utilizador={utilizador} agentes={agentes} agenteInicial={agenteInicial} />
    </>
  );
}

type EstadoGps = "pendente" | "a_obter" | "obtida" | "erro";

function preencherCamposDoAgente(agente: Agente | null) {
  if (!agente) {
    return {
      codigoAgente: 0,
      contactoAgente: "",
      nomeParceiro: "",
      tipoAgenteVisita: TIPOS_AGENTE_VISITA[0],
    };
  }
  return {
    codigoAgente: agente.codigoAgente,
    contactoAgente: contactoPrincipalAgente(agente),
    nomeParceiro: agente.nome,
    tipoAgenteVisita: tipoAgenteVisitaPadrao(agente.tipoAgente),
  };
}

function VisitarForm({
  utilizador,
  agentes,
  agenteInicial,
}: {
  utilizador: ReturnType<typeof useUtilizadorAtual>;
  agentes: Agente[];
  agenteInicial: Agente | null;
}) {
  const navigate = useNavigate();
  const inicial = preencherCamposDoAgente(agenteInicial);
  const [agente, setAgente] = useState<Agente | null>(agenteInicial);
  const [estadoGps, setEstadoGps] = useState<EstadoGps>("pendente");
  const [localizacao, setLocalizacao] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mensagemGps, setMensagemGps] = useState("");
  const [gpsDaBd, setGpsDaBd] = useState(false);
  const [tipoVisita, setTipoVisita] = useState<TipoVisita>(TIPOS_VISITA[0]);
  const [tipoAgenteVisita, setTipoAgenteVisita] = useState<TipoAgenteVisita>(inicial.tipoAgenteVisita);
  const [codigoAgente, setCodigoAgente] = useState(inicial.codigoAgente);
  const [contactoAgente, setContactoAgente] = useState(inicial.contactoAgente);
  const [nomeParceiro, setNomeParceiro] = useState(inicial.nomeParceiro);
  const [pontosVenda, setPontosVenda] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [aGravar, setAGravar] = useState(false);
  const [erroGravacao, setErroGravacao] = useState("");

  useEffect(() => {
    if (!agenteInicial) return;
    const campos = preencherCamposDoAgente(agenteInicial);
    setAgente(agenteInicial);
    setCodigoAgente(campos.codigoAgente);
    setContactoAgente(campos.contactoAgente);
    setNomeParceiro(campos.nomeParceiro);
    setTipoAgenteVisita(campos.tipoAgenteVisita);
  }, [agenteInicial?.id]);

  const aoEscolherAgente = useCallback(
    async (a: Agente | null) => {
      if (a?.codigoAgente) {
        const fresco = await buscarAgentePorCodigo(a.codigoAgente, utilizador);
        if (fresco) a = fresco;
      }
      setAgente(a);
      const campos = preencherCamposDoAgente(a);
      setCodigoAgente(campos.codigoAgente);
      setContactoAgente(campos.contactoAgente);
      setNomeParceiro(campos.nomeParceiro);
      setTipoAgenteVisita(campos.tipoAgenteVisita);
    },
    [utilizador],
  );

  async function obterLocalizacao() {
    setGpsDaBd(false);
    setMensagemGps("");
    setEstadoGps("a_obter");
    const resultado = await obterGeolocalizacaoVisita();
    if (resultado.ok) {
      setLocalizacao({ latitude: resultado.latitude, longitude: resultado.longitude });
      setEstadoGps("obtida");
      return;
    }
    setEstadoGps("erro");
    setMensagemGps(resultado.mensagem);
  }

  function usarLocalizacaoAgenteBd() {
    if (agente?.latitude == null || agente?.longitude == null) return;
    setLocalizacao({ latitude: agente.latitude, longitude: agente.longitude });
    setGpsDaBd(true);
    setMensagemGps("");
    setEstadoGps("obtida");
  }

  async function submeter(e: FormEvent) {
    e.preventDefault();
    if (!agente || !codigoAgente || estadoGps !== "obtida" || !localizacao || aGravar) return;
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
        state: {
          nomeAgente: agente.nome,
          tipoVisita,
          contactoAgente,
          codigoAgente,
        },
      });
    } catch {
      setErroGravacao(MENSAGEM_ERRO_GRAVACAO);
      setAGravar(false);
    }
  }

  return (
    <form onSubmit={submeter}>
      <div className="section-title" style={{ marginTop: 2 }}>1. Escolher agente</div>
      <EscolherAgentePorCodigo
        utilizador={utilizador}
        agentesCarteira={agentes}
        agente={agente}
        onAgenteChange={aoEscolherAgente}
        label="Código do ponto (agente)"
      />
      {agente && (
        <>
          <div className="section-title">Dados do agente (BD_Agentes_Palhativa)</div>
          <div className="field">
            <label>Nome do agente</label>
            <input type="text" value={agente.nome} disabled style={{ background: "var(--cor-fundo)", color: "var(--cor-texto-secundario)" }} />
          </div>
          <div className="field">
            <label>Número do ponto</label>
            <input type="text" value={String(agente.codigoAgente)} disabled style={{ background: "var(--cor-fundo)", color: "var(--cor-texto-secundario)" }} />
          </div>
          <div className="field">
            <label>Contacto do agente</label>
            <input type="tel" placeholder="9XX XXX XXX" value={contactoAgente} onChange={(e) => setContactoAgente(e.target.value)} />
            <div className="hint">Preenchido a partir da BD; pode corrigir no local se necessário.</div>
          </div>
          <div className="agent-item" style={{ cursor: "default", marginBottom: 12 }}>
            <div className="agent-avatar">{iniciais(agente.nome)}</div>
            <div>
              <div className="agent-name">{agente.nome}</div>
              <div className="agent-meta">
                {agente.codigoAgente} · {agente.municipio}, {agente.provincia}
              </div>
            </div>
          </div>
        </>
      )}
      <div className="section-title">2. Localização da visita</div>
      {estadoGps === "pendente" && (
        <div className="gps-card">
          <div className="gps-icon"><Icon name="pin" /></div>
          <div className="gps-text" style={{ flex: 1 }}>
            <b>Localização no local da visita</b>
            <span>No telemóvel, toque no botão para autorizar o GPS (iOS/Safari).</span>
          </div>
          <button type="button" className="btn-primary gps-btn" onClick={obterLocalizacao}>
            Obter localização GPS
          </button>
        </div>
      )}
      {estadoGps === "obtida" && localizacao && (
        <div className="gps-card">
          <div className="gps-icon"><Icon name="pin" /></div>
          <div className="gps-text">
            <b>{gpsDaBd ? "Coordenadas da BD do agente" : "Localização obtida"}</b>
            <span>Lat {localizacao.latitude.toFixed(4)} · Long {localizacao.longitude.toFixed(4)}</span>
          </div>
          {!gpsDaBd && (
            <button type="button" className="btn-secondary gps-btn-sec" onClick={obterLocalizacao}>
              Actualizar GPS
            </button>
          )}
        </div>
      )}
      {estadoGps === "a_obter" && (
        <div className="gps-card"><div className="gps-icon"><Icon name="pin" /></div><div className="gps-text"><b>A obter localização…</b><span>Pode demorar até 40 s em rede móvel</span></div></div>
      )}
      {estadoGps === "erro" && (
        <div className="gps-card gps-erro">
          <div className="gps-icon"><Icon name="alert" /></div>
          <div className="gps-text">
            <b>Não foi possível obter a localização.</b>
            <span>{mensagemGps || "Active a localização do dispositivo e tente novamente."}</span>
          </div>
          <button type="button" className="btn-secondary gps-btn-sec" onClick={obterLocalizacao}>
            Tentar novamente
          </button>
          {agente?.latitude != null && agente?.longitude != null && (
            <button type="button" className="btn-secondary gps-btn-sec" onClick={usarLocalizacaoAgenteBd}>
              Usar GPS registado na BD
            </button>
          )}
        </div>
      )}
      <div className="section-title">3. Dados da visita</div>
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
      <div className="field"><label>Nome do parceiro</label><input type="text" placeholder="Responsável no local" value={nomeParceiro} onChange={(e) => setNomeParceiro(e.target.value)} /><div className="hint">Por defeito, o nome do agente na BD.</div></div>
      <div className="field"><label>Nº de pontos de venda</label><input type="number" placeholder="0" value={pontosVenda} onChange={(e) => setPontosVenda(e.target.value)} /></div>
      <div className="field"><label>Observações</label><textarea rows={3} placeholder="Notas sobre a visita..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></div>
      {erroGravacao && <div className="aviso-erro">{erroGravacao}</div>}
      <button type="submit" className="btn-primary" disabled={!agente || estadoGps !== "obtida" || aGravar}>
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
  const contexto = location.state as {
    nomeAgente?: string;
    tipoVisita?: string;
    contactoAgente?: string;
    codigoAgente?: number;
  } | null;
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
      navigate(`/visita-concluida?agente=${codigoAgente}`, {
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
        <BotaoVoltarConteudo para="/visitar" />
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
      {(contexto?.nomeAgente || codigoAgente > 0) && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="info-row">
            <span className="k">Agente</span>
            <span className="v">{contexto?.nomeAgente ?? "—"}</span>
          </div>
          <div className="info-row">
            <span className="k">Nº do ponto</span>
            <span className="v">{codigoAgente || contexto?.codigoAgente || "—"}</span>
          </div>
          {contexto?.contactoAgente && (
            <div className="info-row">
              <span className="k">Contacto</span>
              <span className="v">{contexto.contactoAgente}</span>
            </div>
          )}
        </div>
      )}
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
  const utilizador = useUtilizadorAtual();
  const { agentes } = useAgentesReais(utilizador);
  const [agente, setAgente] = useState<Agente | null>(null);
  const [pvp, setPvp] = useState(0);

  const tipoAgente = agente?.tipoAgente ?? TIPOS_AGENTE[0];
  const resultado = useMemo(() => calcularRappel(tipoAgente, pvp), [tipoAgente, pvp]);

  return (
    <div className="rappel-screen">
      <div className="section-title" style={{ marginTop: 2, color: "#fff" }}>Simulador de Rappel</div>
      <EscolherAgentePorCodigo
        utilizador={utilizador}
        agentesCarteira={agentes}
        agente={agente}
        onAgenteChange={setAgente}
      />
      <div className="field"><label>Nome do Agente</label><input type="text" value={agente?.nome ?? ""} disabled placeholder="Indique o código do agente" /></div>
      <div className="field"><label>Tipo de Agente</label><input type="text" value={agente?.tipoAgente ?? ""} disabled /></div>
      {agente && (
        <>
          <div className="field"><label>Província / Município</label><input type="text" value={[agente.municipio, agente.provincia].filter(Boolean).join(", ")} disabled /></div>
          <div className="field"><label>Estado</label><input type="text" value={agente.estado} disabled /></div>
        </>
      )}
      <div className="field"><label>Montante PVP AOA</label><input type="number" value={pvp || ""} placeholder="0" onChange={(e) => setPvp(Number(e.target.value) || 0)} /><div className="hint">Define a faixa da escala de comissionamento.</div></div>
      <div className="field"><label>Montante sem IVA</label><input type="text" value={pvp ? montante2(resultado.semIva) : ""} placeholder="0,00" disabled /><div className="hint">PVP ÷ 1,14 — é sobre este valor que a comissão incide.</div></div>
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

const COMUNICACOES_MAIS = [
  {
    id: "rappel-out",
    gradient: "comm-img",
    rotulo: "CAMPANHA",
    icon: "megaphone" as const,
    categoria: "Rede de Agentes",
    titulo: "Nova escala de rappel entra em vigor em Outubro",
    data: "09 Set 2026",
  },
  {
    id: "form-checklist",
    gradient: "comm-img comm-img--alt",
    rotulo: "FORMAÇÃO",
    icon: "book" as const,
    categoria: "Capacitação",
    titulo: "Como preencher correctamente o checklist de visita",
    data: "02 Set 2026",
  },
] as const;

export function Mais() {
  const utilizador = useUtilizadorAtual();
  const [aActualizar, setAActualizar] = useState(false);

  function actualizarApp() {
    setAActualizar(true);
    invalidarCacheAgentes();
    window.location.reload();
  }

  return (
    <>
      <div className="section-title" style={{ marginTop: 2 }}>
        Comunicações
      </div>
      {COMUNICACOES_MAIS.map((item) => (
        <div className="comm-card" key={item.id}>
          <div className={item.gradient}>
            <Icon name={item.icon} />
            {item.rotulo}
          </div>
          <div className="comm-body">
            <div className="comm-cat">{item.categoria}</div>
            <div className="comm-title">{item.titulo}</div>
            <div className="comm-date">{item.data}</div>
          </div>
        </div>
      ))}

      <div className="section-title">Ferramentas</div>
      <Link to="/rappel" className="agent-item">
        <div className="agent-avatar" style={{ background: "var(--cor-magenta)" }}>
          <Icon name="wallet" />
        </div>
        <div>
          <div className="agent-name">Simulador de Rappel</div>
          <div className="agent-meta">Calcular comissão por PVP</div>
        </div>
        <Icon name="chevron" />
      </Link>

      <div className="section-title">Aplicação</div>
      {utilizador && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="info-row">
            <span className="k">Consultor</span>
            <span className="v">{utilizador.nome}</span>
          </div>
          <div className="info-row">
            <span className="k">Conta</span>
            <span className="v">{utilizador.email}</span>
          </div>
        </div>
      )}
      <button type="button" className="btn-secondary" disabled={aActualizar} onClick={actualizarApp}>
        {aActualizar ? "A actualizar…" : "Actualizar app"}
      </button>
      <button type="button" className="btn-secondary" onClick={() => irParaListaDeApps()}>
        Sair
      </button>
    </>
  );
}
