import React, { useState } from 'react';
import QRCode from 'qrcode';
import axios from 'axios';
import {
  Download,
  Share2,
  AlertCircle,
  ArrowUpRight,
  Loader2,
  Zap,
  QrCode
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { useAuth } from '../hooks/useAuth';
import SubscriptionShield from '../hooks/SubscriptionShield';
import { API_BASE_URL } from '../utility/constants';

const MerchantQRGenerator = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, merchantData, logout } = useAuth();
  const [merchant, setMerchant] = useState(merchantData);

  const generateQRData = async () => {
    if (!user) {
      setError("Authentication required. Please log in.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Get Fresh Token
      const token = await user.getIdToken();

      // 2. Call Backend to verify merchant status and log request
      const response = await axios.post(
        `${API_BASE_URL}/api/daraja/generate-qr`,
        { amount: "0", size: "300" },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        // --- TEST ENVIRONMENT LOGIC (OPTION A: Terminal URL) ---
        // This links to your hosted PayPrompt page which handles the STK trigger.
        // We use window.location.origin to adapt to localhost or production URLs.
        const terminalUrl = `${window.location.origin}/pay?uid=${merchantData.uid}&name=${encodeURIComponent(merchantData.name)}&shortcode=${merchantData.shortcode}`;

        /* // --- PRODUCTION LOGIC (OPTION B: Direct M-Pesa Data) ---
        // Use this only if you want to bypass your web UI and open M-Pesa directly.
        // const qrRawData = response.data.data.qrCode; 
        */

        // 3. Render the QR Image
        const qrImageUrl = await QRCode.toDataURL(terminalUrl, {
          width: 600,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'H'
        });

        setQrCodeUrl(qrImageUrl);
        setSuccess(`Terminal asset provisioned for ${merchantData.name}`);
      }
    } catch (err) {
      console.error('QR Generation Error:', err);
      setError(err.response?.data?.message || 'Synchronization failed. Verify server status.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const cleanName = (merchantData?.name || 'Merchant').replace(/\s+/g, '_');
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${cleanName}_Terminal_Asset.png`;
    link.click();
    setSuccess('Asset exported to local storage.');
  };

  const shareQRCode = async () => {
    if (!qrCodeUrl) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], 'Payment_Asset.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: `Merchant Payment Asset: ${merchantData?.name}`,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin + `/pay?uid=${merchantData.uid}`);
        setSuccess('Payment link copied to clipboard.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError('Distribution failed.');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 p-6 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/20">
                <QrCode className="w-6 h-6 text-zinc-950" />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 italic">
                Operational Toolkit
              </h2>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-zinc-950 dark:text-white tracking-tighter uppercase italic leading-none">
              Asset <span className="text-zinc-400 dark:text-zinc-700">Provisioning</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest md:max-w-[200px] md:text-right">
            Deploying secure payment nodes for {merchant?.name || 'Merchant'}.
          </p>
        </div>

        <SubscriptionShield requiredTier="BASIC" featureName="QR Generation">

          {/* --- GENERATOR CARD --- */}
          <div className="relative overflow-hidden bg-orange-600 text-zinc-950 rounded-[3rem] shadow-2xl shadow-orange-600/20 p-8 md:p-12">
            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 italic">Verified Business Profile</p>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">
                  {merchant.name || 'Loading Profile...'}
                </h2>
                <div className="flex gap-4 pt-2">
                  <Badge className="bg-zinc-950 text-white border-none px-4 py-1">
                    Shortcode: {merchant.shortcode || '174379'}
                  </Badge>
                  <Badge className="bg-zinc-950/20 text-zinc-900 border-none px-4 py-1 uppercase text-[9px]">
                    {merchant.accountType || 'PAYBILL'}
                    {console.log(merchantData)}
                  </Badge>
                </div>
              </div>

              <Button
                onClick={generateQRData}
                disabled={loading}
                // FIXED: Added physical 3D elevation (Gradient + Top Highlight + Tighter Colored Shadow)
                className="h-20 w-full md:w-auto px-12 bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-[2rem] font-black uppercase italic tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-orange-600/50 hover:shadow-2xl hover:shadow-orange-500/60 border border-orange-700/50 border-t-white/20"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin mr-3 text-white" />
                ) : (
                  <Zap className="w-6 h-6 fill-white text-white mr-3" />
                )}
                {loading ? 'Synchronizing...' : 'Initialize Payment Asset'}
              </Button>
            </div>
            <QrCode className="absolute -right-12 -bottom-12 h-80 w-80 text-zinc-950 opacity-10 -rotate-12" />
          </div>

          {/* --- QR RESULT --- */}
          {qrCodeUrl && (
            <div className="mt-10 animate-in zoom-in-95 duration-500">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-zinc-100 dark:border-zinc-800 p-10 md:p-16 flex flex-col items-center space-y-10 shadow-2xl rounded-[4rem]">
                <div className="relative p-10 bg-white rounded-[3.5rem] shadow-xl">
                  <img src={qrCodeUrl} alt="Terminal QR" className="w-64 h-64 md:w-80 md:h-80 object-contain" />
                </div>

                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-black text-zinc-950 dark:text-white uppercase italic tracking-tighter">
                    Terminal Asset <span className="text-orange-600">Active</span>
                  </h3>
                  <div className="flex justify-center gap-3">
                    <div className="px-4 py-2 bg-white dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      ID: {merchant?.uid?.slice(-8).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                  <Button onClick={downloadQRCode} variant="outline" className="h-16 rounded-2xl gap-2 font-black uppercase text-xs border-zinc-200">
                    <Download className="w-4 h-4 text-orange-600" /> Export PNG
                  </Button>
                  <Button onClick={shareQRCode} variant="outline" className="h-16 rounded-2xl gap-2 font-black uppercase text-xs border-zinc-200">
                    <Share2 className="w-4 h-4 text-orange-600" /> Share Link
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 italic font-black uppercase text-[10px]">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {success && !error && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center gap-3 italic font-black uppercase text-[10px]">
              <Zap className="w-4 h-4" /> {success}
            </div>
          )}
        </SubscriptionShield>
      </div>
    </div>
  );
};

export default MerchantQRGenerator;