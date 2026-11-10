import { useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../store";
import { Avatar } from "../ui";
import { TYPES } from "../data";
import { balances, downloadCSV, today } from "../utils";

const KEY = "worklog:v1";

// Saved data madhe thet badal kara, mag reload (store var depend nahi)
function mutate(fn) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) {
      fn(s);
      localStorage.setItem(KEY, JSON.stringify(s));
    }
  } catch (e) { /* ignore */ }
  window.location.reload();
}

function removeUser(id) {
  mutate((s) => {
    const sid = String(id);
    const gone = s.users.find((u) => String(u.id) === sid);
    if (!gone) return;
    s.users = s.users
      .filter((u) => String(u.id) !== sid)
      .map((u) => (String(u.manager) === sid ? { ...u, manager: null } : u));
    s.leaves = (s.leaves || []).filter((l) => String(l.userId) !== sid);
    s.attendance = Object.fromEntries(
      Object.entries(s.attendance || {}).filter(([k]) => !k.startsWith(`${sid}:`))
    );
    s.exEmployees = [
      { id: gone.id, name: gone.name, dept: gone.dept, email: gone.email, removedOn: today(), data: gone },
      ...(s.exEmployees || []),
    ];
  });
}

function restoreUser(id) {
  mutate((s) => {
    const sid = String(id);
    const x = (s.exEmployees || []).find((e) => String(e.id) === sid);
    if (!x) return;
    s.users = [...s.users, x.data];
    s.exEmployees = s.exEmployees.filter((e) => String(e.id) !== sid);
  });
}

export default function HR() {
  const { users, leaves, user, exEmployees, dispatch } = useStore();
  const [f, setF] = useState({ name: "", dept: "Engineering", role: "employee" });
  const [askUser, setAskUser] = useState(null);
  const ex = exEmployees || [];
  const staff = users.filter((u) => u.role !== "hr");
  const managers = users.filter((u) => u.role === "manager");
  const days = (u, t) => leaves.filter((l) => l.userId === u.id && l.type === t && l.status === "approved").reduce((n, l) => n + l.days, 0);
  const total = (u) => Object.keys(TYPES).reduce((n, t) => n + days(u, t), 0);
  const depts = [...new Set(staff.map((u) => u.dept))].map((d) => ({ d, n: staff.filter((u) => u.dept === d).reduce((n, u) => n + total(u), 0) }));
  const max = Math.max(1, ...depts.map((x) => x.n));
  const add = (e) => {
    e.preventDefault();
    const name = f.name.trim();
    if (!name) return;
    dispatch({ type: "ADD_USER", user: { name, dept: f.dept, role: f.role, manager: managers[0]?.id ?? null, quota: { casual: 12, sick: 8, paid: 10 }, email: `${name.split(" ")[0].toLowerCase()}@worklog.com` } });
    setF({ ...f, name: "" });
  };
  const confirmRemove = () => {
    if (askUser) removeUser(askUser.id);
    setAskUser(null);
  };
  const csv = () => downloadCSV("leave-report.csv", [["Name", "Department", ...Object.values(TYPES).map((t) => t.label + " days"), "Total approved days"],
    ...staff.map((u) => [u.name, u.dept, ...Object.keys(TYPES).map((t) => days(u, t)), total(u)])]);

  const overlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(11,21,48,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: 16 };
  const box = { width: "100%", maxWidth: 380, background: "#fff", color: "#0b1530", borderRadius: 20, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,.3)" };

  return (
    <>
      <header className="top"><div><h1>People and reports</h1><p className="muted">{staff.length} employees · {leaves.filter((l) => l.status === "pending").length} requests pending</p></div>
        <div className="row"><button className="btn" onClick={csv}>Export CSV</button><button className="btn" onClick={() => confirm("Reset all demo data?") && dispatch({ type: "RESET" })}>Reset demo data</button></div></header>
      <section className="cols wide">
        <div>
          <div className="card">
            <h2>Employees</h2>
            <table>
              <thead><tr><th>Name</th><th>Dept</th><th>Casual</th><th>Sick</th><th>Paid</th><th></th></tr></thead>
              <tbody>{staff.map((u) => { const b = balances(u, leaves); return (
                <tr key={u.id}><td><span className="row"><Avatar name={u.name} size={30} />{u.name}</span></td><td>{u.dept}</td>
                  {Object.keys(TYPES).map((t) => <td key={t}>{b[t].left}/{b[t].total}</td>)}
                  <td>{u.id !== user?.id && <button type="button" className="btn rm" onClick={() => setAskUser(u)}>Remove</button>}</td></tr>); })}</tbody>
            </table>
            <p className="muted">Balance shown as days left / yearly quota.</p>
          </div>

          <div className="card gapt">
            <h2>Ex-employees</h2>
            {ex.length === 0 ? (
              <p className="muted"></p>
            ) : (
              <table>
                <thead><tr><th>Name</th><th>Dept</th><th>Removed on</th><th></th></tr></thead>
                <tbody>{ex.map((x) => (
                  <tr key={x.id}>
                    <td><span className="row"><Avatar name={x.name} size={30} />{x.name}</span></td>
                    <td>{x.dept}</td>
                    <td>{x.removedOn}</td>
                    <td><button type="button" className="btn" onClick={() => restoreUser(x.id)}>Restore</button></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
        <div>
          <form className="card" onSubmit={add}>
            <h2>Add employee</h2>
            <label htmlFor="n">Full name</label><input id="n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <label htmlFor="d">Department</label>
            <select id="d" value={f.dept} onChange={(e) => setF({ ...f, dept: e.target.value })}><option>Engineering</option><option>Design</option><option>Sales</option></select>
            <button className="btn primary">Add employee</button>
          </form>
          <div className="card gapt">
            <h2>Approved leave days by department</h2>
            {depts.map((x) => (
              <div className="bar" key={x.d}><span>{x.d}</span><div><i style={{ width: `${(x.n / max) * 100}%` }} /></div><b>{x.n}</b></div>
            ))}
          </div>
        </div>
      </section>

      {askUser && createPortal(
        <div style={overlay} onClick={() => setAskUser(null)}>
          <div style={box} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: 0 }}>Confirm remove</h2>
            <p style={{ margin: "10px 0 20px", opacity: 0.7 }}>{askUser.name}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="btn" onClick={() => setAskUser(null)}>Cancel</button>
              <button type="button" className="btn primary" onClick={confirmRemove}>Confirm remove</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}