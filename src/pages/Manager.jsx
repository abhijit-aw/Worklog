import { useState } from "react";
import { useStore } from "../store";
import { Avatar, Badge, Empty } from "../ui";
import { TYPES } from "../data";
import { addDays, clashes, fmt, isHoliday, isWeekend, parse, today } from "../utils";

function mondayOf(s) { const d = parse(s); const k = (d.getDay() + 6) % 7; return addDays(s, -k); }

function Request({ l, team }) {
  const { users, leaves, dispatch } = useStore();
  const [c, setC] = useState("");
  const u = users.find((x) => x.id === l.userId);
  const clash = clashes(l, leaves, users);
  const decide = (status) => dispatch({ type: "DECIDE", id: l.id, status, comment: c });
  return (
    <div className="req">
      <div className="row"><Avatar name={u.name} /><div><b>{u.name}</b><div className="muted">{TYPES[l.type].label} · {fmt(l.from)}{l.to !== l.from && ` – ${fmt(l.to)}`} · {l.days} day{l.days === 1 ? "" : "s"}</div></div></div>
      <div className="quote">“{l.reason}”</div>
      {clash.length > 0 && <div className="warn">Also on leave: {clash.map((x) => x.name.split(" ")[0]).join(", ")}</div>}
      <label className="sr" htmlFor={`c${l.id}`}>Comment</label>
      <input id={`c${l.id}`} placeholder="Add a comment (optional)" value={c} onChange={(e) => setC(e.target.value)} />
      <div className="row">
        <button className="btn ok grow" onClick={() => decide("approved")}>Approve</button>
        <button className="btn no grow" onClick={() => decide("rejected")}>Reject</button>
      </div>
    </div>
  );
}

export default function Manager() {
  const { user, users, leaves } = useStore();
  const [start, setStart] = useState(mondayOf(today()));
  const team = users.filter((u) => u.manager === user.id);
  const ids = team.map((u) => u.id);
  const pending = leaves.filter((l) => ids.includes(l.userId) && l.status === "pending");
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const onLeave = leaves.filter((l) => ids.includes(l.userId) && l.status === "approved" && l.from <= today() && today() <= l.to).length;
  const find = (uid, d) => leaves.find((l) => l.userId === uid && ["approved", "pending"].includes(l.status) && l.from <= d && d <= l.to);
  return (
    <>
      <header className="top"><div><h1>Team calendar</h1><p className="muted">{team.length} people report to you</p></div></header>
      <section className="grid3 stats">
        <div className="card"><div className="muted">On leave today</div><div className="num">{onLeave}</div></div>
        <div className="card"><div className="muted">Waiting for you</div><div className="num">{pending.length}</div></div>
        <div className="card"><div className="muted">Team size</div><div className="num">{team.length}</div></div>
      </section>
      <section className="cols wide">
        <div className="card">
          <div className="row between"><h2>Week of {fmt(start)}</h2>
            <div className="row"><button className="btn sm" onClick={() => setStart(addDays(start, -7))}>Previous</button><button className="btn sm" onClick={() => setStart(addDays(start, 7))}>Next</button></div></div>
          <div className="cal">
            <div />
            {days.map((d) => <div key={d} className={"dh" + (d === today() ? " now" : "")}>{parse(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}</div>)}
            {team.map((u) => (
              <div className="cal-row" key={u.id}>
                <div className="who"><Avatar name={u.name} size={30} />{u.name.split(" ")[0]}</div>
                {days.map((d) => {
                  const l = find(u.id, d);
                  const off = isWeekend(d) || isHoliday(d);
                  return (
                    <div key={d} className={"cell" + (off ? " off" : "")}>
                      {l && !off && <span className="pill" style={{ background: l.status === "approved" ? "#D8F3E6" : "#FDEBC8", color: l.status === "approved" ? "#0B6B47" : "#8A4B00" }}>{TYPES[l.type].label}{l.status === "pending" && " ?"}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="muted">Green = approved, amber with “?” = waiting for approval. Grey = weekend or holiday.</p>
        </div>
        <div className="card">
          <h2>Approvals</h2>
          {pending.length === 0 && <Empty>You are all caught up. New requests will show here.</Empty>}
          {pending.map((l) => <Request key={l.id} l={l} team={team} />)}
          <h2 className="gap">Recent decisions</h2>
          {leaves.filter((l) => ids.includes(l.userId) && ["approved", "rejected"].includes(l.status)).slice(0, 4).map((l) => (
            <div className="item" key={l.id}><span className="grow">{users.find((u) => u.id === l.userId).name.split(" ")[0]} · {fmt(l.from)}</span><Badge status={l.status} /></div>
          ))}
        </div>
      </section>
    </>
  );
}
