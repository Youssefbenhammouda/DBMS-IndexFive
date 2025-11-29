import { useEffect, useMemo, useState } from "react";
import { Pill, AlertTriangle, TrendingUp } from "lucide-react";
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
const formatCurrency = (value) => `${(value || 0).toLocaleString()} MAD`;

const MedicationsView = ({ data, error, medicationsConnector }) => {
  const [banner, setBanner] = useState(null);

  const setErrorBanner = (message, source) => {
    setBanner({ type: "error", message, id: Date.now(), source });
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

  const lowStockSource = Array.isArray(data?.lowStock) ? data.lowStock : [];
  const pricingSummary = Array.isArray(data?.pricingSummary) ? data.pricingSummary : [];
  const priceSeries = Array.isArray(data?.priceSeries) ? data.priceSeries : [];
  const replenishmentTrend = Array.isArray(data?.replenishmentTrend) ? data.replenishmentTrend : [];

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
    </div>
  );
};

export default MedicationsView;
