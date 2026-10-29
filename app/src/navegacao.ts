/** Destino do botão Voltar consoante o ecrã actual (HashRouter). */
export function destinoVoltar(pathname: string, search: string): string | null {
  const params = new URLSearchParams(search);
  const agente = params.get("agente");

  switch (pathname) {
    case "/perfil":
      return "/agentes";
    case "/confirm":
      return "/agentes";
    case "/checklist":
      return agente ? `/visitar?agente=${agente}` : "/visitar";
    case "/visita-concluida":
      return agente ? `/perfil?agente=${agente}` : "/agentes";
    case "/rappel":
      return "/mais";
    case "/captar":
      return agente ? `/perfil?agente=${agente}` : null;
    case "/visitar":
      return agente ? `/perfil?agente=${agente}` : null;
    default:
      return null;
  }
}
