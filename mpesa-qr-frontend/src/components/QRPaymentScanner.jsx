import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Label from './ui/Label';
import { 
  Camera, 
  QrCode, 
  ArrowLeft, 
  Phone, 
  DollarSign, 
  User, 
  Home, 
  ChevronDown,
  Smartphone,
  Shield,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Lock,
  CreditCard,
  Scan
} from "lucide-react";
import { parseQRCode, generateSampleQRData, validatePhoneNumber, validateAmount } from '../utility/qrParser';
import { API_BASE_URL, STATUS, MPESA_CONFIG, ERROR_MESSAGES } from '../utility/constants';
import axios from 'axios';
import jsQR from 'jsqr';

const QRPaymentScanner = ({ onPaymentInitiated, onNavigateToLanding }) => {
  // Camera and QR states
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [stream, setStream] = useState(null);
  
  // Payment states
  const [phoneNumber, setPhoneNumber] = useState(MPESA_CONFIG.TEST_PHONE);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [paymentStep, setPaymentStep] = useState('scan'); // 'scan', 'details', 'confirm'

  // Camera setup
  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setStream(mediaStream);
        setScannerReady(true);
        
        // Start QR scanning
        scanForQR();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScannerReady(false);
    setIsScanning(false);
  };

  const scanForQR = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && scannerReady) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          console.log('QR Code detected:', code.data);
          handleQRDetected(code.data);
          return;
        }
      }
      
      if (scannerReady) {
        requestAnimationFrame(scan);
      }
    };
    
    scan();
  };

  const handleQRDetected = (qrText) => {
    console.log('Processing QR:', qrText);
    
    const parsedData = parseQRCode(qrText);
    console.log('Parsed QR data:', parsedData);
    
    if (parsedData.isValid) {
      setQrData(parsedData);
      if (parsedData.amount) {
        setAmount(parsedData.amount.toString());
      }
      stopCamera();
      setPaymentStep('details');
      setError("");
    } else {
      setError("Invalid QR code. Please scan a valid merchant payment QR.");
    }
  };

  const handleStartOver = () => {
    setQrData(null);
    setAmount("");
    setError("");
    setPaymentStep('scan');
  };

  const handleUseCamera = () => {
    setIsScanning(true);
    setPaymentStep('scan');
    startCamera();
  };

  const handleTestQR = () => {
    const testQRData = generateSampleQRData();
    console.log('Testing with sample QR:', testQRData);
    const parsedData = parseQRCode(testQRData);
    setQrData(parsedData);
    if (parsedData.amount) {
      setAmount(parsedData.amount.toString());
    }
    setPaymentStep('details');
  };

  // Customer payment function
  const triggerCustomerPayment = async (paymentRequest) => {
    try {
      console.log('Starting customer payment request...');
      
      const response = await axios.post(
        `${API_BASE_URL}/daraja/customer-payment`,
        paymentRequest,
        {
          headers: { 'Content-Type': 'application/json','ngrok-skip-browser-warning': 'true' },
          timeout: 60000
        }
      );
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            transactionId: response.data.data?.transactionId,
            checkoutRequestID: response.data.data?.CheckoutRequestID,
            merchantRequestID: response.data.data?.MerchantRequestID,
            customerMessage: response.data.data?.CustomerMessage,
            instructions: response.data.data?.instructions
          }
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Payment failed'
        };
      }
    } catch (err) {
      console.error('Payment request error:', err);
      
      let errorMessage = 'Network error';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const handleConfirmPayment = async () => {
    if (!qrData || !phoneNumber || !amount) {
      setError("All fields are required");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError(ERROR_MESSAGES.INVALID_PHONE);
      return;
    }

    if (!validateAmount(amount)) {
      setError(ERROR_MESSAGES.INVALID_AMOUNT);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const paymentRequest = {
        phoneNumber: phoneNumber.trim(),
        amount: parseFloat(amount),
        qrData: {
          merchantId: qrData.merchantId || `qr-${Date.now()}`,
          name: qrData.merchantName || QrData.name || 'QR Merchant',
          businessShortCode: qrData.businessShortCode || MPESA_CONFIG.SANDBOX_SHORTCODE
        }
      };

      const result = await triggerCustomerPayment(paymentRequest);

      if (result.success) {
        const paymentData = {
          merchantName: qrData.merchantName || QrData.name || "QR Merchant",
          phoneNumber,
          amount: parseFloat(amount),
          timestamp: new Date(),
          ...result.data,
          status: STATUS.PENDING,
          isCustomerPayment: true
        };
        
        console.log('Payment initiated successfully:', paymentData);
        if (onPaymentInitiated) {
          onPaymentInitiated(paymentData);
        }
      } else {
        setError(`Payment failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(`Payment failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getMerchantDisplayName = () => {
    if (qrData?.merchantName) return qrData.merchantName;
    if (qrData?.name) return QrData.name;
    return "QR Merchant";
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

return (
    // Rebranded: Deep Zinc-Black background for AMOLED optimization
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-20 relative selection:bg-orange-600/30">
      
      {/* Header - Rebranded for High-Contrast Impact */}
      <div className="bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-orange-600 p-2.5 rounded-2xl shadow-lg shadow-orange-600/20">
                <QrCode className="w-6 h-6 text-zinc-950 dark:text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase italic tracking-tighter">
                  M-Pesa <span className="text-orange-600">QR</span> Pay
                </h1>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Scan • Authorize • Pay</p>
              </div>
            </div>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNavMenu(!showNavMenu)}
                className="text-zinc-400 hover:text-zinc-950 dark:text-white hover:bg-zinc-800"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              
              {showNavMenu && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-zinc-100 dark:bg-zinc-900 rounded-2xl shadow-2xl py-3 z-50 border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => { setShowNavMenu(false); onNavigateToLanding(); }}
                    className="w-full px-5 py-4 text-left text-zinc-300 hover:text-zinc-950 dark:text-white hover:bg-zinc-800 flex items-center gap-4 transition-colors"
                  >
                    <Home className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-sm uppercase tracking-tight">Exit Terminal</span>
                  </button>
                  <button
                    onClick={() => { setShowNavMenu(false); handleStartOver(); }}
                    className="w-full px-5 py-4 text-left text-zinc-300 hover:text-zinc-950 dark:text-white hover:bg-zinc-800 flex items-center gap-4 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-sm uppercase tracking-tight">Restart Flow</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        
        {/* Progress Steps - Rebranded with Orange/Zinc */}
        <div className="px-2">
          <div className="flex items-center justify-between">
            {[ 
              { step: 'scan', label: 'Scan', id: 1 },
              { step: 'details', label: 'Details', id: 2 },
              { step: 'confirm', label: 'Pay', id: 3 }
            ].map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className={`flex flex-col items-center gap-2 ${
                  paymentStep === s.step ? 'text-orange-500' : 'text-zinc-600'
                }`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                    paymentStep === s.step ? 'bg-orange-600 text-zinc-950 dark:text-white shadow-lg shadow-orange-600/20' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800'
                  }`}>
                    {s.id}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
                {idx < 2 && <div className="flex-1 h-[2px] bg-zinc-100 dark:bg-zinc-900 mx-2 mt-[-20px]"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Display - Rebranded for High Contrast */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4 animate-in shake">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-bold leading-tight">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-zinc-600 hover:text-zinc-950 dark:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 1: QR Scanning - Optimized for S22 */}
        {paymentStep === 'scan' && (
          <>
            {isScanning && scannerReady ? (
              <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-orange-600 text-zinc-950 dark:text-white p-6">
                  <CardTitle className="flex items-center gap-3 font-black uppercase italic tracking-tighter">
                    <Scan className="w-6 h-6" /> Live Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative aspect-square md:aspect-video bg-black">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    {/* Rebranded Scan Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-orange-600 border-dashed w-56 h-56 rounded-[2rem] flex items-center justify-center bg-orange-600/5">
                        <QrCode className="w-16 h-16 text-zinc-950 dark:text-white opacity-20" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <Button onClick={stopCamera} variant="outline" className="w-full h-14 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400 rounded-2xl font-black uppercase tracking-widest">
                      <X className="w-5 h-5 mr-2" /> Stop Scanner
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Welcome Screen - High-Contrast Black/Orange */
              <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[3rem] overflow-hidden">
                <CardContent className="p-10 text-center space-y-8">
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] w-fit mx-auto border border-zinc-200 dark:border-zinc-800 shadow-inner">
                      <QrCode className="w-12 h-12 text-orange-600" />
                    </div>
                    <h2 className="text-3xl font-black text-zinc-950 dark:text-white italic uppercase tracking-tighter">Ready to <span className="text-orange-600">Pay?</span></h2>
                    <p className="text-zinc-500 text-sm font-medium leading-relaxed">Scan any official merchant QR for instant M-Pesa settlements.</p>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={handleUseCamera} 
                      className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-zinc-950 dark:text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 active:scale-95"
                    >
                      <Camera className="w-6 h-6 mr-3" /> Start Scanning
                    </Button>
                    <Button variant="outline" onClick={handleTestQR} className="w-full h-14 border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-2xl font-bold uppercase tracking-widest">
                      Demo Mode
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Step 2: Payment Details - Dark Mode Forms */}
        {paymentStep === 'details' && qrData && (
          <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-orange-600 text-zinc-950 dark:text-white p-6">
              <CardTitle className="flex items-center gap-3 font-black uppercase italic tracking-tighter">
                <CheckCircle className="w-6 h-6" /> Data Verified
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-2xl">
                    <User className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Paying To</p>
                    <p className="text-xl font-black text-zinc-950 dark:text-white italic">{getMerchantDisplayName()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Your M-Pesa Number</Label>
                  <Input
                    type="tel"
                    placeholder="254XXXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-14 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-950 dark:text-white font-bold focus:border-orange-600 focus:ring-orange-600 placeholder:text-zinc-800"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Payment Amount (KES)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-14 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl text-orange-500 font-black text-2xl focus:border-orange-600 focus:ring-orange-600"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={handleStartOver} className="h-14 px-6 border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-2xl font-black uppercase">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Button onClick={() => setPaymentStep('confirm')} disabled={!phoneNumber || !amount} className="flex-1 h-16 bg-orange-600 hover:bg-orange-700 text-zinc-950 dark:text-white rounded-2xl font-black uppercase tracking-widest">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment Confirmation - Premium Tech Layout */}
        {paymentStep === 'confirm' && qrData && (
          <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white p-8 border-b border-zinc-200 dark:border-zinc-800">
              <CardTitle className="flex items-center gap-3 font-black uppercase italic tracking-tighter text-2xl">
                <Lock className="w-7 h-7 text-orange-600" /> Confirm
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="bg-orange-600/5 rounded-[2rem] p-8 border border-orange-600/20">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">To Merchant</span>
                    <span className="font-black text-zinc-950 dark:text-white italic">{getMerchantDisplayName()}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800/50 pt-6">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Settlement</span>
                    <span className="text-3xl font-black text-orange-500 tracking-tighter italic">KSH {amount}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-950 p-6 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 flex items-start gap-4">
                <Smartphone className="w-6 h-6 text-orange-600 mt-1" />
                <div className="space-y-2">
                  <h4 className="font-black text-zinc-950 dark:text-white text-[10px] uppercase tracking-widest">Next Action Required</h4>
                  <p className="text-zinc-500 text-xs leading-relaxed">An STK push will be sent to your device. Enter your M-Pesa PIN to authorize this settlement instantly.</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setPaymentStep('details')} className="h-16 px-8 border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-2xl font-black uppercase">
                  Edit
                </Button>
                <button 
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="flex-1 h-16 bg-orange-600 hover:bg-orange-700 text-zinc-950 dark:text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-orange-600/30 flex items-center justify-center gap-4 active:scale-95 transition-all"
                >
                  {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                  <span className="text-lg">Authorize Pay</span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QRPaymentScanner;