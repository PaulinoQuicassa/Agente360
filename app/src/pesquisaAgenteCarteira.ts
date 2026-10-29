import { useEffect, useRef, useState } from "react";
import {
  agenteNaCarteiraConsultor,
  buscarAgentePorCodigo,
  buscarAgentesPorPrefixo,
  type Agente,
  type UtilizadorConsultor,
} from "./sharepoint";

export function unirAgentesPorId(...listas: Agente[][]): Agente[] {
  const porId = new Map<number, Agente>();
  for (const lista of listas) {
    for (const a of lista) porId.set(a.id, a);
  }
  return [...porId.values()].sort((a, b) => a.codigoAgente - b.codigoAgente);
}

export function usePesquisaAgenteCarteira(
  utilizador: UtilizadorConsultor | null | undefined,
  agentesCarteira: Agente[],
  agenteSeleccionado: Agente | null,
  onAgenteSeleccionado: (agente: Agente | null) => void,
) {
  const aoSeleccionar = useRef(onAgenteSeleccionado);
  aoSeleccionar.current = onAgenteSeleccionado;

  const [entradaCodigo, setEntradaCodigo] = useState(() =>
    agenteSeleccionado ? String(agenteSeleccionado.codigoAgente) : "",
  );
  const [sugestoes, setSugestoes] = useState<Agente[]>([]);
  const [aPesquisar, setAPesquisar] = useState(false);

  const prefixoNumerico = entradaCodigo.replace(/\D/g, "");

  useEffect(() => {
    if (agenteSeleccionado) {
      setEntradaCodigo(String(agenteSeleccionado.codigoAgente));
    }
  }, [agenteSeleccionado?.id, agenteSeleccionado?.codigoAgente]);

  useEffect(() => {
    if (!prefixoNumerico) {
      setSugestoes([]);
      aoSeleccionar.current(null);
      return;
    }

    if (!utilizador?.nome && !utilizador?.email) {
      setSugestoes([]);
      aoSeleccionar.current(null);
      return;
    }

    const naCarteira = (a: Agente) => agenteNaCarteiraConsultor(a, utilizador);
    const locais = agentesCarteira.filter(
      (a) => String(a.codigoAgente).startsWith(prefixoNumerico) && naCarteira(a),
    );
    setSugestoes(locais);

    const exactoLocal = locais.find((a) => String(a.codigoAgente) === prefixoNumerico);
    if (exactoLocal) {
      aoSeleccionar.current(exactoLocal);
    }

    let cancelado = false;
    const timer = window.setTimeout(() => {
      setAPesquisar(true);
      (async () => {
        try {
          const daBd = await buscarAgentesPorPrefixo(prefixoNumerico, utilizador);
          if (cancelado) return;
          const merged = unirAgentesPorId(locais, daBd).filter(naCarteira);
          setSugestoes(merged);

          const exacto = merged.find((a) => String(a.codigoAgente) === prefixoNumerico);
          if (exacto) {
            aoSeleccionar.current(exacto);
            return;
          }

          if (prefixoNumerico.length >= 2) {
            const codigo = Number(prefixoNumerico);
            const encontrado = await buscarAgentePorCodigo(codigo, utilizador);
            if (!cancelado) aoSeleccionar.current(encontrado);
          } else if (!exactoLocal) {
            aoSeleccionar.current(null);
          }
        } catch {
          if (!cancelado && !exactoLocal) aoSeleccionar.current(null);
        } finally {
          if (!cancelado) setAPesquisar(false);
        }
      })();
    }, 280);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [prefixoNumerico, utilizador, agentesCarteira]);

  function escolherAgente(a: Agente) {
    setEntradaCodigo(String(a.codigoAgente));
    aoSeleccionar.current(a);
    setSugestoes([a]);
  }

  function alterarEntrada(texto: string) {
    setEntradaCodigo(texto.replace(/\D/g, ""));
  }

  return {
    entradaCodigo,
    alterarEntrada,
    prefixoNumerico,
    sugestoes,
    aPesquisar,
    escolherAgente,
  };
}
