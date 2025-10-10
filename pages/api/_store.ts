// Simple in-memory store (resets on each deploy/restart)
export type Guest = { name: string; attending: boolean; menu: string; allergies?: string; email?: string };
export const store = {
  guests: [
    { name: "Ana López", attending: true, menu: "Vegetariano" },
    { name: "Diego Pérez", attending: false, menu: "Clasico Argentino" },
  ] as Guest[],
  menu: ["Clasico Argentino", "Vegetariano", "Vegano"],
  event: {
    name: "Sofía & Franco — Boda",
    date: "2025-10-18T18:00:00-03:00",
    venue: 'Salón "Luz de Luna" — Av. Libertador 2540, Buenos Aires',
    coords: { lat: -34.5711, lng: -58.4233 }
  }
};
