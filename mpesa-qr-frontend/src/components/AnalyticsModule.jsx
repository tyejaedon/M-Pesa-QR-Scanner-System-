import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Zap, Clock, Sparkles, AlertCircle, Search, DollarSign
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../utility/constants';

const AnalyticsModule = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('bar'); // 'bar' or 'trend'
  
  // Robust URL handling
 

  // --- 1. FETCH DATA ---
// --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Check if user object exists from useAuth()
      if (!user) return; 

      try {
        setLoading(true);
        
        // 2. Get a FRESH ID Token directly from Firebase
        // This ensures the token hasn't expired.
        const token = await user.getIdToken();
        
        const response = await axios.get(
          `${API_BASE_URL}/api/transactions/analytics?period=week`,
          {
            headers: { 
               'Authorization': `Bearer ${token}`, // Use the fresh token
               'ngrok-skip-browser-warning': 'true'
            }
          }
        );

        if (response.data.status === 'success') {
          const rawData = response.data.analytics;
          setAnalytics(rawData);
          processVisualization(rawData);
        }
      } catch (err) {
        console.error("Analytics Module Error:", err);
        // Check if error is specifically 401 to give a better message
        if (err.response?.status === 401) {
            setError("Session expired. Please log in again.");
        } else {
            setError("Could not load intelligence engine.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Added 'user' to dependency array so it fires once the user is loaded
  }, [API_BASE_URL, user]);

  // --- 2. DATA TRANSFORMATION ENGINE (The Split Series Logic) ---
  const processVisualization = (data) => {
    // A. Map Historical Data (Assign to 'actualRevenue')
    const history = data.dailySummaries.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-KE', { weekday: 'short' }),
      
      // KEY 1: Real History
      actualRevenue: day.totalRevenue, 
      
      // KEY 2: Future is null here
      forecastRevenue: null 
    })).sort((a, b) => new Date(a.date) - new Date(b.date)); // Ensure sorted

    // B. Inject AI Prediction (Assign to 'forecastRevenue')
    if (data.insights && data.insights.prediction) {
      const predictedVal = data.insights.prediction.nextDayRevenue;
      
      history.push({
        date: 'Next 24h',
        // KEY 1: History is null
        actualRevenue: null, 
        // KEY 2: Prediction data
        forecastRevenue: predictedVal 
      });
    }

    setChartData(history);
  };

  // --- PIE CHART PROCESSOR ---
  const processPieData = (data) => {
    if (!data || !data.dailySummaries) return [];
    
    return data.dailySummaries.map(day => ({
      name: new Date(day.date).toLocaleDateString('en-KE', { weekday: 'long' }),
      value: day.totalRevenue
    })).filter(item => item.value > 0);
  };

  const pieData = processPieData(analytics);
  const PIE_COLORS = ['#FF6B00', '#F97316', '#FB923C', '#FDBA74', '#52525b', '#3f3f46', '#27272a'];

  // --- 3. UI HELPERS ---
  const isGrowth = analytics?.insights?.prediction?.trendDirection === 'growth';

  if (loading) return (
    <div className="w-full h-96 flex flex-col items-center justify-center space-y-4 animate-pulse">
      <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
    </div>
  );

  if (error) return (
    <div className="w-full p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-4">
      <AlertCircle className="text-red-500" />
      <span className="text-red-700 dark:text-red-400 font-bold text-sm">{error}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* --- TOP ROW: INTELLIGENCE CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* 1. ACTUAL REVENUE */}
        <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-xl">
              <Zap className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Past 7 Days</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
            <span className="text-sm font-bold align-top mr-1">KES</span>
            {analytics?.summary.totalRevenue.toLocaleString()}
          </h3>
        </div>

        {/* 2. AI PREDICTION ENGINE */}
        <div className="relative p-6 rounded-[2rem] bg-zinc-900 dark:bg-black border border-zinc-800 overflow-hidden group shadow-2xl">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-orange/20 blur-3xl rounded-full group-hover:bg-brand-orange/30 transition-all" />
          
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-2.5 bg-brand-orange/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-brand-orange" />
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isGrowth ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">AI Forecast</span>
            </div>
          </div>
          
          <h3 className="relative z-10 text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            <span className="text-sm font-bold align-top text-zinc-500">KES</span>
            {analytics?.insights.prediction.nextDayRevenue.toLocaleString()}
            {isGrowth ? <ArrowUpRight className="w-5 h-5 text-green-500" /> : <ArrowDownRight className="w-5 h-5 text-red-500" />}
          </h3>
          <p className="relative z-10 text-[10px] font-bold text-zinc-500 mt-2 uppercase tracking-wide">
            Projected for Tomorrow
          </p>
        </div>

        {/* 3. PEAK TRAFFIC */}
        <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Peak Hour</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
            {analytics?.insights.peakTradingHour}
          </h3>
          <p className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-wide">
            Most Active Time
          </p>
        </div>
      </div>

      {/* --- BOTTOM ROW: CHART ENGINE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: MAIN CHART */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Performance</h4>
              <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white italic">
                {viewMode === 'bar' ? 'Revenue Volume' : 'Growth Trajectory'}
              </h2>
            </div>
            
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button 
                onClick={() => setViewMode('bar')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'bar' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                Bar
              </button>
              <button 
                onClick={() => setViewMode('trend')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'trend' ? 'bg-brand-orange text-white shadow-brand-orange/20 shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                Trend
              </button>
            </div>
          </div>

          <div className="h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'bar' ? (
                /* --- MODE A: SPLIT BAR CHART --- */
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,107,0,0.1)' }}
                    contentStyle={{ backgroundColor: '#cbcbdd', borderRadius: '12px', border: '1px solid #27272a', color: '#fff' }}
                    formatter={(value, name) => [
                      `KES ${value.toLocaleString()}`, 
                      name === 'actualRevenue' ? 'Actual Revenue' : 'AI Forecast'
                    ]}
                  />
                  {/* BAR 1: HISTORY (Dark) */}
                  <Bar dataKey="actualRevenue" stackId="a" radius={[6, 6, 0, 0]} barSize={40} fill="#27272a" className="dark:fill-zinc-700 fill-zinc-800" />
                  {/* BAR 2: FORECAST (Orange) */}
                  <Bar dataKey="forecastRevenue" stackId="a" radius={[6, 6, 0, 0]} barSize={40} fill="#FF6B00" opacity={0.6} />
                </BarChart>
              ) : (
                /* --- MODE B: SPLIT LINE CHART --- */
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#50508c', borderRadius: '12px', border: '1px solid #27272a', color: '#fff' }}
                    formatter={(value, name) => [
                      `KES ${value.toLocaleString()}`, 
                      name === 'actualRevenue' ? 'Actual Revenue' : 'AI Forecast'
                    ]}
                  />
                  {/* LINE 1: HISTORY (Solid + Area) */}
                  <Line type="monotone" dataKey="actualRevenue" stroke="#FF6B00" strokeWidth={3} dot={{ r: 4, fill: '#FF6B00', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  
                  {/* LINE 2: FORECAST (Dotted) */}
                  <Line type="monotone" dataKey="forecastRevenue" stroke="#FF6B00" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#FF6B00' }} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: DONUT CHART */}
        <div className="lg:col-span-1 p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col">
          <div className="mb-4">
             <h4 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Breakdown</h4>
             <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white italic">Daily Share</h2>
          </div>
          
          <div className="flex-1 w-full relative min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#a0a0d0', borderRadius: '12px', border: '1px solid #27272a', color: '#fff' }} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block tracking-widest">Total</span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white">{analytics?.dailySummaries?.length || 0}</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase block">Days</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsModule;