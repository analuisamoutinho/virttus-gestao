"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { FormError } from "@/components/ui/form";
import { regenerateFeedbackLink } from "@/server/actions/manager-feedback";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Link do formulário anônimo"
        className="w-full rounded-sm border border-border bg-bg px-3.5 py-2.5 text-sm text-deep focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/30"
      />
      <Button
        type="button"
        variant="outline"
        icon={copied ? "check" : "link"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* navegador sem permissão de área de transferência: o campo já está selecionável */
          }
        }}
      >
        {copied ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}

export function RegenerateLinkButton({
  userId,
  hasLink,
  size = "md",
}: {
  userId?: string;
  hasLink: boolean;
  size?: "sm" | "md";
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size={size}
        variant={hasLink ? "outline" : "primary"}
        disabled={pending}
        onClick={() => {
          if (hasLink && !confirm("O link atual deixará de funcionar. Gerar um novo?")) return;
          setError(null);
          start(async () => {
            const res = await regenerateFeedbackLink(userId);
            if (!res.ok) setError(res.error);
          });
        }}
      >
        {pending ? "Gerando…" : hasLink ? "Gerar novo link" : "Gerar link"}
      </Button>
      {error ? <FormError>{error}</FormError> : null}
    </div>
  );
}
