// Oferta de lanzamiento: toda invitación cuesta $50 MXN plano, sin importar
// el base_price de la plantilla. base_price queda como precio "regular" (tachado).
// ponytail: para terminar la oferta, poné LAUNCH_OFFER = false (vuelve a base_price).
export const LAUNCH_OFFER = true;
export const LAUNCH_OFFER_CENTS = 5000; // $50.00 MXN

// Precio que se COBRA y se MUESTRA como vigente (mismo cálculo en ambos lados).
export const offerPriceCents = (baseCents: number) =>
  LAUNCH_OFFER ? LAUNCH_OFFER_CENTS : baseCents;

export const mxn = (cents: number) =>
  (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
