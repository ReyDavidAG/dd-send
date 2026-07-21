// Iconos SVG inline (sin dependencias). Heredan color con currentColor y tamaño
// vía className (default 1em). Trazo tipo "lucide".
type P = { className?: string };
const base = (className = "h-4 w-4") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconEdit = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
export const IconPay = ({ className }: P) => (
  <svg {...base(className)}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
);
export const IconTrash = ({ className }: P) => (
  <svg {...base(className)}><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" /><path d="M10 11v6M14 11v6" /></svg>
);
export const IconPlus = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconLogout = ({ className }: P) => (
  <svg {...base(className)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);
export const IconUser = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const IconEye = ({ className }: P) => (
  <svg {...base(className)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconArrowLeft = ({ className }: P) => (
  <svg {...base(className)}><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
);
export const IconCheck = ({ className }: P) => (
  <svg {...base(className)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconLayout = ({ className }: P) => (
  <svg {...base(className)}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
);
export const IconCalendar = ({ className }: P) => (
  <svg {...base(className)}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
export const IconChevronLeft = ({ className }: P) => (
  <svg {...base(className)}><path d="M15 18l-6-6 6-6" /></svg>
);
export const IconChevronRight = ({ className }: P) => (
  <svg {...base(className)}><path d="M9 18l6-6-6-6" /></svg>
);
