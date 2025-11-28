const initialSnapshot = {
  kpis: [
    {
      key: "totalMonthlyBillings",
      title: "Total Billings (30d)",
      value: 1280000,
      unit: "MAD",
      subtext: "417 clinical activities",
      trend: { direction: "up", value: 0.084 },
      iconKey: "CreditCard",
    },
    {
      key: "insuredCoverage",
      title: "Insured Coverage",
      value: 0.78,
      unit: "ratio",
      subtext: "Weighted by Expense.Total",
      trend: { direction: "up", value: 0.032 },
      iconKey: "ShieldCheck",
    },
    {
      key: "avgExpense",
      title: "Average Expense",
      value: 3050,
      unit: "MAD",
      subtext: "Per billed activity",
      trend: { direction: "down", value: 0.012 },
      iconKey: "Clock3",
    },
    {
      key: "activeHospitals",
      title: "Active Hospitals",
      value: 9,
      unit: "count",
      subtext: "With billable activity",
      trend: { direction: "up", value: 0.05 },
      iconKey: "AlertTriangle",
    },
  ],
  insuranceSplit: [
    { insId: 1, type: "CNOPS", amount: 520000, activities: 138, share: 41 },
    { insId: 2, type: "CNSS", amount: 410000, activities: 112, share: 32 },
    { insId: 3, type: "RAMED", amount: 165000, activities: 74, share: 13 },
    { insId: 4, type: "Private", amount: 135000, activities: 41, share: 11 },
    { insId: null, type: "Self-Pay", amount: 50000, activities: 32, share: 3 },
  ],
  hospitalRollup: [
    { hid: 1, name: "Casablanca Central", region: "Casablanca-Settat", total: 260000, activities: 84, insuredShare: 0.81, avgExpense: 3095 },
    { hid: 2, name: "Rabat University Hospital", region: "Rabat-Salé-Kénitra", total: 215000, activities: 72, insuredShare: 0.79, avgExpense: 2986 },
    { hid: 3, name: "Tangier Regional", region: "Tanger-Tétouan-Al Hoceïma", total: 142000, activities: 46, insuredShare: 0.64, avgExpense: 3087 },
    { hid: 4, name: "Fez Specialist Center", region: "Fès-Meknès", total: 118000, activities: 39, insuredShare: 0.73, avgExpense: 3025 },
    { hid: 5, name: "Oujda Teaching Hospital", region: "Oriental", total: 87000, activities: 28, insuredShare: 0.52, avgExpense: 3107 },
  ],
  departmentSummary: [
    { depId: 11, hospital: "Casablanca Central", department: "Cardiology", specialty: "Cardiology", total: 76000, activities: 22, avgExpense: 3450 },
    { depId: 14, hospital: "Casablanca Central", department: "Oncology", specialty: "Oncology", total: 54000, activities: 14, avgExpense: 3850 },
    { depId: 21, hospital: "Rabat University Hospital", department: "Neurology", specialty: "Neurology", total: 51000, activities: 17, avgExpense: 3000 },
    { depId: 27, hospital: "Tangier Regional", department: "Emergency", specialty: "Emergency", total: 42000, activities: 25, avgExpense: 1680 },
    { depId: 31, hospital: "Fez Specialist Center", department: "Orthopedics", specialty: "Orthopedics", total: 39500, activities: 13, avgExpense: 3038 },
  ],
  recentExpenses: [
    {
      expId: 1048,
      caid: 8123,
      activityDate: "2025-11-12T09:45:00Z",
      hospital: { hid: 4, name: "Rabat University Hospital" },
      department: { depId: 21, name: "Cardiology" },
      patient: { iid: 5401, fullName: "Amina Haddad" },
      staff: { staffId: 221, fullName: "Dr. Selma Idrissi" },
      insurance: { insId: 2, type: "CNSS" },
      total: 2450,
      prescription: {
        pid: 9901,
        medications: [
          { mid: 120, name: "Atorvastatin 40mg", dosage: "1 tablet", duration: "30 days", therapeuticClass: "Statin" },
          { mid: 218, name: "Metoprolol 50mg", dosage: "1 tablet", duration: "30 days", therapeuticClass: "Beta blocker" },
        ],
      },
    },
    {
      expId: 1047,
      caid: 8121,
      activityDate: "2025-11-10T14:30:00Z",
      hospital: { hid: 1, name: "Casablanca Central" },
      department: { depId: 14, name: "Oncology" },
      patient: { iid: 5402, fullName: "Nabil Faridi" },
      staff: { staffId: 189, fullName: "Dr. Amine Rahmouni" },
      insurance: { insId: 1, type: "CNOPS" },
      total: 3120,
      prescription: {
        pid: 9900,
        medications: [{ mid: 301, name: "Chemotherapy pack", dosage: "Cycle", duration: "1 session", therapeuticClass: "Chemotherapy" }],
      },
    },
    {
      expId: 1046,
      caid: 8045,
      activityDate: "2025-11-08T08:05:00Z",
      hospital: { hid: 3, name: "Tangier Regional" },
      department: { depId: 27, name: "Emergency" },
      patient: { iid: 5210, fullName: "Salma Outmane" },
      staff: { staffId: 205, fullName: "Dr. Fadoua Kabbaj" },
      insurance: { insId: 4, type: "Private" },
      total: 5780,
      prescription: null,
    },
  ],
  medicationUtilization: [
    { mid: 120, name: "Atorvastatin 40mg", therapeuticClass: "Statin", prescriptions: 48, share: 0.16 },
    { mid: 218, name: "Metoprolol 50mg", therapeuticClass: "Beta blocker", prescriptions: 42, share: 0.14 },
    { mid: 301, name: "Chemotherapy pack", therapeuticClass: "Chemotherapy", prescriptions: 28, share: 0.09 },
    { mid: 402, name: "Insulin Lispro", therapeuticClass: "Endocrinology", prescriptions: 24, share: 0.08 },
    { mid: 512, name: "Omeprazole 20mg", therapeuticClass: "Gastroenterology", prescriptions: 20, share: 0.07 },
  ],
  metadata: {
    filters: { hospitalId: null, departmentId: null, insuranceId: null, daysBack: 30 },
    lastSyncedAt: new Date().toISOString(),
  },
};

const registerBillingMockServer = (backendConnector) => {
  if (!backendConnector) return;

  let snapshot = JSON.parse(JSON.stringify(initialSnapshot));

  backendConnector.registerResource(
    "billing",
    async () => ({
      ...snapshot,
      metadata: {
        ...snapshot.metadata,
        lastSyncedAt: new Date().toISOString(),
      },
    }),
    { method: "GET" },
  );

  backendConnector.registerResource(
    "billing/expense",
    async (_params, body = {}) => {
      const requiredFields = ["caid", "total"];
      const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null);
      if (missing.length) {
        throw new Error(`Missing fields: ${missing.join(", ")}`);
      }

      const expenseId = body.expId || `EXP-${Math.floor(Math.random() * 9000) + 1000}`;
      const createdExpense = {
        expId: expenseId,
        caid: body.caid,
        activityDate: body.activityDate || new Date().toISOString(),
        hospital: body.hospital || { hid: 99, name: "Unknown Hospital" },
        department: body.department || { depId: 1, name: "General" },
        patient: body.patient || { iid: 0, fullName: "Unknown Patient" },
        staff: body.staff || { staffId: 0, fullName: "Unknown Staff" },
        insurance: body.insId !== undefined ? { insId: body.insId, type: body.insuranceType || "Insured" } : { insId: null, type: "Self-Pay" },
        total: Number(body.total) || 0,
        prescription: null,
      };

      snapshot = {
        ...snapshot,
        recentExpenses: [createdExpense, ...snapshot.recentExpenses].slice(0, 25),
      };

      return {
        expense: createdExpense,
        message: "Expense captured via billing mock endpoint",
      };
    },
    { method: "POST" },
  );
};

export { registerBillingMockServer };
