// Presentation only. No provider requests or invented history for real products.
export function normalizeHistory(records = []) {
  return records.filter(row => row && /^\d{4}-\d{2}-\d{2}$/.test(row.date) && Number.isFinite(Date.parse(`${row.date}T00:00:00Z`)) && typeof row.price === 'number' && row.price > 0)
    .map(row => ({ ...row })).sort((a, b) => a.date.localeCompare(b.date));
}
export function priceWindow(records, days, now = new Date()) {
  const end = new Date(now); end.setUTCHours(23, 59, 59, 999);
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - days + 1); start.setUTCHours(0, 0, 0, 0);
  return normalizeHistory(records).filter(row => { const time = Date.parse(`${row.date}T00:00:00Z`); return time >= start.getTime() && time <= end.getTime(); });
}
export function summarizeHistory(records) {
  const rows = normalizeHistory(records);
  if (!rows.length) return null;
  const first = rows[0].price, latest = rows.at(-1).price;
  return { latest, low: Math.min(...rows.map(row => row.price)), high: Math.max(...rows.map(row => row.price)), change: latest - first, percent: (latest - first) / first * 100 };
}
export function chartPoints(records, width = 640, height = 180) {
  const rows = normalizeHistory(records);
  if (!rows.length) return [];
  const times = rows.map(row => Date.parse(`${row.date}T00:00:00Z`));
  const prices = rows.map(row => row.price), low = Math.min(...prices), high = Math.max(...prices);
  const range = high - low || high * .1 || 1, padding = range * .15;
  return rows.map((row, index) => ({ ...row, x: times.at(-1) === times[0] ? width / 2 : (times[index] - times[0]) / (times.at(-1) - times[0]) * width, y: height - (row.price - low + padding) / (range + padding * 2) * height }));
}
export function exampleHistory(now = new Date()) {
  // Deliberately separate demo dataset; never attached to a real product or persisted.
  const amounts = [960000, 948000, 965000, 942000, 938000, 920000, 933000, 910000, 918000, 900000, 895000, 908000, 890000];
  return amounts.map((price, index) => { const date = new Date(now); date.setUTCDate(date.getUTCDate() - (amounts.length - 1 - index) * 7); return { date: date.toISOString().slice(0, 10), price, source: '화면 확인용 예시' }; });
}
