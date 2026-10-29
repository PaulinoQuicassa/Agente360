import { getClient } from "@microsoft/power-apps/data";
import { dataSourcesInfo } from "../.power/schemas/appschemas/dataSourcesInfo";
import { dentroDoPowerApps } from "./powerHost";

const DATA_SOURCE = "bd_agentes_palhativa";

async function ficheiroParaBase64(ficheiro: File): Promise<string> {
  const buffer = await ficheiro.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binario = "";
  const bloco = 0x8000;
  for (let i = 0; i < bytes.length; i += bloco) {
    binario += String.fromCharCode(...bytes.subarray(i, i + bloco));
  }
  return btoa(binario);
}

type OperacaoAnexo = {
  tableName: string;
  operationName: string;
  parameters: Record<string, unknown>;
};

async function tentarOperacaoAnexo(operacao: OperacaoAnexo): Promise<boolean> {
  const client = getClient(dataSourcesInfo);
  const resultado = await client.executeAsync<Record<string, unknown>, unknown>({
    connectorOperation: operacao,
  });
  return Boolean(resultado.success);
}

/**
 * Anexa ficheiros ao item da lista BD_Agentes_Palhativa (HasAttachments).
 * Tenta variantes de operação do conector SharePoint até uma funcionar.
 */
export async function anexarFicheirosAoAgente(itemId: number, ficheiros: File[]): Promise<number> {
  if (!ficheiros.length || !dentroDoPowerApps()) return 0;

  let gravados = 0;
  const id = String(itemId);

  for (const ficheiro of ficheiros) {
    const fileContent = await ficheiroParaBase64(ficheiro);
    const nome = ficheiro.name.replace(/[\\/:*?"<>|]/g, "_") || "documento";

    const tentativas: OperacaoAnexo[] = [
      {
        tableName: DATA_SOURCE,
        operationName: "CreateAttachment",
        parameters: { id, displayName: nome, body: fileContent },
      },
      {
        tableName: DATA_SOURCE,
        operationName: "CreateAttachment",
        parameters: { id, fileName: nome, body: fileContent },
      },
      {
        tableName: DATA_SOURCE,
        operationName: "PostItemAttachment",
        parameters: { id, fileName: nome, fileContent },
      },
      {
        tableName: DATA_SOURCE,
        operationName: "AddAttachment",
        parameters: { id, fileName: nome, fileContent },
      },
    ];

    let ok = false;
    for (const op of tentativas) {
      try {
        if (await tentarOperacaoAnexo(op)) {
          ok = true;
          break;
        }
      } catch {
        // tenta a operação seguinte
      }
    }
    if (ok) gravados += 1;
  }

  return gravados;
}
