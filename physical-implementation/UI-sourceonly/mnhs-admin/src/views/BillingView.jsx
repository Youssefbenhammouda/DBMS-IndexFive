import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, ShieldCheck, Clock3, AlertTriangle, Plus } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Card from "../components/common/Card";
import KpiCard from "../components/common/KpiCard";
import Badge from "../components/common/Badge";
import Drawer from "../components/common/Drawer";
import Modal from "../components/common/Modal";

const INSURANCE_COLORS = ["#0d9488", "#3b82f6", "#f97316", "#8b5cf6", "#ef4444"];

const ICON_MAP = {
  CreditCard,
  ShieldCheck,
  Clock3,
  AlertTriangle,
};

const DEFAULT_EXPENSE_FORM = {
  caid: "",
  insId: "",
  total: "",
};

const COVERAGE_ALL_TOKEN = "none";
const COVERAGE_SELF_TOKEN = "self";
const DEFAULT_DAYS_BACK = 90;
const DEFAULT_FILTER_FORM = {
  hospitalId: "",
  departmentId: "",
  insuranceId: COVERAGE_ALL_TOKEN,
  daysBack: DEFAULT_DAYS_BACK.toString(),
};
const DAYS_BACK_PRESETS = [7, 30, 60, 90];

const formatCurrency = (value, { compact = false, minimumFractionDigits = 0, maximumFractionDigits = 0 } = {}) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

const toPercentNumber = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value <= 1 ? value * 100 : value;
};

const formatPercentLabel = (value, digits = 1) => {
  const percent = toPercentNumber(value);
  if (percent === null) return "--";
  return `${percent.toFixed(digits)}%`;
};

const formatKpiValue = (value, unit) => {
  switch (unit) {
    case "MAD":
      return formatCurrency(value, { compact: true, maximumFractionDigits: 1 });
    case "ratio":
      return formatPercentLabel(value, 1);
    case "count":
      return typeof value === "number" ? value.toLocaleString() : "--";
    default:
      return value ?? "--";
  }
};

const formatTrendLabel = (trend) => {
  if (!trend) return null;
  const percent = toPercentNumber(trend.value);
  if (percent === null) return null;
  const signed = trend.direction === "down" ? -percent : percent;
  const sign = signed > 0 ? "+" : "";
  return `${sign}${signed.toFixed(1)}%`;
};

const summarizeFilters = (filters = {}) => {
  const tokens = [];
  if (filters.hospitalId) tokens.push(`Hospital #${filters.hospitalId}`);
  if (filters.departmentId) tokens.push(`Department #${filters.departmentId}`);
  if (filters.insuranceScope === "self") tokens.push("Self-Pay only");
  else if (filters.insuranceScope === "insurer" && filters.insuranceId) tokens.push(`Insurer #${filters.insuranceId}`);
  const scopeLabel = tokens.length ? tokens.join(" - ") : "Network-wide";
  const days = filters.daysBack ?? DEFAULT_DAYS_BACK;
  return `${scopeLabel} - Last ${days} days`;
};

const formatDateOnly = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleString();
};

const shareFromValue = (value, fallbackAmount = 0, totalAmount = 1) => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value <= 1 ? value * 100 : value;
  }
  if (!fallbackAmount || !totalAmount) return 0;
  return (fallbackAmount / totalAmount) * 100;
};

const BillingView = ({ data, error, billingConnector, onRequestRefresh }) => {
  const [insuranceFilter, setInsuranceFilter] = useState("All");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [formState, setFormState] = useState(DEFAULT_EXPENSE_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formStatus, setFormStatus] = useState(null);
  const [isSubmittingExpense, setSubmittingExpense] = useState(false);
  const [appointmentOptions, setAppointmentOptions] = useState([]);
  const [isLoadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [filterForm, setFilterForm] = useState(DEFAULT_FILTER_FORM);
  const metadataSyncSignature = useRef(null);

  const usingLiveData = Boolean(data && Object.keys(data).length);
  const dataset = usingLiveData ? data : {};
  const {
    kpis = [],
    insuranceSplit = [],
    hospitalRollup = [],
    departmentSummary = [],
    recentExpenses = [],
    medicationUtilization = [],
    metadata = {},
  } = dataset;

  const hasConnector = Boolean(billingConnector);
  const lastSyncedLabel = metadata.lastSyncedAt ? new Date(metadata.lastSyncedAt).toLocaleString() : null;
  const rawMetadataFilters = metadata.filters || {};
  const metadataFiltersWithScope = useMemo(() => {
    if (rawMetadataFilters.insuranceScope) {
      return rawMetadataFilters;
    }
    if (
      rawMetadataFilters.insuranceId === null &&
      Object.prototype.hasOwnProperty.call(rawMetadataFilters, "insuranceId")
    ) {
      return { ...rawMetadataFilters, insuranceScope: "self" };
    }
    if (rawMetadataFilters.insuranceId) {
      return { ...rawMetadataFilters, insuranceScope: "insurer" };
    }
    return { ...rawMetadataFilters, insuranceScope: "all" };
  }, [rawMetadataFilters]);
  const filtersSummary = summarizeFilters(metadataFiltersWithScope);

  const loadAppointmentOptions = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (!billingConnector?.fetchActivityOptions) {
        setAppointmentsError("Billing connector unavailable");
        return;
      }
      setLoadingAppointments(true);
      setAppointmentsError(null);
      try {
        const options = await billingConnector.fetchActivityOptions({ forceRefresh });
        setAppointmentOptions(Array.isArray(options) ? options : []);
      } catch (err) {
        setAppointmentsError(err.message || "Failed to load appointment data");
      } finally {
        setLoadingAppointments(false);
      }
    },
    [billingConnector],
  );

  useEffect(() => {
    if (isExpenseModalOpen && !appointmentOptions.length && !isLoadingAppointments) {
      loadAppointmentOptions();
    }
  }, [isExpenseModalOpen, appointmentOptions.length, isLoadingAppointments, loadAppointmentOptions]);

  useEffect(() => {
    if (!isExpenseModalOpen) {
      setFormErrors({});
      setSubmittingExpense(false);
      setFormState(() => ({ ...DEFAULT_EXPENSE_FORM }));
    }
  }, [isExpenseModalOpen]);

  const insurerOptions = useMemo(() => {
    const uniqueInsurers = new Map();
    insuranceSplit.forEach((bucket) => {
      if (bucket.insId === null || bucket.insId === undefined) return;
      const key = bucket.insId.toString();
      if (!uniqueInsurers.has(key)) {
        uniqueInsurers.set(key, {
          value: key,
          label: bucket.type || `Insurer #${bucket.insId}`,
        });
      }
    });
    return [{ value: "self", label: "Self-Pay" }, ...Array.from(uniqueInsurers.values())];
  }, [insuranceSplit]);

  const selectedAppointment = useMemo(() => {
    const caidValue = formState.caid?.toString();
    if (!caidValue) return null;
    return appointmentOptions.find((apt) => apt.id?.toString() === caidValue) || null;
  }, [appointmentOptions, formState.caid]);

  const hospitalFilterOptions = useMemo(() => {
    const unique = new Map();
    hospitalRollup.forEach((row) => {
      if (!row || row.hid === undefined || row.hid === null) return;
      unique.set(row.hid.toString(), row.name || `Hospital #${row.hid}`);
    });
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [hospitalRollup]);

  const departmentFilterOptions = useMemo(() => {
    const unique = new Map();
    departmentSummary.forEach((dept) => {
      if (!dept || dept.depId === undefined || dept.depId === null) return;
      const value = dept.depId.toString();
      if (!unique.has(value)) {
        unique.set(value, `${dept.department || `Department #${dept.depId}`} (${dept.hospital || "Unknown"})`);
      }
    });
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [departmentSummary]);

  const coverageFilterOptions = useMemo(() => {
    const rows = [
      { value: COVERAGE_ALL_TOKEN, label: "All coverages" },
      { value: COVERAGE_SELF_TOKEN, label: "Self-Pay only" },
    ];
    const seen = new Set(rows.map((option) => option.value));
    insuranceSplit.forEach((bucket) => {
      if (bucket.insId === null || bucket.insId === undefined) return;
      const value = bucket.insId.toString();
      if (seen.has(value)) return;
      seen.add(value);
      rows.push({ value, label: bucket.type || `Insurer #${bucket.insId}` });
    });
    return rows;
  }, [insuranceSplit]);

  const daysBackOptions = useMemo(() => {
    const values = new Set(DAYS_BACK_PRESETS);
    const metaValue = Number(metadataFiltersWithScope.daysBack);
    if (!Number.isNaN(metaValue) && metaValue > 0) values.add(metaValue);
    const currentValue = Number(filterForm.daysBack);
    if (!Number.isNaN(currentValue) && currentValue > 0) values.add(currentValue);
    return Array.from(values).sort((a, b) => a - b);
  }, [filterForm.daysBack, metadataFiltersWithScope]);

  const normalizedFiltersFromMetadata = useMemo(() => {
    const resolved = {
      hospitalId: metadataFiltersWithScope.hospitalId ? metadataFiltersWithScope.hospitalId.toString() : "",
      departmentId: metadataFiltersWithScope.departmentId ? metadataFiltersWithScope.departmentId.toString() : "",
      insuranceId:
        metadataFiltersWithScope.insuranceScope === "self"
          ? COVERAGE_SELF_TOKEN
          : metadataFiltersWithScope.insuranceScope === "insurer" && metadataFiltersWithScope.insuranceId
          ? metadataFiltersWithScope.insuranceId.toString()
          : COVERAGE_ALL_TOKEN,
      daysBack: (metadataFiltersWithScope.daysBack ?? DEFAULT_DAYS_BACK).toString(),
    };
    return resolved;
  }, [metadataFiltersWithScope]);

  // Keep track of the last metadata snapshot to avoid clobbering in-progress edits.
  useEffect(() => {
    const metadataSignature = JSON.stringify(normalizedFiltersFromMetadata);
    if (metadataSignature === metadataSyncSignature.current) {
      return;
    }
    metadataSyncSignature.current = metadataSignature;
    setFilterForm(normalizedFiltersFromMetadata);
  }, [normalizedFiltersFromMetadata]);

  const filtersDirty = useMemo(() => {
    return JSON.stringify(filterForm) !== JSON.stringify(normalizedFiltersFromMetadata);
  }, [filterForm, normalizedFiltersFromMetadata]);

  const isDefaultFilterState = useMemo(() => {
    return JSON.stringify(filterForm) === JSON.stringify(DEFAULT_FILTER_FORM);
  }, [filterForm]);

  const handleFilterFieldChange = (field) => (event) => {
    const { value } = event.target;
    setFilterForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildFilterPayload = useCallback((form) => {
    const payload = {};
    if (form.hospitalId) payload.hospitalId = Number(form.hospitalId);
    if (form.departmentId) payload.departmentId = Number(form.departmentId);
    if (form.insuranceId === COVERAGE_SELF_TOKEN) {
      payload.insuranceId = COVERAGE_SELF_TOKEN;
    } else if (form.insuranceId === COVERAGE_ALL_TOKEN) {
      payload.insuranceId = COVERAGE_ALL_TOKEN;
    } else if (form.insuranceId) {
      const numeric = Number(form.insuranceId);
      if (!Number.isNaN(numeric)) {
        payload.insuranceId = numeric;
      }
    }
    if (form.daysBack) {
      const days = Number(form.daysBack);
      if (!Number.isNaN(days) && days > 0) payload.daysBack = days;
    }
    return payload;
  }, []);

  const handleApplyFilters = () => {
    if (!hasConnector || typeof onRequestRefresh !== "function") return;
    onRequestRefresh(buildFilterPayload(filterForm));
  };

  const handleClearFilters = () => {
    setFilterForm({ ...DEFAULT_FILTER_FORM });
  };

  const canApplyFilters = filtersDirty && hasConnector && typeof onRequestRefresh === "function";
  const preparedKpis = useMemo(
    () =>
      kpis.map((kpi, index) => ({
        key: kpi.key || `kpi-${index}`,
        title: kpi.title,
        displayValue: formatKpiValue(kpi.value, kpi.unit),
        subtext: kpi.subtext,
        trendDirection: kpi.trend?.direction,
        trendValue: formatTrendLabel(kpi.trend),
        iconKey: kpi.iconKey,
      })),
    [kpis],
  );

  const insuranceFilterOptions = useMemo(
    () => ["All", ...insuranceSplit.map((bucket) => bucket.type)],
    [insuranceSplit],
  );

  const insuranceSummary = useMemo(() => {
    const totalAmount = insuranceSplit.reduce((acc, row) => acc + (row.amount || 0), 0) || 1;
    return insuranceSplit.map((bucket, index) => ({
      ...bucket,
      color: INSURANCE_COLORS[index % INSURANCE_COLORS.length],
      resolvedShare: Math.round(shareFromValue(bucket.share, bucket.amount, totalAmount)),
    }));
  }, [insuranceSplit]);

  const filteredExpenses = useMemo(() => {
    if (insuranceFilter === "All") return recentExpenses;
    return recentExpenses.filter((expense) => expense.insurance?.type === insuranceFilter);
  }, [insuranceFilter, recentExpenses]);

  const hospitalPreview = useMemo(() => hospitalRollup.slice(0, 6), [hospitalRollup]);

  const departmentLeaders = useMemo(() => {
    const leaders = departmentSummary.slice(0, 5);
    const avg = leaders.length
      ? leaders.reduce((acc, dept) => acc + (dept.total || 0), 0) / leaders.length
      : 0;
    return { leaders, avg };
  }, [departmentSummary]);

  const medicationSnapshot = useMemo(() => {
    const list = medicationUtilization.slice(0, 5);
    const maxPrescriptions = Math.max(...list.map((med) => med.prescriptions || 0), 0) || 1;
    return list.map((med) => ({
      ...med,
      barWidth: Math.round(((med.prescriptions || 0) / maxPrescriptions) * 100),
      shareLabel: formatPercentLabel(med.share, 1),
    }));
  }, [medicationUtilization]);

  const drawerMedications = selectedExpense?.prescription?.medications || [];

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    if (!hasConnector) {
      setFormStatus({ type: "error", message: "Billing connector unavailable." });
      return;
    }

    const resolvedCaid = Number(formState.caid);
    const resolvedTotal = Number(formState.total);
    const nextErrors = {};

    if (!formState.caid || Number.isNaN(resolvedCaid) || resolvedCaid <= 0) {
      nextErrors.caid = "Select a clinical activity.";
    }
    if (Number.isNaN(resolvedTotal) || resolvedTotal < 0) {
      nextErrors.total = "Total must be zero or greater.";
    }

    let resolvedInsId;
    if (formState.insId === "self") {
      resolvedInsId = null;
    } else if (formState.insId) {
      resolvedInsId = Number(formState.insId);
      if (Number.isNaN(resolvedInsId)) {
        nextErrors.insId = "Insurance must be numeric.";
      }
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    const payload = { caid: resolvedCaid, total: resolvedTotal };
    if (resolvedInsId !== undefined) {
      payload.insId = resolvedInsId;
    }

    setSubmittingExpense(true);
    setFormStatus(null);
    try {
      await billingConnector.createExpense(payload);
      setFormStatus({ type: "success", message: "Expense captured." });
      setFormState(() => ({ ...DEFAULT_EXPENSE_FORM }));
      setExpenseModalOpen(false);
      if (typeof onRequestRefresh === "function") {
        onRequestRefresh(metadataFiltersWithScope || {});
      }
    } catch (err) {
      setFormStatus({ type: "error", message: err.message || "Failed to capture expense." });
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleAppointmentSelection = (event) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, caid: value || "" }));
    if (formErrors.caid) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.caid;
        return next;
      });
    }
  };

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleOpenExpenseModal = () => {
    if (!hasConnector) return;
    setFormErrors({});
    setFormStatus(null);
    setExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    setExpenseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          Failed to refresh billing data: {error}
        </div>
      )}
      {!usingLiveData && !error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
          No billing data returned yet. Adjust filters or retry once the backend is available.
        </div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1 text-xs">
          {hasConnector && usingLiveData ? (
            <>
              <span className="text-emerald-600 dark:text-emerald-400">
                {lastSyncedLabel ? `Last synced ${lastSyncedLabel}` : ""}
              </span>
              <span className="text-slate-500 dark:text-slate-400">Scope: {filtersSummary}</span>
            </>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">Scope: {filtersSummary}</span>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          {formStatus && !isExpenseModalOpen && (
            <div
              className={`text-xs px-3 py-2 rounded-lg border ${
                formStatus.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200"
                  : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200"
              }`}
            >
              {formStatus.message}
            </div>
          )}
          <button
            type="button"
            onClick={handleOpenExpenseModal}
            disabled={!hasConnector}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasConnector
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            <Plus className="w-4 h-4" /> Capture Expense
          </button>
        </div>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-1">Hospital</label>
            <select
              value={filterForm.hospitalId}
              onChange={handleFilterFieldChange("hospitalId")}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
            >
              <option value="">All hospitals</option>
              {hospitalFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-1">Department</label>
            <select
              value={filterForm.departmentId}
              onChange={handleFilterFieldChange("departmentId")}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
            >
              <option value="">All departments</option>
              {departmentFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-1">Coverage</label>
            <select
              value={filterForm.insuranceId}
              onChange={handleFilterFieldChange("insuranceId")}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
            >
              {coverageFilterOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-1">Window</label>
            <select
              value={filterForm.daysBack}
              onChange={handleFilterFieldChange("daysBack")}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
            >
              {daysBackOptions.map((value) => (
                <option key={value} value={value.toString()}>
                  Last {value} days
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end mt-4">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30"
            disabled={isDefaultFilterState}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApplyFilters}
            disabled={!canApplyFilters}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${
              canApplyFilters ? "bg-teal-600 hover:bg-teal-700" : "bg-slate-300 cursor-not-allowed dark:bg-slate-700"
            }`}
          >
            Apply Filters
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {preparedKpis.map((kpi) => (
          <KpiCard
            key={kpi.key}
            title={kpi.title}
            value={kpi.displayValue}
            subtext={kpi.subtext}
            trend={kpi.trendDirection}
            trendValue={kpi.trendValue}
            icon={ICON_MAP[kpi.iconKey] || CreditCard}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2" title="Insurance Coverage Mix">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={insuranceSummary} dataKey="amount" nameKey="type" innerRadius={70} outerRadius={120} paddingAngle={3}>
                    {insuranceSummary.map((entry) => (
                      <Cell key={entry.type} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(15,23,42,0.12)",
                    }}
                    formatter={(value, _name, payload) => [
                      formatCurrency(value),
                      `${payload?.payload?.type || ""} (${payload?.payload?.resolvedShare || 0}% share)`
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {insuranceSummary.map((bucket) => (
                <div key={bucket.type} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{bucket.type}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{bucket.activities} activities</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(bucket.amount, { compact: true })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{bucket.resolvedShare}% share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Medication Utilization Snapshot">
          <div className="space-y-4">
            {medicationSnapshot.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No prescriptions recorded for the selected filters.</p>
            )}
            {medicationSnapshot.map((med) => (
              <div key={med.mid} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{med.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{med.therapeuticClass} - {med.shareLabel}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{med.prescriptions} rx</p>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 dark:bg-teal-400"
                    style={{ width: `${Math.min(100, med.barWidth)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2" title="Hospital Billing Overview">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 dark:text-slate-300">
                <tr>
                  <th className="py-3 px-4">Hospital</th>
                  <th className="py-3 px-4">Region</th>
                  <th className="py-3 px-4 text-right">Activities</th>
                  <th className="py-3 px-4 text-right">Insured Share</th>
                  <th className="py-3 px-4 text-right">Avg Expense</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {hospitalPreview.map((row) => (
                  <tr key={row.hid}>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">{row.name}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{row.region}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-200">{row.activities?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-200">{formatPercentLabel(row.insuredShare)}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-200">{formatCurrency(row.avgExpense, { minimumFractionDigits: 0 })}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(row.total, { minimumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
                {!hospitalPreview.length && (
                  <tr>
                    <td className="py-6 text-center text-slate-500 dark:text-slate-400" colSpan={6}>
                      No hospital data for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Department Leaderboard">
          <div className="space-y-4">
            {departmentLeaders.leaders.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No department activity recorded.</p>
            )}
            {departmentLeaders.leaders.map((dept) => {
              const isAboveAverage = departmentLeaders.avg && dept.total >= departmentLeaders.avg;
              return (
                <div key={dept.depId} className="p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{dept.department}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{dept.hospital} - {dept.specialty}</p>
                    </div>
                    {isAboveAverage && <Badge color="green">Above avg</Badge>}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{dept.activities} activities</span>
                    {typeof dept.avgExpense === "number" && (
                      <span>Avg {formatCurrency(dept.avgExpense, { minimumFractionDigits: 0 })}</span>
                    )}
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(dept.total, { compact: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card
        title="Recent Billable Activities"
        action={
          <select
            value={insuranceFilter}
            onChange={(event) => setInsuranceFilter(event.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          >
            {insuranceFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 dark:text-slate-300">
              <tr>
                <th className="py-3 px-4">Expense</th>
                <th className="py-3 px-4">CAID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Hospital</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Insurance</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.expId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                  onClick={() => setSelectedExpense(expense)}
                >
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">{expense.expId}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{expense.caid ?? "--"}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{formatDateOnly(expense.activityDate)}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{expense.hospital?.name}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{expense.department?.name}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{expense.patient?.fullName}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{expense.insurance?.type || "Self-Pay"}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(expense.total, { minimumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
              {!filteredExpenses.length && (
                <tr>
                  <td className="py-6 text-center text-slate-500 dark:text-slate-400" colSpan={8}>
                    No expenses for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
          Each row represents one Expense linked 1:1 to a ClinicalActivity (CAID) using the lab schema.
        </p>
      </Card>

      <Modal isOpen={isExpenseModalOpen} onClose={handleCloseExpenseModal} title="Capture Expense">
        <form className="space-y-5" onSubmit={handleExpenseSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Select clinical activity (required)
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
              value={formState.caid ? formState.caid.toString() : ""}
              onChange={handleAppointmentSelection}
              required
            >
              <option value="">-- Choose an appointment --</option>
              {appointmentOptions.map((apt) => (
                <option key={apt.id} value={apt.id?.toString() ?? ""}>
                  #{apt.id} · {apt.patient} · {apt.department} · {apt.date}
                </option>
              ))}
            </select>
            {formErrors.caid && <p className="text-xs text-red-600">{formErrors.caid}</p>}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Refresh to pull the latest Appointments dataset.</span>
              <button
                type="button"
                className="text-teal-600 hover:text-teal-700 font-medium dark:text-teal-400 dark:hover:text-teal-300"
                onClick={() => loadAppointmentOptions({ forceRefresh: true })}
                disabled={isLoadingAppointments}
              >
                {isLoadingAppointments ? "Loading..." : "Refresh"}
              </button>
            </div>
            {appointmentsError && <p className="text-xs text-red-600">{appointmentsError}</p>}
          </div>

          {selectedAppointment && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 text-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{selectedAppointment.patient}</p>
              <p className="text-slate-500 dark:text-slate-400">
                {selectedAppointment.hospital} · {selectedAppointment.department}
              </p>
              <p className="text-slate-500 dark:text-slate-400">Doctor: {selectedAppointment.staff}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Appointment #{selectedAppointment.id} on {selectedAppointment.date}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Insurance</label>
            <select
              value={formState.insId}
              onChange={handleFieldChange("insId")}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
            >
              <option value="">Keep CA defaults</option>
              {insurerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {formErrors.insId && <p className="text-xs text-red-600 mt-1">{formErrors.insId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Total (MAD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.total}
              onChange={handleFieldChange("total")}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
              placeholder="0.00"
            />
            {formErrors.total && <p className="text-xs text-red-600 mt-1">{formErrors.total}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseExpenseModal} className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-300">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingExpense}
              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${
                isSubmittingExpense ? "bg-teal-400" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isSubmittingExpense ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </Modal>

      <Drawer
        isOpen={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        title={selectedExpense ? `Expense ${selectedExpense.expId}` : "Expense details"}
      >
        {selectedExpense && (
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Patient</p>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {selectedExpense.patient?.fullName}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {selectedExpense.hospital?.name} - {selectedExpense.department?.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Insurance</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {selectedExpense.insurance?.type || "Self-Pay"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Clinical Activity</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{selectedExpense.caid ?? "--"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Attending Staff</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {selectedExpense.staff?.fullName}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Billed On</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{formatDateTime(selectedExpense.activityDate)}</p>
              </div>
            </div>

            {selectedExpense.prescription && (
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400 mb-2">Prescription #{selectedExpense.prescription.pid}</p>
                {drawerMedications.length === 0 && <p className="text-slate-500 dark:text-slate-400">No medications recorded.</p>}
                <div className="space-y-3">
                  {drawerMedications.map((med) => (
                    <div key={med.mid} className="flex justify-between text-slate-700 dark:text-slate-200">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {med.dosage || "Dose N/A"} - {med.duration || "Duration N/A"}
                        </p>
                      </div>
                      {med.therapeuticClass && <Badge color="blue">{med.therapeuticClass}</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Total</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(selectedExpense.total, { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BillingView;
