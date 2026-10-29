import { useRef } from "react";
import { Icon } from "./Icon";

type Props = {
  ficheiros: File[];
  onChange: (ficheiros: File[]) => void;
  disabled?: boolean;
};

export function AnexosCaptacao({ ficheiros, onChange, disabled }: Props) {
  const inputDocumento = useRef<HTMLInputElement>(null);
  const inputCamera = useRef<HTMLInputElement>(null);

  function acrescentar(lista: FileList | null) {
    if (!lista?.length) return;
    const novos = [...ficheiros];
    for (const f of lista) {
      if (!novos.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)) {
        novos.push(f);
      }
    }
    onChange(novos);
  }

  function remover(indice: number) {
    onChange(ficheiros.filter((_, i) => i !== indice));
  }

  return (
    <div className="field">
      <label>Documentos</label>
      <div className="anexos-captacao__accoes">
        <button
          type="button"
          className="btn-secondary anexos-captacao__btn"
          disabled={disabled}
          onClick={() => inputDocumento.current?.click()}
        >
          <Icon name="file" />
          Anexar documento
        </button>
        <button
          type="button"
          className="btn-secondary anexos-captacao__btn"
          disabled={disabled}
          onClick={() => inputCamera.current?.click()}
        >
          <Icon name="upload" />
          Tirar fotografia
        </button>
      </div>
      <input
        ref={inputDocumento}
        type="file"
        accept="image/*,application/pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
        multiple
        hidden
        onChange={(e) => {
          acrescentar(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={inputCamera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          acrescentar(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="hint">BI, comprovativos ou fotos do ponto — ficam anexos ao registo na BD_Agentes_Palhativa.</div>
      {ficheiros.length > 0 && (
        <ul className="anexos-captacao__lista">
          {ficheiros.map((f, i) => (
            <li key={`${f.name}-${f.lastModified}-${i}`}>
              <span className="anexos-captacao__nome">{f.name}</span>
              <span className="anexos-captacao__tam">{(f.size / 1024).toFixed(0)} KB</span>
              <button type="button" className="link anexos-captacao__remover" disabled={disabled} onClick={() => remover(i)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
