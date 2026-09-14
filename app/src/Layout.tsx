import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon, IconSprite, type IconName } from "./Icon";
import { useUtilizadorAtual } from "./auth";
import { formatarNumero, iniciais, useAgentesReais } from "./sharepoint";

const headers: Record<string, { title: string; sub: string }> = {
  "/": { title: "Rede de Agentes", sub: "Rede de Agentes · Visão geral" },
  "/captar": { title: "Captar Agente", sub: "Novo registo na rede" },
  "/confirm": { title: "Confirmação", sub: "Captação concluída" },
  "/agentes": { title: "Agentes", sub: "Agentes na rede" },
  "/perfil": { title: "Visão 360º", sub: "Perfil completo do agente" },
  "/visitar": { title: "Visitar", sub: "Registar visita ao agente" },
  "/checklist": { title: "Checklist de Visita", sub: "Materiais e serviços" },
  "/visita-concluida": { title: "Confirmação", sub: "Visita concluída" },
  "/rappel": { title: "Simulador de Rappel", sub: "Cálculo de comissão" },
  "/mais": { title: "Mais", sub: "Comunicações da rede" },
};

const nav: { to: string; label: string; icon: IconName; fab?: boolean }[] = [
  { to: "/", label: "Início", icon: "home" },
  { to: "/agentes", label: "Agentes", icon: "people" },
  { to: "/captar", label: "Captar", icon: "plus", fab: true },
  { to: "/visitar", label: "Visitar", icon: "pin" },
  { to: "/mais", label: "Mais", icon: "menu" },
];

function linkActive(path: string, pathname: string) {
  if (path === "/") return pathname === "/";
  if (path === "/agentes") return pathname === "/agentes" || pathname === "/perfil";
  if (path === "/visitar") return pathname === "/visitar" || pathname === "/checklist" || pathname === "/visita-concluida";
  if (path === "/mais") return pathname === "/mais" || pathname === "/rappel";
  if (path === "/captar") return pathname === "/captar" || pathname === "/confirm";
  return pathname === path;
}

export function Layout() {
  const { pathname } = useLocation();
  const header = headers[pathname] ?? headers["/"];
  const utilizador = useUtilizadorAtual();
  const { agentes, carregando } = useAgentesReais();
  const titulo = pathname === "/" ? `Olá, ${utilizador?.nome ?? "Agente"}` : header.title;
  const sub =
    pathname === "/" || pathname === "/agentes"
      ? carregando && agentes.length === 0
        ? "A carregar a rede de agentes…"
        : `${formatarNumero(agentes.length)} agentes na rede${carregando ? "…" : ""}`
      : header.sub;

  return (
    <div className="nav-shell">
      <IconSprite />
      <header className="app-header">
        <div className="app-header__row1">
          <div className="app-header__brand">
            <span className="app-header__dot" />
            AGENTE 360
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
