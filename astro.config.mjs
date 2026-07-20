// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// ponytail: para desplegar en GitHub Pages, cambia estas dos líneas.
//   - site: la URL raíz de tu usuario/org en GitHub Pages
//   - base: el nombre del repositorio, entre barras. Si usas dominio propio
//           o un repo "usuario.github.io", pon base: '/'.
export default defineConfig({
  site: 'https://reydavidag.github.io',
  base: '/dd-send/',
  vite: {
    plugins: [tailwindcss()],
  },
});
