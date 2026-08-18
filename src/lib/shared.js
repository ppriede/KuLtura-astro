export const CAT_LABELS = {
  musica: "🎼 Música",
  arte: "Arte",
  literatura: "📖 Literatura",
  fotografia: "📸 Fotografía",
  columnas: "Columnas",
};

export const CAT_ORDER = ["musica", "arte", "literatura", "fotografia", "columnas"];

// "2026-08-16" como Date = medianoche UTC → se corría 1 día en zonas al oeste de UTC; se arma en hora local
export function formatFecha(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
