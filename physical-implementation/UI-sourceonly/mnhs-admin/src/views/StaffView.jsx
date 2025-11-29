import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import Modal from "../components/common/Modal";

const COLORS = ["#0d9488", "#3b82f6", "#f59e0b", "#6366f1", "#14b8a6", "#f472b6"];
const STATUS_OPTIONS = ["Active", "Retired"];
const INITIAL_FORM_STATE = {
  id: "",
  name: "",
  status: STATUS_OPTIONS[0],
};

const StaffView = ({ data, error, staffConnector }) => {
  const [banner, setBanner] = useState(null);
  const [staffList, setStaffList] = useState(() => (Array.isArray(data?.staff) ? data.staff : []));
  const [syncedAt, setSyncedAt] = useState(data?.lastSyncedAt ?? null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const didAutoRefresh = useRef(false);

  useEffect(() => {
    if (error) {
      setBanner({ type: "error", message: error, id: Date.now() });
    }
  }, [error]);

  useEffect(() => {
    if (!staffConnector) {
      setBanner({ type: "error", message: "Staff connector unavailable. Please refresh.", id: Date.now() });
    }
  }, [staffConnector]);

  useEffect(() => {
    if (Array.isArray(data?.staff)) {
      setStaffList(data.staff);
      setSyncedAt(data.lastSyncedAt ?? null);
    }
  }, [data]);

  const refreshStaff = useCallback(
    async ({ forceRefresh = false, silent = false } = {}) => {
      if (!staffConnector) return null;

      if (!silent) {
        setIsLoadingStaff(true);
        setFetchError(null);
      }

      try {
        const payload = await staffConnector.fetchStaff({ forceRefresh });
        const nextStaff = Array.isArray(payload?.staff) ? payload.staff : [];
        setStaffList(nextStaff);
        setSyncedAt(payload?.lastSyncedAt ?? null);
        setFetchError(null);
        return payload;
      } catch (loadError) {
        const message = loadError?.message || "Failed to load staff records from backend.";
        setFetchError(message);
        if (!silent) {
          setBanner({ type: "error", message, id: Date.now() });
        }
        return null;
      } finally {
        if (!silent) {
          setIsLoadingStaff(false);
        }
      }
    },
    [staffConnector],
  );

  useEffect(() => {
    if (!staffConnector || didAutoRefresh.current) return;
    didAutoRefresh.current = true;
    const hadInitialPayload = Array.isArray(data?.staff) && data.staff.length > 0;
    refreshStaff({ silent: hadInitialPayload });
  }, [staffConnector, refreshStaff, data]);

  const roleData = useMemo(() => {
    const counts = staffList.reduce((acc, member) => {
      const role = member.role || "Other";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [staffList]);

  const hasConnector = Boolean(staffConnector);
  const lastSyncedLabel = useMemo(() => (syncedAt ? new Date(syncedAt).toLocaleString() : null), [syncedAt]);

  const handleOpenModal = () => {
    setFormValues(INITIAL_FORM_STATE);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors = {};
    const trimmedId = formValues.id.trim();
    const trimmedName = formValues.name.trim();
    const normalizedStatus = STATUS_OPTIONS.includes(formValues.status) ? formValues.status : STATUS_OPTIONS[0];

    if (!trimmedId) errors.id = "ID is required";
    else if (!/^\d+$/.test(trimmedId)) errors.id = "ID must be numeric";
    else if (staffList.some((member) => String(member.id) === trimmedId)) errors.id = "ID already exists";

    if (!trimmedName) errors.name = "Name is required";

    return { errors, trimmedId, trimmedName, normalizedStatus };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!staffConnector) {
      setBanner({ type: "error", message: "Staff connector unavailable. Please refresh.", id: Date.now() });
      return;
    }

    const { errors, trimmedId, trimmedName, normalizedStatus } = validateForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    const requestPayload = {
      id: Number(trimmedId),
      name: trimmedName,
      status: normalizedStatus,
    };

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const response = await staffConnector.addStaff(requestPayload);
      const created = response?.staff || requestPayload;
      const normalized = {
        id: created.id ?? requestPayload.id,
        name: created.name ?? requestPayload.name,
        role: created.role || "Unassigned",
        departments: Array.isArray(created.departments) ? created.departments : [],
        hospitals: Array.isArray(created.hospitals) ? created.hospitals : [],
        status: created.status || requestPayload.status,
      };

      setStaffList((prev) => [normalized, ...prev]);
      setBanner({ type: "success", message: response?.message || "Staff created", id: Date.now() });
      setFormValues(INITIAL_FORM_STATE);
      setIsModalOpen(false);
      refreshStaff({ forceRefresh: true, silent: true });
    } catch (submitError) {
      setBanner({ type: "error", message: submitError?.message || "Failed to create staff member.", id: Date.now() });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            banner.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          {banner.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lg:col-span-2"
          title="Staff Directory"
          action={
            hasConnector ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                  onClick={handleOpenModal}
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4" /> Add Staff
                </button>
                <button
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  onClick={() => refreshStaff({ forceRefresh: true })}
                  disabled={isLoadingStaff}
                >
                  {isLoadingStaff ? "Syncing..." : "Refresh"}
                </button>
              </div>
            ) : null
          }
        >
          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-300 mb-2">
            <span>{staffList.length} team members</span>
            {lastSyncedLabel && <span>Synced {lastSyncedLabel}</span>}
          </div>
          {fetchError && (
            <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-200">
              Unable to sync staff: {fetchError}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Departments</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-300">
                      No staff records available.
                    </td>
                  </tr>
                )}
                {staffList.slice(0, 8).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{s.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.departments?.length ? s.departments : ["Unassigned"]).map((d) => (
                          <span key={d} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-200">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={s.status === "Active" ? "green" : "orange"}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Allocation by Role">
          <div className="h-64">
            {roleData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No data</div>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add Staff Member">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID *</label>
            <input
              type="text"
              value={formValues.id}
              onChange={handleInputChange("id")}
              placeholder="Numeric ID"
              maxLength={8}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${formErrors.id ? "border-red-500" : ""}`}
            />
            {formErrors.id && <p className="text-xs text-red-500 mt-1">{formErrors.id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={formValues.name}
              onChange={handleInputChange("name")}
              placeholder="Staff member name"
              maxLength={100}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${formErrors.name ? "border-red-500" : ""}`}
            />
            {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={formValues.status}
              onChange={handleInputChange("status")}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500">Only ID and full name are required. Status defaults to Active.</p>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg font-medium text-white ${
                isSubmitting ? "bg-teal-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Staff"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffView;
