import { useRef } from "react";
import { FileText, Trash2, Upload } from "lucide-react";

export interface UploadItem {
  file: File;
  description: string;
}

/** Botão destacado (identidade IPMA) que abre o seletor de ficheiros do sistema. */
export function FilePickButton({
  onPick,
  multiple = false,
  accept,
  label = "Escolher ficheiros",
  small = false,
}: {
  onPick: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
  small?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        hidden
        multiple={multiple}
        accept={accept}
        onChange={(e) => {
          const fs = Array.from(e.target.files ?? []);
          if (fs.length > 0) onPick(fs);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`inline-flex items-center gap-2 rounded-md bg-primary font-medium text-primary-foreground ring-1 ring-black/5 transition-colors hover:bg-primary/90 ${
          small ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[12px]"
        }`}
      >
        <Upload className={small ? "size-3" : "size-3.5"} />
        {label}
      </button>
    </>
  );
}

/** Lista de ficheiros escolhidos, com descrição editável e remoção. */
export function UploadList({
  items,
  onDescription,
  onRemove,
}: {
  items: UploadItem[];
  onDescription: (index: number, description: string) => void;
  onRemove: (index: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 space-y-2">
      {items.map((it, i) => (
        <li
          key={`${it.file.name}-${i}`}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white/60 px-3 py-2"
        >
          <FileText className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{it.file.name}</span>
          <input
            value={it.description}
            maxLength={120}
            placeholder="Descrição do documento (opcional)"
            onChange={(e) => onDescription(i, e.target.value)}
            className="input-ipma min-w-40 flex-1 !py-1 text-[12px]"
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            title="Remover ficheiro"
            className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
