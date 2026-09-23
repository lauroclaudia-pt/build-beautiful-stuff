import { PageShell } from "@/components/shell";

export function InstitutionalPage({
  eyebrow,
  title,
  intro,
  content,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  content: string;
}) {
  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <div className="max-w-[60ch] animate-rise">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">{title}</h1>
          <p className="mt-3 text-[15px] text-muted-foreground text-pretty">{intro}</p>
        </div>

        <article className="glass mt-8 max-w-[900px] animate-rise rounded-xl p-6 [animation-delay:80ms] sm:p-8">
          <div className="whitespace-pre-wrap text-[15px] leading-7 text-foreground text-pretty">
            {content}
          </div>
        </article>
      </main>
    </PageShell>
  );
}