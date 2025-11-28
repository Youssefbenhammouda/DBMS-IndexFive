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

const registerCoreModels = (modelConnector) => {
  modelConnector.registerModel("Overview", {
    resource: "core-dashboard",
    contract: OVERVIEW_MODEL_CONTRACT,
    transform: buildOverviewModel,
  });
};

export { OVERVIEW_MODEL_CONTRACT, registerCoreModels };
