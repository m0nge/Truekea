export const CATEGORIES = [
  "Electrónica",
  "Ropa",
  "Hogar",
  "Deportes",
  "Libros",
  "Vehículos",
  "Juguetes",
  "Herramientas",
  "Arte",
  "Otros"
];

export const CONDITION_LABELS: Record<string, string> = {
  new: "Nuevo",
  like_new: "Como Nuevo",
  good: "Buen Estado",
  fair: "Usado",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  pending: "Pendiente",
  sold: "Vendido",
};

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  sold: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};
