const OVERVIEW_MODEL_CONTRACT = {
  requiredKeys: [
    "staff",
    "appointments",
    "summary",
    "lowStockMedications",
  ],
  validators: {
    staff: Array.isArray,
    appointments: Array.isArray,
    summary: (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value),
    staffLeaderboard: (value) => value === undefined || Array.isArray(value),
    lowStockMedications: Array.isArray,
  },
};

const buildOverviewSummary = (payload) => {
  if (payload.summary && typeof payload.summary === "object" && !Array.isArray(payload.summary)) {
    return payload.summary;
  }

  const patients = payload.patients || [];
  const staff = payload.staff || [];
  const appointments = payload.appointments || [];

  const now = new Date();
  const upcomingAppointments = appointments.filter((apt) => new Date(apt.date) >= now).length;

  return {
    totalAppointments: appointments.length,
    upcomingAppointments,
    activeStaff: staff.filter((member) => member.status === "Active").length,
    admittedPatients: patients.filter((patient) => patient.status === "Admitted").length,
  };
};

const buildOverviewModel = (payload) => {
  const staff = payload.staff || [];
  const staffLeaderboard = Array.isArray(payload.staffLeaderboard)
    ? payload.staffLeaderboard
    : [...staff].sort((a, b) => (b.workload ?? 0) - (a.workload ?? 0)).slice(0, 5);
  const lowStockMedications = Array.isArray(payload.lowStockMedications) ? payload.lowStockMedications : [];

  return {
    ...payload,
    summary: buildOverviewSummary(payload),
    staffLeaderboard,
    lowStockMedications,
  };
};

const PATIENTS_MODEL_CONTRACT = {
  requiredKeys: ["patients"],
  validators: {
    patients: Array.isArray,
    lastSyncedAt: (value) => value === undefined || value === null || typeof value === "string",
  },
};

const normalizePatientRecord = (patient, index) => ({
  iid: patient.iid ?? `P-${1000 + index}`,
  cin: patient.cin ?? "UNKNOWN",
  name: patient.name ?? "Unknown Patient",
  sex: patient.sex === "F" ? "F" : "M",
  birthDate: patient.birthDate || patient.birth || "Unknown",
  bloodGroup: patient.bloodGroup || null,
  phone: patient.phone || null,
  email: patient.email || null,
  city: patient.city || "N/A",
  insurance: patient.insurance || "None",
  status: patient.status || "Outpatient",
});

const buildPatientsModel = (payload = {}) => {
  const list = Array.isArray(payload.patients) ? payload.patients : [];
  return {
    patients: list.map(normalizePatientRecord),
    lastSyncedAt: payload.lastSyncedAt || null,
  };
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const STAFF_MODEL_CONTRACT = {
  requiredKeys: ["staff"],
  validators: {
    staff: Array.isArray,
    lastSyncedAt: (value) => value === undefined || value === null || typeof value === "string",
  },
};

const normalizeStaffRecord = (staff, index) => ({
  id: staff.id ?? `S-${200 + index}`,
  name: staff.name ?? "Unknown Staff",
  role: staff.role ?? "General",
  departments: Array.isArray(staff.departments) ? staff.departments : [],
  hospitals: Array.isArray(staff.hospitals) ? staff.hospitals : [],
  status: staff.status || "Active",
});

const buildStaffModel = (payload = {}) => {
  const staff = Array.isArray(payload.staff) ? payload.staff : [];
  return {
    staff: staff.map(normalizeStaffRecord),
    lastSyncedAt: payload.lastSyncedAt || null,
  };
};

const MEDICATIONS_MODEL_CONTRACT = {
  requiredKeys: ["lowStock", "pricingSummary", "priceSeries", "replenishmentTrend", "aggregates"],
  validators: {
    lowStock: Array.isArray,
    pricingSummary: Array.isArray,
    priceSeries: Array.isArray,
    replenishmentTrend: Array.isArray,
    aggregates: (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value),
  },
};

const normalizeLowStockRecord = (record, index) => ({
  id: record.id ?? `MED-${index}`,
  name: record.name ?? "Unknown Medication",
  hospital: record.hospital ?? "N/A",
  qty: typeof record.qty === "number" ? record.qty : 0,
  reorderLevel: typeof record.reorderLevel === "number" ? record.reorderLevel : 0,
  unit: record.unit || "units",
  class: record.class || "General",
});

const normalizePricingSummary = (record, index) => ({
  hospital: record.hospital ?? "N/A",
  medication: record.medication ?? `Medication ${index}`,
  avg: typeof record.avg === "number" ? record.avg : 0,
  min: typeof record.min === "number" ? record.min : 0,
  max: typeof record.max === "number" ? record.max : 0,
  updatedAt: record.updatedAt || new Date().toISOString(),
});

const normalizePriceSeries = (record, index) => ({
  hospital: record.hospital ?? `Hospital ${index + 1}`,
  avgUnitPrice: typeof record.avgUnitPrice === "number" ? record.avgUnitPrice : 0,
});

const normalizeReplenishmentPoint = (record, index) => ({
  month: record.month ?? `M${index + 1}`,
  qty: typeof record.qty === "number" ? record.qty : 0,
  cost: typeof record.cost === "number" ? record.cost : 0,
});

const computeMedAggregates = (lowStock, overrides = {}) => {
  const criticalAlerts = typeof overrides.criticalAlerts === "number"
    ? overrides.criticalAlerts
    : lowStock.filter((row) => row.qty <= row.reorderLevel / 2).length;

  const avgStockGapPct =
    typeof overrides.avgStockGapPct === "number"
      ? overrides.avgStockGapPct
      : lowStock.length
      ? Math.round(
          (lowStock.reduce((acc, row) => acc + (row.reorderLevel ? Math.max(0, 1 - row.qty / row.reorderLevel) : 0), 0) /
            lowStock.length) *
            100,
        )
      : 0;

  const projectedMonthlySpend = typeof overrides.projectedMonthlySpend === "number" ? overrides.projectedMonthlySpend : 0;

  return { criticalAlerts, avgStockGapPct, projectedMonthlySpend };
};

const buildMedicationsModel = (payload = {}) => {
  const lowStock = ensureArray(payload.lowStock).map(normalizeLowStockRecord);
  const pricingSummary = ensureArray(payload.pricingSummary).map(normalizePricingSummary);
  const priceSeries = ensureArray(payload.priceSeries).map(normalizePriceSeries);
  const replenishmentTrend = ensureArray(payload.replenishmentTrend).map(normalizeReplenishmentPoint);
  const aggregates = computeMedAggregates(lowStock, payload.aggregates || {});

  return {
    lowStock,
    pricingSummary,
    priceSeries,
    replenishmentTrend,
    aggregates,
    lastSyncedAt: payload.lastSyncedAt || null,
  };
};

const BILLING_MODEL_CONTRACT = {
  requiredKeys: ["kpis", "insuranceSplit", "reimbursementTimeline", "outstandingClaims", "recentExpenses"],
  validators: {
    kpis: Array.isArray,
    insuranceSplit: Array.isArray,
    reimbursementTimeline: Array.isArray,
    outstandingClaims: Array.isArray,
    recentExpenses: Array.isArray,
    lastSyncedAt: (value) => value === undefined || value === null || typeof value === "string",
  },
};

const normalizeBillingKpi = (entry, index) => ({
  title: entry.title || `Metric ${index + 1}`,
  value: entry.value || "—",
  subtext: entry.subtext || "",
  trend: entry.trend === "down" ? "down" : entry.trend === "up" ? "up" : null,
  trendValue: entry.trendValue || null,
  iconKey: entry.iconKey || entry.icon || "CreditCard",
});

const normalizeInsuranceSlice = (entry, index) => ({
  type: entry.type || `Bucket ${index + 1}`,
  amount: typeof entry.amount === "number" ? entry.amount : 0,
  claims: typeof entry.claims === "number" ? entry.claims : 0,
});

const normalizeTimelinePoint = (entry, index) => ({
  month: entry.month || `M${index + 1}`,
  reimbursed: typeof entry.reimbursed === "number" ? entry.reimbursed : 0,
  pending: typeof entry.pending === "number" ? entry.pending : 0,
});

const normalizeClaimRecord = (entry, index) => ({
  id: entry.id || `CLAIM-${index}`,
  insurer: entry.insurer || "Unknown",
  hospital: entry.hospital || "Unknown Hospital",
  amount: typeof entry.amount === "number" ? entry.amount : 0,
  daysOutstanding: typeof entry.daysOutstanding === "number" ? entry.daysOutstanding : 0,
  priority: entry.priority || "Medium",
});

const normalizeExpenseRecord = (entry, index) => ({
  id: entry.id || `EXP-${index}`,
  date: entry.date || new Date().toISOString(),
  hospital: entry.hospital || "Unknown Hospital",
  patient: entry.patient || `Patient ${index}`,
  insurance: entry.insurance || "None",
  total: typeof entry.total === "number" ? entry.total : 0,
  status: entry.status || "Awaiting Reimbursement",
  staff: entry.staff || "Unknown Staff",
  department: entry.department || "General",
  medications: ensureArray(entry.medications).map((med, medIndex) => ({
    name: med.name || `Medication ${medIndex + 1}`,
    qty: typeof med.qty === "number" ? med.qty : 0,
    unitPrice: typeof med.unitPrice === "number" ? med.unitPrice : 0,
  })),
  notes: entry.notes || "",
});

const buildBillingModel = (payload = {}) => {
  const kpis = ensureArray(payload.kpis).map(normalizeBillingKpi);
  const insuranceSplit = ensureArray(payload.insuranceSplit).map(normalizeInsuranceSlice);
  const reimbursementTimeline = ensureArray(payload.reimbursementTimeline).map(normalizeTimelinePoint);
  const outstandingClaims = ensureArray(payload.outstandingClaims).map(normalizeClaimRecord);
  const recentExpenses = ensureArray(payload.recentExpenses).map(normalizeExpenseRecord);

  return {
    kpis,
    insuranceSplit,
    reimbursementTimeline,
    outstandingClaims,
    recentExpenses,
    lastSyncedAt: payload.lastSyncedAt || null,
  };
};

const APPOINTMENTS_MODEL_CONTRACT = {
  requiredKeys: ["appointments"],
  validators: {
    appointments: Array.isArray,
    lastSyncedAt: (value) => value === undefined || value === null || typeof value === "string",
  },
};

const normalizeAppointmentRecord = (appointment, index) => ({
  id: appointment.id ?? `APT-${5000 + index}`,
  date: appointment.date ?? new Date().toISOString().split("T")[0],
  time: appointment.time ?? "09:00",
  hospital: appointment.hospital ?? "Unknown Hospital",
  department: appointment.department ?? "General",
  patient: appointment.patient || appointment.patientName || `Patient ${index}`,
  staff: appointment.staff || appointment.doctor || `Dr. Staff ${index}`,
  reason: appointment.reason || "Consultation",
  status: appointment.status || "Scheduled",
});

const buildAppointmentsModel = (payload = {}) => {
  const appointments = Array.isArray(payload.appointments) ? payload.appointments : [];
  return {
    appointments: appointments.map(normalizeAppointmentRecord),
    lastSyncedAt: payload.lastSyncedAt || null,
  };
};

const registerCoreModels = (modelConnector) => {
  modelConnector.registerModel("Overview", {
    resource: "core-dashboard",
    contract: OVERVIEW_MODEL_CONTRACT,
    transform: buildOverviewModel,
  });

  modelConnector.registerModel("Patients", {
    resource: "patients",
    contract: PATIENTS_MODEL_CONTRACT,
    transform: buildPatientsModel,
  });

  modelConnector.registerModel("Appointments", {
    resource: "appointments",
    contract: APPOINTMENTS_MODEL_CONTRACT,
    transform: buildAppointmentsModel,
  });

  modelConnector.registerModel("Staff", {
    resource: "staff",
    contract: STAFF_MODEL_CONTRACT,
    transform: buildStaffModel,
  });

  modelConnector.registerModel("Medications", {
    resource: "medications",
    contract: MEDICATIONS_MODEL_CONTRACT,
    transform: buildMedicationsModel,
  });

  modelConnector.registerModel("Billing", {
    resource: "billing",
    contract: BILLING_MODEL_CONTRACT,
    transform: buildBillingModel,
  });
};

export {
  OVERVIEW_MODEL_CONTRACT,
  PATIENTS_MODEL_CONTRACT,
  APPOINTMENTS_MODEL_CONTRACT,
  STAFF_MODEL_CONTRACT,
  MEDICATIONS_MODEL_CONTRACT,
  BILLING_MODEL_CONTRACT,
  registerCoreModels,
};
