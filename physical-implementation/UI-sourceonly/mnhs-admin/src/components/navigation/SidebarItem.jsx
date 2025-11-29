const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active
        ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 font-semibold"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
    <span>{label}</span>
  </button>
);

export default SidebarItem;
