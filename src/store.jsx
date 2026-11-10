import { createContext, useContext, useEffect, useReducer } from "react";
import { seed } from "./data";
import { today } from "./utils";

const KEY = "worklog:v1";
const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

function load() {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { /* ignore */ }
  return seed();
}

function reducer(s, a) {
  switch (a.type) {
    case "LOGIN": return { ...s, session: a.id };
    case "LOGOUT": return { ...s, session: null };
    case "APPLY":
      return { ...s, leaves: [{ id: Date.now(), status: "pending", applied: today(), comment: "", ...a.leave }, ...s.leaves] };
    case "DECIDE":
      return { ...s, leaves: s.leaves.map((l) => (l.id === a.id ? { ...l, status: a.status, comment: a.comment || "" } : l)) };
    case "CHECK": {
      const key = `${a.userId}:${today()}`;
      const cur = s.attendance[key] || {};
      const next = a.kind === "in" ? { in: a.time } : { ...cur, out: a.time };
      return { ...s, attendance: { ...s.attendance, [key]: next } };
    }
    case "ADD_USER": return { ...s, users: [...s.users, { id: Date.now(), password: "1234", ...a.user }] };
    case "RESET": return seed();
    default: return s;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);
  const user = state.users.find((u) => u.id === state.session) || null;
  return <Ctx.Provider value={{ ...state, user, dispatch }}>{children}</Ctx.Provider>;
}
