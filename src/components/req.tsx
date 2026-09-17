/** Marca visual de campo de preenchimento obrigatório. */
export function Req() {
  return (
    <span className="text-destructive" title="Preenchimento obrigatório" aria-label="obrigatório">
      {" *"}
    </span>
  );
}

/** Data de hoje em formato ISO (YYYY-MM-DD) — valor por omissão das datas de início. */
export const hojeISO = () => new Date().toISOString().slice(0, 10);
