import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { getAnalytics } from "../services/analyticsService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Clock, Target, Calendar, Zap, AlertTriangle, Brain } from "lucide-react";

export function Analytics() {
  const [stats, setStats] = useState({});
  const [weeklyData, setWeeklyData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [insight, setInsight] = useState("");
  const [productiveTime, setProductiveTime] = useState("");
  const [averageSession, setAverageSession] = useState("");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {

    async function loadAnalytics() {

        try {

            const data = await getAnalytics();

            setStats(data.stats);

            setWeeklyData(data.weeklyData);

            setTrendData(data.trendData);

            setInsight(data.insight);

            setProductiveTime(data.productiveTime);

            setAverageSession(data.averageSession);

        } catch (error) {

            console.error(error);

        }

    }

    loadAnalytics();

  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0a0a0a] p-8 scrollbar-hide relative">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h2 className="text-3xl font-light tracking-tight mb-2">Behavioral Insights</h2>
          <p className="text-neutral-500">Understand your focus patterns and productivity trends.</p>
        </div>

        {/* AI Insight Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex gap-4 items-start"
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
            <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">AI Behavioral Insight</h4>
            <p className="text-blue-900/80 dark:text-blue-200/80 text-[15px] leading-relaxed">
              {insight}
            </p>
          </div>
        </motion.div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Focus Hours" value={`${stats.focusHours ?? 0}h`} icon={<Clock />} subtitle="This week" />
          <StatCard title="Focus Integrity" value={`${stats.focusIntegrity ?? 0}%`} icon={<Target />} subtitle="Session completion ratio" />
          <StatCard title="Current Streak" value={`${stats.streak ?? 0} Days`} icon={<Zap />} subtitle="Daily study target met" />
          <StatCard title="Distractions" value={stats.distractions ?? 0} icon={<AlertTriangle />} subtitle="Interruptions this week"  />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Bar Chart */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
            <h3 className="font-medium mb-6 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              Daily Study Hours
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} 
                  />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
            <h3 className="font-medium mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-neutral-400" />
              Weekly Focus Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} 
                  />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
          <div className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Most Productive Time of Day</p>
              <p className="text-lg font-medium">{productiveTime}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Average Session Length</p>
              <p className="text-lg font-medium">{averageSession}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, trend, trendDownIsGood }) {
  const isPositive = trend?.startsWith('+');
  const trendColor = trendDownIsGood 
    ? (isPositive ? 'text-red-500' : 'text-emerald-500')
    : (isPositive ? 'text-emerald-500' : 'text-red-500');

  return (
    <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trendColor}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-light tracking-tight mb-1">{value}</h3>
        <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">{title}</p>
        <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
