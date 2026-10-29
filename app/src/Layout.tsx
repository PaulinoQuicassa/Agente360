import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BotaoVoltar } from "./BotaoVoltar";
import { Icon, IconSprite, type IconName } from "./Icon";
import { LogoZap } from "./LogoZap";
import { useEstadoAuth } from "./auth";
import { destinoVoltar } from "./navegacao";
import { formatarNumero, iniciais, useEstadoCarteira } from "./sharepoint";
import { agentesPorVisitar, useResumoVisitas } from "./visitas";

const headers: Record<string, { title: string; sub: string }> = {
  "/": { title: "Rede de Agentes", sub: "Rede de Agentes · Visão geral" },
  "/captar": { title: "Captar Agente", sub: "Novo registo na rede" },
  "/confirm": { title: "Confirmação", sub: "Captação concluída" },
  "/agentes": { title: "Agentes", sub: "A sua carteira" },
  "/perfil": { title: "Visão 360º", sub: "Perfil completo do agente" },
  "/visitar": { title: "Visitar", sub: "Registar visita ao agente" },
  "/checklist": { title: "Checklist de Visita", sub: "Materiais e serviços" },
  "/visita-concluida": { title: "Confirmação", sub: "Visita concluída" },
  "/rappel": { title: "Simulador de Rappel", sub: "Cálculo de comissão" },
  "/mais": { title: "Mais", sub: "Comunicações e opções da app" },
};

const nav: { to: string; label: string; icon: IconName; fab?: boolean }[] = [
  { to: "/", label: "Início", icon: "home" },
  { to: "/agentes", label: "Agentes", icon: "people" },
  { to: "/captar", label: "Captar", icon: "plus", fab: true },
  { to: "/visitar", label: "Visitar", icon: "pin" },
  { to: "/mais", label: "Mais", icon: "menu" },
];

function textoResumoInicio({
  faseAuth,
  totalCarteira,
  carregandoAgentes,
  erroAgentes,
  utilizador,
  resumo,
  carregandoVisitas,
}: {
  faseAuth: "loading" | "ready" | "error";
  totalCarteira: number;
  carregandoAgentes: boolean;
  erroAgentes: boolean;
  utilizador: { nome: string; email: string } | null;
  resumo: { agentesVisitadosEsteMes: number; agendadosHoje: number; hoje: number } | null;
  carregandoVisitas: boolean;
}): string {
  if (erroAgentes && totalCarteira === 0) {
    return "Não foi possível ler a sua carteira em BD_Agentes_Palhativa (campo Consultor).";
  }
  if (faseAuth === "loading" && !utilizador) {
    return "A identificar o consultor…";
  }
  if (faseAuth === "error" && !utilizador) {
    return "Consultor não identificado — use «Tentar novamente» no ecrã.";
  }
  if (!utilizador) {
    return "A identificar o consultor…";
  }
  if (carregandoAgentes && totalCarteira === 0) {
    return "A carregar a sua carteira do SharePoint…";
  }

  const n = totalCarteira;
  const suffixCarga = carregandoAgentes ? " (carteira a actualizar…)" : "";
  const partes: string[] = [
    `${formatarNumero(n)} ${n === 1 ? "agente na carteira" : "agentes na carteira"}${suffixCarga}`,
  ];

  if (carregandoVisitas && !resumo) {
    partes.push("visitas a carregar…");
  } else if (resumo) {
    const faltam = agentesPorVisitar(n, resumo.agentesVisitadosEsteMes);
    partes.push(`${formatarNumero(resumo.agentesVisitadosEsteMes)} visitados este mês`);
    partes.push(`${formatarNumero(faltam)} por visitar`);
    partes.push(`${formatarNumero(resumo.agendadosHoje)} agendados hoje`);
    partes.push(`${formatarNumero(resumo.hoje)} visitas hoje`);
  }

  return partes.join(" · ");
}

function linkActive(path: string, pathname: string) {
  if (path === "/") return pathname === "/";
  if (path === "/agentes") return pathname === "/agentes" || pathname === "/perfil";
  if (path === "/visitar") return pathname === "/visitar" || pathname === "/checklist" || pathname === "/visita-concluida";
  if (path === "/mais") return pathname === "/mais" || pathname === "/rappel";
  if (path === "/captar") return pathname === "/captar" || pathname === "/confirm";
  return pathname === path;
}

export function Layout() {
  const { pathname, search } = useLocation();
  const voltarPara = destinoVoltar(pathname, search);
  const header = headers[pathname] ?? headers["/"];
  const { fase: faseAuth, utilizador } = useEstadoAuth();
  const authPronto = faseAuth === "ready";
  const { total: totalCarteira, carregando, erro } = useEstadoCarteira(utilizador, { activo: authPronto });
  const precisaResumoVisitas = pathname === "/" || pathname === "/agentes";
  const { resumo, carregando: carregandoVisitas } = useResumoVisitas(utilizador, {
    activo: authPronto && precisaResumoVisitas,
    adiarMs: precisaResumoVisitas ? 2500 : 0,
  });
  const titulo = pathname === "/" ? `Olá, ${utilizador?.nome ?? "Agente"}` : header.title;
  const sub =
    pathname === "/"
      ? textoResumoInicio({
          faseAuth,
          totalCarteira,
          carregandoAgentes: carregando,
          erroAgentes: erro,
          utilizador,
          resumo,
          carregandoVisitas,
        })
      : pathname === "/agentes"
        ? textoResumoInicio({
            faseAuth,
            totalCarteira,
            carregandoAgentes: carregando,
            erroAgentes: erro,
            utilizador,
            resumo,
            carregandoVisitas,
          })
        : header.sub;

  return (
    <div className="nav-shell">
      <IconSprite />
      <header className="app-header">
        <div className="app-header__row1">
          <div className="app-header__start">
            {voltarPara ? <BotaoVoltar para={voltarPara} rotulo="Voltar" /> : null}
            <div className="app-header__brand">
              <LogoZap />
              <span className="app-header__brand-name">AGENTE 360</span>
            </div>
          </div>
          <div className="app-header__avatar" title={utilizador?.email}>
            {utilizador ? iniciais(utilizador.nome) : "—"}
          </div>
        </div>
        <h1 className="app-header__title">{titulo}</h1>
        <p className="app-header__sub">{sub}</p>
      </header>

      <aside className="nav-shell__sidebar">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={() =>
              `nav-shell__sidebar-link${linkActive(item.to, pathname) ? " nav-shell__sidebar-link--active" : ""}`
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to="/rappel"
          className={() =>
            `nav-shell__sidebar-link${pathname === "/rappel" ? " nav-shell__sidebar-link--active" : ""}`
          }
        >
          <Icon name="wallet" />
          Rappel
        </NavLink>
      </aside>

      <main className="nav-shell__content">
        <Outlet />
      </main>

      <nav className="nav-shell__bottombar">
        {nav.map((item) =>
          item.fab ? (
            <NavLink key={item.to} to={item.to} className="nav-shell__fab" aria-label={item.label}>
              <Icon name={item.icon} />
            </NavLink>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                `nav-shell__bottombar-link${linkActive(item.to, pathname) ? " nav-shell__bottombar-link--active" : ""}`
              }
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}
