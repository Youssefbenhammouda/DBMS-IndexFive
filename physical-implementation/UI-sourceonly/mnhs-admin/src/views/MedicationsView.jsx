import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pill, AlertTriangle, TrendingUp, Plus, PackagePlus, Loader2, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import Modal from "../components/common/Modal";
const formatCurrency = (value) => `${(value || 0).toLocaleString()} MAD`;

const DEFAULT_HOSPITAL_OPTIONS = ["Rabat Central", "Casablanca General", "Marrakech Health", "Tangier Med"];
const DEFAULT_UNIT_OPTIONS = ["boxes", "packs", "vials", "bottles"];
const UNIT_DATALIST_ID = "medications-unit-options";
const normalizeQuery = (value) => (value || "").toString().trim().toLowerCase();
const filterStringOptions = (options, query, limit = 8) => {
  if (!Array.isArray(options) || !options.length) return [];
  const normalized = normalizeQuery(query);
  const source = normalized ? options.filter((option) => option.toLowerCase().includes(normalized)) : options;
  return source.slice(0, limit);
};
const filterMedicationDirectory = (directory, query, limit = 8) => {
  if (!Array.isArray(directory) || !directory.length) return [];
  const normalized = normalizeQuery(query);
  const source = normalized
    ? directory.filter(
        (entry) =>
          String(entry.id).toLowerCase().includes(normalized) || (entry.name || "").toString().toLowerCase().includes(normalized),
      )
    : directory;
  return source.slice(0, limit);
};
const DEFAULT_MEDICATION_FORM = {
  id: "",
  name: "",
  hospital: "",
  qty: "",
  reorderLevel: "",
  unit: DEFAULT_UNIT_OPTIONS[0],
  class: "",
};

const DEFAULT_STOCK_FORM = {
  templateKey: "",
  medicationId: "",
  medicationName: "",
  hospital: "",
  qtyReceived: "",
  unitPrice: "",
};

const MedicationsView = ({ data, error, medicationsConnector, staffConnector, onRequestRefresh }) => {
  const [banner, setBanner] = useState(null);
  const hasConnector = Boolean(medicationsConnector);
  const [isMedicationModalOpen, setMedicationModalOpen] = useState(false);
  const [isStockModalOpen, setStockModalOpen] = useState(false);
  const [medicationForm, setMedicationForm] = useState({ ...DEFAULT_MEDICATION_FORM });
  const [medicationErrors, setMedicationErrors] = useState({});
  const [medicationStatus, setMedicationStatus] = useState(null);
  const [isSubmittingMedication, setSubmittingMedication] = useState(false);
  const [stockForm, setStockForm] = useState({ ...DEFAULT_STOCK_FORM });
  const [stockErrors, setStockErrors] = useState({});
  const [stockStatus, setStockStatus] = useState(null);
  const [isSubmittingStock, setSubmittingStock] = useState(false);
  const [facilityHospitals, setFacilityHospitals] = useState([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [facilityError, setFacilityError] = useState(null);
  const [hasAttemptedFacilityLoad, setHasAttemptedFacilityLoad] = useState(false);
  const [isMedicationHospitalDropdownOpen, setMedicationHospitalDropdownOpen] = useState(false);
  const [isStockHospitalDropdownOpen, setStockHospitalDropdownOpen] = useState(false);
  const [isStockMedicationDropdownOpen, setStockMedicationDropdownOpen] = useState(false);
  const medicationHospitalDropdownRef = useRef(null);
  const stockHospitalDropdownRef = useRef(null);
  const stockMedicationDropdownRef = useRef(null);

  const showBanner = (type, message, source) => {
    setBanner({ type, message, id: Date.now(), source });
  };

  const setErrorBanner = (message, source) => {
    showBanner("error", message, source);
  };

  useEffect(() => {
    if (error) {
      setErrorBanner(error, "prop");
    } else if (banner?.source === "prop") {
      setBanner(null);
    }
  }, [error]);

  useEffect(() => {
    if (!medicationsConnector) {
      setErrorBanner("Medications connector unavailable. Please refresh.", "connector");
    } else if (banner?.source === "connector") {
      setBanner(null);
    }
  }, [medicationsConnector, banner]);

  useEffect(() => {
    if (error || !medicationsConnector) return;
    if (!data) {
      setErrorBanner("Medications data unavailable from backend.", "data");
      return;
    }

    const issues = [];
    if (!Array.isArray(data.lowStock)) issues.push("lowStock");
    if (!Array.isArray(data.pricingSummary)) issues.push("pricingSummary");
    if (!Array.isArray(data.priceSeries)) issues.push("priceSeries");
    if (!Array.isArray(data.replenishmentTrend)) issues.push("replenishmentTrend");
    if (!data.aggregates) issues.push("aggregates");

    if (issues.length) {
      setErrorBanner(`Medications payload missing fields: ${issues.join(", ")}.`, "data");
    } else if (banner?.source === "data") {
      setBanner(null);
    }
  }, [data, error, medicationsConnector, banner]);

  useEffect(() => {
    if (!isMedicationModalOpen) {
      setMedicationForm({ ...DEFAULT_MEDICATION_FORM });
      setMedicationErrors({});
      setMedicationStatus(null);
      setSubmittingMedication(false);
      setMedicationHospitalDropdownOpen(false);
    }
  }, [isMedicationModalOpen]);

  useEffect(() => {
    if (!isStockModalOpen) {
      setStockForm({ ...DEFAULT_STOCK_FORM });
      setStockErrors({});
      setStockStatus(null);
      setSubmittingStock(false);
      setStockHospitalDropdownOpen(false);
      setStockMedicationDropdownOpen(false);
    }
  }, [isStockModalOpen]);

  const loadHospitalDirectory = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (!staffConnector) return null;
      setIsLoadingFacilities(true);
      setFacilityError(null);
      setHasAttemptedFacilityLoad(true);
      try {
        const payload = await staffConnector.fetchStaff({ forceRefresh });
        const staffList = Array.isArray(payload?.staff) ? payload.staff : [];
        const hospitals = new Set();
        staffList.forEach((staff) => {
          (Array.isArray(staff.hospitals) ? staff.hospitals : []).forEach((hospital) => {
            if (hospital) hospitals.add(hospital);
          });
        });
        const sortedHospitals = Array.from(hospitals).sort((a, b) => a.localeCompare(b));
        setFacilityHospitals(sortedHospitals);
        return sortedHospitals;
      } catch (directoryError) {
        setFacilityError(directoryError?.message || "Unable to load hospital directory.");
        return null;
      } finally {
        setIsLoadingFacilities(false);
      }
    },
    [staffConnector],
  );

  useEffect(() => {
    if (!staffConnector) return;
    if (facilityHospitals.length || isLoadingFacilities || hasAttemptedFacilityLoad) return;
    loadHospitalDirectory();
  }, [staffConnector, facilityHospitals.length, isLoadingFacilities, hasAttemptedFacilityLoad, loadHospitalDirectory]);

  const ensureHospitalDirectory = useCallback(() => {
    if (!staffConnector || isLoadingFacilities || facilityHospitals.length) return;
    loadHospitalDirectory();
  }, [staffConnector, isLoadingFacilities, facilityHospitals.length, loadHospitalDirectory]);

  useEffect(() => {
    if (!isMedicationHospitalDropdownOpen) return;
    const handleClick = (event) => {
      if (medicationHospitalDropdownRef.current && !medicationHospitalDropdownRef.current.contains(event.target)) {
        setMedicationHospitalDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMedicationHospitalDropdownOpen]);

  useEffect(() => {
    if (!isStockHospitalDropdownOpen) return;
    const handleClick = (event) => {
      if (stockHospitalDropdownRef.current && !stockHospitalDropdownRef.current.contains(event.target)) {
        setStockHospitalDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isStockHospitalDropdownOpen]);

  useEffect(() => {
    if (!isStockMedicationDropdownOpen) return;
    const handleClick = (event) => {
      if (stockMedicationDropdownRef.current && !stockMedicationDropdownRef.current.contains(event.target)) {
        setStockMedicationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isStockMedicationDropdownOpen]);

  const lowStockSource = Array.isArray(data?.lowStock) ? data.lowStock : [];
  const pricingSummary = Array.isArray(data?.pricingSummary) ? data.pricingSummary : [];
  const priceSeries = Array.isArray(data?.priceSeries) ? data.priceSeries : [];
  const replenishmentTrend = Array.isArray(data?.replenishmentTrend) ? data.replenishmentTrend : [];

  const lowStockHospitalOptions = useMemo(() => {
    const unique = Array.from(new Set(lowStockSource.map((row) => row.hospital).filter(Boolean)));
    return unique.length ? unique : DEFAULT_HOSPITAL_OPTIONS;
  }, [lowStockSource]);

  const availableHospitalOptions = useMemo(() => {
    if (facilityHospitals.length) return facilityHospitals;
    if (lowStockHospitalOptions.length) return lowStockHospitalOptions;
    return DEFAULT_HOSPITAL_OPTIONS;
  }, [facilityHospitals, lowStockHospitalOptions]);

  const unitOptions = useMemo(() => {
    const unique = Array.from(new Set(lowStockSource.map((row) => row.unit).filter(Boolean)));
    return unique.length ? unique : DEFAULT_UNIT_OPTIONS;
  }, [lowStockSource]);

  const stockTemplates = useMemo(() => {
    const records = [];
    const seen = new Set();
    lowStockSource.forEach((row) => {
      if (!row?.id || !row?.hospital) return;
      const key = `${row.id}::${row.hospital}`;
      if (seen.has(key)) return;
      seen.add(key);
      records.push({
        key,
        medicationId: row.id,
        medicationName: row.name,
        hospital: row.hospital,
      });
    });
    return records;
  }, [lowStockSource]);

  const medicationDirectory = useMemo(() => {
    if (!lowStockSource.length) return [];
    const map = new Map();
    lowStockSource.forEach((row) => {
      if (!row?.id) return;
      const key = String(row.id);
      const hospital = row.hospital || null;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: row.name || key,
          hospitals: hospital ? [hospital] : [],
        });
      } else if (hospital) {
        const existing = map.get(key);
        if (!existing.hospitals.includes(hospital)) {
          existing.hospitals.push(hospital);
        }
      }
    });
    return Array.from(map.values());
  }, [lowStockSource]);

  const medicationHospitalChoices = useMemo(
    () => filterStringOptions(availableHospitalOptions, medicationForm.hospital),
    [availableHospitalOptions, medicationForm.hospital],
  );
  const stockHospitalChoices = useMemo(
    () => filterStringOptions(availableHospitalOptions, stockForm.hospital),
    [availableHospitalOptions, stockForm.hospital],
  );
  const medicationSearchQuery = stockForm.medicationId || stockForm.medicationName;
  const stockMedicationChoices = useMemo(
    () => filterMedicationDirectory(medicationDirectory, medicationSearchQuery),
    [medicationDirectory, medicationSearchQuery],
  );

  const lowStockAlerts = useMemo(() => {
    return lowStockSource.map((row, index) => {
      const qty = typeof row.qty === "number" ? row.qty : 0;
      const reorderLevel = typeof row.reorderLevel === "number" ? row.reorderLevel : 0;
      const ratio = reorderLevel ? qty / reorderLevel : 0;
      const severity = ratio <= 0.3 ? "critical" : ratio <= 0.6 ? "warning" : "low";
      return {
        id: row.id ?? `MED-${index}`,
        name: row.name,
        hospital: row.hospital,
        qty,
        reorderLevel,
        unit: row.unit,
        class: row.class,
        severity,
      };
    });
  }, [lowStockSource]);

  const fallbackAggregates = useMemo(() => {
    if (!lowStockAlerts.length) {
      return { criticalAlerts: 0, avgStockGapPct: 0, projectedMonthlySpend: 0 };
    }
    const criticalAlerts = lowStockAlerts.filter((alert) => alert.severity === "critical").length;
    const avgStockGapPct = Math.round(
      (lowStockAlerts.reduce((acc, alert) => acc + (alert.reorderLevel ? Math.max(0, 1 - alert.qty / alert.reorderLevel) : 0), 0) /
        lowStockAlerts.length) *
        100,
    );
    return { criticalAlerts, avgStockGapPct, projectedMonthlySpend: 146000 };
  }, [lowStockAlerts]);

  const aggregates = {
    criticalAlerts: data?.aggregates?.criticalAlerts ?? fallbackAggregates.criticalAlerts,
    avgStockGapPct: data?.aggregates?.avgStockGapPct ?? fallbackAggregates.avgStockGapPct,
    projectedMonthlySpend: data?.aggregates?.projectedMonthlySpend ?? fallbackAggregates.projectedMonthlySpend,
  };
  const lastSyncedLabel = data?.lastSyncedAt ? new Date(data.lastSyncedAt).toLocaleString() : null;

  const updateMedicationField = (field, value) => {
    setMedicationForm((prev) => ({ ...prev, [field]: value }));
    if (medicationErrors[field]) {
      setMedicationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleMedicationFieldChange = (field) => (event) => {
    updateMedicationField(field, event.target.value);
  };

  const updateStockField = (field, value) => {
    setStockForm((prev) => ({ ...prev, [field]: value }));
    if (stockErrors[field]) {
      setStockErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleStockFieldChange = (field) => (event) => {
    updateStockField(field, event.target.value);
  };

  const handleStockTemplateChange = (event) => {
    const templateKey = event.target.value;
    setStockForm((prev) => ({ ...prev, templateKey }));
    if (!templateKey) {
      return;
    }
    const template = stockTemplates.find((record) => record.key === templateKey);
    if (!template) return;
    if (stockErrors.medicationId || stockErrors.hospital) {
      setStockErrors((prev) => {
        const next = { ...prev };
        delete next.medicationId;
        delete next.hospital;
        return next;
      });
    }
    setStockForm((prev) => ({
      ...prev,
      templateKey,
      medicationId: template.medicationId,
      medicationName: template.medicationName || prev.medicationName,
      hospital: template.hospital,
    }));
    setStockMedicationDropdownOpen(false);
    setStockHospitalDropdownOpen(false);
  };

  const handleMedicationHospitalSelect = (value) => {
    if (!value) return;
    updateMedicationField("hospital", value.trim());
    setMedicationHospitalDropdownOpen(false);
  };

  const handleStockHospitalSelect = (value) => {
    if (!value) return;
    updateStockField("hospital", value.trim());
    setStockHospitalDropdownOpen(false);
  };

  const handleStockMedicationSelect = (entry) => {
    if (!entry) return;
    updateStockField("medicationId", entry.id);
    updateStockField("medicationName", entry.name || entry.id);
    if (!stockForm.hospital && Array.isArray(entry.hospitals) && entry.hospitals.length) {
      updateStockField("hospital", entry.hospitals[0]);
    }
    setStockMedicationDropdownOpen(false);
  };

  const validateMedicationForm = () => {
    const errors = {};
    const trimmedId = medicationForm.id.trim();
    const trimmedName = medicationForm.name.trim();
    const trimmedHospital = medicationForm.hospital.trim();
    const trimmedUnit = medicationForm.unit.trim();
    const trimmedClass = medicationForm.class.trim();
    const qtyValue = Number(medicationForm.qty);
    const reorderValue = Number(medicationForm.reorderLevel);

    if (!trimmedId) errors.id = "Medication ID is required.";
    if (!trimmedName) errors.name = "Medication name is required.";
    else if (trimmedName.length > 100) errors.name = "Name must be 100 characters or fewer.";
    if (!trimmedHospital) errors.hospital = "Hospital is required.";
    if (Number.isNaN(qtyValue) || qtyValue < 0) errors.qty = "Quantity must be zero or greater.";
    if (Number.isNaN(reorderValue) || reorderValue <= 0) errors.reorderLevel = "Reorder level must be greater than zero.";
    if (!trimmedUnit) errors.unit = "Unit is required.";

    const payload = {
      id: trimmedId,
      name: trimmedName,
      hospital: trimmedHospital,
      qty: qtyValue,
      reorderLevel: reorderValue,
      unit: trimmedUnit,
    };
    if (trimmedClass) {
      payload.class = trimmedClass;
    }

    return { errors, payload };
  };

  const validateStockForm = () => {
    const errors = {};
    const trimmedMedicationId = stockForm.medicationId.trim();
    const trimmedHospital = stockForm.hospital.trim();
    const trimmedName = stockForm.medicationName.trim();
    const qtyValue = Number(stockForm.qtyReceived);
    const priceValue = Number(stockForm.unitPrice);

    if (!trimmedMedicationId) errors.medicationId = "Medication ID is required.";
    if (!trimmedHospital) errors.hospital = "Hospital is required.";
    if (Number.isNaN(qtyValue) || qtyValue <= 0) errors.qtyReceived = "Quantity received must be greater than zero.";
    if (Number.isNaN(priceValue) || priceValue < 0) errors.unitPrice = "Unit price must be zero or greater.";

    const payload = {
      medicationId: trimmedMedicationId,
      hospital: trimmedHospital,
      qtyReceived: qtyValue,
      unitPrice: priceValue,
    };
    if (trimmedName) {
      payload.medicationName = trimmedName;
    }

    return { errors, payload };
  };

  const handleMedicationSubmit = async (event) => {
    event.preventDefault();
    if (!hasConnector) {
      setMedicationStatus({ type: "error", message: "Medications connector unavailable." });
      return;
    }

    const { errors, payload } = validateMedicationForm();
    setMedicationErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }

    setSubmittingMedication(true);
    setMedicationStatus(null);
    try {
      const response = await medicationsConnector.addMedication(payload);
      const message = response?.message || "Medication created.";
      showBanner("success", message, "action");
      setMedicationModalOpen(false);
      if (typeof onRequestRefresh === "function") {
        onRequestRefresh();
      }
    } catch (submitError) {
      const message = submitError?.message || "Failed to create medication.";
      setMedicationStatus({ type: "error", message });
      showBanner("error", message, "action");
    } finally {
      setSubmittingMedication(false);
    }
  };

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    if (!hasConnector) {
      setStockStatus({ type: "error", message: "Medications connector unavailable." });
      return;
    }

    const { errors, payload } = validateStockForm();
    setStockErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }

    setSubmittingStock(true);
    setStockStatus(null);
    try {
      const response = await medicationsConnector.addStockEntry(payload);
      const message = response?.message || "Stock entry recorded.";
      showBanner("success", message, "action");
      setStockModalOpen(false);
      if (typeof onRequestRefresh === "function") {
        onRequestRefresh();
      }
    } catch (submitError) {
      const message = submitError?.message || "Failed to record stock entry.";
      setStockStatus({ type: "error", message });
      showBanner("error", message, "action");
    } finally {
      setSubmittingStock(false);
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

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {lastSyncedLabel ? `Last synced ${lastSyncedLabel}` : "Waiting for the backend snapshot."}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => hasConnector && setMedicationModalOpen(true)}
            disabled={!hasConnector}
            title={hasConnector ? undefined : "Backend connector required"}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              hasConnector
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            <Plus className="w-4 h-4" /> Add Medication
          </button>
          <button
            type="button"
            onClick={() => hasConnector && setStockModalOpen(true)}
            disabled={!hasConnector}
            title={hasConnector ? undefined : "Backend connector required"}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              hasConnector
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            <PackagePlus className="w-4 h-4" /> Log Stock Intake
          </button>
          {staffConnector && (
            <button
              type="button"
              onClick={() => loadHospitalDirectory({ forceRefresh: true })}
              disabled={isLoadingFacilities}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isLoadingFacilities
                  ? "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700"
              }`}
            >
              {isLoadingFacilities ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sync Hospitals
            </button>
          )}
        </div>
      </div>

      {facilityError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Unable to confirm hospital directory: {facilityError}
        </div>
      )}

      <datalist id={UNIT_DATALIST_ID}>
        {unitOptions.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Critical Alerts</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{aggregates.criticalAlerts} meds</p>
              <p className="text-xs text-slate-500">Need immediate reorder</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Average Stock Gap</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{aggregates.avgStockGapPct}%</p>
              <p className="text-xs text-slate-500">Below reorder threshold</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Monthly Spend</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(aggregates.projectedMonthlySpend)}
              </p>
              <p className="text-xs text-slate-500">Projected replenishment</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2" title="Low Stock Watchlist">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>{lowStockAlerts.length} records</span>
            {data?.lastSyncedAt && <span>Synced {new Date(data.lastSyncedAt).toLocaleString()}</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Medication</th>
                  <th className="px-4 py-3 font-medium">Hospital</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Reorder</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {lowStockAlerts.map((row) => (
                  <tr key={`${row.id}-${row.hospital}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.class}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.hospital}</td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                      {row.qty} {row.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">{row.reorderLevel}</td>
                    <td className="px-4 py-3">
                      <Badge color={row.severity === "critical" ? "red" : row.severity === "warning" ? "orange" : "blue"}>
                        {row.severity === "critical" ? "Critical" : row.severity === "warning" ? "Low" : "Observe"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!lowStockAlerts.length && (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-400" colSpan={5}>
                      No medications flagged at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Avg Unit Price by Hospital">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hospital" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis tickFormatter={(value) => `${value} MAD`} />
                <RechartsTooltip formatter={(value) => `${value} MAD`} />
                <Bar dataKey="avgUnitPrice" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Pricing Summary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Medication</th>
                  <th className="px-4 py-3 font-medium">Hospital</th>
                  <th className="px-4 py-3 font-medium text-right">Avg</th>
                  <th className="px-4 py-3 font-medium text-right">Range</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {pricingSummary.map((row) => (
                  <tr key={`${row.hospital}-${row.medication}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.medication}</td>
                    <td className="px-4 py-3 text-slate-500">{row.hospital}</td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{row.avg.toFixed(2)} MAD</td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {row.min.toFixed(2)} - {row.max.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(row.updatedAt).toLocaleString(undefined, { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
                {!pricingSummary.length && (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-400" colSpan={5}>
                      No pricing data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Replenishment Trend">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={replenishmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#0d9488" />
                <YAxis yAxisId="right" orientation="right" stroke="#6366f1" tickFormatter={(value) => `${value / 1000}k`} />
                <RechartsTooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="qty" stroke="#0d9488" strokeWidth={3} dot={false} name="Units" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={false}
                  name="Cost (MAD)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Modal isOpen={isMedicationModalOpen} onClose={() => setMedicationModalOpen(false)} title="Register Medication">
        <form className="space-y-4" onSubmit={handleMedicationSubmit}>
          {medicationStatus && (
            <div
              className={`rounded-lg border px-4 py-2 text-sm ${
                medicationStatus.type === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
            >
              {medicationStatus.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Medication ID *</label>
              <input
                type="text"
                value={medicationForm.id}
                onChange={handleMedicationFieldChange("id")}
                className={`mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 ${
                  medicationErrors.id ? "border-red-500" : "border-slate-200"
                }`}
                placeholder="e.g., MED-500"
              />
              {medicationErrors.id && <p className="text-xs text-red-500 mt-1">{medicationErrors.id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Therapeutic Class</label>
              <input
                type="text"
                value={medicationForm.class}
                onChange={handleMedicationFieldChange("class")}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-600"
                placeholder="e.g., Antibiotic"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Medication Name *</label>
            <input
              type="text"
              value={medicationForm.name}
              onChange={handleMedicationFieldChange("name")}
              maxLength={100}
              className={`mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 ${
                medicationErrors.name ? "border-red-500" : "border-slate-200"
              }`}
              placeholder="Full display name"
            />
            {medicationErrors.name && <p className="text-xs text-red-500 mt-1">{medicationErrors.name}</p>}
          </div>

          <div className="relative" ref={medicationHospitalDropdownRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Hospital *</label>
            <input
              type="text"
              value={medicationForm.hospital}
              onFocus={() => {
                ensureHospitalDirectory();
                setMedicationHospitalDropdownOpen(true);
              }}
              onChange={(event) => {
                updateMedicationField("hospital", event.target.value);
                if (!isMedicationHospitalDropdownOpen) {
                  setMedicationHospitalDropdownOpen(true);
                }
              }}
              className={`mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 ${
                medicationErrors.hospital ? "border-red-500" : "border-slate-200"
              }`}
              placeholder="Facility label"
            />
            {medicationErrors.hospital && <p className="text-xs text-red-500 mt-1">{medicationErrors.hospital}</p>}
            {isMedicationHospitalDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm shadow-xl dark:bg-slate-800 dark:border-slate-600">
                {medicationHospitalChoices.length ? (
                  medicationHospitalChoices.map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => handleMedicationHospitalSelect(option)}
                      className="flex w-full items-center px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50"
                    >
                      {option}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-500">No hospitals found.</div>
                )}
              </div>
            )}
            {!facilityHospitals.length && staffConnector && hasAttemptedFacilityLoad && !isLoadingFacilities && !facilityError && (
              <p className="text-xs text-slate-500 mt-1">Hospital directory is empty; type the facility name exactly as stored in MNHS.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Quantity *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={medicationForm.qty}
                onChange={handleMedicationFieldChange("qty")}
                className={`mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 ${
                  medicationErrors.qty ? "border-red-500" : "border-slate-200"
                }`}
              />
              {medicationErrors.qty && <p className="text-xs text-red-500 mt-1">{medicationErrors.qty}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Reorder Level *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={medicationForm.reorderLevel}
                onChange={handleMedicationFieldChange("reorderLevel")}
                className={`mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 ${
                  medicationErrors.reorderLevel ? "border-red-500" : "border-slate-200"
                }`}
              />
              {medicationErrors.reorderLevel && <p className="text-xs text-red-500 mt-1">{medicationErrors.reorderLevel}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Unit *</label>
            <input
              type="text"
              list={UNIT_DATALIST_ID}
              value={medicationForm.unit}
              onChange={handleMedicationFieldChange("unit")}
              className={`mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 ${
                medicationErrors.unit ? "border-red-500" : "border-slate-200"
              }`}
              placeholder="e.g., boxes"
            />
            {medicationErrors.unit && <p className="text-xs text-red-500 mt-1">{medicationErrors.unit}</p>}
          </div>

          

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setMedicationModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingMedication}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                isSubmittingMedication ? "bg-teal-400" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isSubmittingMedication && <Loader2 className="w-4 h-4 animate-spin" />} Save Medication
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isStockModalOpen} onClose={() => setStockModalOpen(false)} title="Log Stock Receipt">
        <form className="space-y-4" onSubmit={handleStockSubmit}>
          {stockStatus && (
            <div
              className={`rounded-lg border px-4 py-2 text-sm ${
                stockStatus.type === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
            >
              {stockStatus.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Use tracked record</label>
            <select
              value={stockForm.templateKey}
              onChange={handleStockTemplateChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
            >
              <option value="">-- optional quick-fill --</option>
              {stockTemplates.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.medicationName || template.medicationId} · {template.hospital}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Selecting a record pre-fills ID and hospital but fields remain editable.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={stockMedicationDropdownRef}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Medication ID *</label>
              <input
                type="text"
                value={stockForm.medicationId}
                onFocus={() => setStockMedicationDropdownOpen(true)}
                onChange={(event) => {
                  updateStockField("medicationId", event.target.value);
                  if (!isStockMedicationDropdownOpen) {
                    setStockMedicationDropdownOpen(true);
                  }
                }}
                className={`mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 ${
                  stockErrors.medicationId ? "border-red-500" : "border-slate-200"
                }`}
              />
              {stockErrors.medicationId && <p className="text-xs text-red-500 mt-1">{stockErrors.medicationId}</p>}
              {isStockMedicationDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm shadow-xl dark:bg-slate-800 dark:border-slate-600">
                  {stockMedicationChoices.length ? (
                    stockMedicationChoices.map((entry) => (
                      <button
                        type="button"
                        key={entry.id}
                        onClick={() => handleStockMedicationSelect(entry)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.id}</p>
                        <p className="text-xs text-slate-500">{entry.name}</p>
                        {entry.hospitals?.length ? (
                          <p className="text-[11px] text-slate-400">Hospitals: {entry.hospitals.join(", ")}</p>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-500">
                      No tracked medications available. Continue typing to use this ID.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Medication Name</label>
              <input
                type="text"
                value={stockForm.medicationName}
                onChange={handleStockFieldChange("medicationName")}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-600"
                placeholder="Optional override"
              />
            </div>
          </div>

          <div className="relative" ref={stockHospitalDropdownRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Hospital *</label>
            <input
              type="text"
              value={stockForm.hospital}
              onFocus={() => {
                ensureHospitalDirectory();
                setStockHospitalDropdownOpen(true);
              }}
              onChange={(event) => {
                updateStockField("hospital", event.target.value);
                if (!isStockHospitalDropdownOpen) {
                  setStockHospitalDropdownOpen(true);
                }
              }}
              className={`mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 ${
                stockErrors.hospital ? "border-red-500" : "border-slate-200"
              }`}
            />
            {stockErrors.hospital && <p className="text-xs text-red-500 mt-1">{stockErrors.hospital}</p>}
            {isStockHospitalDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm shadow-xl dark:bg-slate-800 dark:border-slate-600">
                {stockHospitalChoices.length ? (
                  stockHospitalChoices.map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => handleStockHospitalSelect(option)}
                      className="flex w-full items-center px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50"
                    >
                      {option}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-500">No hospitals found.</div>
                )}
              </div>
            )}
            {!facilityHospitals.length && staffConnector && hasAttemptedFacilityLoad && !isLoadingFacilities && !facilityError && (
              <p className="text-xs text-slate-500 mt-1">Hospital directory is empty; type the facility name exactly as stored in MNHS.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Quantity Received *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={stockForm.qtyReceived}
                onChange={handleStockFieldChange("qtyReceived")}
                className={`mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 ${
                  stockErrors.qtyReceived ? "border-red-500" : "border-slate-200"
                }`}
              />
              {stockErrors.qtyReceived && <p className="text-xs text-red-500 mt-1">{stockErrors.qtyReceived}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Unit Price (MAD) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={stockForm.unitPrice}
                onChange={handleStockFieldChange("unitPrice")}
                className={`mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 ${
                  stockErrors.unitPrice ? "border-red-500" : "border-slate-200"
                }`}
              />
              {stockErrors.unitPrice && <p className="text-xs text-red-500 mt-1">{stockErrors.unitPrice}</p>}
            </div>
          </div>

          

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setStockModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingStock}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                isSubmittingStock ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {isSubmittingStock && <Loader2 className="w-4 h-4 animate-spin" />} Save Stock Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MedicationsView;
