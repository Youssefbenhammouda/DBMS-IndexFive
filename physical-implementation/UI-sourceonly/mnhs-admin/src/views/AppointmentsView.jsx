import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Calendar, Filter, Plus, Check, X, RefreshCw } from "lucide-react";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import Modal from "../components/common/Modal";

const DEFAULT_HOSPITAL_OPTIONS = ["Rabat Central", "Casablanca General", "Marrakech Health", "Tangier Med"];

const formatAgendaTime = (time = "") => {
  if (!time && time !== 0) return "—";
  const normalized = typeof time === "string" ? time : String(time ?? "");
  const [hours = "00", minutes = "00"] = normalized.split(":");
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getTimeSortValue = (time = "") => {
  const normalized = typeof time === "string" ? time : String(time ?? "");
  const [hours = "0", minutes = "0"] = normalized.split(":");
  const h = Number.parseInt(hours, 10);
  const m = Number.parseInt(minutes, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.POSITIVE_INFINITY;
  return h * 60 + m;
};

const buildAgendaDays = (appointments) => {
  if (!Array.isArray(appointments) || !appointments.length) return [];

  const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

  const grouped = appointments.reduce((acc, appointment) => {
    if (!appointment?.date) return acc;
    const timestamp = Date.parse(appointment.date);
    if (Number.isNaN(timestamp)) return acc;

    const key = appointment.date;
    if (!acc.has(key)) {
      const dateObj = new Date(timestamp);
      acc.set(key, {
        dateKey: key,
        dateObj,
        label: `${dayFormatter.format(dateObj)} • ${dateFormatter.format(dateObj)}`,
        appointments: [],
      });
    }

    acc.get(key).appointments.push(appointment);
    return acc;
  }, new Map());

  return Array.from(grouped.values())
    .sort((a, b) => a.dateObj - b.dateObj)
    .map((group) => ({
      ...group,
      appointments: group.appointments
        .slice()
        .sort((a, b) => getTimeSortValue(a.time) - getTimeSortValue(b.time)),
    }))
    .slice(0, 5);
};

const getStatusBadgeColor = (status) => {
  switch (status) {
    case "Completed":
      return "green";
    case "Cancelled":
    case "No Show":
      return "red";
    case "Scheduled":
    default:
      return "blue";
  }
};

const AppointmentsView = ({ data, error, appointmentConnector, patientConnector }) => {
  const [viewMode, setViewMode] = useState("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [banner, setBanner] = useState(null);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [isFetchingPatients, setIsFetchingPatients] = useState(false);
  const [patientFetchError, setPatientFetchError] = useState(null);
  const [patientFieldError, setPatientFieldError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [hasLoadedPatients, setHasLoadedPatients] = useState(false);
  const patientSearchRef = useRef(null);

  useEffect(() => {
    if (error) {
      setBanner({ type: "error", message: error, id: Date.now() });
    }
  }, [error]);

  useEffect(() => {
    if (!appointmentConnector) {
      setBanner((current) =>
        current?.type === "error"
          ? current
          : { type: "error", message: "Appointment connector unavailable. Please refresh.", id: Date.now() },
      );
    }
  }, [appointmentConnector]);

  const appointments = useMemo(() => (Array.isArray(data?.appointments) ? data.appointments : []), [data]);

  const hospitalOptions = useMemo(() => {
    const fromData = appointments.length
      ? Array.from(new Set(appointments.map((apt) => apt.hospital).filter(Boolean)))
      : [];
    return fromData.length ? fromData : DEFAULT_HOSPITAL_OPTIONS;
  }, [appointments]);

  const agendaDays = useMemo(() => buildAgendaDays(appointments), [appointments]);

  const fetchPatients = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (!patientConnector) return;
      setIsFetchingPatients(true);
      setPatientFetchError(null);
      try {
        const payload = await patientConnector.fetchPatients({ forceRefresh });
        const list = Array.isArray(payload?.patients) ? payload.patients : [];
        setPatientResults(list);
      } catch (loadError) {
        setPatientFetchError(loadError?.message || "Unable to load patients. Please try again.");
      } finally {
        setIsFetchingPatients(false);
        setHasLoadedPatients(true);
      }
    },
    [patientConnector],
  );

  useEffect(() => {
    if (!isModalOpen || !patientConnector || hasLoadedPatients) return;
    fetchPatients();
  }, [isModalOpen, patientConnector, hasLoadedPatients, fetchPatients]);

  useEffect(() => {
    if (!isModalOpen) {
      setPatientQuery("");
      setSelectedPatient(null);
      setPatientFieldError(null);
      setIsPatientDropdownOpen(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!isPatientDropdownOpen) return;
    const handleClickOutside = (event) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(event.target)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPatientDropdownOpen, patientSearchRef]);

  const handlePatientSearchChange = (event) => {
    setPatientQuery(event.target.value);
    setSelectedPatient(null);
    setPatientFieldError(null);
    setIsPatientDropdownOpen(true);
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setPatientQuery(patient?.cin ?? "");
    setPatientFieldError(null);
    setIsPatientDropdownOpen(false);
  };

  const filteredPatients = useMemo(() => {
    if (!patientResults.length) return [];
    const term = patientQuery.trim().toLowerCase();
    const source = term
      ? patientResults.filter((record) => {
          const cin = record.cin ? record.cin.toLowerCase() : "";
          const name = record.name ? record.name.toLowerCase() : "";
          return cin.includes(term) || name.includes(term);
        })
      : patientResults;
    return source.slice(0, 8);
  }, [patientQuery, patientResults]);

  const handleScheduleSubmit = (event) => {
    event.preventDefault();
    if (!selectedPatient) {
      setPatientFieldError(
        patientConnector
          ? "Select a patient by CIN before scheduling."
          : "Patient search requires a backend connection.",
      );
      if (patientConnector) {
        setIsPatientDropdownOpen(true);
      }
      return;
    }
    setPatientFieldError(null);
    setIsModalOpen(false);
    setBanner({
      type: "success",
      message: `Appointment scheduled for ${selectedPatient.name} (${selectedPatient.cin}) (mock submission).`,
      id: Date.now(),
    });
    // alert(`Appointment scheduled for ${selectedPatient.name} (${selectedPatient.cin}) (mock).`);
  };

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

        {banner && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              banner.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {banner.message}
          </div>
        )}
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
              {appointments.slice(0, 10).map((apt) => (
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
                    <Badge color={getStatusBadgeColor(apt.status)}>{apt.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : agendaDays.length ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {agendaDays.map((day) => (
            <div key={day.dateKey} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 min-h-[400px]">
              <h4 className="font-bold text-center mb-4 text-slate-600 dark:text-slate-300">{day.label}</h4>
              <div className="space-y-3">
                {day.appointments.map((apt) => (
                  <div
                    key={apt.id || `${day.dateKey}-${apt.time}-${apt.patient}`}
                    className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border-l-4 border-teal-500 text-xs"
                  >
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200 mb-1">
                      <span>{formatAgendaTime(apt.time)}</span>
                      <span className="text-teal-600">{apt.department}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{apt.patient}</p>
                    <p className="text-[11px] text-slate-400">with {apt.staff}</p>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="truncate pr-2">{apt.hospital}</span>
                      <Badge color={getStatusBadgeColor(apt.status)}>{apt.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center text-slate-500 dark:text-slate-400">
          No appointment data available for agenda view.
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Appointment">
        <form className="space-y-4" onSubmit={handleScheduleSubmit}>
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Patient (CIN) *</label>
            <div className="flex gap-2">
              <div className="relative flex-1" ref={patientSearchRef}>
                <input
                  type="text"
                  value={patientQuery}
                  onChange={handlePatientSearchChange}
                  onFocus={() => patientConnector && setIsPatientDropdownOpen(true)}
                  placeholder={patientConnector ? "Search CIN or name..." : "Connect backend to search"}
                  disabled={!patientConnector}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600${
                    patientFieldError ? " border-red-500" : ""
                  }`}
                />
                {isPatientDropdownOpen && patientConnector && (
                  <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                    {isFetchingPatients ? (
                      <div className="px-4 py-3 text-sm text-slate-500">Loading patients...</div>
                    ) : filteredPatients.length ? (
                      filteredPatients.map((patient, index) => (
                        <button
                          type="button"
                          key={`patient-option-${patient.cin || patient.iid || index}`}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handlePatientSelect(patient);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{patient.cin}</span>
                          <span className="block text-xs text-slate-500">{patient.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500">No patients match this search.</div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fetchPatients({ forceRefresh: true })}
                disabled={!patientConnector || isFetchingPatients}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-slate-700 disabled:opacity-50"
                title="Refresh patient list"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingPatients ? "animate-spin" : ""}`} />
              </button>
            </div>
            {selectedPatient && (
              <p className="text-xs text-slate-500 mt-1">
                Selected: {selectedPatient.name} • CIN {selectedPatient.cin}
              </p>
            )}
            {patientFieldError && <p className="text-xs text-red-500 mt-1">{patientFieldError}</p>}
            {patientFetchError && !isFetchingPatients && (
              <p className="text-xs text-red-500 mt-1">{patientFetchError}</p>
            )}
            {!patientConnector && (
              <p className="text-xs text-slate-500 mt-1">Backend connector required to search patients.</p>
            )}
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
