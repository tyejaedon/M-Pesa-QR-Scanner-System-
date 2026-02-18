import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { ArrowLeft, RefreshCw, Download, Eye, Calendar, Phone, DollarSign } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS, STATUS } from '../utility/constants';
import axios from 'axios';

function Transactions({ token, user, onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    if (!token) {
      setError('Please login to view transactions');
      setLoading(false);
      return;
    }

    try {
      setError('');
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.TRANSACTIONS} ?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.data.status === 'success') {

        setTransactions(response.data.transactions || []);
        console.log('Fetched transactions:', Transactions);

        console.log('Fetched transactions:', response.data.transactions);
      } else {
        setError('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Fetch transactions error:', err);
      setError(err.response?.data?.error || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
  };

  const getStatusBadge = (status) => {
    const variants = {
      [STATUS.SUCCESS]: 'success',
      [STATUS.PENDING]: 'warning',
      [STATUS.FAILED]: 'error',
      [STATUS.ERROR]: 'error'
    };

    const labels = {
      [STATUS.SUCCESS]: 'Completed',
      [STATUS.PENDING]: 'Pending',
      [STATUS.FAILED]: 'Failed',
      [STATUS.ERROR]: 'Error'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';

    // Backend now sends ISO Strings thanks to serializeTransaction
    const date = new Date(timestamp);

    return date.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!token) {
    return (
      // Rebranded: Deep Zinc-Black background for consistent AMOLED look
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col selection:bg-orange-600/30">

        {/* Header: Rebranded with the "Merchant Pro" dark-tech header */}
        <div className="bg-zinc-100 dark:bg-zinc-900/50 backdrop-blur-md text-zinc-950 dark:text-white sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800">
          <div className="px-4 py-4 md:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-zinc-400 hover:text-zinc-950 dark:text-white hover:bg-zinc-800 h-10 w-10 shrink-0 rounded-xl transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="font-black text-xl uppercase italic tracking-tighter">
                Transaction <span className="text-orange-600">History</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex-1 container mx-auto p-6 flex items-center justify-center">
          {/* Auth-Gate Card: High-contrast Dark Card */}
          <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[3rem] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-500">
            <CardContent className="p-10 text-center space-y-8">

              {/* Visual Warning: Orange Lock Icon */}
              <div className="space-y-4">
                <div className="bg-orange-600/10 p-6 rounded-[2.5rem] w-fit mx-auto border border-orange-600/20">
                  <Lock className="w-12 h-12 text-orange-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-zinc-950 dark:text-white uppercase italic tracking-tighter">
                    Access <span className="text-orange-600">Restricted</span>
                  </h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                    Authentication is required to view the secure merchant ledger.
                  </p>
                </div>
              </div>

              {/* Action CTA: Redirect to Login */}
              <Button
                onClick={() => window.location.href = '/login'}
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-zinc-950 dark:text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 active:scale-95 transition-all"
              >
                Sign In to View
              </Button>

              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">
                Secure Merchant Environment
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    // Rebranded: Deep Zinc-Black background for AMOLED optimization
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col selection:bg-orange-600/30">
      <SubscriptionShield
        requiredTier="ELITE"
        featureName="Elite Analytics"
      >

        {/* Premium Sticky Header - Dark Tech Aesthetic */}
        <div className="bg-zinc-100 dark:bg-zinc-900/50 backdrop-blur-md text-zinc-950 dark:text-white sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800">
          <div className="px-4 py-4 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {onBack && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="text-zinc-400 hover:text-zinc-950 dark:text-white hover:bg-zinc-800 h-10 w-10 shrink-0 active:scale-90 transition-transform rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <div className="truncate">
                  <h1 className="font-black text-lg md:text-xl truncate tracking-tighter uppercase italic leading-none">
                    Transaction <span className="text-orange-600">Ledger</span>
                  </h1>
                  <p className="text-[10px] md:text-xs text-zinc-500 truncate mt-1 uppercase font-black tracking-widest">
                    {user?.email || 'Merchant Services'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-zinc-400 hover:text-orange-600 h-10 w-10 shrink-0"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-8">
          {loading ? (
            <div className="p-20 text-center animate-pulse">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-600 opacity-50" />
              <p className="text-zinc-600 font-black text-xs tracking-[0.2em] uppercase">Syncing Ledger...</p>
            </div>
          ) : error ? (
            <Card className="border-red-500/20 bg-red-500/5 border-2 shadow-none rounded-[2rem]">
              <CardContent className="p-10 text-center">
                <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                <h3 className="font-black text-zinc-950 dark:text-white uppercase italic tracking-tight mb-2 text-xl">Sync Error</h3>
                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">{error}</p>
                <Button onClick={handleRefresh} className="bg-white text-zinc-950 hover:bg-zinc-200 font-black px-10 h-12 rounded-2xl uppercase text-xs tracking-widest">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Sync
                </Button>
              </CardContent>
            </Card>
          ) : transactions.length === 0 ? (
            <div className="p-20 text-center space-y-6">
              <div className="bg-zinc-100 dark:bg-zinc-900 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <CreditCard className="w-12 h-12 text-zinc-700" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-zinc-950 dark:text-white uppercase italic tracking-tighter">No Records Found</h3>
                <p className="text-zinc-500 text-sm max-w-[280px] mx-auto font-medium leading-relaxed">
                  As soon as a customer settles an order via your QR terminal, the receipt will appear in this feed.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Quick Analytics - Rebranded with High Contrast */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-100 dark:bg-zinc-900 border-none shadow-xl border-l-4 border-green-500 rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.2em] mb-2">Success</p>
                    <p className="text-3xl font-black text-zinc-950 dark:text-white italic tracking-tighter">
                      {transactions.filter(t => t.status === SUCCESS_STATUS).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-100 dark:bg-zinc-900 border-none shadow-xl border-l-4 border-orange-500 rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.2em] mb-2">Pending</p>
                    <p className="text-3xl font-black text-zinc-950 dark:text-white italic tracking-tighter">
                      {transactions.filter(t => t.status === PENDING_STATUS).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-100 dark:bg-zinc-900 border-none shadow-xl border-l-4 border-red-600 rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.2em] mb-2">Failed</p>
                    <p className="text-3xl font-black text-zinc-950 dark:text-white italic tracking-tighter">
                      {transactions.filter(t => FAILED_STATUS.includes(t.status)).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-600 border-none shadow-2xl shadow-orange-600/20 rounded-2xl col-span-2 lg:col-span-1">
                  <CardContent className="p-5">
                    <p className="text-[9px] uppercase font-black text-zinc-950 dark:text-white/70 tracking-[0.2em] mb-2">Total Net</p>
                    <p className="text-3xl font-black text-zinc-950 dark:text-white italic tracking-tighter leading-none">
                      {formatCurrency(
                        transactions
                          .filter(t => t.status === SUCCESS_STATUS)
                          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* List Header */}
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">Full Feed History</h3>
                <div className="h-[1px] flex-grow bg-zinc-800 mx-6 opacity-50 hidden sm:block"></div>
                <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
                  {transactions.length} Records
                </span>
              </div>

              {/* Transactions Feed - Dark Mode Optimization */}
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="border-zinc-900 bg-zinc-100 dark:bg-zinc-900 shadow-xl hover:border-orange-600/30 transition-all active:scale-[0.98] group overflow-hidden rounded-[2rem]"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Vertical Indicator Bar */}
                        <div className={`w-2 shrink-0 ${transaction.status === SUCCESS_STATUS ? 'bg-green-500' :
                            transaction.status === PENDING_STATUS ? 'bg-orange-500' : 'bg-red-600'
                          }`} />

                        <div className="flex-1 p-5 md:p-7">
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 group-hover:border-orange-600/50 transition-colors">
                                <Phone className="w-6 h-6 text-zinc-600 group-hover:text-orange-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-zinc-950 dark:text-white text-lg md:text-xl truncate tracking-tight italic">
                                  {transaction.phoneNumber || 'M-Pesa Guest'}
                                </p>
                                <div className="scale-90 origin-left mt-1.5">
                                  {getStatusBadge(transaction.status)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-zinc-950 dark:text-white text-xl md:text-2xl italic tracking-tighter leading-none">
                                {formatCurrency(transaction.amount || 0)}
                              </p>
                              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-2">
                                {transaction.description || 'Service Payment'}
                              </p>
                            </div>
                          </div>

                          {/* Information Grid: High-Performance Data Display */}
                          <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-5 border-t border-zinc-200 dark:border-zinc-800/50">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] uppercase font-black text-zinc-600 tracking-widest flex items-center gap-2">
                                <Hash className="w-3 h-3 text-orange-600" /> Reference
                              </span>
                              <span className="text-xs font-bold text-zinc-300 bg-white dark:bg-zinc-950 px-2 py-1 rounded-lg w-fit">
                                {transaction.transactionRef || transaction.id?.substring(0, 10).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 items-end text-right">
                              <span className="text-[9px] uppercase font-black text-zinc-600 tracking-widest flex items-center gap-2 justify-end">
                                <Calendar className="w-3 h-3 text-orange-600" /> Executed
                              </span>
                              <span className="text-xs font-bold text-zinc-400">
                                {formatDate(transaction.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Success Specific - Receipt Block */}
                          {transaction.status === SUCCESS_STATUS && transaction.paymentDetails?.mpesaReceiptNumber && (
                            <div className="mt-5 flex items-center justify-between bg-green-500/5 p-4 rounded-2xl border border-green-500/10">
                              <div className="flex items-center gap-3">
                                <div className="bg-green-500 p-1.5 rounded-full shadow-lg shadow-green-500/20">
                                  <CheckCircle className="w-3 h-3 text-zinc-950 dark:text-white" />
                                </div>
                                <span className="text-[10px] font-black text-green-500 tracking-widest uppercase">
                                  Receipt ID: {transaction.paymentDetails.mpesaReceiptNumber}
                                </span>
                              </div>
                              <Button variant="ghost" className="h-8 text-[9px] font-black text-green-500 hover:bg-green-500/10 uppercase tracking-[0.2em]">
                                Audit
                              </Button>
                            </div>
                          )}

                          {/* Error Context Block */}
                          {FAILED_STATUS.includes(transaction.status) && transaction.error && (
                            <div className="mt-5 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 flex items-start gap-3 animate-in fade-in">
                              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <span className="text-[10px] font-bold text-red-400/80 leading-relaxed italic uppercase tracking-tight">
                                Error: {transaction.error}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </SubscriptionShield>
    </div>
  );
}

export default Transactions;