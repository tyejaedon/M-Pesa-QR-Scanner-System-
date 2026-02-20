import React, { useState, useEffect } from 'react';
import { QrCode, Edit3, Eye, Save, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import QRCode from 'qrcode';

// We import the sub-components we built earlier
import MenuView from './MenuView';
import generateMenuQR from './MerchantQRGenerator';
import { 
  Download, 
  Share2
} from 'lucide-react';
import SubscriptionShield from '../hooks/SubscriptionShield';
import { API_BASE_URL } from '../utility/constants';
const MenuModule = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'preview', or 'qr'
  const [isSaving, setIsSaving] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 

  // 1. Load Data
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/menu/${user.uid}`);
        if (response.data.success) setItems(response.data.menu);
      } catch (err) { console.error("Fetch error", err); }
    };
    if (user) fetchMenu();
  }, [user]);

  // 2. Handle CRUD Logic (Siphoned from Editor)
  const handleInputChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addRow = () => setItems([...items, { name: '', price: '', category: 'Mains', isAvailable: true }]);

  const removeRow = (index) => setItems(items.filter((_, i) => i !== index));

  // 3. Save & Generate QR
const handleSaveAndPublish = async () => {
    setIsSaving(true);
    setError(''); // Clear any previous errors

    try {
      const token = await user.getIdToken();
      
      // 1. Save Menu to Backend using standard Axios convention
      const response = await axios.post(`${API_BASE_URL}/api/menu/save`, { 
        merchantId: user.uid,
        items: items 
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true' 
        }
      });

      // 2. Check for backend success flag
      if (response.data.success) {
        // Generate Menu Deep Link QR
        const deepLink = `${window.location.origin}/public/menu/${user.uid}`;
        
        // Brand the QR code to match your high-end Orange UI
        const qrUrl = await QRCode.toDataURL(deepLink, { 
          width: 400,
          margin: 2,
          color: {
            dark: '#ea580c', // text-orange-600
            light: '#ffffff' // pure white background
          }
        });
        
        setQrCodeUrl(qrUrl);
        setViewMode('qr'); 
      } else {
        setError(response.data.message || "Failed to save menu configuration.");
      }
    } catch (err) {
      console.error("Menu Save Error:", err);
      setError("An error occurred while synchronizing your menu. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

const handleGenerateQRAction = async () => {
    setLoading(true);
    setError(''); 

    try {
      const token = await user.getIdToken();

      // Requesting a Dynamic QR from your backend Daraja integration
      const response = await axios.post(`${API_BASE_URL}/daraja/generate-qr`, {
        merchantId: user.uid,
        amount: 0, // Dynamic amount (customer types it in)
        description: "Merchant Terminal Payment"
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true' 
        }
      });

      // Handle the Daraja standard response
      if (response.data.success) {
        // Assuming your backend returns the Daraja QR string or Base64 Image
        setQrCodeUrl(response.data.qrCodeUrl || response.data.qrData);
        setViewMode('qr');
      } else {
        setError(response.data.message || "Failed to initialize M-Pesa QR asset.");
      }
    } catch (err) {
      console.error("Daraja QR Generation Error:", err);
      setError("Payment network error. Could not fetch QR code.");
    } finally {
      setLoading(false);
    }
  };

return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- Rebranded Segmented Control: Deep Black & Bold Orange --- */}
      <div className="bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-[2rem] shadow-2xl flex gap-1 border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setViewMode('edit')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all text-xs font-black uppercase tracking-widest ${viewMode === 'edit' ? 'bg-orange-600 text-zinc-950 dark:text-white shadow-lg shadow-orange-600/20' : 'text-zinc-500 hover:text-zinc-950 dark:text-white'}`}
        >
          <Edit3 className="w-4 h-4" /> 
          <span>Edit</span>
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all text-xs font-black uppercase tracking-widest ${viewMode === 'preview' ? 'bg-orange-600 text-zinc-950 dark:text-white shadow-lg shadow-orange-600/20' : 'text-zinc-500 hover:text-zinc-950 dark:text-white'}`}
        >
          <Eye className="w-4 h-4" /> 
          <span>Preview</span>
        </button>
        <button
          onClick={handleGenerateQRAction}
          className={`flex-[1.2] flex items-center justify-center gap-2 py-4 rounded-2xl transition-all text-xs font-black uppercase tracking-widest ${viewMode === 'qr' ? 'bg-white text-zinc-950 shadow-lg' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'} active:scale-95`}
        >
          <QrCode className="w-4 h-4" />
          <span className="whitespace-nowrap">View QR</span>
        </button>
      </div>

      {/* --- Dynamic Content Area --- */}
      <div className="min-h-[400px]">
        
        {/* MODE: EDIT - Rebranded for High-Contrast Data Entry */}
        {viewMode === 'edit' && (
          <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-4 md:p-8 shadow-2xl border border-zinc-900 space-y-6">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col gap-4 p-6 bg-zinc-100 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 group relative transition-all focus-within:ring-2 focus-within:ring-orange-600/30">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                      <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block tracking-[0.2em]">Dish Name</label>
                      <input
                        value={item.name}
                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-bold text-zinc-950 dark:text-white outline-none focus:border-orange-600 transition-colors placeholder:text-zinc-700"
                        placeholder="e.g. Traditional Platter"
                      />
                    </div>
                    <div className="sm:w-44">
                      <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block tracking-[0.2em]">Price (KES)</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleInputChange(index, 'price', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-black text-orange-500 outline-none focus:border-orange-600"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => removeRow(index)} 
                    className="flex items-center justify-center gap-2 py-3 text-red-500 font-black text-xs uppercase bg-red-500/10 rounded-xl sm:absolute sm:-top-2 sm:-right-2 sm:shadow-xl sm:w-10 sm:h-10 sm:p-0 sm:rounded-full hover:bg-red-500 hover:text-zinc-950 dark:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sm:hidden">Delete Dish</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <button 
                onClick={addRow} 
                className="w-full py-5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-500 font-black uppercase tracking-widest hover:text-orange-500 hover:border-orange-600/50 hover:bg-orange-600/5 transition-all flex items-center justify-center gap-3 active:scale-98"
              >
                <Plus className="w-5 h-5" /> Add New Dish
              </button>
              
              <button
                onClick={handleSaveAndPublish}
                disabled={isSaving}
                className="w-full py-6 bg-orange-600 hover:bg-orange-700 text-zinc-950 dark:text-white rounded-3xl font-black text-lg uppercase tracking-tighter shadow-2xl shadow-orange-600/30 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Syncing Menu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" /> Save & Update QR
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* MODE: PREVIEW - Will inherit the Public branding */}
        {viewMode === 'preview' && <MenuView items={items} />}

        {/* MODE: QR CODE - The Ultimate Presentation Mode */}
        {viewMode === 'qr' && (
          <div className="bg-white dark:bg-zinc-950 p-8 md:p-12 rounded-[3rem] border border-zinc-900 shadow-2xl text-center space-y-10 animate-in zoom-in-95 duration-300">
            <div className="space-y-3">
              <h3 className="text-4xl font-black text-zinc-950 dark:text-white tracking-tighter leading-none uppercase italic">Menu Published!</h3>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Customer-ready QR Link Generated</p>
            </div>

            <div className="relative inline-block p-8 bg-white rounded-[3rem] shadow-[0_0_50px_rgba(255,107,0,0.2)]">
              <img src={qrCodeUrl} alt="Menu QR Code" className="w-60 h-60 md:w-72 md:h-72 rounded-2xl" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-orange-600 text-zinc-950 dark:text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">
                Scan to View
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={qrCodeUrl}
                download="menu-qr.png"
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white rounded-2xl font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-800 transition active:scale-95"
              >
                <Download className="w-5 h-5 text-orange-500" /> Download
              </a>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ 
                      title: 'Our Digital Menu',
                      url: `${window.location.origin}/menu/${merchantId}` 
                    });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-orange-600 text-zinc-950 dark:text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition active:scale-95"
              >
                <Share2 className="w-5 h-5" /> Share Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuModule;