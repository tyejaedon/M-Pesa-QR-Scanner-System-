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
  UtensilsCrossed,
  Plus
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../utility/constants';
import { useAuth } from '../hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import MenuModule from './MenuModule';

const MerchantDashboard = () => {
  const { user, merchantData, logout } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');
  const [status, setStatus] = useState('all');
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required. Please login.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Defensively handle the 'status' and 'period' values to avoid "undefined" strings
      const currentStatus = status || 'all';
      const currentPeriod = period || 'week';

      const params = new URLSearchParams({
        period: currentPeriod,
        status: currentStatus,
        includeQRMetrics: 'true',
        limit: '100'
      });

      // 2. Ensure the URL includes the /api prefix and uses the centralized base URL
      // Your backend routes in daraja.js and transactions.js use the /api prefix
      const response = await axios.get(
        `${API_BASE_URL}/api/transactions/analytics?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true' // Vital for bypassing the ngrok landing page
          }
        }
      );

      console.log('Raw API Response:', response.data);

      // 3. Drill down into the 'analytics' object provided by getTransactionAnalytics
      if (response.data.status === 'success' && response.data.analytics) {
        const analyticsData = response.data.analytics;

        console.log('Processed Analytics Data:', analyticsData);

        setAnalytics(analyticsData);
        // Backend returns transactions inside the analytics object
        setTransactions(analyticsData.transactions || []);

        if ((analyticsData.transactions || []).length === 0) {
          console.log('No transactions found for this period/filter.');
        }
      } else {
        setError('No analytics data found.');
        setTransactions([]);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      // Standardize error messaging based on backend response
      const errorMessage = err.response?.data?.error || 'Failed to fetch analytics data';
      setError(errorMessage);
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
    fetchAnalytics();
  }, [period, status]);

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
  const dailyData = analytics?.dailySummaries?.map(day => ({
    date: day.dateFormatted,
    revenue: day.totalRevenue, // Matches backend key
    successful: day.successful,
    failed: day.failed,
    pending: day.pending,
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Modern Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-blue-600 p-2 rounded-lg shrink-0">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="truncate">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate leading-tight">Merchant</h1>
                <p className="text-xs md:text-sm text-gray-500 truncate">
                  {merchantData?.name || user?.displayName || 'Dashboard'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-9 px-2 md:px-3"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline ml-2 text-xs">Sync</span>
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNavMenu(!showNavMenu)}
                  className="h-9 px-2 md:px-3"
                >
                  <Menu className="w-4 h-4" />
                  <span className="hidden md:inline ml-2 text-xs">Menu</span>
                </Button>

                {showNavMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 border border-slate-200">
                    <button
                      onClick={() => { setShowNavMenu(false); handleNavigateToQRGenerator(); }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <QrCode className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">Generate QR Code</span>
                    </button>
                    <button
                      onClick={() => { setShowNavMenu(false); handleNavigateToScanner(); }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <Smartphone className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">QR Scanner</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => { setShowNavMenu(false); handleLogout(); }}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4">
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="today">Today</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="all">Total</option>
                </select>
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="all">Status</option>
                  <option value="success">Success</option>
                  <option value="pending">Wait</option>
                  <option value="failed">Fail</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCSV}
                className="flex-1 sm:flex-none justify-center gap-2 h-10"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
                className="flex-1 sm:flex-none justify-center gap-2 text-gray-500 h-10"
              >
                {showDebug ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="sm:hidden">Debug</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6 pb-24">
        {/* Error/Loading */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 leading-tight">{error}</p>
          </div>
        )}

        {/* Stats Grid - 2 Col on Mobile */}
        {/* We use !bg- classes and !border-none to override hardcoded values in the Card module */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card className="!bg-green-600 !text-white !border-none shadow-md relative overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <p className="text-white/90 text-[10px] uppercase font-bold tracking-widest mb-1">Income</p>
              <div className="text-lg md:text-3xl font-black text-white">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-white/80 text-[10px] mt-1 truncate font-medium">{stats.totalTransactions} Orders</p>
            </CardContent>
            <DollarSign className="absolute -right-3 -bottom-3 h-16 w-16 text-white/10 rotate-12" />
          </Card>

          <Card className="!bg-blue-600 !text-white !border-none shadow-md relative overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <p className="text-white/90 text-[10px] uppercase font-bold tracking-widest mb-1">Efficiency</p>
              <div className="text-lg md:text-3xl font-black text-white">{stats.successRate}%</div>
              <p className="text-white/80 text-[10px] mt-1 truncate font-medium">Success rate</p>
            </CardContent>
            <TrendingUp className="absolute -right-3 -bottom-3 h-16 w-16 text-white/10 rotate-12" />
          </Card>

          <Card className="!bg-amber-500 !text-white !border-none shadow-md relative overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <p className="text-white/90 text-[10px] uppercase font-bold tracking-widest mb-1">In Review</p>
              <div className="text-lg md:text-3xl font-black text-white">{stats.pendingPayments}</div>
              <p className="text-white/80 text-[10px] mt-1 truncate font-medium">Pending clear</p>
            </CardContent>
            <Clock className="absolute -right-3 -bottom-3 h-16 w-16 text-white/10 rotate-12" />
          </Card>

          <Card className="!bg-rose-600 !text-white !border-none shadow-md relative overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <p className="text-white/90 text-[10px] uppercase font-bold tracking-widest mb-1">Failed</p>
              <div className="text-lg md:text-3xl font-black text-white">{stats.failedPayments}</div>
              <p className="text-white/80 text-[10px] mt-1 truncate font-medium">Action needed</p>
            </CardContent>
            <XCircle className="absolute -right-3 -bottom-3 h-16 w-16 text-white/10 rotate-12" />
          </Card>
        </div>

        {/* Content Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-slate-100 p-1 rounded-2xl no-scrollbar">
            <TabsTrigger value="overview" className="flex-1 py-3 text-xs md:text-sm font-bold gap-2">
              <Activity className="w-4 h-4" /> Trend
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 py-3 text-xs md:text-sm font-bold gap-2">
              <CreditCard className="w-4 h-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex-1 py-3 text-xs md:text-sm font-bold gap-2">
              <UtensilsCrossed className="w-4 h-4" /> Menu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Revenue Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-6">
                <div className="h-[250px] md:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {analytics?.transactions?.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {analytics.transactions.slice(0, 10).map((transaction, idx) => (
                      <div key={transaction.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-2.5 rounded-xl ${
                            transaction.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{transaction.phoneNumber || 'Order'}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{formatDate(transaction.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-slate-900">{formatCurrency(transaction.amount)}</p>
                          <div className="scale-[0.7] origin-right">
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 px-6">
                    <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="font-bold text-slate-400">No activity yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="mt-4">
            <MenuModule merchantId={user.uid} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MerchantDashboard;