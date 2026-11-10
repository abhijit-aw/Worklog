import { addDays, fmt, isHoliday, isWeekend, today } from "./utils";
 
export const TYPES = {
  casual: { label: "Casual", color: "#E5484D", color2: "#FF8C8F", tint: "#FDE6E7" },
  sick: { label: "Sick", color: "#3E63DD", color2: "#96AEF4", tint: "#E1E8FB" },
  paid: { label: "Paid", color: "#FFB224", color2: "#FFD98A", tint: "#FFF1D6" },
};
 
export const HOLIDAYS = [
  { date: "2026-12-25", name: "Christmas" },
  { date: "2027-01-01", name: "New Year" },
  { date: "2027-01-26", name: "Republic Day" },
  { date: "2027-05-01", name: "Maharashtra Day" },
  { date: "2027-08-15", name: "Independence Day" },
  { date: "2027-10-02", name: "Gandhi Jayanti" },
];
 
const q = { casual: 12, sick: 8, paid: 10 };
const user = (id, name, role, dept, manager, extra = {}) => ({
  id, name, role, dept, manager, quota: { ...q },
  email: `${name.split(" ")[0].toLowerCase()}@worklog.com`, password: "1234", ...extra,
});
 
const work = (s) => { while (isWeekend(s) || isHoliday(s)) s = addDays(s, 1); return s; };
const span = (off, len) => {
  const from = work(addDays(today(), off));
  let to = from;
  for (let n = 1; n < len; n++) to = work(addDays(to, 1));
  return [from, to];
};
 
export function seed() {
  const L = (id, userId, type, off, len, status, reason, comment = "") => {
    const [from, to] = span(off, len);
    return { id, userId, type, from, to, status, reason, days: len, comment, half: false, applied: addDays(from, -6) };
  };
  const N = (userId, text, hrsAgo, read = false) =>
    ({ id: userId * 1000 + hrsAgo, userId, text, at: new Date(Date.now() - hrsAgo * 3600000).toISOString(), read });
  const t = today();
  return {
    session: null,
    adminId: null,
    users: [
      user(1, "Riya Sharma", "hr", "HR", null),
      user(2, "Abhijit Awatare", "manager", "Engineering", 1, { admin: true }),
      user(3, "Sneha Joshi", "employee", "Engineering", 2),
      user(4, "Rohan Deshmukh", "employee", "Engineering", 2),
      user(5, "Priya Kulkarni", "employee", "Engineering", 2),
      user(6, "Karan Mehta", "employee", "Engineering", 2),
      user(7, "Neha Kapoor", "manager", "Design", 1),
      user(8, "Vikram Rao", "employee", "Design", 7),
      user(9, "Ananya Iyer", "employee", "Design", 7),
      user(10, "Sameer Khan", "manager", "Sales", 1),
      user(11, "Pooja Nair", "employee", "Sales", 10),
      user(12, "Arjun Singh", "employee", "Sales", 10),
    ],
    leaves: [
      L(101, 3, "casual", 2, 2, "pending", "Cousin’s wedding in Pune"),
      L(102, 6, "casual", 3, 1, "pending", "Passport appointment"),
      L(103, 4, "sick", 1, 1, "approved", "Fever and cold", "Get well soon"),
      L(104, 5, "paid", 6, 3, "approved", "Family trip to Goa", "Enjoy the trip"),
      L(105, 3, "sick", -14, 2, "approved", "Viral fever"),
      L(106, 5, "casual", -30, 1, "approved", "Bank work"),
      L(107, 6, "paid", -20, 3, "rejected", "Vacation", "Sprint release week, please move it after the 28th"),
      L(108, 4, "casual", -45, 2, "approved", "Home repair work"),
      L(109, 8, "casual", 1, 2, "pending", "Shifting to a new flat"),
      L(110, 9, "sick", -3, 1, "approved", "Migraine", "Take rest"),
      L(111, 7, "paid", 10, 5, "approved", "Annual family vacation"),
      L(112, 11, "casual", 4, 1, "pending", "Society meeting"),
      L(113, 12, "paid", -10, 2, "approved", "Sister’s engagement", "Congratulations"),
      L(114, 10, "sick", -6, 1, "approved", "Dental surgery"),
    ],
    attendance: {
      [`3:${t}`]: { in: "09:48" }, [`4:${t}`]: { in: "09:31" }, [`5:${t}`]: { in: "10:05" },
      [`8:${t}`]: { in: "09:55" }, [`11:${t}`]: { in: "09:40" }, [`12:${t}`]: { in: "09:22" },
    },
    notes: [
      N(2, "Sneha Joshi applied for casual leave", 3),
      N(2, "Karan Mehta applied for casual leave", 2),
      N(7, "Vikram Rao applied for casual leave", 5),
      N(10, "Pooja Nair applied for casual leave", 1),
      N(5, "Your paid leave was approved. Enjoy the trip", 20),
      N(3, "Your sick leave was approved", 300, true),
      N(6, "Your paid leave was rejected: sprint release week", 480, true),
    ],
  };
}