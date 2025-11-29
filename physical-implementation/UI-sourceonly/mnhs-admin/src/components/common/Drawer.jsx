import { X } from "lucide-react";

const Drawer = ({ isOpen, onClose, title, children }) => (
  <>
    {isOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-lg text-slate-900 dark:text-white">{title}</h2>
        <button onClick={onClose}>
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">{children}</div>
    </div>
  </>
);

export default Drawer;
