// Prefija cualquier ruta de public/ con el base path (para que funcione en
// GitHub Pages bajo /nombre-repo/). Uso: asset('images/foto.jpg').
export const asset = (p: string) => import.meta.env.BASE_URL + p.replace(/^\//, '');
