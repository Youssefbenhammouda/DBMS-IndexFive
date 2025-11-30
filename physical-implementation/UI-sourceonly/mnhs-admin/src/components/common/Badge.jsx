const COLOR_MAP = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  gray: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

const Badge = ({ children, color = "blue" }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${COLOR_MAP[color] || COLOR_MAP.gray}`}>
    {children}
  </span>
);

export default Badge;
