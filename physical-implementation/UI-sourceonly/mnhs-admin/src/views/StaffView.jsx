import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";

const COLORS = ["#0d9488", "#3b82f6", "#f59e0b", "#6366f1", "#14b8a6", "#f472b6"];

const StaffView = ({ data, error, staffConnector }) => {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (error) {
      setBanner({ type: "error", message: error, id: Date.now() });
    }
  }, [error]);

  useEffect(() => {
    if (!staffConnector) {
      setBanner({ type: "error", message: "Staff connector unavailable. Please refresh.", id: Date.now() });
    }
  }, [staffConnector]);

  const staffList = useMemo(() => (Array.isArray(data?.staff) ? data.staff : []), [data]);

  const roleData = useMemo(() => {
    const counts = staffList.reduce((acc, member) => {
      const role = member.role || "Other";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [staffList]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Staff Directory">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>{staffList.length} team members</span>
            {data?.lastSyncedAt && <span>Synced {new Date(data.lastSyncedAt).toLocaleString()}</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Departments</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No staff records available.
                    </td>
                  </tr>
                )}
                {staffList.slice(0, 8).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500">{s.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.departments?.length ? s.departments : ["Unassigned"]).map((d) => (
                          <span key={d} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={s.status === "Active" ? "green" : "orange"}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Allocation by Role">
          <div className="h-64">
            {roleData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No data</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StaffView;
