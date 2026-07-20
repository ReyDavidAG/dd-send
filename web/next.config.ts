import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El repo tiene dos lockfiles (Astro en la raíz + este). Fijamos la raíz
  // de Turbopack a /web para que no infiera mal el workspace.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
