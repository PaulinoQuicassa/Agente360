import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "./Icon";

const municipios: Record<string, string[]> = {
  Luanda: ["Luanda", "Cazenga", "Cacuaco", "Talatona", "Viana", "Belas", "Icolo e Bengo", "Kilamba Kiaxi"],
  Benguela: ["Benguela", "Lobito", "Catumbela", "Baía Farta", "Cubal"],
  "Huíla": ["Lubango", "Matala", "Humpata", "Caconda", "Chibia"],
  Huambo: ["Huambo", "Caála", "Bailundo", "Londuimbali"],
};

const provincas = ["Luanda", "Benguela", "Huíla", "Huambo", "Cabinda", "Bengo", "Bié", "Cuando Cubango", "Cuanza Norte", "Cuanza Sul", "Cunene", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"];

function calcRappel(semIva: number) {
  let pct = 0.03, label = "3%";
  if (semIva > 1500000) { pct = 0.075; label = "7,5%"; }
  else if (semIva > 1000000) { pct = 0.06; label = "6%"; }
  else if (semIva > 500000) { pct = 0.045; label = "4,5%"; }
  return { valor: Math.round(semIva * pct).toLocaleString("pt-PT") + " AOA", label };
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
        <div className="activity-item"><div className="activity-icon activity-add" style={{ background: "#FFF7D6" }}><Icon name="user-plus" /></div><div><div className="activity-title">Agente captado · AGT-001284</div><div className="activity-sub">Joana Kizua · Luanda, Cazenga</div></div><div className="activity-time">há 12 min</div></div>
        <div className="activity-item"><div className="activity-icon activity-pin" style={{ background: "#E5F3FB" }}><Icon name="pin" /></div><div><div className="activity-title">Visita registada</div><div className="activity-sub">Manuel Sozinho · Talatona</div></div><div className="activity-time">há 47 min</div></div>
        <div className="activity-item"><div className="activity-icon activity-doc" style={{ background: "#FBE7E8" }}><Icon name="file" /></div><div><div className="activity-title">Documentação pendente</div><div className="activity-sub">Rosa Ngueve · Benguela</div></div><div className="activity-time">há 2h</div></div>
      </div>
    </>
  );
}

export function Captar() {
  const navigate = useNavigate();
  const [prov, setProv] = useState("");
  const [tipo, setTipo] = useState("Produto");
  const munList = municipios[prov];
  return (
    <>
      <div className="section-title" style={{ marginTop: 2 }}>Dados do agente</div>
      <div className="field"><label>Nome <span className="req">*</span></label><input type="text" placeholder="Nome completo" /></div>
      <div className="field"><label>Província <span className="req">*</span></label>
        <select value={prov} onChange={(e) => setProv(e.target.value)}>
          <option value="">Selecione a província</option>
          {provincas.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="field"><label>Município <span className="req">*</span></label>
        <select>
          <option value="">{prov ? "Selecione o município" : "Selecione primeiro a província"}</option>
          {(munList ?? (prov ? ["Sede Municipal"] : [])).map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="field"><label>Endereço <span className="req">*</span></label><input type="text" placeholder="Rua, bairro, referência" /></div>
      <div className="field"><label>Contacto <span className="req">*</span></label><input type="tel" placeholder="9XX XXX XXX" /></div>
      <div className="field"><label>Email</label><input type="email" placeholder="opcional@exemplo.com" /><div className="hint">Opcional — validado automaticamente se preenchido.</div></div>
      <div className="section-title">Tipo de Agente</div>
      <div className="segmented">
        <button className={tipo === "Produto" ? "active" : ""} onClick={() => setTipo("Produto")}>Produto</button>
        <button className={tipo === "Zapadinhas" ? "active" : ""} onClick={() => setTipo("Zapadinhas")}>Zapadinhas</button>
      </div>
      <div className="section-title">Documentação</div>
      <div className="upload-box"><Icon name="upload" /><b>Toca para associar documentos</b><br />BI, comprovativo de morada ou outros (PDF, JPG)</div>
      <button className="btn-primary" onClick={() => navigate("/confirm")}>Captar Agente</button>
    </>
  );
}

export function Confirm() {
  const navigate = useNavigate();
  return (
    <div className="confirm-wrap">
      <div className="check-circle"><Icon name="check" /></div>
      <h2>Agente captado com sucesso</h2>
      <p>O agente foi registado e entra agora no processo de análise.</p>
      <div className="card confirm-card">
        <div className="info-row"><span className="k">ID do agente</span><span className="v">AGT-001285</span></div>
        <div className="info-row"><span className="k">Nome</span><span className="v">Joana Kizua</span></div>
        <div className="info-row"><span className="k">Tipo</span><span className="v">Produto</span></div>
        <div className="info-row"><span className="k">Estado</span><span className="v"><span className="badge badge-azul">Captado</span></span></div>
      </div>
      <button className="btn-primary" onClick={() => navigate("/agentes")}>Ver lista de Agentes</button>
      <button className="btn-secondary" onClick={() => navigate("/captar")}>Captar outro agente</button>
    </div>
  );
}

const agentes = [
  { ini: "JK", nome: "Joana Kizua", meta: "AGT-001285 · Luanda, Cazenga", badge: "badge-azul", estado: "Captado", tempo: "hoje" },
  { ini: "MS", nome: "Manuel Sozinho", meta: "AGT-000942 · Talatona", badge: "badge-verde", estado: "Activo", tempo: "visita há 2d" },
  { ini: "RN", nome: "Rosa Ngueve", meta: "AGT-001103 · Benguela", badge: "badge-vermelho", estado: "Doc. pendente", tempo: "5d" },
  { ini: "TC", nome: "Tomás Capingala", meta: "AGT-000871 · Huambo", badge: "badge-amarelo", estado: "Em análise", tempo: "1d" },
  { ini: "LP", nome: "Luísa Paciência", meta: "AGT-000765 · Huíla", badge: "badge-cinza", estado: "Inactivo", tempo: "32d" },
];

export function Agentes() {
  const [filtro, setFiltro] = useState("Todos");
  return (
    <>
      <div className="search-bar"><Icon name="search" /><input type="text" placeholder="Pesquisar por nome ou ID..." /></div>
      <div className="filter-chips">
        {["Todos", "Activos", "Em análise", "Pendentes"].map((c) => (
          <button key={c} className={`chip${filtro === c ? " active" : ""}`} onClick={() => setFiltro(c)}>{c}</button>
        ))}
        <button className="chip">Província <Icon name="chevron" /></button>
        <button className="chip">Tipo <Icon name="chevron" /></button>
      </div>
      {agentes.map((a) => (
        <Link to="/perfil" key={a.ini} className="agent-item">
          <div className="agent-avatar">{a.ini}</div>
          <div><div className="agent-name">{a.nome}</div><div className="agent-meta">{a.meta}</div></div>
          <div className="agent-right"><span className={`badge ${a.badge}`}>{a.estado}</span><span style={{ fontSize: 10, color: "var(--cor-texto-secundario)" }}>{a.tempo}</span></div>
        </Link>
      ))}
    </>
  );
}

export function Perfil() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("resumo");
  return (
    <>
      <div className="profile-hero">
        <div className="top">
          <div className="avatar-lg">JK</div>
          <div>
            <div className="pname">Joana Kizua</div>
            <div className="pid">AGT-001285 · Produto</div>
            <span className="badge badge-azul" style={{ marginTop: 6 }}>Captado</span>
          </div>
        </div>
        <div className="profile-stats">
          <div className="pstat"><div className="pnum">12 Jun</div><div className="plabel">Data de captação</div></div>
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
            <div className="info-row"><span className="k">Contacto</span><span className="v">923 456 789</span></div>
            <div className="info-row"><span className="k">Email</span><span className="v">joana.kizua@mail.com</span></div>
            <div className="info-row"><span className="k">Endereço</span><span className="v">Rua 21, Cazenga</span></div>
            <div className="info-row"><span className="k">Município</span><span className="v">Cazenga, Luanda</span></div>
            <div className="info-row"><span className="k">Estado da documentação</span><span className="v"><span className="badge badge-amarelo">1 em falta</span></span></div>
          </div>
          <button className="btn-primary" onClick={() => navigate("/visitar")}>Iniciar Visita a este Agente</button>
        </>
      )}
      {tab === "visitas" && <div className="card empty-state">Ainda sem visitas registadas para este agente.</div>}
      {tab === "checklist" && <div className="card empty-state">Sem checklists associados.</div>}
      {tab === "docs" && (
        <div className="card">
          <div className="info-row"><span className="k">Bilhete de Identidade</span><span className="v"><span className="badge badge-verde">Carregado</span></span></div>
          <div className="info-row"><span className="k">Comprovativo de morada</span><span className="v"><span className="badge badge-vermelho">Em falta</span></span></div>
        </div>
      )}
      {tab === "rappel" && <div className="card empty-state">Sem volume registado neste período.</div>}
      {tab === "pagamentos" && <div className="card empty-state">Sem pagamentos processados ainda.</div>}
    </>
  );
}

export function Visitar() {
  const navigate = useNavigate();
  const [fly, setFly] = useState("Sim");
  return (
    <>
      <div className="section-title" style={{ marginTop: 2 }}>Agente seleccionado</div>
      <div className="agent-item" style={{ cursor: "default" }}>
        <div className="agent-avatar">JK</div>
        <div><div className="agent-name">Joana Kizua</div><div className="agent-meta">AGT-001285 · Cazenga, Luanda</div></div>
        <div className="agent-right"><span className="link" style={{ color: "var(--cor-azul)", fontSize: 11, fontWeight: 700 }}>Trocar</span></div>
      </div>
      <div className="gps-card">
        <div className="gps-icon"><Icon name="pin" /></div>
        <div className="gps-text"><b>Localização obtida</b><span>Lat -8.8368 · Long 13.2343 · há instantes</span></div>
      </div>
      <div className="field"><label>Tipo de visita <span className="req">*</span></label>
        <select><option>Visita de acompanhamento</option><option>Primeira visita</option><option>Reposição de materiais</option><option>Resolução de incidência</option></select>
      </div>
      <div className="field"><label>Data e hora</label><input type="text" value="11/09/2026 · 14:32" disabled style={{ background: "#F3F5F7", color: "var(--cor-texto-secundario)" }} /><div className="hint">Preenchido automaticamente ao guardar.</div></div>
      <div className="field"><label>Nome do parceiro</label><input type="text" placeholder="Responsável no local" /></div>
      <div className="field"><label>Nº de pontos de venda</label><input type="number" placeholder="0" /></div>
      <div className="field"><label>Flybanner presente?</label>
        <div className="segmented">
          <button className={fly === "Sim" ? "active" : ""} onClick={() => setFly("Sim")}>Sim</button>
          <button className={fly === "Não" ? "active" : ""} onClick={() => setFly("Não")}>Não</button>
        </div>
      </div>
      <div className="field"><label>Observações</label><textarea rows={3} placeholder="Notas sobre a visita..." /></div>
      <div className="field"><label>Resultado da visita</label>
        <select><option>Positivo</option><option>Necessita acompanhamento</option><option>Sem contacto</option></select>
      </div>
      <button className="btn-primary" onClick={() => navigate("/checklist")}>Guardar e Continuar para Checklist</button>
    </>
  );
}

const materiais = ["Flybanner", "Merchandising", "Placa Ponto ZAP", "Boxe Demonstração", "Pendurante Aberto", "Pendurante Fechado", "Pintura de Parede", "Stock de Boxes", "Zapadinhas / Pontos"];

export function Checklist() {
  const navigate = useNavigate();
  const [on, setOn] = useState<Record<string, boolean>>({ Flybanner: true, "Placa Ponto ZAP": true, "Pendurante Fechado": true, "Stock de Boxes": true });
  const [svc, setSvc] = useState([true, false, true, false]);
  return (
    <>
      <div className="section-title" style={{ marginTop: 2 }}>Materiais de Marketing</div>
      <div className="material-grid">
        {materiais.slice(0, 8).map((m) => (
          <button key={m} className={`mat-chip${on[m] ? " active" : ""}`} onClick={() => setOn((s) => ({ ...s, [m]: !s[m] }))}>
            <span className="box"><Icon name="check" /></span>{m}
          </button>
        ))}
      </div>
      <div className="material-grid" style={{ gridTemplateColumns: "1fr" }}>
        <button className={`mat-chip${on["Zapadinhas / Pontos"] ? " active" : ""}`} onClick={() => setOn((s) => ({ ...s, "Zapadinhas / Pontos": !s["Zapadinhas / Pontos"] }))}>
          <span className="box"><Icon name="check" /></span>Zapadinhas / Pontos
        </button>
      </div>
      <div className="section-title">Serviços Utilizados</div>
      <div className="card">
        {["Usa Meio de Carregamento USSD", "Usa o antigo ZAP Agentes Mobile", "Usa o novo ZAP Agentes Mobile", "Usa ZAP Agentes Web"].map((label, i) => (
          <div className="toggle-row" key={label}>
            <span className="t-label">{label}</span>
            <button className={`switch${svc[i] ? " active" : ""}`} onClick={() => setSvc((s) => s.map((v, j) => (j === i ? !v : v)))} />
          </div>
        ))}
      </div>
      <div className="field" style={{ marginTop: 16 }}><label>Observação</label><textarea rows={3} placeholder="Detalhes adicionais do checklist..." /></div>
      <div className="field"><label>Data da próxima visita</label><input type="date" min="2026-09-11" /></div>
      <button className="btn-primary" onClick={() => navigate("/")}>Guardar Checklist</button>
    </>
  );
}

export function Rappel() {
  const [semIva, setSemIva] = useState(1059322);
  const result = useMemo(() => calcRappel(semIva), [semIva]);
  return (
    <div className="rappel-screen">
      <div className="section-title" style={{ marginTop: 2, color: "#fff" }}>Simulador de Rappel</div>
      <div className="field"><label>ID do Agente</label><input type="text" defaultValue="AGT-000942" /></div>
      <div className="field"><label>Tipo de Agente</label><select><option>Produto</option><option>Zapadinhas</option></select></div>
      <div className="field"><label>Nome do Agente</label><input type="text" defaultValue="Manuel Sozinho" /></div>
      <div className="field"><label>Montante PVP AOA</label><input type="number" defaultValue={1250000} /></div>
      <div className="field"><label>Montante sem IVA</label><input type="number" value={semIva} onChange={(e) => setSemIva(Number(e.target.value))} /></div>
      <div className="rappel-result">
        <div className="rlabel">Comissão estimada</div>
        <div className="rval">{result.valor}</div>
        <div className="rscale">Escala aplicada: <span>{result.label}</span></div>
      </div>
      <span className="example-tag"><Icon name="alert" /> Dados de exemplo — escalas reais configuráveis na lista SharePoint "EscalasRappel"</span>
      <table className="scale-table">
        <thead><tr><th>Faixa de Volume (AOA)</th><th>Percentagem</th></tr></thead>
        <tbody>
          <tr><td>Até 500 000</td><td>3%</td></tr>
          <tr><td>500 001 — 1 000 000</td><td>4,5%</td></tr>
          <tr className={result.label === "6%" ? "hl" : ""}><td>1 000 001 — 1 500 000</td><td>6%</td></tr>
          <tr className={result.label === "7,5%" ? "hl" : ""}><td>Acima de 1 500 000</td><td>7,5%</td></tr>
        </tbody>
      </table>
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
            <div className="comm-body">
              <div className="comm-cat">Rede de Agentes</div>
              <div className="comm-title">Nova escala de rappel entra em vigor em Outubro</div>
              <div className="comm-date">09 Set 2026</div>
            </div>
          </div>
          <div className="comm-card">
            <div className="comm-img" style={{ background: "linear-gradient(135deg,var(--cor-amarelo-escuro),var(--cor-azul))" }}><Icon name="book" />FORMAÇÃO</div>
            <div className="comm-body">
              <div className="comm-cat">Capacitação</div>
              <div className="comm-title">Como preencher correctamente o checklist de visita</div>
              <div className="comm-date">02 Set 2026</div>
            </div>
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
