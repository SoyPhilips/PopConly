export type PlanId = "essential" | "plus" | "ultra";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  priceNote: string;
  /** Precio fijo en COP para Wompi/Nequi (TRM ~$4.100 redondeado comercial). */
  cop: number;
  quality: string;
  resolution: string;
  devices: string;
  devicesShort: string;
  downloads: string;
  downloadsOk: boolean;
  popular?: boolean;
  features: string[];
};

export function formatCOP(cop: number): string {
  return `$${cop.toLocaleString("es-CO")}`;
}

export const PLANS: Plan[] = [
  {
    id: "essential",
    name: "Pop Essential",
    price: "$4.99",
    priceNote: "/mes",
    cop: 19900,
    quality: "Buena",
    resolution: "720p HD",
    devices: "1 dispositivo a la vez",
    devicesShort: "1",
    downloads: "Sin descargas",
    downloadsOk: false,
    features: ["720p HD", "1 dispositivo a la vez", "Sin descargas", "Sin anuncios"],
  },
  {
    id: "plus",
    name: "Pop Plus",
    price: "$8.99",
    priceNote: "/mes",
    cop: 36900,
    quality: "Mejor",
    resolution: "1080p Full HD",
    devices: "2 dispositivos a la vez",
    devicesShort: "2",
    downloads: "Descargas habilitadas",
    downloadsOk: true,
    popular: true,
    features: ["1080p Full HD", "2 dispositivos a la vez", "Descargas habilitadas", "Sin anuncios"],
  },
  {
    id: "ultra",
    name: "Pop Ultra",
    price: "$12.99",
    priceNote: "/mes",
    cop: 52900,
    quality: "Óptima",
    resolution: "4K Ultra HD + HDR",
    devices: "4 dispositivos simultáneos",
    devicesShort: "4",
    downloads: "Descargas en todos los dispositivos",
    downloadsOk: true,
    features: [
      "4K Ultra HD + HDR",
      "Audio Dolby Atmos",
      "4 dispositivos simultáneos",
      "Descargas en todos los dispositivos",
      "Sin anuncios",
    ],
  },
];

export function getPlan(id: string | null): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[1];
}
