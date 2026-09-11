import { useEffect, useState } from "react";
import { getContext } from "@microsoft/power-apps/app";

export interface UtilizadorSessao {
  nome: string;
  email: string;
  objectId?: string;
  tenantId?: string;
}

/**
 * Utilizador autenticado, obtido do host Power Apps via getContext() do SDK
 * — nunca de um sistema de login próprio. getContext() só resolve dentro do
 * Power Apps player; fora dele (`npm run dev` sem estar embebido no player)
 * o host nunca responde, por isso aplicamos um timeout para não bloquear a
 * UI indefinidamente.
 */
export function useUtilizadorAtual(): UtilizadorSessao | null {
  const [utilizador, setUtilizador] = useState<UtilizadorSessao | null>(null);

  useEffect(() => {
    let cancelado = false;
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));

    Promise.race([getContext(), timeout])
      .then((ctx) => {
        if (cancelado || !ctx) return;
        const { user } = ctx;
        const nome = user.fullName || user.userPrincipalName;
        if (nome) {
          setUtilizador({
            nome,
            email: user.userPrincipalName ?? "",
            objectId: user.objectId,
            tenantId: user.tenantId,
          });
        }
      })
      .catch(() => {
        // Fora do Power Apps player — sem contexto de utilizador disponível.
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return utilizador;
}
