import { useMemo, useState } from "react";
import { AlertTriangle, Calendar, Filter, Plus, Check, X } from "lucide-react";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import Modal from "../components/common/Modal";

const DEFAULT_HOSPITAL_OPTIONS = ["Rabat Central", "Casablanca General", "Marrakech Health", "Tangier Med"];

const AppointmentsView = ({ data }) => {
  const [viewMode, setViewMode] = useState("list");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hospitalOptions = useMemo(() => {
    const fromData = Array.isArray(data?.appointments)
      ? Array.from(new Set(data.appointments.map((apt) => apt.hospital).filter(Boolean)))
      : [];
    return fromData.length ? fromData : DEFAULT_HOSPITAL_OPTIONS;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4" /> This Week
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300">
            <Filter className="w-4 h-4" /> Hospital: All
          </button>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-500"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-500"
              }`}
            >
              Agenda
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-slate-200">142</p>
            <p className="text-xs text-slate-500">Scheduled</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-slate-200">12</p>
            <p className="text-xs text-slate-500">Emergencies</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-slate-200">84</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <X className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-slate-200">5</p>
            <p className="text-xs text-slate-500">Cancelled</p>
          </div>
        </Card>
      </div>

      {viewMode === "list" ? (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Hospital & Dept</th>
                <th className="px-6 py-4 font-medium">Doctor</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.appointments.slice(0, 10).map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{apt.time}</div>
                    <div className="text-xs text-slate-500">{apt.date}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{apt.patient}</td>
                  <td className="px-6 py-4">
                    <div className="text-slate-800 dark:text-slate-200">{apt.department}</div>
                    <div className="text-xs text-slate-500">{apt.hospital}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{apt.staff}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{apt.reason}</td>
                  <td className="px-6 py-4">
                    <Badge
                      color={apt.status === "Scheduled" ? "blue" : apt.status === "Completed" ? "green" : "red"}
                    >
                      {apt.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
            <div key={day} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 min-h-[400px]">
              <h4 className="font-bold text-center mb-4 text-slate-600 dark:text-slate-300">{day}</h4>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border-l-4 border-teal-500 text-xs"
                  >
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200 mb-1">
                      <span>09:00</span>
                      <span className="text-teal-600">Cardio</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Mohammed Benali</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Appointment">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setIsModalOpen(false);
            alert("Appointment Scheduled (Mock)");
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
              <input type="time" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hospital</label>
            <select className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600">
              {hospitalOptions.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Patient CIN</label>
            <input
              type="text"
              placeholder="Search CIN..."
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              rows="3"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700">
              Confirm Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsView;
