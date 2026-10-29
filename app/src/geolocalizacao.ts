export type ResultadoGeolocalizacao =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; codigo: number; mensagem: string };

function mensagemErro(codigo: number): string {
  switch (codigo) {
    case 1:
      return "Permissão negada. Em Ajustes → Privacidade → Localização, active o acesso para Safari ou Power Apps.";
    case 2:
      return "Localização indisponível neste momento. Saia para exterior ou tente mais tarde.";
    case 3:
      return "Tempo esgotado ao obter GPS. Verifique se a localização está activa e tente outra vez.";
    default:
      return "Não foi possível obter a localização. Active a localização do dispositivo e tente novamente.";
  }
}

function pedirPosicao(opcoes: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, opcoes);
  });
}

/** Pedido explícito (toque do utilizador) — recomendado no iPhone / Power Apps móvel. */
export async function obterGeolocalizacaoVisita(): Promise<ResultadoGeolocalizacao> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return { ok: false, codigo: 0, mensagem: "Este dispositivo não suporta geolocalização." };
  }

  const estrategias: PositionOptions[] = [
    { enableHighAccuracy: false, timeout: 22000, maximumAge: 300_000 },
    { enableHighAccuracy: true, timeout: 40000, maximumAge: 120_000 },
  ];

  let ultimoCodigo = 0;
  for (const opcoes of estrategias) {
    try {
      const pos = await pedirPosicao(opcoes);
      return {
        ok: true,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    } catch (err) {
      const geo = err as GeolocationPositionError;
      ultimoCodigo = geo?.code ?? 0;
      if (ultimoCodigo === 1) break;
    }
  }

  return { ok: false, codigo: ultimoCodigo, mensagem: mensagemErro(ultimoCodigo) };
}
