import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Smartphone, Loader2, Zap, ArrowUpRight, DollarSign, ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from '../utility/constants';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PayPrompt = () => {
  const query = useQuery();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // 1. DATA SIPHONING
  const qrData = useMemo(() => {
    const data = {};
    for (const [key, value] of query.entries()) {
      data[key] = value;
    }
    return data;
  }, [query]);

  // --- CRITICAL GUARD: MERCHANT ID CHECK ---
  const merchantUid = qrData.uid || qrData.merchantId;

  // 2. DYNAMIC VS FIXED LOGIC
  const isDynamic = useMemo(() => {
    return qrData.dynamicAmount === 'true' || !qrData.amount || qrData.amount === '0';
  }, [qrData]);

  // 3. SYNC FIXED AMOUNT
  useEffect(() => {
    if (!isDynamic && qrData.amount) {
      setAmount(qrData.amount);
    }
  }, [isDynamic, qrData.amount]);

  // --- 4. ERROR STATE: MISSING MERCHANT ---
  if (!merchantUid) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center p-6 text-center">
        <div className="space-y-6 max-w-sm">
          <div className="bg-red-500/10 p-6 rounded-[2.5rem] border border-red-500/20 mx-auto w-fit">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic">Invalid QR Asset</h2>
          <p className="text-zinc-500 text-sm font-medium">This payment link is malformed or expired. Please ask the merchant to generate a new QR code.</p>
          <button onClick={() => window.location.reload()} className="text-orange-500 text-xs font-black uppercase tracking-widest">Retry Scan</button>
        </div>
      </div>
    );
  }

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // --- PHONE SANITIZER ---
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.substring(1);
    if ((cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) && cleanPhone.length === 9) {
      cleanPhone = '254' + cleanPhone;
    }

    // Sandbox override for testing environment
const finalPhone = cleanPhone;
    if (finalPhone.length < 12) {
      setError('Invalid Number. Use 2547XXXXXXXX');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/daraja/customer-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          phoneNumber: finalPhone,
          amount: parseFloat(amount),
          merchantId: merchantUid, // Passed securely
          reference: qrData.reference || 'WEB_PAY',
          name: qrData.name
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setSuccess('STK Push Sent! Enter PIN on your phone.');
      } else {
        setError(result.error || result.message || 'Payment failed to initiate.');
      }
    } catch (err) {
      setError('Network failure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualPay = () => {
    const link = `mpesa://paybill?business=${qrData.shortcode || '174379'}&amount=${amount}&account=${qrData.reference || 'PAY'}`;
    window.location.href = link;
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-2xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 p-8 rounded-[3.5rem] shadow-2xl w-full max-w-md relative overflow-hidden">
        
        <Zap className="absolute -right-10 -top-10 h-40 w-40 text-orange-600 opacity-5 -rotate-12" />

        <div className="text-center space-y-4 mb-10 relative z-10">
          <div className="bg-orange-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-600/30">
            <Smartphone className="text-zinc-950 w-10 h-10" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 italic mb-1">Secure Payment to</p>
            <h2 className="text-4xl font-black text-zinc-950 dark:text-white uppercase italic tracking-tighter leading-none">
              {qrData.name || 'Merchant Store'}
            </h2>
          </div>
        </div>

        <form onSubmit={handlePay} className="space-y-6 relative z-10">
          <div className="bg-orange-600 p-8 rounded-[2.5rem] text-center relative overflow-hidden">
            <label className="text-[10px] uppercase font-black text-zinc-900/60 tracking-widest block mb-2 italic">Total KES</label>
            {isDynamic ? (
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent border-none text-5xl font-black text-zinc-900 focus:ring-0 text-center placeholder:text-zinc-900/20 italic tracking-tighter outline-none"
                required
              />
            ) : (
              <div className="text-6xl font-black text-zinc-900 italic tracking-tighter">
                {Number(amount).toLocaleString()}
              </div>
            )}
            <DollarSign className="absolute -left-4 -bottom-4 h-24 w-24 text-zinc-900 opacity-5 rotate-12" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-zinc-500 ml-4 tracking-[0.2em] italic">M-Pesa Number</label>
            <input
              type="tel"
              placeholder="07XXXXXXXX"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              className="h-20 w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[2rem] text-center text-2xl font-black text-zinc-950 dark:text-white focus:border-orange-600 transition-all outline-none"
              required
            />
          </div>

          <div className="pt-4 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-orange-600 hover:bg-orange-700 text-zinc-950 rounded-[2rem] font-black uppercase italic tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl shadow-orange-600/30 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <>Confirm Payment <ArrowUpRight className="w-5 h-5" /></>}
            </button>

            <button
              type="button"
              onClick={handleManualPay}
              className="w-full py-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-orange-600 transition-colors italic text-center"
            >
              Manual Pay via App
            </button>
          </div>
        </form>

        {(error || success) && (
          <div className={`mt-8 p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in slide-in-from-bottom-2 ${
            error ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-orange-600/10 border-orange-600/20 text-orange-600'
          }`}>
            {error ? <AlertCircle className="shrink-0" /> : <CheckCircle className="shrink-0" />}
            <p className="text-[11px] font-black uppercase tracking-tight italic leading-tight">{error || success}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayPrompt;