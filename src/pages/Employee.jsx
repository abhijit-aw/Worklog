import { useState } from "react";
import { useStore } from "../store";
import { Badge, Empty, Ring } from "../ui";
import { TYPES, HOLIDAYS } from "../data";
import { addDays, balances, countDays, fmt, isHoliday, isWeekend, overlaps, parse, today } from "../utils";
 
function MonthCal({ leaves, uid }) {
  const t = today();
  const first = t.slice(0, 8) + "01";
  const d0 = parse(first);
  const lead = (d0.getDay() + 6) % 7;
  const n = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => addDays(first, i))];
  const mine = leaves.filter((l) => l.userId === uid && ["pending", "approved"].includes(l.status));
  return (
    <div className="card">
      <h2>{d0.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
      <div className="mc">
        {"MTWTFSS".split("").map((c, i) => <span key={i} className="mh">{c}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={"e" + i} />;
          const l = mine.find((x) => x.from <= d && d <= x.to);
          const cls = "md" + (d === t ? " today" : "") + (isWeekend(d) || isHoliday(d) ? " off" : "") + (l ? " " + l.status : "");
          return <span key={d} className={cls}>{+d.slice(8)}</span>;
        })}
      </div>
      <p className="muted">Green = approved, amber = waiting. Grey = weekend or holiday.</p>
    </div>
  );
}
 
function ApplyForm({ onClose }) {
  const { user, leaves, dispatch } = useStore();
  const bal = balances(user, leaves);
  const [f, setF] = useState({ type: "casual", from: today(), to: today(), half: false, reason: "" });
  const days = countDays(f.from, f.to, f.half);
  const errors = [];
  if (f.to < f.from) errors.push("End date must be on or after the start date.");
  else if (days === 0) errors.push("These dates are weekends or holidays, so no leave is needed.");
  if (days > bal[f.type].left) errors.push(`Not enough ${TYPES[f.type].label.toLowerCase()} leave. You have ${bal[f.type].left} day(s) left.`);
  if (leaves.some((l) => l.userId === user.id && ["pending", "approved"].includes(l.status) && overlaps(l, f)))
    errors.push("You already have a leave request on some of these dates.");
  if (!f.reason.trim()) errors.push("Add a short reason.");
  const set = (k, v) => setF({ ...f, [k]: v });
  const submit = (e) => {
    e.preventDefault();
    if (errors.length) return;
    dispatch({ type: "APPLY", leave: { userId: user.id, type: f.type, from: f.from, to: f.to, half: f.half, days, reason: f.reason.trim() } });
    onClose();
  };
  return (
    <div className="overlay" onClick={onClose}>
      <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Apply for leave</h2>
        <label htmlFor="t">Leave type</label>
        <select id="t" value={f.type} onChange={(e) => set("type", e.target.value)}>
          {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.label} ({bal[k].left} left)</option>)}
        </select>
        <div className="row">
          <div className="grow"><label htmlFor="a">From</label><input id="a" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value, to: e.target.value > f.to ? e.target.value : f.to })} /></div>
          <div className="grow"><label htmlFor="b">To</label><input id="b" type="date" value={f.to} min={f.from} onChange={(e) => set("to", e.target.value)} /></div>
        </div>
        <label className="check"><input type="checkbox" checked={f.half} onChange={(e) => set("half", e.target.checked)} /> Half day (single date only)</label>
        <label htmlFor="r">Reason</label>
        <input id="r" value={f.reason} onChange={(e) => set("reason", e.target.value)} />
        <div className="count">{days} working day{days === 1 ? "" : "s"} <span className="muted">(weekends and holidays are not counted)</span></div>
        {errors.map((m) => <p className="err" key={m}>{m}</p>)}
        <div className="row end">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={errors.length > 0}>Send request</button>
        </div>
      </form>
    </div>
  );
}
 
export default function Employee() {
  const { user, leaves, attendance, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const bal = balances(user, leaves);
  const mine = leaves.filter((l) => l.userId === user.id).sort((a, b) => b.from.localeCompare(a.from));
  const att = attendance[`${user.id}:${today()}`] || {};
  const now = () => new Date().toTimeString().slice(0, 5);
  const upcoming = HOLIDAYS.filter((h) => h.date >= today()).slice(0, 3);
  return (
    <>
      <header className="top">
        <div><h1>Hello, {user.name.split(" ")[0]}</h1><p className="muted">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p></div>
        <button className="btn primary" onClick={() => setOpen(true)}>Apply for leave</button>
      </header>
      <section className="grid3">
        <div className="card hero">
          <div className="muted light">Today’s attendance</div>
          <div className="big">{att.in || "--:--"}</div>
          <div className="light">{att.out ? `Checked out at ${att.out}` : att.in ? "Checked in" : "Not checked in yet"}</div>
          {!att.in && <button className="btn white" onClick={() => dispatch({ type: "CHECK", userId: user.id, kind: "in", time: now() })}>Check in</button>}
          {att.in && !att.out && <button className="btn white" onClick={() => dispatch({ type: "CHECK", userId: user.id, kind: "out", time: now() })}>Check out</button>}
        </div>
        {Object.keys(TYPES).map((t) => <Ring key={t} type={t} {...bal[t]} />)}
      </section>
      <section className="cols">
        <div className="card">
          <h2>My requests</h2>
          {mine.length === 0 && <Empty>No requests yet. Use “Apply for leave” to send your first one.</Empty>}
          {mine.map((l) => (
            <div className="item" key={l.id}>
              <div className="grow">
                <b>{TYPES[l.type].label} leave</b>
                <div className="muted">{fmt(l.from)}{l.to !== l.from && ` – ${fmt(l.to)}`} · {l.days} day{l.days === 1 ? "" : "s"} · {l.reason}</div>
                {l.comment && <div className="note">Manager: {l.comment}</div>}
              </div>
              <Badge status={l.status} />
              {l.status === "pending" && <button className="link" onClick={() => dispatch({ type: "DECIDE", id: l.id, status: "cancelled" })}>Cancel</button>}
            </div>
          ))}
        </div>
        <div className="stack">
          <MonthCal leaves={leaves} uid={user.id} />
        <div className="card">
          <h2>Upcoming holidays</h2>
          {upcoming.map((h) => <div className="item" key={h.date}><b className="grow">{h.name}</b><span className="muted">{fmt(h.date)}</span></div>)}
        </div>
        </div>
      </section>
      {open && <ApplyForm onClose={() => setOpen(false)} />}
    </>
  );
}