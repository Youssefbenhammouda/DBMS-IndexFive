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

const normalizePatientNextVisit = (visit) => {
  if (!visit || typeof visit !== "object") return null;
  return {
    date: typeof visit.date === "string" ? visit.date : null,
    time: typeof visit.time === "string" ? visit.time : null,
    hospital: visit.hospital || "To be assigned",
    department: visit.department || null,
    reason: visit.reason || null,
  };
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
  insuranceStatus: patient.insuranceStatus || (patient.insurance === "None" ? "Self-Pay" : "Active"),
  policyNumber: patient.policyNumber || null,
  nextVisit: normalizePatientNextVisit(patient.nextVisit),
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
  requiredKeys: [
    "kpis",
    "insuranceSplit",
    "hospitalRollup",
    "departmentSummary",
    "recentExpenses",
    "medicationUtilization",
    "metadata",
  ],
  validators: {
    kpis: Array.isArray,
    insuranceSplit: Array.isArray,
    hospitalRollup: Array.isArray,
    departmentSummary: Array.isArray,
    recentExpenses: Array.isArray,
    medicationUtilization: Array.isArray,
    metadata: (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value),
  },
};

const normalizeTrend = (trend) => {
  if (!trend || typeof trend !== "object") return null;
  const direction = trend.direction === "down" ? "down" : trend.direction === "up" ? "up" : null;
  const value = typeof trend.value === "number" ? trend.value : Number(trend.value);
  if (!direction && (value === undefined || Number.isNaN(value))) {
    return null;
  }
  return {
    direction,
    value: Number.isNaN(value) ? null : value,
  };
};

const normalizeBillingKpi = (entry, index) => ({
  key: entry.key || `kpi-${index}`,
  title: entry.title || `Metric ${index + 1}`,
  value: typeof entry.value === "number" ? entry.value : Number(entry.value) || 0,
  unit: entry.unit || "MAD",
  iconKey: entry.iconKey || entry.icon || "CreditCard",
  subtext: entry.subtext || null,
  trend: normalizeTrend(entry.trend),
});

const normalizeInsuranceSlice = (entry, index) => ({
  insId: entry.insId ?? null,
  type: entry.type || `Bucket ${index + 1}`,
  amount: typeof entry.amount === "number" ? entry.amount : 0,
  activities: typeof entry.activities === "number" ? entry.activities : entry.claims || 0,
  share: typeof entry.share === "number" ? entry.share : null,
});

const normalizeHospitalRollup = (entry, index) => ({
  hid: entry.hid ?? index,
  name: entry.name || `Hospital ${index + 1}`,
  region: entry.region || "Unknown Region",
  total: typeof entry.total === "number" ? entry.total : 0,
  activities: typeof entry.activities === "number" ? entry.activities : 0,
  insuredShare: typeof entry.insuredShare === "number" ? entry.insuredShare : null,
  avgExpense: typeof entry.avgExpense === "number" ? entry.avgExpense : null,
});

const normalizeDepartmentSummary = (entry, index) => ({
  depId: entry.depId ?? index,
  hospital: entry.hospital || "Unknown Hospital",
  department: entry.department || `Department ${index + 1}`,
  specialty: entry.specialty || "General",
  total: typeof entry.total === "number" ? entry.total : 0,
  activities: typeof entry.activities === "number" ? entry.activities : 0,
  avgExpense: typeof entry.avgExpense === "number" ? entry.avgExpense : null,
});

const normalizeExpenseRecord = (entry, index) => {
  const normalizeOrgBlock = (block, fallbackLabel, idKey) => {
    if (block && typeof block === "object" && !Array.isArray(block)) {
      return {
        [idKey]: block[idKey] ?? block.id ?? null,
        name: block.name || fallbackLabel,
        region: block.region || block.location || block.regionName || null,
      };
    }
    return { [idKey]: null, name: block || fallbackLabel, region: null };
  };

  const normalizePerson = (person, fallbackLabel, idKey) => {
    if (person && typeof person === "object" && !Array.isArray(person)) {
      return {
        [idKey]: person[idKey] ?? person.id ?? null,
        fullName: person.fullName || person.name || fallbackLabel,
      };
    }
    return { [idKey]: null, fullName: person || fallbackLabel };
  };

  const normalizeInsurance = (insurance) => {
    if (insurance && typeof insurance === "object" && !Array.isArray(insurance)) {
      return {
        insId: insurance.insId ?? insurance.id ?? null,
        type: insurance.type || insurance.name || "Self-Pay",
      };
    }
    return {
      insId: null,
      type: insurance || "Self-Pay",
    };
  };

  const normalizePrescription = (prescription) => {
    if (!prescription || typeof prescription !== "object" || Array.isArray(prescription)) {
      return null;
    }
    return {
      pid: prescription.pid ?? prescription.id ?? null,
      medications: ensureArray(prescription.medications).map((med, medIndex) => ({
        mid: med.mid ?? med.id ?? medIndex,
        name: med.name || `Medication ${medIndex + 1}`,
        dosage: med.dosage || null,
        duration: med.duration || null,
        therapeuticClass: med.therapeuticClass || med.class || null,
      })),
    };
  };

  return {
    expId: entry.expId ?? entry.id ?? `EXP-${index}`,
    caid: entry.caid ?? null,
    activityDate: entry.activityDate || entry.date || new Date().toISOString(),
    hospital: normalizeOrgBlock(entry.hospital, "Unknown Hospital", "hid"),
    department: normalizeOrgBlock(entry.department, "General", "depId"),
    patient: normalizePerson(entry.patient, `Patient ${index + 1}`, "iid"),
    staff: normalizePerson(entry.staff, "Unknown Staff", "staffId"),
    insurance: normalizeInsurance(entry.insurance),
    total: typeof entry.total === "number" ? entry.total : 0,
    prescription: normalizePrescription(entry.prescription),
  };
};

const normalizeMedicationUtilization = (entry, index) => ({
  mid: entry.mid ?? entry.id ?? index,
  name: entry.name || `Medication ${index + 1}`,
  therapeuticClass: entry.therapeuticClass || entry.class || "General",
  prescriptions: typeof entry.prescriptions === "number" ? entry.prescriptions : 0,
  share: typeof entry.share === "number" ? entry.share : null,
});

const normalizeMetadata = (metadata = {}) => {
  const filters = metadata.filters && typeof metadata.filters === "object" && !Array.isArray(metadata.filters)
    ? metadata.filters
    : {};
  let lastSyncedAt = metadata.lastSyncedAt || null;
  if (lastSyncedAt instanceof Date) {
    lastSyncedAt = lastSyncedAt.toISOString();
  }
  if (lastSyncedAt && typeof lastSyncedAt !== "string") {
    lastSyncedAt = null;
  }
  return { filters, lastSyncedAt };
};

const buildBillingModel = (payload = {}) => {
  const kpis = ensureArray(payload.kpis).map(normalizeBillingKpi);
  const insuranceSplit = ensureArray(payload.insuranceSplit).map(normalizeInsuranceSlice);
  const hospitalRollup = ensureArray(payload.hospitalRollup).map(normalizeHospitalRollup);
  const departmentSummary = ensureArray(payload.departmentSummary).map(normalizeDepartmentSummary);
  const recentExpenses = ensureArray(payload.recentExpenses).map(normalizeExpenseRecord);
  const medicationUtilization = ensureArray(payload.medicationUtilization).map(normalizeMedicationUtilization);
  const metadata = normalizeMetadata(payload.metadata || {});

  return {
    kpis,
    insuranceSplit,
    hospitalRollup,
    departmentSummary,
    recentExpenses,
    medicationUtilization,
    metadata,
  };
};

const APPOINTMENTS_MODEL_CONTRACT = {
  requiredKeys: ["appointments"],
  validators: {
    appointments: Array.isArray,
    lastSyncedAt: (value) => value === undefined || value === null || typeof value === "string",
  },
};

const resolveAppointmentCaid = (appointment, index) => {
  const parseNumeric = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    const direct = Number(trimmed);
    if (!Number.isNaN(direct)) return direct;
    const digitsMatch = trimmed.match(/(\d+)/);
    return digitsMatch ? Number(digitsMatch[0]) : null;
  };

  const candidates = [
    appointment?.caid,
    appointment?.caId,
    appointment?.activityId,
    appointment?.activity?.caid,
    appointment?.activity?.id,
    appointment?.activity?.activityId,
    appointment?.id,
  ];

  for (const candidate of candidates) {
    const numeric = parseNumeric(candidate);
    if (numeric !== null) {
      return numeric;
    }
  }

  return 5000 + index;
};

const normalizeAppointmentRecord = (appointment, index) => {
  const resolvedCaid = resolveAppointmentCaid(appointment, index);

  return {
    id: appointment.id ?? `APT-${5000 + index}`,
    caid: resolvedCaid,
    date: appointment.date ?? new Date().toISOString().split("T")[0],
    time: appointment.time ?? "09:00",
    hospital: appointment.hospital ?? "Unknown Hospital",
    department: appointment.department ?? "General",
    patient: appointment.patient || appointment.patientName || `Patient ${index}`,
    staff: appointment.staff || appointment.doctor || `Dr. Staff ${index}`,
    reason: appointment.reason || "Consultation",
    status: appointment.status || "Scheduled",
  };
};

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
