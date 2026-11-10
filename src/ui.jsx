import { TYPES } from "./data";

const STATUS = {
  pending: ["#FDEBC8", "#8A4B00"], approved: ["#D8F3E6", "#0B6B47"],
  rejected: ["#FBDADF", "#9B1C33"], cancelled: ["#E8E6EF", "#4A4760"],
};
export const Badge = ({ status }) => (
  <span className="badge" style={{ background: STATUS[status][0], color: STATUS[status][1] }}>
    {status[0].toUpperCase() + status.slice(1)}
  </span>
);

export const Avatar = ({ name, size = 40 }) => {
  const hues = [12, 160, 250, 40, 330, 200];
  const h = hues[name.length % hues.length];
  return (
    <span className="avatar" style={{ width: size, height: size, background: `hsl(${h} 70% 82%)`, fontSize: size * 0.38 }}>
      {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
    </span>
  );
};

export function Ring({ type, left, total }) {
  const t = TYPES[type];
  const pct = Math.max(0, left) / total;
  return (
    <div className="card ring">
      <div className="muted">{t.label} leave</div>
      <svg viewBox="0 0 120 120" width="110" height="110" role="img" aria-label={`${t.label} leave: ${left} of ${total} days left`}>
        <circle cx="60" cy="60" r="48" fill="none" stroke={t.tint} strokeWidth="12" />
        <circle cx="60" cy="60" r="48" fill="none" stroke={t.color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${302 * pct} 302`} transform="rotate(-90 60 60)" />
        <text x="60" y="68" textAnchor="middle" fontSize="26" fontWeight="800" fill="#181629">{left}</text>
      </svg>
      <div className="muted">days left of {total}</div>
    </div>
  );
}

export const Empty = ({ children }) => <div className="empty">{children}</div>;
