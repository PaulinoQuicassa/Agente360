import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";

type Props = {
  para: string;
  /** Texto visível além do ícone — omitir no header compacto. */
  rotulo?: string;
  className?: string;
};

export function BotaoVoltar({ para, rotulo = "Voltar", className = "app-header__back" }: Props) {
  const navigate = useNavigate();
  return (
    <button type="button" className={className} onClick={() => navigate(para)} aria-label={rotulo}>
      <Icon name="arrow-left" className="ico" />
      {rotulo ? <span className={className.includes("app-header") ? "app-header__back-label" : undefined}>{rotulo}</span> : null}
    </button>
  );
}

/** Voltar no fluxo de conteúdo (fora do header). */
export function BotaoVoltarConteudo({ para, rotulo = "Voltar" }: Omit<Props, "className">) {
  const navigate = useNavigate();
  return (
    <button type="button" className="btn-voltar" onClick={() => navigate(para)}>
      <Icon name="arrow-left" className="ico" />
      {rotulo}
    </button>
  );
}
