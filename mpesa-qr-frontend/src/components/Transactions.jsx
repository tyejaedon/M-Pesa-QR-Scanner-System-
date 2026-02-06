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
        console.log('Fetched transactions:',Transactions);
    
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
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-blue-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">Transactions</h1>
          </div>
        </div>
        <div className="container mx-auto p-4">
          <Card className="border-red-500">
            <CardContent className="p-4">
              <p className="text-center text-red-600">Please login to view transactions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Premium Sticky Header */}
      <div className="bg-blue-600 text-white sticky top-0 z-30 shadow-md">
        <div className="px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              {onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="text-white hover:bg-blue-700 h-10 w-10 shrink-0 active:scale-90 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="truncate">
                <h1 className="font-black text-lg md:text-xl truncate tracking-tight leading-none">Activity Log</h1>
                <p className="text-[10px] md:text-xs text-blue-100 truncate opacity-80 mt-1 uppercase font-bold tracking-widest">
                  {user?.email || 'Merchant Services'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-white hover:bg-blue-700 h-10 w-10 shrink-0"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
        {loading ? (
          <Card className="border-none shadow-sm">
            <CardContent className="p-20 text-center">
              <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600 opacity-30" />
              <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Syncing Ledger...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-rose-100 bg-rose-50 border-2 shadow-none">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="font-black text-rose-900 mb-1">Connection Error</h3>
              <p className="text-rose-700 text-sm mb-6 opacity-80">{error}</p>
              <Button onClick={handleRefresh} variant="outline" className="bg-white border-rose-200 text-rose-700 hover:bg-rose-100 font-bold px-8 rounded-xl shadow-sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Sync
              </Button>
            </CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <Card className="border-none shadow-sm bg-white rounded-[32px]">
            <CardContent className="p-20 text-center">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-inner">
                <CreditCard className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">No Transactions</h3>
              <p className="text-slate-500 text-sm max-w-[240px] mx-auto leading-relaxed">
                As soon as a customer pays via your QR code, the receipt will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Analytics Summary - Stays clean on small screens */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-none shadow-sm bg-white border-l-4 border-green-500 rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Successful</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {transactions.filter(t => t.status === SUCCESS_STATUS).length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white border-l-4 border-amber-400 rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Pending</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {transactions.filter(t => t.status === PENDING_STATUS).length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white border-l-4 border-rose-500 rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Failed</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {transactions.filter(t => FAILED_STATUS.includes(t.status)).length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-blue-600 text-white rounded-2xl col-span-2 lg:col-span-1">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase font-black text-blue-200 tracking-widest mb-1">Total Revenue</p>
                  <p className="text-2xl font-black leading-none">
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
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Detailed History</h3>
              <div className="h-[1px] flex-grow bg-slate-200 mx-4 opacity-50 hidden sm:block"></div>
              <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 text-[10px] font-bold">
                {transactions.length} Records
              </Badge>
            </div>

            {/* Transactions Feed */}
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card 
                  key={transaction.id} 
                  className="border-none shadow-sm hover:shadow-md transition-all active:scale-[0.98] group overflow-hidden bg-white rounded-[24px]"
                >
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Vertical Indicator Bar */}
                      <div className={`w-1.5 shrink-0 ${
                        transaction.status === SUCCESS_STATUS ? 'bg-green-500' : 
                        transaction.status === PENDING_STATUS ? 'bg-amber-400' : 'bg-rose-500'
                      }`} />
                      
                      <div className="flex-1 p-4 md:p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="bg-slate-50 p-3 rounded-[16px] border border-slate-100 group-hover:bg-blue-50 transition-colors">
                              <Phone className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 text-base md:text-lg truncate leading-tight">
                                {transaction.phoneNumber || 'Guest Order'}
                              </p>
                              <div className="scale-90 origin-left -ml-1 mt-1">
                                {getStatusBadge(transaction.status)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-slate-900 text-lg md:text-xl leading-none">
                              {formatCurrency(transaction.amount || 0)}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                              {transaction.description || 'Merchant Pay'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Information Grid */}
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-slate-50">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1">
                              <Hash className="w-2.5 h-2.5" /> Reference
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded truncate">
                              {transaction.transactionRef || transaction.id?.substring(0, 12)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5 items-end">
                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1 justify-end">
                              <Calendar className="w-2.5 h-2.5" /> Timestamp
                            </span>
                            <span className="text-xs font-bold text-slate-600">
                              {formatDate(transaction.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Success Specific - Receipt Row */}
                        {transaction.status === SUCCESS_STATUS && transaction.paymentDetails?.mpesaReceiptNumber && (
                          <div className="mt-4 flex items-center justify-between bg-green-50/50 p-3 rounded-xl border border-green-100/50">
                            <div className="flex items-center gap-2">
                              <div className="bg-green-500 p-1 rounded-full">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-[11px] font-black text-green-700 tracking-tight">
                                RECEIPT: {transaction.paymentDetails.mpesaReceiptNumber}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black text-green-600 hover:bg-green-100 uppercase tracking-widest">
                              Details
                            </Button>
                          </div>
                        )}

                        {/* Error Context Block */}
                        {FAILED_STATUS.includes(transaction.status) && transaction.error && (
                          <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-2">
                            <XCircle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                            <span className="text-[11px] font-bold text-rose-700 leading-relaxed italic">
                              "{transaction.error}"
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
    </div>
  );
}

export default Transactions;