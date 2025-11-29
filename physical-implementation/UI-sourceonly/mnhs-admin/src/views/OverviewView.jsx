import { useMemo } from "react";
import { Calendar, LayoutDashboard, Stethoscope, Users, Pill } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import KpiCard from "../components/common/KpiCard";

const BAR_COLORS = ["#0d9488", "#3b82f6", "#6366f1", "#f97316"];

const formatNumber = (value) => (typeof value === "number" ? value.toLocaleString() : "—");
const normalizeTime = (time = "00:00") => {
  if (!time) return "00:00";
  return time.length === 4 ? `0${time}` : time;
};
const buildDateWithTime = (date, time) => new Date(`${date}T${normalizeTime(time)}`);

const OverviewView = ({ data, error, onNavigate }) => {
  const appointments = data?.appointments ?? [];
  const staff = data?.staff ?? [];
  const staffLeaderboard = data?.staffLeaderboard ?? staff;
  const lowStockMedications = data?.lowStockMedications ?? [];
  const summary = data?.summary ?? {};

  const pendingNext24h = useMemo(() => {
    if (!appointments.length) return 0;
    const now = new Date();
    const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return appointments.filter((apt) => {
      if (apt.status !== "Scheduled") return false;
      const aptDate = buildDateWithTime(apt.date, apt.time);
      return aptDate >= now && aptDate <= nextDay;
    }).length;
  }, [appointments]);

  const activeHospitals = useMemo(() => {
    if (appointments.length) {
      return new Set(appointments.map((apt) => apt.hospital)).size;
    }
    const staffHospitals = staff.flatMap((member) => member.hospitals || []);
    return new Set(staffHospitals).size;
  }, [appointments, staff]);

  const chartHospitals = useMemo(() => {
    if (!appointments.length) return [];
    const counts = appointments.reduce((acc, apt) => {
      acc[apt.hospital] = (acc[apt.hospital] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
  }, [appointments]);

  const chartData = useMemo(() => {
    if (!appointments.length || !chartHospitals.length) return [];
    const grouped = new Map();

    appointments.forEach((apt) => {
      if (!chartHospitals.includes(apt.hospital)) return;
      if (!grouped.has(apt.date)) {
        grouped.set(apt.date, { rawDate: apt.date });
      }
      const bucket = grouped.get(apt.date);
      bucket[apt.hospital] = (bucket[apt.hospital] || 0) + 1;
    });

    return Array.from(grouped.values())
      .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
      .slice(0, 7)
      .map((entry) => {
        const { rawDate, ...rest } = entry;
        chartHospitals.forEach((hospital) => {
          rest[hospital] = rest[hospital] || 0;
        });
        return {
          ...rest,
          date: new Date(rawDate).toLocaleDateString(undefined, { weekday: "short" }),
        };
      });
  }, [appointments, chartHospitals]);

  const kpis = [
    {
      title: "Total Appointments",
      value: formatNumber(summary.totalAppointments ?? appointments.length),
      subtext: summary.upcomingAppointments
        ? `${formatNumber(summary.upcomingAppointments)} upcoming`
        : "Based on current data",
      trend:
        summary.totalAppointments && summary.upcomingAppointments
          ? summary.upcomingAppointments >= summary.totalAppointments / 2
            ? "up"
            : "down"
          : null,
      trendValue:
        summary.totalAppointments && summary.upcomingAppointments
          ? `${Math.round((summary.upcomingAppointments / summary.totalAppointments) * 100)}% next 14d`
          : null,
      icon: Calendar,
    },
    {
      title: "Active Hospitals",
      value: formatNumber(activeHospitals),
      subtext: "With scheduled appointments",
      icon: LayoutDashboard,
    },
    {
      title: "Active Staff",
      value: formatNumber(summary.activeStaff ?? 0),
      subtext: staff.length ? `${formatNumber(staff.length)} total staff` : "Marked as active",
      trend: summary.activeStaff && staff.length && summary.activeStaff < staff.length / 2 ? "down" : "up",
      trendValue:
        summary.activeStaff && staff.length
          ? `${Math.round((summary.activeStaff / staff.length) * 100)}% engaged`
          : null,
      icon: Stethoscope,
    },
    {
      title: "Pending Patients",
      value: formatNumber(summary.admittedPatients ?? pendingNext24h),
      subtext: pendingNext24h ? `${pendingNext24h} visits next 24h` : "Admitted status",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load overview data: {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Upcoming Appointments by Hospital" className="lg:col-span-2">
          <div className="h-80 w-full">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                  {chartHospitals.map((hospital, index) => (
                    <Bar
                      key={hospital}
                      dataKey={hospital}
                      stackId="a"
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                      radius={
                        chartHospitals.length === 1
                          ? [6, 6, 6, 6]
                          : index === 0
                          ? [0, 0, 4, 4]
                          : index === chartHospitals.length - 1
                          ? [4, 4, 0, 0]
                          : [0, 0, 0, 0]
                      }
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                No appointment data available.
              </div>
            )}
          </div>
        </Card>

        <Card title="Critical Stock Alerts">
          <div className="space-y-4">
            {lowStockMedications.slice(0, 5).map((med) => {
              const currentStock =
                typeof med.stockLevel === "number"
                  ? med.stockLevel
                  : typeof med.qty === "number"
                  ? med.qty
                  : 0;
              const reorderPoint =
                typeof med.reorderPoint === "number"
                  ? med.reorderPoint
                  : typeof med.reorderLevel === "number"
                  ? med.reorderLevel
                  : 0;
              const severityColor = currentStock <= reorderPoint / 2 ? "red" : "orange";
              const severityLabel = severityColor === "red" ? "Critical" : "Low";
              const subtitleParts = [med.category].filter(Boolean);
              return (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <Pill className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{med.name}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {subtitleParts.length ? `${subtitleParts.join(" • ")} • ` : ""}Stock: {currentStock}
                        {med.unit ? ` ${med.unit}` : ""} (Reorder: {reorderPoint})
                      </p>
                    </div>
                  </div>
                  <Badge color={severityColor}>{severityLabel}</Badge>
                </div>
              );
            })}
            {!lowStockMedications.length && (
              <p className="text-sm text-slate-500 dark:text-slate-400">All medications are above reorder levels.</p>
            )}
            <button
              type="button"
              onClick={() => onNavigate?.("Medications")}
              className="w-full text-sm text-teal-600 hover:text-teal-700 font-medium text-center mt-2"
            >
              View All Alerts
            </button>
          </div>
        </Card>
      </div>

      <Card title="Staff Workload Leaderboard">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Staff Name</th>
                <th className="px-4 py-3 font-medium">Hospital</th>
                <th className="px-4 py-3 font-medium text-right">Appointments (30d)</th>
                <th className="px-4 py-3 font-medium">Load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {staffLeaderboard.slice(0, 5).map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{member.name}</td>
                  <td className="px-4 py-3 text-slate-500">{member.hospitals?.[0] || "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-200">{member.workload ?? 0}</td>
                  <td className="px-4 py-3 w-32">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500"
                        style={{ width: `${Math.min(member.workload ?? 0, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
              {!staffLeaderboard.length && (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-500 dark:text-slate-400" colSpan={4}>
                    No staff workload data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default OverviewView;
