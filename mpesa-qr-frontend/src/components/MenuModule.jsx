import React, { useState, useEffect } from 'react';
import { QrCode, Edit3, Eye, Save, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../utility/constants';
import QRCode from 'qrcode';

// We import the sub-components we built earlier
import MenuView from './MenuView';
import generateMenuQR from './MerchantQRGenerator';
import { 
  Download, 
  Share2
} from 'lucide-react';


const MenuModule = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'preview', or 'qr'
  const [isSaving, setIsSaving] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);

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
    try {
      const token = await user.getIdToken();
      // Save to Backend
      await axios.post(`${API_BASE_URL}/api/menu/save`, { items }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Generate QR Deep Link
      const deepLink = `${window.location.origin}/public/menu/${user.uid}`;
      const qrUrl = await QRCode.toDataURL(deepLink, { width: 400 });
      setQrCodeUrl(qrUrl);

      setViewMode('qr'); // Switch to QR view on success
    } catch (err) {
      alert("Failed to save menu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateQRAction = async () => {
    // 1. Immediate UI Feedback
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      // 2. Perform the actual backend registration
       generateMenuQR();

      // 3. Logic to switch view only if successful
      setViewMode('qr');
    } catch (err) {
      // Error is handled inside generateMenuQR, but you can add local logic here
      console.error("Action failed", err);
    } finally {
      // 4. Always reset loading, regardless of success or failure
      setLoading(false);
    }
  };

 return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* --- Mobile Optimized Segmented Control --- */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
        <button
          onClick={() => setViewMode('edit')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold ${viewMode === 'edit' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Edit3 className="w-4 h-4" /> 
          <span>Edit</span>
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold ${viewMode === 'preview' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Eye className="w-4 h-4" /> 
          <span>Preview</span>
        </button>
        <button
          onClick={handleGenerateQRAction}
          className={`flex-[1.2] flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold ${viewMode === 'qr' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'} active:scale-95`}
        >
          <QrCode className="w-4 h-4" />
          <span className="whitespace-nowrap">View QR</span>
        </button>
      </div>

      {/* --- Dynamic Content Area --- */}
      <div className="min-h-[400px]">
        {/* MODE: EDIT */}
        {viewMode === 'edit' && (
          <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 group relative transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 block tracking-wider">Dish Name</label>
                      <input
                        value={item.name}
                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                        className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                        placeholder="e.g. Traditional Platter"
                      />
                    </div>
                    <div className="sm:w-44">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 block tracking-wider">Price (KES)</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleInputChange(index, 'price', e.target.value)}
                        className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 font-black text-blue-700 outline-none focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeRow(index)} 
                    className="flex items-center justify-center gap-2 py-2 text-rose-500 font-bold text-sm bg-rose-50 rounded-lg sm:absolute sm:-top-2 sm:-right-2 sm:shadow-md sm:w-8 sm:h-8 sm:p-0 sm:rounded-full hover:bg-rose-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sm:hidden">Remove Item</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={addRow} 
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Plus className="w-5 h-5" /> Add New Dish
              </button>
              
              <button
                onClick={handleSaveAndPublish}
                disabled={isSaving}
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:grayscale"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Syncing Dishes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Save & Update QR
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* MODE: PREVIEW */}
        {viewMode === 'preview' && <MenuView items={items} />}

        {/* MODE: QR CODE */}
        {viewMode === 'qr' && (
          <div className="bg-white p-6 md:p-10 rounded-[40px] border border-slate-100 shadow-xl text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Your Menu is Ready!</h3>
              <p className="text-slate-500 text-sm font-medium">Place this QR code on your tables for customers</p>
            </div>

            <div className="relative inline-block p-6 bg-white rounded-[32px] border-8 border-blue-50 shadow-inner">
              <img src={qrCodeUrl} alt="Menu QR Code" className="w-56 h-56 md:w-64 md:h-64 rounded-xl" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={qrCodeUrl}
                download="menu-qr.png"
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition active:scale-95"
              >
                <Download className="w-5 h-5" /> Download
              </a>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ 
                      title: 'View Our Digital Menu',
                      url: `${window.location.origin}/menu/${merchantId}` 
                    });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition active:scale-95"
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