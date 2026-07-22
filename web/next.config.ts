import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El repo tiene dos lockfiles (Astro en la raíz + este). Fijamos la raíz
  // de Turbopack a /web para que no infiera mal el workspace.
  turbopack: { root: import.meta.dirname },
  // Permite probar el dev server desde otros dispositivos en la LAN (ej. celular).
  allowedDevOrigins: ["192.168.0.39"],
  experimental: {
    // Fotos de móvil (JPEG/HEIC de cámara) pesan 2-8 MB por archivo y el
    // default de Next.js es 1 MB, lo que rompe `uploadPhoto` desde celular
    // con "Body exceeded 1 MB limit". 10 MB cubre incluso HEIC de iPhone Pro.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
