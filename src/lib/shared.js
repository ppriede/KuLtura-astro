export const CAT_LABELS = {
  musica: "🎼 Música",
  arte: "Arte",
  literatura: "📖 Literatura",
  fotografia: "📸 Fotografía",
  columnas: "Columnas",
};

export const CAT_ORDER = ["musica", "arte", "literatura", "fotografia", "columnas"];

// "2026-08-16" o "2026-08-16 18:30" como Date = medianoche UTC → se corría 1 día en zonas al oeste de UTC; se arma en hora local
export function formatFecha(iso) {
  // Extraer solo la parte de fecha (YYYY-MM-DD) si viene con hora
  const datePart = iso.split(" ")[0];
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
