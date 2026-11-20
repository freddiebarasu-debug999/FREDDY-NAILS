import { normalizeServiceName, stripServicePrice } from "@/lib/serviceNames";

// The full service menu with durations (minutes) and starting prices (R).
// Used by the owner dashboard. Keep in step with the booking page.
// item = [name, duration, price]
const RAW = [
  ["Acrylic Manicure", [
    ["Acrylic — Plain Short–Medium", 90, 200],
    ["Acrylic — Plain Long", 105, 250],
    ["Acrylic — Plain XL–XXXL", 120, 300],
    ["Acrylic — French Short–Medium", 100, 300],
    ["Acrylic — French Long", 115, 350],
    ["Acrylic — French XL–XXL", 130, 400],
    ["Acrylic — Ombré Short–Medium", 120, 250],
    ["Acrylic — Ombré Long", 135, 300],
    ["Acrylic — Ombré XL–XXXL", 150, 350],
  ]],
  ["Gel Manicure", [
    ["Gel — Overlay", 75, 200],
    ["Gel — Plain Short–Medium", 90, 250],
    ["Gel — Plain Long", 100, 300],
    ["Gel — French Short–Medium", 95, 300],
    ["Gel — French Long", 110, 350],
  ]],
  ["Pedicure", [
    ["Pedicure — Gel Overlay", 45, 150],
    ["Pedicure — Gel Full Tips", 60, 200],
    ["Pedicure — Acrylic Overlay", 55, 180],
    ["Pedicure — Acrylic Full Tips", 65, 200],
    ["Pedicure — Acrylic French Tips", 75, 250],
  ]],
  ["Eyelash Extensions", [
    ["Lashes — Cluster", 45, 130],
    ["Lashes — Cateye", 60, 150],
    ["Lashes — Classic", 90, 180],
  ]],
  ["Foot Spa", [
    ["Foot Spa — Basic", 30, 200],
    ["Foot Spa — Luxury", 45, 280],
  ]],
  ["Extras", [
    ["Extra — Buff & Shine", 30, 150],
    ["Extra — Fill-in @3 weeks", 75, 180],
    ["Extra — Nail Repair", 15, 20],
    ["Extra — Soak Off (own work)", 20, 50],
    ["Extra — Soak Off (other salon)", 20, 70],
    ["Extra — Nail Art", 20, 30],
    ["Extra — Rhinestones", 10, 10],
    ["Extra — 3D Art", 30, 50],
  ]],
];

export const SERVICE_CATEGORIES = RAW.map(([category, items]) => ({
  category,
  items: items.map(([name, duration, price]) => ({
    label: stripServicePrice(name), // how it is stored on bookings
    duration,
    price,
  })),
}));

const BY_NORMALIZED = {};
for (const group of SERVICE_CATEGORIES) {
  for (const item of group.items) {
    BY_NORMALIZED[normalizeServiceName(item.label)] = item;
  }
}
// Older bookings may say just "Extra - Soak Off".
BY_NORMALIZED[normalizeServiceName("Extra — Soak Off")] =
  BY_NORMALIZED[normalizeServiceName("Extra — Soak Off (own work)")];

export function findService(name) {
  return BY_NORMALIZED[normalizeServiceName(name)] || null;
}

// "Acrylic - Plain Short-Medium + Pedicure - Gel Overlay" -> list of names
export function parseStoredServices(text) {
  return String(text || "")
    .split(" + ")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function servicesDuration(names) {
  return (names || []).reduce((sum, n) => sum + (findService(n)?.duration || 0), 0);
}

export function servicesPrice(names) {
  return (names || []).reduce((sum, n) => sum + (findService(n)?.price || 0), 0);
}
