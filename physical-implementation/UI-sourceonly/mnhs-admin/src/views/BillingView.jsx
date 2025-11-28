import { useMemo, useState } from "react";
import { CreditCard, ShieldCheck, Clock3, AlertTriangle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Card from "../components/common/Card";
import KpiCard from "../components/common/KpiCard";
import Badge from "../components/common/Badge";
import Drawer from "../components/common/Drawer";

const INSURANCE_COLORS = ["#0d9488", "#3b82f6", "#f97316", "#8b5cf6", "#ef4444"];

const ICON_MAP = {
  CreditCard,
  ShieldCheck,
  Clock3,
  AlertTriangle,
};

const BILLING_VIEW_MOCK = {
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
    { insurer: "RAMED", hospital: "Casablanca Central", amount: 94000, daysOutstanding: 18, priority: "High" },
    { insurer: "CNSS", hospital: "Rabat University Hospital", amount: 64000, daysOutstanding: 23, priority: "Medium" },
    { insurer: "Private", hospital: "Tangier Regional", amount: 48000, daysOutstanding: 31, priority: "Medium" },
    { insurer: "CNOPS", hospital: "Fez Specialist Center", amount: 42000, daysOutstanding: 9, priority: "Low" },
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

const STATUS_COLORS = {
  Reimbursed: "green",
  "Awaiting Reimbursement": "orange",
  Flagged: "red",
  "Self-Paid": "blue",
};

const priorityBadgeColor = {
  High: "red",
  Medium: "orange",
  Low: "green",
};

const formatCurrency = (value, { compact = false, minimumFractionDigits = 0, maximumFractionDigits = 0 } = {}) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const BillingView = ({ data, error, billingConnector }) => {
  const [insuranceFilter, setInsuranceFilter] = useState("All");
  const [selectedExpense, setSelectedExpense] = useState(null);

  const dataset = data && Object.keys(data).length ? data : BILLING_VIEW_MOCK;
  const kpis = dataset.kpis || [];
  const insuranceSplit = dataset.insuranceSplit || [];
  const outstandingClaims = dataset.outstandingClaims || [];
  const reimbursementTimeline = dataset.reimbursementTimeline || [];
  const expenses = dataset.recentExpenses || [];
  const hasConnector = Boolean(billingConnector);
  const usingLiveData = Boolean(data);
  const lastSyncedLabel = dataset.lastSyncedAt
    ? new Date(dataset.lastSyncedAt).toLocaleString()
    : null;

  const insuranceOptions = useMemo(
    () => ["All", ...insuranceSplit.map((bucket) => bucket.type)],
    [insuranceSplit],
  );

  const filteredExpenses = useMemo(() => {
    if (insuranceFilter === "All") return expenses;
    return expenses.filter((expense) => expense.insurance === insuranceFilter);
  }, [insuranceFilter, expenses]);

  const insuranceSummary = useMemo(() => {
    const totalAmount = insuranceSplit.reduce((acc, row) => acc + row.amount, 0) || 1;
    return insuranceSplit.map((item, index) => ({
      ...item,
      color: INSURANCE_COLORS[index % INSURANCE_COLORS.length],
      share: Math.round((item.amount / totalAmount) * 100),
    }));
  }, [insuranceSplit]);

  const averagePending = useMemo(() => {
    if (!reimbursementTimeline.length) return 0;
    const totalPending = reimbursementTimeline.reduce((acc, row) => acc + row.pending, 0);
    return Math.round(totalPending / reimbursementTimeline.length);
  }, [reimbursementTimeline]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to refresh billing data: {error}
        </div>
      )}
      {!data && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Showing inline mock data until the billing API is wired up.
        </div>
      )}
      {hasConnector && usingLiveData && (
        <div className="text-xs text-emerald-600">
          Connected via BillingConnector{lastSyncedLabel ? ` • Last synced ${lastSyncedLabel}` : ""}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} icon={ICON_MAP[kpi.iconKey] || CreditCard} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Expenses by Insurance Type">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insuranceSummary}
                    dataKey="amount"
                    nameKey="type"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                  >
                    {insuranceSummary.map((entry, idx) => (
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
                      formatCurrency(value, { compact: false }),
                      `${payload?.payload?.type || ""} (${payload?.payload?.share || 0}% share)`,
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
                    <p className="text-xs text-slate-500">{bucket.claims} claims</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(bucket.amount, { compact: true })}
                    </p>
                    <p className="text-xs text-slate-500">{bucket.share}% share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Outstanding Claims">
          <div className="space-y-4">
            {outstandingClaims.map((claim) => (
              <div
                key={`${claim.insurer}-${claim.hospital}`}
                className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{claim.insurer}</p>
                  <Badge color={priorityBadgeColor[claim.priority] || "gray"}>{claim.priority} priority</Badge>
                </div>
                <p className="text-xs text-slate-500">{claim.hospital}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(claim.amount)}
                  </span>
                  <span className="text-slate-500">{claim.daysOutstanding} days pending</span>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500">
              Prioritize RAMED and CNSS batches to keep SLA &lt; 20 days as defined in Lab 6 triggers.
            </p>
          </div>
        </Card>
      </div>

      <Card
        title="Reimbursement Throughput (last 6 months)"
        action={<p className="text-xs text-slate-500">Avg pending {formatCurrency(averagePending, { compact: true })}</p>}
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reimbursementTimeline}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => formatCurrency(value, { compact: true })} />
              <RechartsTooltip
                cursor={{ fill: "rgba(15,23,42,0.05)" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 8px 16px rgba(15,23,42,0.12)",
                }}
                formatter={(value, name) => [formatCurrency(value), name]}
              />
              <Legend />
              <Bar dataKey="reimbursed" name="Reimbursed" stackId="a" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card
        title="Recent Expenses"
        action={
          <select
            value={insuranceFilter}
            onChange={(event) => setInsuranceFilter(event.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-900"
          >
            {insuranceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-3 px-4">Exp ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Hospital</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Insurance</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                  onClick={() => setSelectedExpense(expense)}
                >
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">{expense.id}</td>
                  <td className="py-3 px-4">{formatDate(expense.date)}</td>
                  <td className="py-3 px-4">{expense.hospital}</td>
                  <td className="py-3 px-4">{expense.patient}</td>
                  <td className="py-3 px-4">{expense.insurance}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {formatCurrency(expense.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    <Badge color={STATUS_COLORS[expense.status] || "gray"}>{expense.status}</Badge>
                  </td>
                </tr>
              ))}
              {!filteredExpenses.length && (
                <tr>
                  <td className="py-6 text-center text-slate-500" colSpan={7}>
                    No expenses for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Dataset derived from Lab 6 billing specification: each expense is linked 1:1 to a ClinicalActivity (CAID) and
          inherits triggers for stock valuation and insurance checks.
        </p>
      </Card>

      <Drawer
        isOpen={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        title={selectedExpense ? `Expense ${selectedExpense.id}` : "Expense details"}
      >
        {selectedExpense && (
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-xs uppercase text-slate-500">Patient</p>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{selectedExpense.patient}</p>
              <p className="text-slate-500">
                {selectedExpense.hospital} • {selectedExpense.department}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-slate-500">Insurance</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{selectedExpense.insurance}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Status</p>
                <Badge color={STATUS_COLORS[selectedExpense.status] || "gray"}>{selectedExpense.status}</Badge>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Attending Staff</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{selectedExpense.staff}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Billed On</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{formatDate(selectedExpense.date)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase text-slate-500 mb-2">Medications & Services</p>
              <div className="space-y-3">
                {selectedExpense.medications.map((medication) => (
                  <div key={medication.name} className="flex justify-between text-slate-700 dark:text-slate-200">
                    <div>
                      <p className="font-medium">{medication.name}</p>
                      <p className="text-xs text-slate-500">Qty {medication.qty}</p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(medication.qty * medication.unitPrice, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 mt-4 pt-4">
                <p className="text-xs uppercase text-slate-500">Total</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatCurrency(selectedExpense.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {selectedExpense.notes && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-700">
                <p className="text-xs uppercase text-slate-500 mb-1">Notes</p>
                <p className="text-slate-700 dark:text-slate-200">{selectedExpense.notes}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BillingView;
