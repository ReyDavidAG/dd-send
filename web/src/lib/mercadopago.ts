import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

export function mpClient() {
  return new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
}

export function mpPreference() {
  return new Preference(mpClient());
}

export function mpPayment() {
  return new Payment(mpClient());
}
