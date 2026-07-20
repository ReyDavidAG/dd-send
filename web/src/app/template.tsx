// Un template se re-monta en cada navegación → re-dispara la animación de
// entrada, dando una transición suave entre pantallas.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="dd-fade-in flex min-h-full flex-1 flex-col">{children}</div>;
}
