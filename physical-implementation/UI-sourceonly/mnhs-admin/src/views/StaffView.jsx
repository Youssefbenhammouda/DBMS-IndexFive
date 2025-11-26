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

const ROLE_DATA = [
  { name: "Doctors", value: 45 },
  { name: "Nurses", value: 80 },
  { name: "Admin", value: 20 },
  { name: "Techs", value: 15 },
];

const COLORS = ["#0d9488", "#3b82f6", "#f59e0b", "#6366f1"];

const StaffView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2" title="Staff Directory">
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
              {data.staff.slice(0, 8).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.departments.map((d) => (
                        <span key={d} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color="green">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Allocation by Role">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={ROLE_DATA} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value">
                {ROLE_DATA.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  </div>
);

export default StaffView;
