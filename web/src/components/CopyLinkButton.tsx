"use client";

import { useState } from "react";

// Botón compacto para copiar un link. Devuelve feedback visual breve.
export function CopyLinkButton({
  url,
  label = "Copiar link",
  className,
}: {
  url: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className={className} type="button">
      {copied ? "✓ Copiado" : label}
    </button>
  );
}