import { notFound } from "next/navigation";
import { getTemplate, resolvePalette } from "@/templates/registry";

// Vista previa de una plantilla con su contenido de muestra (dev/QA).
// Reutilizable como base de la vista previa en vivo de la Fase 4.
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const def = getTemplate(key);
  if (!def) notFound();

  const content = def.schema.defaults;
  const palette = resolvePalette(def, content.paletteKey);
  const { Component } = def;

  return <Component content={content} palette={palette} style={def.style} />;
}
