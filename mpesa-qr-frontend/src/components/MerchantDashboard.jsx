import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  Calendar,
  Download,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Menu,
  X,
  LogOut,
  Home,
  QrCode,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Activity,
  CreditCard,
  Smartphone,
  Settings,
  ArrowRight,
  UtensilsCrossed,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid,
  ResponsiveContainer, ComposedChart, Line, Area
} from 'recharts';
import MenuModule from './MenuModule';
import { useSubscription } from '../hooks/SubscriptionProvider';
import SubscriptionShield from '../hooks/SubscriptionShield';
import ThemeToggle from './ui/Toggle';
import AnalyticsModule from './AnalyticsModule'; // <--- IMPORT IT
// Add API_BASE_URL to the list
import { API_BASE_URL, API_ENDPOINTS } from '../utility/constants'; // Adjust path if needed (e.g. '../utils/constants')

const MerchantDashboard = () => {
  const { user, merchantData, logout } = useAuth();

  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');
  const [status, setStatus] = useState('all');
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { tier, isValid, status: subStatus, menuEnabled, loading: subLoading } = useSubscription();
  const [isLineChart, setIsLineChart] = useState(false);
  const [dailyData, setDailyData] = useState([]);

  const formatCurrency = (amount) => {
    return `KSH ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString); // Backend sends ISO strings
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Format error:", error);
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      success: 'success',
      pending: 'warning',
      failed: 'error',
      error: 'error'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </Badge>
    );
  };

  const downloadCSV = () => {
    if (!analytics?.transactions?.length) {
      alert('No data to download');
      return;
    }

    const headers = ['Date', 'Phone', 'Amount', 'Status', 'Reference'];
    const csvData = analytics.transactions.map(t => [
      formatDate(t.createdAt),
      t.phoneNumber || 'N/A',
      t.amount || 0,
      t.status || 'unknown',
      t.transactionRef || t.id || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };





  const fetchAnalytics = async () => {
    // 1. Bulletproof Auth Check
    // Instead of localStorage, we check the 'user' object from useAuth()
    if (!user) {
      console.warn("Analytics fetch blocked: No user object found.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 2. GET A FRESH TOKEN
      // This is the most important change. It ensures the token is never 'undefined'
      const token = await user.getIdToken();

      // Defensive handling for query params
      const currentStatus = status || 'all';
      const currentPeriod = period || 'week';

      const params = new URLSearchParams({
        period: currentPeriod,
        status: currentStatus,
        includeQRMetrics: 'true',
        limit: '100'
      });

      // 3. EXECUTE REQUEST
      const response = await axios.get(
        `${API_BASE_URL}/api/transactions/analytics?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      console.log('Raw API Response:', response.data);

      // 4. DATA PROCESSING
      if (response.data.status === 'success') {

        // A. Extract and set the Analytics Object (for your charts/cards)
        if (response.data.analytics) {
          const analyticsData = response.data.analytics;
          setAnalytics(analyticsData);

          if (typeof processChartData === 'function') {
            processChartData(analyticsData);
          }
        }

        // B. Extract and set the Transactions Array (for your list/table)
        // This is the missing piece that fixes the blank list issue!
        if (response.data.transactions) {
          setTransactions(response.data.transactions);
        } else {
          setTransactions([]); // Safe fallback
        }

      }
    } catch (err) {
      console.error('Analytics fetch error:', err);

      // Handle 401 specifically to help you debug auth issues
      if (err.response?.status === 401) {
        setError('Session expired or unauthorized. Please re-login.');
      } else {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to fetch analytics data';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDebugInfo = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/transactions/debug`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.status === 'success') {
        setDebugData(response.data.debug);
      }
    } catch (err) {
      console.error('Debug fetch error:', err);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
    if (showDebug) {
      fetchDebugInfo();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const handleNavigateToQRGenerator = () => {
    navigate('/generate-qr');
  };

  const handleNavigateToScanner = () => {
    navigate('/payment-scanner');
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, status, period]); // Refetch when user logs in or filters change

  useEffect(() => {
    if (showDebug && !debugData) {
      fetchDebugInfo();
    }
  }, [showDebug]);

  // Calculate stats
  const stats = analytics ? {
    totalRevenue: analytics.summary?.totalRevenue || 0,
    totalTransactions: analytics.summary?.totalTransactions || 0,
    successfulPayments: analytics.summary?.successfulTransactions || 0,
    pendingPayments: analytics.summary?.pendingTransactions || 0,
    failedPayments: analytics.summary?.failedTransactions || 0,
    successRate: analytics.summary?.successRate || 0
  } : {
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    successRate: 0
  };

  // Add dailyData for chart



  // --- CHART DATA PROCESSOR ---
  const processChartData = (analyticsData) => {
    if (!analyticsData || !analyticsData.dailySummaries) return;

    // 1. Map API Data (totalRevenue -> revenue) & Sort Chronologically
    const rawHistory = analyticsData.dailySummaries.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-KE', { weekday: 'short' }), // e.g., "Mon"
      fullDate: day.date,
      revenue: day.totalRevenue, // <--- Mapping fixed here
      prediction: null // Real days have no prediction
    })).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

    // 2. Get the last real data point (The Anchor)
    const lastRealPoint = rawHistory[rawHistory.length - 1];

    // 3. Prepare the "Future" Point based on backend prediction
    if (analyticsData.insights && analyticsData.insights.prediction) {
      const predictedAmount = analyticsData.insights.prediction.nextDayRevenue;

      // ANCHOR TRICK: Add a point that exists in BOTH lines to connect them
      // We modify the last real point to start the prediction line
      if (lastRealPoint) {
        lastRealPoint.prediction = lastRealPoint.revenue;
      }

      // Add the future point
      rawHistory.push({
        date: 'Tomorrow',
        revenue: null, // Solid line stops
        prediction: predictedAmount // Dotted line continues
      });
    }

    setDailyData(rawHistory);
  };



  return (
    // Rebranded: Deep Zinc-Black background for high-end "FinTech" feel
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white selection:bg-orange-600/30">


      {/* --- NEW: GLOBAL EXPIRY BANNER --- */}
      {!isValid && !subLoading && (
        <div className="bg-red-600 text-zinc-950 dark:text-white px-4 py-2 text-center animate-in slide-in-from-top duration-500 sticky top-0 z-50 shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <AlertCircle className="w-3 h-3" />
            Subscription {subStatus === 'EXPIRED' ? 'Expired' : 'Inactive'} — Features Restricted
            <button
              onClick={() => navigate('/upgrade')}
              className="ml-4 bg-white text-red-600 px-3 py-1 rounded-full hover:bg-zinc-100 transition-colors"
            >
              Renew Now
            </button>
          </p>
        </div>
      )}
      {/* Modern Header - Rebranded for Dark Tech Aesthetic */}
      <div className="bg-zinc-100 dark:bg-zinc-900/50 backdrop-blur-md shadow-2xl border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-orange-600 p-2.5 rounded-2xl shadow-lg shadow-orange-600/20 shrink-0">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-zinc-950 dark:text-white" />
              </div>
              <div className="truncate">
                <h1 className="text-lg md:text-xl font-black text-zinc-950 dark:text-white truncate leading-tight uppercase italic tracking-tighter">
                  Merchant <span className="text-orange-600">Pro</span>
                </h1>
                <p className="text-[10px] md:text-xs text-zinc-500 truncate font-bold uppercase tracking-widest">
                  {merchantData?.name || user?.displayName || 'Dashboard'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                disabled={loading}
                className="h-10 px-3 bg-zinc-800/50 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-xl"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
                <span className="hidden md:inline ml-2 text-[10px] font-black uppercase tracking-wider">Sync</span>
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNavMenu(!showNavMenu)}
                  className="h-10 px-3 bg-orange-600 hover:bg-orange-700 text-zinc-950 dark:text-white border-none rounded-xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                >
                  <Menu className="w-4 h-4" />
                  <span className="hidden md:inline ml-2 text-[10px] font-black uppercase tracking-wider">Menu</span>
                </Button>

                {showNavMenu && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] shadow-2xl py-3 z-50 border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={() => { setShowNavMenu(false); handleNavigateToQRGenerator(); }}
                      // Fixed: text-zinc-700 for light mode, dark:text-zinc-300 for dark mode. Added light mode hover bg.
                      className="w-full px-5 py-4 text-left text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800/50 flex items-center gap-4 transition-colors"
                    >
                      <QrCode className="w-5 h-5 text-orange-500" />
                      <span className="font-bold text-sm">Generate QR</span>
                    </button>

                    <button
                      onClick={() => { setShowNavMenu(false); handleNavigateToScanner(); }}
                      // Fixed: Same visibility updates applied here
                      className="w-full px-5 py-4 text-left text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800/50 flex items-center gap-4 transition-colors"
                    >
                      <Smartphone className="w-5 h-5 text-orange-500" />
                      <span className="font-bold text-sm">QR Scanner</span>
                    </button>

                    <div className="my-2 border-t border-zinc-200 dark:border-zinc-800 mx-4" />

                    {/* Make sure your Logout button is also visible! */}
                    <button
                      onClick={() => { setShowNavMenu(false); handleLogout(); }}
                      className="w-full px-5 py-4 text-left text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-4 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-bold text-sm">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Controls - Rebranded with Dark Selects */}
          <SubscriptionShield requiredTier="BASIC" featureName="Real-time Stats">

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5">
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold focus:ring-2 focus:ring-orange-600 appearance-none outline-none transition-all group-hover:border-zinc-300 dark:group-hover:border-zinc-700"                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">Total Revenue</option>
                  </select>
                </div>

                <div className="relative group">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold focus:ring-2 focus:ring-orange-600 appearance-none outline-none transition-all group-hover:border-zinc-300 dark:group-hover:border-zinc-700"                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={downloadCSV}
                  className="flex-1 sm:flex-none justify-center gap-2 h-12 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl  dark:text-white dark:bg-zinc-800 font-black text-[10px] uppercase tracking-widest px-6"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </Button>
              </div>
            </div>
          </SubscriptionShield>
        </div>
      </div>

      <div className="px-4 py-6 md:px-8 md:py-8 space-y-6 md:space-y-8 pb-32">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-[1.5rem] p-5 flex items-start gap-4 animate-in shake duration-500">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <p className="text-sm text-red-400 font-bold leading-tight">{error}</p>
          </div>
        )}
        <SubscriptionShield requiredTier="BASIC" featureName="Real-time Stats">

          {/* Stats Grid - High Contrast 2-Col for S22 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

            <Card className="!bg-orange-600 !text-zinc-950 dark:text-white !border-none shadow-2xl shadow-orange-600/20 relative overflow-hidden rounded-[2rem]">
              <CardContent className="p-5 md:p-7">
                <p className="text-zinc-950 dark:text-white/70 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Total Income</p>
                <div className="text-2xl md:text-4xl font-black text-zinc-950 dark:text-white italic tracking-tighter">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-zinc-950 dark:text-white/60 text-[10px] mt-2 font-bold uppercase">{stats.totalTransactions} Completed</p>
              </CardContent>
              <DollarSign className="absolute -right-4 -bottom-4 h-20 w-20 text-zinc-950 dark:text-white/10 rotate-12" />
            </Card>



            <Card className="!bg-white !text-zinc-950 !border-none shadow-xl relative overflow-hidden rounded-[2rem]">
              <CardContent className="p-5 md:p-7">
                <p className="text-zinc-400 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Success Rate</p>
                <div className="text-2xl md:text-4xl font-black text-zinc-950">{stats.successRate}%</div>
                <p className="text-orange-600 text-[10px] mt-2 font-bold uppercase tracking-widest">Efficiency</p>
              </CardContent>
              <TrendingUp className="absolute -right-4 -bottom-4 h-20 w-20 text-zinc-100 rotate-12" />
            </Card>

            <Card className="!bg-zinc-100 dark:bg-zinc-900 !text-zinc-950 dark:text-white !border border-zinc-200 dark:border-zinc-800 shadow-xl relative overflow-hidden rounded-[2rem]">
              <CardContent className="p-5 md:p-7">
                <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em] mb-2">In Review</p>
                <div className="text-2xl md:text-4xl font-black text-orange-500">{stats.pendingPayments}</div>
                <p className="text-zinc-600 text-[10px] mt-2 font-bold uppercase tracking-widest">Pending</p>
              </CardContent>
              <Clock className="absolute -right-4 -bottom-4 h-20 w-20 text-zinc-950 dark:text-white/5 rotate-12" />
            </Card>

            <Card className="!bg-zinc-100 dark:bg-zinc-900 !text-zinc-950 dark:text-white !border border-zinc-200 dark:border-zinc-800 shadow-xl relative overflow-hidden rounded-[2rem]">
              <CardContent className="p-5 md:p-7">
                <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Failed</p>
                <div className="text-2xl md:text-4xl font-black text-red-500">{stats.failedPayments}</div>
                <p className="text-zinc-600 text-[10px] mt-2 font-bold uppercase tracking-widest">Attention</p>
              </CardContent>
              <XCircle className="absolute -right-4 -bottom-4 h-20 w-20 text-zinc-950 dark:text-white/5 rotate-12" />
            </Card>
          </div>
        </SubscriptionShield>

        {/* Content Navigation - Tabs rebranded for Dark Mode */}
        {/* Content Navigation - Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-[1.5rem] no-scrollbar border border-zinc-200 dark:border-zinc-800">
            <TabsTrigger value="overview" className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-zinc-950 dark:text-white rounded-xl transition-all">
              <Activity className="w-4 h-4" /> Trend
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-zinc-950 dark:text-white rounded-xl transition-all">
              <CreditCard className="w-4 h-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-zinc-950 dark:text-white rounded-xl transition-all">
              <UtensilsCrossed className="w-4 h-4" /> Setup
            </TabsTrigger>
          </TabsList>

          {/* --- TAB 1: OVERVIEW (Protected by ELITE) --- */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <SubscriptionShield requiredTier="ELITE" featureName="Advanced Analytics">
              <AnalyticsModule />
            </SubscriptionShield>
          </TabsContent>

          {/* --- TAB 2: TRANSACTIONS (Available to BASIC & ELITE) --- */}
          <TabsContent value="transactions" className="mt-6">
            <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden rounded-[2.5rem]">
              <CardHeader className="p-6 border-b border-zinc-200 dark:border-zinc-800/50">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Order Feed
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                {transactions && transactions.length > 0 ? (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                    {transactions.slice(0, 10).map((transaction, idx) => {
                      const isSuccess = transaction.status?.toLowerCase() === 'success';

                      let timeValue = null;
                      if (transaction.createdAt && transaction.createdAt._seconds) {
                        timeValue = transaction.createdAt._seconds * 1000;
                      } else if (transaction.createdAt) {
                        timeValue = transaction.createdAt;
                      }

                      const dateStr = timeValue
                        ? new Date(timeValue).toLocaleDateString('en-KE', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })
                        : 'Just Now';

                      const amountStr = Number(transaction.amount).toLocaleString();

                      return (
                        <div
                          key={transaction.id || idx}
                          className="p-5 flex items-center justify-between hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors group"
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className={`p-3 rounded-2xl transition-colors ${isSuccess
                              ? 'bg-orange-100 dark:bg-orange-600/10 text-orange-600'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                              }`}>
                              <DollarSign className="w-5 h-5" />
                            </div>

                            <div className="truncate">
                              <p className="font-black text-zinc-950 dark:text-white truncate text-sm uppercase tracking-tight group-hover:text-brand-orange transition-colors">
                                {transaction.phoneNumber || transaction.accountRef || 'M-Pesa Order'}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                {dateStr}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-black text-zinc-950 dark:text-white text-lg italic tracking-tighter">
                              KES {amountStr}
                            </p>

                            <div className="scale-[0.8] origin-right mt-1">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isSuccess
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : transaction.status === 'pending'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                }`}>
                                {transaction.status || 'UNKNOWN'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-24 px-6 bg-zinc-50 dark:bg-zinc-900/50">
                    <Search className="w-16 h-16 text-zinc-300 dark:text-zinc-800 mx-auto mb-5" />
                    <p className="font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest text-xs">
                      Awaiting First Transaction
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- TAB 3: MENU MODULE (Protected by its own Addon logic if needed) --- */}
          <TabsContent value="menu" className="mt-6">
            <SubscriptionShield requiredTier="BASIC" featureName="Digital Menu">
              {user ? <MenuModule merchantId={user.uid} /> : <div className="p-4">Loading User...</div>}
            </SubscriptionShield>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default MerchantDashboard;