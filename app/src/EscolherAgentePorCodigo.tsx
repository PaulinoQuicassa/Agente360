import type { Agente, UtilizadorConsultor } from "./sharepoint";
import { usePesquisaAgenteCarteira } from "./pesquisaAgenteCarteira";

type Props = {
  utilizador: UtilizadorConsultor | null | undefined;
  agentesCarteira: Agente[];
  agente: Agente | null;
  onAgenteChange: (agente: Agente | null) => void;
  label?: string;
  placeholder?: string;
  maxSugestoes?: number;
};

export function EscolherAgentePorCodigo({
  utilizador,
  agentesCarteira,
  agente,
  onAgenteChange,
  label = "Código do agente",
  placeholder = "Digite o código…",
  maxSugestoes = 12,
}: Props) {
  const { entradaCodigo, alterarEntrada, prefixoNumerico, sugestoes, aPesquisar, escolherAgente } =
    usePesquisaAgenteCarteira(utilizador, agentesCarteira, agente, onAgenteChange);

  return (
    <div className="field">
      <label>
        {label} <span className="req">*</span>
      </label>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={entradaCodigo}
        onChange={(e) => alterarEntrada(e.target.value)}
      />
      <div className="hint">
        {!utilizador?.nome && !utilizador?.email
          ? "A aguardar identificação do consultor (Power Apps)…"
          : aPesquisar
            ? "A pesquisar na BD_Agentes_Palhativa (só a sua carteira — campo Consultor)…"
            : "Pesquisa na lista BD_Agentes_Palhativa — agentes do consultor logado."}
      </div>
      {sugestoes.length > 0 && prefixoNumerico && (
        <div className="codigo-sugestoes" role="listbox" aria-label="Agentes sugeridos">
          {sugestoes.slice(0, maxSugestoes).map((a) => (
            <button
              type="button"
              key={a.id}
              className={`codigo-sugestao${agente?.id === a.id ? " codigo-sugestao--activo" : ""}`}
              onClick={() => escolherAgente(a)}
            >
              <span className="codigo-sugestao__cod">{a.codigoAgente}</span>
              <span className="codigo-sugestao__nome">{a.nome}</span>
              <span className="codigo-sugestao__meta">{a.municipio}</span>
            </button>
          ))}
        </div>
      )}
      {!agente && prefixoNumerico.length >= 2 && !aPesquisar && sugestoes.length === 0 && utilizador && (
        <div className="hint" style={{ color: "var(--cor-erro, #c0392b)", marginTop: 6 }}>
          Nenhum agente na sua carteira com código a começar por {prefixoNumerico}.
        </div>
      )}
    </div>
  );
}
