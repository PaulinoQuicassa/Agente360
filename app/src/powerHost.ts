export const ERRO_FORA_DO_HOST =
  "Esta aplicação só está disponível dentro do Power Apps. Abra Agente 360 no player Microsoft 365.";

const AMBIENTE_FALLBACK = "85de9078-2a11-e636-a7d4-4cfe77ad3656";

let hostConfirmado = false;

/** Chamado quando o player responde ao getContext() — prova definitiva de que estamos no host. */
export function marcarHostPowerApps(): void {
  hostConfirmado = true;
}

/**
 * Verdadeiro quando a app corre embebida no player Power Apps. A app nativa
 * (Android/iOS) serve a Code App em *.powerplatformusercontent.com sem
 * referrer de apps.powerapps.com, por isso o URL não basta: estar numa
 * iframe ou ter o bridge injectado também conta.
 */
export function dentroDoPowerApps(): boolean {
  if (typeof window === "undefined") return false;
  if (hostConfirmado) return true;
  if ((globalThis as { powerAppsBridge?: unknown }).powerAppsBridge) return true;
  if (window.self !== window.top) return true;
  const junto = `${window.location.href}\n${document.referrer ?? ""}`.toLowerCase();
  return /powerapps\.com|powerplatform\.com|powerplatformusercontent\.com|powerapps\.microsoft\.com|\.powerapps\.ms|sharepoint\.com/.test(
    junto,
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
