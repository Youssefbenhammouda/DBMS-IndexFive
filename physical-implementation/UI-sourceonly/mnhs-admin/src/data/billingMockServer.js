const initialSnapshot = {
  kpis: [
    {
      title: "Monthly Billings",
      value: "1.28M MAD",
      subtext: "417 clinical activities",
      trend: "up",
      trendValue: "+8.4% vs last month",
      iconKey: "CreditCard",
    },
    {
      title: "Insured Coverage",
      value: "78%",
      subtext: "Weighted by Expense.Total",
      trend: "up",
      trendValue: "+3.2 pts MoM",
      iconKey: "ShieldCheck",
    },
    {
      title: "Avg. Reimbursement Time",
      value: "9.4 days",
      subtext: "Target < 12 days",
      trend: "down",
      trendValue: "-1.1 days vs Oct",
      iconKey: "Clock3",
    },
    {
      title: "Outstanding Balance",
      value: "312K MAD",
      subtext: "58 claims awaiting payment",
      trend: "up",
      trendValue: "+6.5% backlog",
      iconKey: "AlertTriangle",
    },
  ],
  insuranceSplit: [
    { type: "CNOPS", amount: 520000, claims: 138 },
    { type: "CNSS", amount: 410000, claims: 112 },
    { type: "RAMED", amount: 165000, claims: 74 },
    { type: "Private", amount: 135000, claims: 41 },
    { type: "None", amount: 50000, claims: 32 },
  ],
  reimbursementTimeline: [
    { month: "Jun", reimbursed: 640000, pending: 140000 },
    { month: "Jul", reimbursed: 710000, pending: 155000 },
    { month: "Aug", reimbursed: 780000, pending: 162000 },
    { month: "Sep", reimbursed: 820000, pending: 150000 },
    { month: "Oct", reimbursed: 860000, pending: 145000 },
    { month: "Nov", reimbursed: 910000, pending: 120000 },
  ],
  outstandingClaims: [
    { id: "CLAIM-901", insurer: "RAMED", hospital: "Casablanca Central", amount: 94000, daysOutstanding: 18, priority: "High" },
    { id: "CLAIM-902", insurer: "CNSS", hospital: "Rabat University Hospital", amount: 64000, daysOutstanding: 23, priority: "Medium" },
    { id: "CLAIM-903", insurer: "Private", hospital: "Tangier Regional", amount: 48000, daysOutstanding: 31, priority: "Medium" },
    { id: "CLAIM-904", insurer: "CNOPS", hospital: "Fez Specialist Center", amount: 42000, daysOutstanding: 9, priority: "Low" },
  ],
  recentExpenses: [
    {
      id: "EXP-1048",
      date: "2025-11-12",
      hospital: "Rabat University Hospital",
      patient: "Amina Haddad",
      insurance: "CNSS",
      total: 2450,
      status: "Awaiting Reimbursement",
      staff: "Dr. Selma Idrissi",
      department: "Cardiology",
      medications: [
        { name: "Atorvastatin 40mg", qty: 30, unitPrice: 45 },
        { name: "Metoprolol 50mg", qty: 30, unitPrice: 32 },
      ],
      notes: "Awaiting CNSS batch cut-off on Nov 30",
    },
    {
      id: "EXP-1047",
      date: "2025-11-10",
      hospital: "Casablanca Central Hospital",
      patient: "Nabil Faridi",
      insurance: "CNOPS",
      total: 3120,
      status: "Reimbursed",
      staff: "Dr. Amine Rahmouni",
      department: "Orthopedics",
      medications: [
        { name: "Ibuprofen 600mg", qty: 45, unitPrice: 6 },
        { name: "Physio sessions", qty: 6, unitPrice: 180 },
      ],
      notes: "Settled Nov 15 via CNOPS wire",
    },
    {
      id: "EXP-1046",
      date: "2025-11-08",
      hospital: "Tangier Regional",
      patient: "Salma Outmane",
      insurance: "Private",
      total: 5780,
      status: "Flagged",
      staff: "Dr. Fadoua Kabbaj",
      department: "Oncology",
      medications: [
        { name: "Chemotherapy pack", qty: 1, unitPrice: 4200 },
        { name: "Support meds", qty: 1, unitPrice: 1580 },
      ],
      notes: "Insurer requested pathology report attachment",
    },
    {
      id: "EXP-1045",
      date: "2025-11-07",
      hospital: "Fez Specialist Center",
      patient: "Reda Menara",
      insurance: "RAMED",
      total: 1880,
      status: "Awaiting Reimbursement",
      staff: "Dr. Mouna Ait Lhaj",
      department: "Emergency",
      medications: [
        { name: "Trauma imaging", qty: 1, unitPrice: 1100 },
        { name: "Analgesics", qty: 1, unitPrice: 780 },
      ],
      notes: "Consolidated into RAMED batch #458",
    },
    {
      id: "EXP-1044",
      date: "2025-11-04",
      hospital: "Oujda Teaching Hospital",
      patient: "Karim El Idrissi",
      insurance: "None",
      total: 920,
      status: "Self-Paid",
      staff: "Dr. Sanae Azzouzi",
      department: "General Medicine",
      medications: [
        { name: "Consultation", qty: 1, unitPrice: 350 },
        { name: "Laboratory tests", qty: 1, unitPrice: 570 },
      ],
      notes: "Paid in cash on discharge",
    },
  ],
};

const registerBillingMockServer = (backendConnector) => {
  if (!backendConnector) return;

  let snapshot = JSON.parse(JSON.stringify(initialSnapshot));

  backendConnector.registerResource(
    "billing",
    async () => ({
      ...snapshot,
      lastSyncedAt: new Date().toISOString(),
    }),
    { method: "GET" },
  );

  backendConnector.registerResource(
    "billing/expense",
    async (_params, body = {}) => {
      const requiredFields = ["patient", "hospital", "insurance", "total", "department", "staff"];
      const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === "");
      if (missing.length) {
        throw new Error(`Missing fields: ${missing.join(", ")}`);
      }

      const expenseId = body.id || `EXP-${Math.floor(Math.random() * 9000) + 1000}`;
      const createdExpense = {
        id: expenseId,
        date: body.date || new Date().toISOString().slice(0, 10),
        hospital: body.hospital,
        patient: body.patient,
        insurance: body.insurance,
        total: Number(body.total) || 0,
        status: body.status || "Awaiting Reimbursement",
        staff: body.staff,
        department: body.department,
        medications: Array.isArray(body.medications) ? body.medications : [],
        notes: body.notes || "",
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

  backendConnector.registerResource(
    "billing/insurance-payment",
    async (_params, body = {}) => {
      const requiredFields = ["insurer", "amount", "reference"];
      const missing = requiredFields.filter((field) => !body[field]);
      if (missing.length) {
        throw new Error(`Missing fields: ${missing.join(", ")}`);
      }

      const paymentAmount = Number(body.amount) || 0;
      snapshot = {
        ...snapshot,
        outstandingClaims: snapshot.outstandingClaims.map((claim) =>
          claim.insurer === body.insurer && paymentAmount > 0
            ? { ...claim, amount: Math.max(0, claim.amount - paymentAmount) }
            : claim,
        ),
      };

      return {
        payment: {
          insurer: body.insurer,
          amount: paymentAmount,
          reference: body.reference,
          recordedAt: new Date().toISOString(),
        },
        message: "Payment recorded via billing mock endpoint",
      };
    },
    { method: "POST" },
  );
};

export { registerBillingMockServer };
