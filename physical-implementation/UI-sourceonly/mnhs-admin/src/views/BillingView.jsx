import { useMemo, useState } from "react";
import { CreditCard, ShieldCheck, Clock3, AlertTriangle } from "lucide-react";
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
        medications: [
          { mid: 301, name: "Chemotherapy pack", dosage: "Cycle", duration: "1 session", therapeuticClass: "Chemotherapy" },
        ],
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
  if (filters.insuranceId === null) tokens.push("Self-Pay only");
  else if (filters.insuranceId) tokens.push(`Insurer #${filters.insuranceId}`);
  const scope = tokens.length ? tokens.join(" - ") : "Network-wide";
  const days = filters.daysBack ?? 30;
  return `${scope} - Last ${days} days`;
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

const BillingView = ({ data, error, billingConnector }) => {
  const [insuranceFilter, setInsuranceFilter] = useState("All");
  const [selectedExpense, setSelectedExpense] = useState(null);

  const dataset = data && Object.keys(data).length ? data : BILLING_VIEW_MOCK;
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
  const usingLiveData = Boolean(data);
  const lastSyncedLabel = metadata.lastSyncedAt ? new Date(metadata.lastSyncedAt).toLocaleString() : null;
  const filtersSummary = summarizeFilters(metadata.filters);

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

  const insuranceOptions = useMemo(
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
        <div className="flex flex-col gap-1 text-xs text-emerald-600">
          <span>Connected via BillingConnector{lastSyncedLabel ? ` - Last synced ${lastSyncedLabel}` : ""}</span>
          <span className="text-slate-500">Scope: {filtersSummary}</span>
        </div>
      )}

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
                    <p className="text-xs text-slate-500">{bucket.activities} activities</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(bucket.amount, { compact: true })}
                    </p>
                    <p className="text-xs text-slate-500">{bucket.resolvedShare}% share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Medication Utilization Snapshot">
          <div className="space-y-4">
            {medicationSnapshot.length === 0 && (
              <p className="text-sm text-slate-500">No prescriptions recorded for the selected filters.</p>
            )}
            {medicationSnapshot.map((med) => (
              <div key={med.mid} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{med.name}</p>
                    <p className="text-xs text-slate-500">{med.therapeuticClass} - {med.shareLabel}</p>
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
              <thead className="text-left text-slate-500">
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
                    <td className="py-3 px-4 text-slate-500">{row.region}</td>
                    <td className="py-3 px-4 text-right">{row.activities?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{formatPercentLabel(row.insuredShare)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(row.avgExpense, { minimumFractionDigits: 0 })}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {formatCurrency(row.total, { minimumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
                {!hospitalPreview.length && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={6}>
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
              <p className="text-sm text-slate-500">No department activity recorded.</p>
            )}
            {departmentLeaders.leaders.map((dept) => {
              const isAboveAverage = departmentLeaders.avg && dept.total >= departmentLeaders.avg;
              return (
                <div key={dept.depId} className="p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{dept.department}</p>
                      <p className="text-xs text-slate-500">{dept.hospital} - {dept.specialty}</p>
                    </div>
                    {isAboveAverage && <Badge color="green">Above avg</Badge>}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
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
                  <td className="py-3 px-4 text-slate-500">{expense.caid ?? "--"}</td>
                  <td className="py-3 px-4">{formatDateOnly(expense.activityDate)}</td>
                  <td className="py-3 px-4">{expense.hospital?.name}</td>
                  <td className="py-3 px-4">{expense.department?.name}</td>
                  <td className="py-3 px-4">{expense.patient?.fullName}</td>
                  <td className="py-3 px-4">{expense.insurance?.type || "Self-Pay"}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {formatCurrency(expense.total, { minimumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
              {!filteredExpenses.length && (
                <tr>
                  <td className="py-6 text-center text-slate-500" colSpan={8}>
                    No expenses for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Each row represents one Expense linked 1:1 to a ClinicalActivity (CAID) using the lab schema.
        </p>
      </Card>

      <Drawer
        isOpen={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        title={selectedExpense ? `Expense ${selectedExpense.expId}` : "Expense details"}
      >
        {selectedExpense && (
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-xs uppercase text-slate-500">Patient</p>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {selectedExpense.patient?.fullName}
              </p>
              <p className="text-slate-500">
                {selectedExpense.hospital?.name} - {selectedExpense.department?.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-slate-500">Insurance</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {selectedExpense.insurance?.type || "Self-Pay"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Clinical Activity</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{selectedExpense.caid ?? "--"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Attending Staff</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {selectedExpense.staff?.fullName}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Billed On</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{formatDateTime(selectedExpense.activityDate)}</p>
              </div>
            </div>

            {selectedExpense.prescription && (
              <div>
                <p className="text-xs uppercase text-slate-500 mb-2">Prescription #{selectedExpense.prescription.pid}</p>
                {drawerMedications.length === 0 && <p className="text-slate-500">No medications recorded.</p>}
                <div className="space-y-3">
                  {drawerMedications.map((med) => (
                    <div key={med.mid} className="flex justify-between text-slate-700 dark:text-slate-200">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-xs text-slate-500">
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
              <p className="text-xs uppercase text-slate-500">Total</p>
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
