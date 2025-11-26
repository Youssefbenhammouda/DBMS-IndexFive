import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Card from "./Card";

const KpiCard = ({ title, value, subtext, trend, trendValue, icon: Icon }) => (
  <Card className="flex flex-col justify-between h-32 hover:shadow-md transition-shadow cursor-default">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</h4>
      </div>
      <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
        <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
      </div>
    </div>
    <div className="flex items-center mt-2">
      {trend === "up" ? (
        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
      ) : (
        <ArrowDownRight className="w-4 h-4 text-red-500" />
      )}
      <span className={`text-xs ml-1 font-medium ${trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
        {trendValue}
      </span>
      <span className="text-xs text-slate-400 ml-2">{subtext}</span>
    </div>
  </Card>
);

export default KpiCard;
