"use client";

import { getTemplate, resolvePalette } from "@/templates/registry";
import { InvitationView } from "@/templates/InvitationView";

// Mini vista previa (no interactiva) de una plantilla, escalada para caber
// en una tarjeta. Sirve en la landing y en el selector de plantillas.
export function MiniPreview({ templateKey, className = "h-44" }: { templateKey: string; className?: string }) {
  const def = getTemplate(templateKey);
  if (!def) return null;
  const content = def.schema.defaults;
  const palette = resolvePalette(def, content.paletteKey);

  return (
    <div className={`pointer-events-none relative w-full overflow-hidden ${className}`}>
      <div style={{ width: 1100, transform: "scale(0.34)", transformOrigin: "top left" }}>
        <InvitationView content={content} palette={palette} style={def.style} animate={false} />
      </div>
    </div>
  );
}
