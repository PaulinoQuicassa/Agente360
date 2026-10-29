export const ERRO_FORA_DO_HOST =
  "Esta aplicação só está disponível dentro do Power Apps. Abra Agente 360 no player Microsoft 365.";

const AMBIENTE_FALLBACK = "85de9078-2a11-e636-a7d4-4cfe77ad3656";

/** Verdadeiro quando a app corre embebida no player Power Apps (ou host conhecido). */
export function dentroDoPowerApps(): boolean {
  if (typeof window === "undefined") return false;
  if ((globalThis as { powerAppsBridge?: unknown }).powerAppsBridge) return true;
  const href = window.location.href;
  const ref = document.referrer ?? "";
  const junto = `${href}\n${ref}`.toLowerCase();
  return (
    /powerapps\.com|powerplatform\.com|powerapps\.microsoft\.com|\.powerapps\.ms|sharepoint\.com/.test(junto) ||
    (window.self !== window.top && /microsoft|office\.com|sharepoint/.test(junto))
  );
}

function idAmbiente(): string {
  if (typeof window === "undefined") return AMBIENTE_FALLBACK;
  const url = new URL(window.location.href);
  const deQuery = url.searchParams.get("environmentid") || url.searchParams.get("environmentId");
  if (deQuery) return deQuery;
  const match = url.href.match(/\/e\/([0-9a-f-]{36})/i);
  if (match?.[1]) return match[1];
  try {
    const ref = document.referrer;
    if (ref) {
      const refUrl = new URL(ref);
      const env = refUrl.searchParams.get("environmentid") || refUrl.searchParams.get("environmentId");
      if (env) return env;
    }
  } catch {
    /* ignore */
  }
  return AMBIENTE_FALLBACK;
}

/** Sair da Code App e voltar à lista de apps do ambiente. */
export function irParaListaDeApps(): void {
  const env = idAmbiente();
  window.location.assign(`https://apps.powerapps.com/home?environmentid=${env}`);
}
