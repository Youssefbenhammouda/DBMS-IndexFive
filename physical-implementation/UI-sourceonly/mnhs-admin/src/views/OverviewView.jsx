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

const OverviewView = ({ data }) => {
  const chartData = [
    { date: "Mon", Rabat: 40, Casablanca: 65, Marrakech: 30 },
    { date: "Tue", Rabat: 30, Casablanca: 55, Marrakech: 40 },
    { date: "Wed", Rabat: 20, Casablanca: 85, Marrakech: 45 },
    { date: "Thu", Rabat: 27, Casablanca: 35, Marrakech: 30 },
    { date: "Fri", Rabat: 18, Casablanca: 45, Marrakech: 50 },
    { date: "Sat", Rabat: 23, Casablanca: 38, Marrakech: 55 },
    { date: "Sun", Rabat: 34, Casablanca: 43, Marrakech: 20 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Appointments"
          value="1,248"
          subtext="vs last 14 days"
          trend="up"
          trendValue="12%"
          icon={Calendar}
        />
        <KpiCard
          title="Active Hospitals"
          value="4"
          subtext="Operational"
          trend="up"
          trendValue="100%"
          icon={LayoutDashboard}
        />
        <KpiCard
          title="Active Staff"
          value="342"
          subtext="Across all depts"
          trend="down"
          trendValue="2%"
          icon={Stethoscope}
        />
        <KpiCard
          title="Pending Patients"
          value="89"
          subtext="Next 24 hours"
          trend="up"
          trendValue="8%"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Upcoming Appointments by Hospital" className="lg:col-span-2">
          <div className="h-80 w-full">
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
                <Bar dataKey="Rabat" stackId="a" fill="#0d9488" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Casablanca" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Marrakech" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Critical Stock Alerts">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <Pill className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Amoxicillin {500 + i * 10}mg</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Rabat Central • Qty: {5 + i}</p>
                  </div>
                </div>
                <Badge color="red">Low</Badge>
              </div>
            ))}
            <button className="w-full text-sm text-teal-600 hover:text-teal-700 font-medium text-center mt-2">
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
              {data.staff.slice(0, 5).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.hospitals[0]}</td>
                  <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-200">{s.workload}</td>
                  <td className="px-4 py-3 w-32">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${Math.min(s.workload, 100)}%` }}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default OverviewView;
