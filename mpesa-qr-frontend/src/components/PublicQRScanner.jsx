import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  AlertCircle,
  Camera,
  CameraOff,
  RefreshCw,
  Smartphone,
  Phone,
  DollarSign
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { Label } from './ui/Label';
import { API_BASE_URL } from '../utility/constants';

const PublicQRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraPermission, setCameraPermission] = useState(null);
  const [html5QrCode, setHtml5QrCode] = useState(null);

  useEffect(() => {
    // Initialize the scanner logic wrapper
    const qrCodeScanner = new Html5Qrcode('qr-reader');
    setHtml5QrCode(qrCodeScanner);

    // Cleanup on unmount
    return () => {
      if (qrCodeScanner && qrCodeScanner.isScanning) {
        qrCodeScanner.stop().catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, []);

  const startScanner = async () => {
    setScanning(true);
    setError('');

    try {
      setCameraPermission('requesting');
      
      if (!html5QrCode) return;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Prefer back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        onScanSuccess,
        onScanFailure
      );
      
      setCameraPermission('granted');
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Camera access denied. Please check your browser permissions.');
      setScanning(false);
      setCameraPermission('denied');
    }
  };

  const stopScanner = async () => {
    if (html5QrCode && html5QrCode.isScanning) {
      try {
        await html5QrCode.stop();
        console.log('Scanner paused');
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const onScanSuccess = (decodedText) => {
    console.log('QR Code detected:', decodedText);
    stopScanner(); // Stop camera immediately
    
    // 1. DYNAMIC URL DETECTION (Redirect Mode)
    if (decodedText.startsWith('http')) {
      try {
        // If it's a deep link to your own app, just redirect
        window.location.href = decodedText;
        return; 
      } catch (e) {
        console.error('URL parsing failed, falling back to JSON check', e);
      }
    }

    // 2. LEGACY JSON PARSING (Embedded Mode)
    try {
      const parsedData = JSON.parse(decodedText);
      setQrData(parsedData);
      
      // Auto-fill Amount if fixed
      if (parsedData.dynamicAmount === 'true' || parsedData.dynamicAmount === true) {
        setAmount(''); 
      } else if (parsedData.amount) {
        setAmount(parsedData.amount.toString()); 
      }
      
    } catch (err) {
      console.error('Error parsing QR data:', err);
      setError('Invalid QR format. Use a valid Merchant Terminal QR.');
      setQrData(null);
    }
  };

  const onScanFailure = (error) => {
    // Suppress console spam for "no qr found"
  };

  const resetScanner = () => {
    stopScanner();
    setQrData(null);
    setPhoneNumber('');
    setAmount('');
    setError('');
    setSuccess('');
  };

  const processPayment = async () => {
    if (!qrData) return setError('Please scan a QR code first');
    if (!phoneNumber) return setError('Enter M-Pesa number');
    if (!amount) return setError('Enter valid amount');

    setLoading(true);
    setError('');
    setSuccess('');

    // Phone Sanitization
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.substring(1);
    if ((cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) && cleanPhone.length === 9) cleanPhone = '254' + cleanPhone;

    if (cleanPhone.length < 12) {
        setLoading(false);
        return setError('Invalid Phone Format (Use 07XX... or 2547...)');
    }

    try {
      // Use the centralized API constant
      const response = await fetch(`${API_BASE_URL}/api/daraja/customer-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          amount: parseFloat(amount),
          qrData: qrData, // Send full QR object for context
          merchantId: qrData.uid || qrData.merchantId, // Fallback support
          name: qrData.name
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess(`STK Push Sent! Check phone ${cleanPhone} to complete.`);
      } else {
        setError(result.message || 'Payment initiation failed.');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4 selection:bg-orange-600/30">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="bg-orange-600 p-3 rounded-2xl w-fit mx-auto shadow-lg shadow-orange-600/20 mb-4">
            <QrCode className="w-8 h-8 text-zinc-950 dark:text-white" />
          </div>
          <h1 className="text-3xl font-black text-zinc-950 dark:text-white italic uppercase tracking-tighter">
            M-Pesa <span className="text-orange-600">Scanner</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            Instant Merchant Recognition
          </p>
        </div>

        <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 space-y-6">
            
            {/* --- SCANNER VIEW --- */}
            {!qrData ? (
              <div className="space-y-6">
                <div 
                  id="qr-reader" 
                  className={`relative bg-white dark:bg-zinc-950 rounded-[2rem] overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 ${!scanning ? 'h-64 flex items-center justify-center' : 'min-h-[300px]'}`}
                >
                  {!scanning && (
                    <div className="text-center p-8 animate-in fade-in duration-500">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-zinc-800" />
                      <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Camera Standby</p>
                    </div>
                  )}
                  
                  {/* Visual Crosshairs */}
                  {scanning && (
                    <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent z-10">
                       <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-600 rounded-tl-xl"></div>
                       <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-600 rounded-tr-xl"></div>
                       <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-600 rounded-bl-xl"></div>
                       <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-600 rounded-br-xl"></div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  {!scanning ? (
                    <Button
                      onClick={startScanner}
                      className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-zinc-950 dark:text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 active:scale-95 transition-all"
                    >
                      <Camera className="w-5 h-5 mr-2" /> Initialize
                    </Button>
                  ) : (
                    <Button
                      onClick={stopScanner}
                      variant="outline"
                      className="w-full h-16 border-zinc-200 dark:border-zinc-800 text-zinc-400 bg-white dark:bg-zinc-950 rounded-2xl font-black uppercase tracking-widest active:scale-95"
                    >
                      <CameraOff className="w-5 h-5 mr-2" /> Stop
                    </Button>
                  )}
                </div>

                {cameraPermission === 'denied' && (
                  <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                    <p className="text-red-400 text-[10px] font-bold uppercase text-center leading-relaxed">
                      Camera Blocked. Check Settings.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* --- PAYMENT FORM --- */
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-zinc-950/50 p-6 rounded-[1.5rem] border-l-4 border-orange-600">
                  <h3 className="font-black text-orange-600 text-xs uppercase tracking-widest mb-3">Target Merchant</h3>
                  <div className="space-y-2">
                    <p className="text-xl font-black text-zinc-950 dark:text-white italic tracking-tight truncate">
                      {/* FIX: Corrected variable case here */}
                      {qrData.name || 'Merchant'}
                    </p>
                    <p className="text-xs text-zinc-500 font-medium">
                      {qrData.description || 'General Payment'}
                    </p>
                    {qrData.reference && (
                      <p className="text-[10px] bg-zinc-100 dark:bg-zinc-900 text-zinc-400 px-2 py-1 rounded w-fit font-bold uppercase tracking-tighter">
                        REF: {qrData.reference}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-zinc-500 font-black uppercase text-[10px] tracking-widest ml-1">M-Pesa Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-600 w-4 h-4" />
                      <Input
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="07XXXXXXXX"
                        className="h-14 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 text-zinc-950 dark:text-white font-bold focus:border-orange-600 focus:ring-orange-600 transition-all"
                        maxLength={12}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-zinc-500 font-black uppercase text-[10px] tracking-widest ml-1">
                      {/* Only show 'Enter Amount' if dynamic, else 'Total Amount' */}
                      {(qrData.dynamicAmount === 'true' || !qrData.amount) ? 'Enter Amount (KES)' : 'Total Amount'}
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-600 w-4 h-4" />
                      <Input
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="h-14 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 text-orange-500 font-black text-xl focus:border-orange-600 focus:ring-orange-600 transition-all"
                        type="number"
                        // Lock input if amount is fixed in QR
                        readOnly={!(qrData.dynamicAmount === 'true' || !qrData.amount)}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-in shake">
                    <p className="text-red-400 text-[10px] font-black uppercase text-center tracking-wide">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-orange-600/10 border border-orange-600/20 rounded-xl p-4">
                    <p className="text-orange-400 text-[10px] font-black uppercase text-center tracking-wide">{success}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={processPayment}
                    disabled={loading}
                    className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-zinc-950 dark:text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Smartphone className="w-5 h-5" /> Push To M-Pesa
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={resetScanner}
                    disabled={loading}
                    className="w-full py-3 text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:text-zinc-950 dark:text-white transition-colors"
                  >
                    Rescan QR Code
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicQRScanner;