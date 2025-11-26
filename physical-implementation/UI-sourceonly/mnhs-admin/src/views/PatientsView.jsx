import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";

const PatientsView = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filtered = useMemo(
    () =>
      data.patients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cin.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [data.patients, searchTerm]
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search CIN or Name..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Patient
          </button>
        </div>

        <Card className="flex-1 overflow-hidden p-0">
          <div className="overflow-y-auto h-full">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">CIN</th>
                  <th className="px-6 py-3 font-medium">City</th>
                  <th className="px-6 py-3 font-medium">Insurance</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((p) => (
                  <tr
                    key={p.iid}
                    onClick={() => setSelectedPatient(p)}
                    className={`cursor-pointer transition-colors ${
                      selectedPatient?.iid === p.iid
                        ? "bg-teal-50 dark:bg-teal-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-6 py-3 text-slate-500">{p.cin}</td>
                    <td className="px-6 py-3 text-slate-500">{p.city}</td>
                    <td className="px-6 py-3">
                      <Badge color={p.insurance === "None" ? "red" : "blue"}>{p.insurance}</Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.status === "Admitted" ? "bg-orange-500" : "bg-emerald-500"}`} />
                        <span className="text-slate-600 dark:text-slate-400">{p.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {selectedPatient && (
        <div className="w-96 flex flex-col gap-4 animate-in slide-in-from-right duration-300">
          <Card className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center pb-6 border-b border-slate-100 dark:border-slate-700">
              <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-bold mb-3">
                {selectedPatient.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedPatient.name}</h2>
              <p className="text-slate-500 text-sm">
                {selectedPatient.iid} • {selectedPatient.cin}
              </p>
            </div>

            <div className="py-6 space-y-6">
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">Demographics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Gender</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedPatient.sex === "M" ? "Male" : "Female"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Birth Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPatient.birthDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">City</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPatient.city}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">Insurance</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-teal-700 dark:text-teal-400">{selectedPatient.insurance}</span>
                    <Badge color="green">Active</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Policy #MAR-2023-8842</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">Next Visit</h4>
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-col leading-none border border-blue-100">
                    <span className="text-[10px] font-bold uppercase">Oct</span>
                    <span className="text-lg font-bold">24</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cardiology Checkup</p>
                    <p className="text-xs text-slate-500">Rabat Central • 09:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full mt-4 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Schedule Appointment
            </button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PatientsView;
