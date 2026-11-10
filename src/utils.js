import { HOLIDAYS, TYPES } from "./data";
const p = (n) => String(n).padStart(2, "0");
export const iso = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
export const parse = (s) => new Date(s + "T00:00:00");
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const today = () => iso(new Date());
export const isWeekend = (s) => [0, 6].includes(parse(s).getDay());
export const isHoliday = (s) => HOLIDAYS.some((h) => h.date === s);
export const fmt = (s) => parse(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const range = (a, b) => (l) => l.from <= b && a <= l.to;
 
export function countDays(from, to, half) {
  if (!from || !to || to < from) return 0;
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) if (!isWeekend(d) && !isHoliday(d)) n++;
  return half && from === to ? n * 0.5 : n;
}
 
export const overlaps = (a, b) => a.from <= b.to && b.from <= a.to;
const live = (l) => l.status === "pending" || l.status === "approved";
 
export function balances(user, leaves) {
  const out = {};
  for (const t of Object.keys(TYPES)) {
    const used = leaves.filter((l) => l.userId === user.id && l.type === t && live(l)).reduce((n, l) => n + l.days, 0);
    out[t] = { left: user.quota[t] - used, total: user.quota[t] };
  }
  return out;
}
 
export function clashes(leave, leaves, users) {
  const me = users.find((u) => u.id === leave.userId);
  return leaves
    .filter((l) => l.id !== leave.id && l.userId !== leave.userId && live(l) && overlaps(l, leave))
    .map((l) => users.find((u) => u.id === l.userId))
    .filter((u) => u && u.manager === me.manager);
}
 
export function downloadCSV(name, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
}