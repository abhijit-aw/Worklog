import { useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useStore } from "./store";
import { Avatar } from "./ui";
import Employee from "./pages/Employee";
import Manager from "./pages/Manager";
import HR from "./pages/HR";
 
const HOME = { employee: "/employee", manager: "/manager", hr: "/hr" };
const NAV = {
  employee: [["/employee", "My leaves"]],
  manager: [["/manager", "Approvals & calendar"], ["/employee", "My leaves"]],
  hr: [["/hr", "People & reports"], ["/employee", "My leaves"]],
};
 
function Guard({ allow, children }) {
  const { user, isAdmin } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role) && !isAdmin)
    return (
      <div className="denied">
        <div className="card denied-card">
          <span className="denied-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg></span>
          <h1>Access denied</h1>
          <p className="muted">Your role ({user.role}) cannot open this page.</p>
          <NavLink to={HOME[user.role]} className="btn primary">Go to my page</NavLink>
        </div>
      </div>
    );
  return children;
}
 
function Layout({ children }) {
  const { user, users, adminId, isAdmin, dispatch } = useStore();
  const nav = useNavigate();
  const switchTo = (id) => {
    const target = users.find((x) => String(x.id) === String(id));
    if (!target) return;
    dispatch({ type: "SWITCH", id: target.id });
    nav(HOME[target.role]);
  };
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><span className="logo" />WorkLog</div>
        {NAV[user.role].map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => "nav" + (isActive ? " on" : "")}>{label}</NavLink>
        ))}
        {isAdmin && (
          <div className="switch">
            <label htmlFor="sw">Switch account</label>
            <select id="sw" value={String(user.id)} onChange={(e) => switchTo(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>{u.name} ({u.role})</option>
              ))}
            </select>
            {user.id !== adminId && (
              <button className="ghost" onClick={() => switchTo(adminId)}>Back to my account</button>
            )}
          </div>
        )}
        <div className="me">
          <Avatar name={user.name} />
          <div><b>{user.name}</b><span>{user.role}</span></div>
        </div>
        <button className="ghost" onClick={() => { dispatch({ type: "LOGOUT" }); nav("/login"); }}>Log out</button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
 
function Login() {
  const { users, user, dispatch } = useStore();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  if (user) return <Navigate to={HOME[user.role]} replace />;
  const submit = (e) => {
    e.preventDefault();
    const u = users.find((x) => x.email === email.trim().toLowerCase() && x.password === pw);
    if (!u) return setErr("Email or password is wrong. Use one of the demo accounts below.");
    dispatch({ type: "LOGIN", id: u.id });
  };
  const demo = [
    ["Employee", "Apply for leave, check in", "sneha@worklog.com"],
    ["Manager", "Approve and plan the team", "abhijit@worklog.com"],
    ["HR", "People, balances, reports", "riya@worklog.com"],
  ];
  return (
    <div className="login">
      <section className="login-art">
        <div className="brand"><span className="logo" />WorkLog</div>
        <div className="art-copy">
          <h2>Leave, attendance and approvals in one calm place.</h2>
          <p>Apply in seconds. Managers see clashes before they approve. HR gets the report without chasing anyone.</p>
        </div>
        <div className="art-cards">
          <div className="mini m1"><span className="dot ok" /><div><b>Casual leave approved</b><span>10 – 12 Nov · 3 days</span></div></div>
          <div className="mini m2"><span className="dot warn" /><div><b>2 requests waiting</b><span>Overlap with 1 teammate</span></div></div>
          <div className="mini m3"><svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="none" stroke="rgba(11,21,48,.12)" strokeWidth="6" /><circle cx="20" cy="20" r="15" fill="none" stroke="#FFB224" strokeWidth="6" strokeLinecap="round" strokeDasharray="62 94" transform="rotate(-90 20 20)" /></svg><div><b>9 days left</b><span>Casual balance</span></div></div>
        </div>
      </section>
      <section className="login-side">
        <form className="login-form" onSubmit={submit}>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage your leave.</p>
          <label htmlFor="em">Email</label>
          <input id="em" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@worklog.com" />
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" />
          {err && <p className="err">{err}</p>}
          <button className="btn primary wide" type="submit">Sign in</button>
          <div className="sep"><span>or try a demo account</span></div>
          <div className="demo">
            {demo.map(([r, d, m]) => (
              <button type="button" key={r} className={"demo-btn" + (email === m ? " on" : "")} onClick={() => { setEmail(m); setPw("1234"); setErr(""); }}>
                <b>{r}</b><span>{d}</span>
              </button>
            ))}
          </div>
        </form>
      </section>
    </div>
  );
}
 
export default function App() {
  const { user } = useStore();
  const w = (el, allow) => <Guard allow={allow}><Layout>{el}</Layout></Guard>;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/employee" element={w(<Employee />, ["employee", "manager", "hr"])} />
      <Route path="/manager" element={w(<Manager />, ["manager"])} />
      <Route path="/hr" element={w(<HR />, ["hr"])} />
      <Route path="*" element={<Navigate to={user ? HOME[user.role] : "/login"} replace />} />
    </Routes>
  );
}