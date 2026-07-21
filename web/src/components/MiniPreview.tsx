"use client";

import { getTemplate, resolvePalette } from "@/templates/registry";
import { InvitationView } from "@/templates/InvitationView";
import type { InvitationContent } from "@/templates/types";

// Mini vista previa (no interactiva) de una plantilla, escalada para caber en
// una tarjeta. Si se pasa `content`, previsualiza ese contenido real (borrador);
// si no, usa el contenido de muestra de la plantilla.
export function MiniPreview({
  templateKey,
  className = "h-44",
  scale = 0.34,
  content,
}: {
  templateKey: string;
  className?: string;
  scale?: number;
  content?: InvitationContent;
}) {
  const def = getTemplate(templateKey);
  if (!def) return null;
  const c = content ?? def.schema.defaults;
  const palette = resolvePalette(def, c.paletteKey);

  return (
    <div className={`pointer-events-none relative w-full overflow-hidden ${className}`}>
      <div style={{ width: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <InvitationView content={c} palette={palette} style={def.style} animate={false} />
      </div>
    </div>
  );
}
