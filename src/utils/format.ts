export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits }).format(value);
}

export function formatCurrency(value: number, currency = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value: string) {
  const date = new Date(`${value.length === 10 ? `${value}T12:00:00` : value}`);
  if (Number.isNaN(date.getTime())) return "Fecha no válida";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(date);
}

export function todayInputValue() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
