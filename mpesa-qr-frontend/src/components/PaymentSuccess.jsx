import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase'; 
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { CheckCircle, ArrowLeft, Download, Share2, Zap, Loader2 } from 'lucide-react';

const PaymentSuccess = () => {
  const { checkoutRequestId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // Aligned with schema lowercase: pending, success, failed
  const [txnData, setTxnData] = useState(null);

  useEffect(() => {
    if (!checkoutRequestId) return;

    // 1. QUERY OPTIMIZATION: Matching your nested schema path
    const q = query(
      collection(db, "transactions"), 
      where("mpesaResponse.CheckoutRequestID", "==", checkoutRequestId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setTxnData(data);
        // Using lowercase to match your schema's enum [pending, success, failed]
        setStatus(data.status?.toLowerCase() || 'pending'); 
      }
    }, (err) => {
      console.error("Firestore Listener Error:", err);
    });

    return () => unsubscribe();
  }, [checkoutRequestId]);

  return (
    <div className="min-h-screen bg-white dark:bg-brand-black flex items-center justify-center p-6 transition-colors duration-500 animate-in fade-in duration-700">
      
      <div className="w-full max-w-sm space-y-10 text-center">
        
        {/* --- THE VICTORY CARD --- */}
        <div className={`relative overflow-hidden p-10 rounded-[4rem] transition-all duration-1000 shadow-2xl ${
          status === 'success' 
            ? '!bg-brand-orange shadow-brand-orange/30 scale-100' 
            : 'bg-zinc-50 dark:bg-brand-gray border-2 border-zinc-100 dark:border-brand-gray/50 scale-95 opacity-80'
        }`}>
          
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Status Icon Wrapper */}
            <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 shadow-xl ${
              status === 'success' ? 'bg-brand-black' : '!bg-brand-orange animate-pulse rotate-12'
            }`}>
              {status === 'success' ? (
                <CheckCircle className="w-14 h-14 !text-brand-orange" />
              ) : (
                <Loader2 className="w-14 h-14 text-brand-black animate-spin" />
              )}
            </div>

            <div className="space-y-3">
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] italic ${
                status === 'success' ? 'text-brand-black/50' : 'text-zinc-400'
              }`}>
                {status === 'success' ? 'Terminal Verified' : 'Gateway Syncing'}
              </p>
              <h1 className={`text-4xl font-black uppercase italic tracking-tighter leading-[0.85] transition-colors ${
                status === 'success' ? 'text-brand-black' : 'text-zinc-950 dark:text-white'
              }`}>
                {status === 'success' ? 'Payment <br/> Received.' : 'Confirming <br/> M-Pesa...'}
              </h1>
            </div>

            {status === 'success' && (
              <div className="w-full pt-8 border-t border-brand-black/10 space-y-2">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xs font-black text-brand-black/60 uppercase italic">KES</span>
                  <p className="text-6xl font-black text-brand-black italic tracking-tighter">
                    {txnData?.amount}
                  </p>
                </div>
                <p className="text-[10px] font-black text-brand-black/40 uppercase tracking-[0.2em]">
                  {txnData?.paymentDetails?.mpesaReceiptNumber || 'MPESA_TXN_ID'}
                </p>
              </div>
            )}
          </div>

          <Zap className={`absolute -right-10 -bottom-10 h-64 w-64 transition-opacity duration-1000 ${
            status === 'success' ? 'text-brand-black opacity-5' : 'text-brand-orange opacity-5'
          } rotate-12`} />
        </div>

        {/* --- MOBILE ACTIONS --- */}
        {status === 'success' && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-10 duration-1000">
            <div className="grid grid-cols-2 gap-4">
              <button className="h-16 bg-zinc-100 dark:bg-brand-gray border border-zinc-200 dark:border-brand-gray/50 text-brand-black dark:text-white rounded-3xl font-black uppercase italic text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Download className="w-4 h-4 !text-brand-orange" /> Receipt
              </button>
              <button className="h-16 bg-zinc-100 dark:bg-brand-gray border border-zinc-200 dark:border-brand-gray/50 text-brand-black dark:text-white rounded-3xl font-black uppercase italic text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Share2 className="w-4 h-4 !text-brand-orange" /> Share
              </button>
            </div>

            <button 
              onClick={() => navigate('/')}
              className="h-20 bg-brand-black dark:bg-white text-white dark:text-brand-black rounded-[2.2rem] font-black uppercase italic text-sm tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl"
            >
              <ArrowLeft className="w-5 h-5" /> Done
            </button>
          </div>
        )}

        {status === 'pending' && (
          <div className="space-y-4">
            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse italic">
              Awaiting Secure Callback
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;