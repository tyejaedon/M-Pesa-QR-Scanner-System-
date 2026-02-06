import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Download, 
  Share2, 
  AlertCircle, 
  CheckCircle,
  QrCode
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button'; // Default export
import Input from './ui/Input';   // Default export
import { Label } from './ui/Label';
import { Badge } from './ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../utility/constants';


const MerchantQRGenerator = () => {
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [qrData, setQrData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const qrRef = useRef(null);
  const { user } = useAuth();

  // Generate QR data using backend
const generateQRData = async () => {
  setLoading(true);
  setError('');
  setSuccess('');

  try {
    const token = await user.getIdToken();
    
    // Construct the Deep Link URL for the QR code
    // If you have a specific price (fixed amount), we append it as a query param
    const baseUrl = window.location.origin;
    const menuPath = `/public/menu/${user.uid}`;
    // Support for potential fixed-price items in the future:
    const priceParam = amount ? `?amount=${amount}` : ''; 
    const deepLinkUrl = `${baseUrl}${menuPath}${priceParam}`;

    const response = await fetch(`${API_BASE_URL}/api/daraja/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        // 1. M-Pesa Standard Fields
        dynamicAmount: !amount, // If no price is set, it's dynamic
        description: description || 'Payment',
        reference: reference || 'MENU-PAY',
        businessName: businessName || 'Merchant',
        
        // 2. The Secret Sauce: The Deep Link URL
        // This tells the backend to encode a URL instead of just JSON
        qrUrl: deepLinkUrl 
      })
    });

    const result = await response.json(); // Use json() directly for cleaner code

    if (response.ok && result.success) {
      // Store the full response for legacy/state tracking
      setQrData(result.data);

      // result.data.qrUrl is now our deepLinkUrl processed by Safaricom/Backend
      if (result.data?.qrUrl) {
        try {
          // Generate the visual QR image
          const qrImageUrl = await generateQRCodeImage(result.data.qrUrl, '400x400');
          setQrCodeUrl(qrImageUrl);
          setSuccess('Dynamic QR Code with Menu Link generated! Scan to test.');
        } catch (imgErr) {
          throw new Error('Failed to render the QR image.');
        }
      }
    } else {
      setError(result.message || 'Failed to generate QR code');
    }
  } catch (err) {
    console.error('QR Generation Error:', err);
    setError(err.message || 'Failed to connect to the server.');
  } finally {
    setLoading(false);
  }
};

  const generateMenuQR = async () => {
  setLoading(true);
  setError('');
  setSuccess('');

  try {
    const token = await user.getIdToken();
    
    // We point the QR directly to the Public Menu Route
    // This allows the scanner to 'siphon' the merchantId from the URL
    const publicMenuUrl = `${window.location.origin}/public/menu/${user.uid}`;

    const response = await fetch(`${API_BASE_URL}/api/daraja/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        dynamicAmount: true, // Menu items have different prices
        description: `Menu for ${businessName || 'Merchant'}`,
        qrUrl: publicMenuUrl, // The Deep Link
        merchantId: user.uid
      })
    });

    // 1. Network/HTTP Level Error Handling
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server responded with ${response.status}`);
    }

    const result = await response.json();

    // 2. Data Integrity Handling
    if (result.success && result.data?.qrUrl) {
      setQrData(result.data);
      
      try {
        const qrImageUrl = await generateQRCodeImage(result.data.qrUrl, '400x400');
        setQrCodeUrl(qrImageUrl);
        setSuccess('Digital Menu QR Code generated! Customers can now scan to view your items.');
      } catch (imgErr) {
        throw new Error('QR data received, but failed to render the image. Please try again.');
      }
    } else {
      throw new Error(result.message || 'The server failed to return a valid QR URL.');
    }

  } catch (err) {
    // 3. User-Friendly Error Categorization
    console.error('Menu QR Error:', err);
    if (err.message.includes('401')) {
        setError('Your session has expired. Please log in again.');
    } else if (err.message.includes('Failed to fetch')) {
        setError('Network Error: Check if your backend/ngrok is running.');
    } else {
        setError(err.message || 'An unexpected error occurred during generation.');
    }
  } finally {
    setLoading(false);
  }
};
  // Generate QR code image from data
  const generateQRCodeImage = async (data, size = '300x300') => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: parseInt(size.split('x')[0]),
        height: parseInt(size.split('x')[1]),
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code image:', error);
      throw error;
    }
  };

  // Generate unique reference
  const generateReference = () => {
    const timestamp = Date.now().toString().slice(-6);
    setReference(`REF${timestamp}`);
  };

  // Clear form
  const clearForm = () => {
    setDescription('');
    setReference('');
    setBusinessName('');
    setQrData(null);
    setQrCodeUrl('');
    setError('');
    setSuccess('');
  };

  // Download QR code
  const downloadQRCode = async () => {
    if (!qrData || !qrCodeUrl) {
      setError('Generate a QR code first');
      return;
    }

    try {
      // Use qrUrl for download as well
      const qrImageUrl = await generateQRCodeImage(qrData.qrUrl, '400x400');
      
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.download = `mpesa-qr-dynamic-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('QR code downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download QR code');
    }
  };

  // Share QR code
  const shareQRCode = async () => {
    if (!qrData || !qrCodeUrl) {
      setError('Generate a QR code first');
      return;
    }

    try {
      if (navigator.share) {
        // Convert data URL to blob for sharing
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const file = new File([blob], `mpesa-qr-dynamic.png`, { type: 'image/png' });

        await navigator.share({
          title: `M-Pesa Payment QR - Dynamic Amount`,
          text: `Pay to ${qrData.businessName} by scanning this M-Pesa QR code and entering your amount`,
          files: [file]
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`Pay to ${qrData.businessName} - M-Pesa QR Code Generated`);
        setSuccess('Payment details copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
      setError('Failed to share QR code');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Generate Dynamic M-Pesa QR Code
          </CardTitle>
          <p className="text-gray-600">Create QR codes that allow customers to enter their own payment amount</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Your Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-gray-500">Displayed to customers</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Payment Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-gray-500">What is this payment for?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="reference"
                  placeholder="Payment Reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  maxLength={20}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateReference}
                  className="flex-shrink-0"
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-gray-500">Your internal reference ID</p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={generateQRData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              {loading ? 'Generating...' : 'Generate QR Code'}
            </Button>
            
            <Button
              variant="outline"
              onClick={clearForm}
              disabled={loading}
              className="flex items-center gap-2"
            >
              Clear
            </Button>
          </div>

          {/* QR Code Display */}
          {qrCodeUrl && (
            <div className="mt-6 border rounded-lg p-6 bg-white">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <img
                    src={qrCodeUrl}
                    alt="M-Pesa QR Code"
                    className="w-64 h-64 object-contain"
                    ref={qrRef}
                  />
                </div>
                
                <div className="text-center space-y-2">
                  <p className="font-bold text-lg">Dynamic Payment QR Code</p>
                  <p className="text-sm text-gray-600">
                    Business: {businessName || 'Your Business'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Description: {description || 'Payment'}
                  </p>
                  {reference && (
                    <p className="text-sm text-gray-600">
                      Reference: {reference}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-2">
                    Customer will enter amount
                  </Badge>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={downloadQRCode}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={shareQRCode}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantQRGenerator;