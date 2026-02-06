import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../utility/constants';
import MenuView from '../components/MenuView';
import { Utensils, AlertCircle, X, Smartphone, Loader2 } from 'lucide-react';

const PublicMenuPage = () => {
    const { merchantId } = useParams();
    const [menuData, setMenuData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Payment State
    const [selectedItem, setSelectedItem] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState({ type: '', msg: '' });

    useEffect(() => {
        const fetchPublicMenu = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/menu/${merchantId}`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                if (response.data.success) setMenuData(response.data.menu);
                else setError("This merchant's menu is currently empty.");
            } catch (err) {
                setError("Could not load the menu. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        if (merchantId) fetchPublicMenu();
    }, [merchantId]);

    const handleProcessPayment = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setPaymentStatus({ type: 'error', msg: 'Please enter a valid M-Pesa number.' });
            return;
        }

        setIsProcessing(true);
        setPaymentStatus({ type: '', msg: '' });

        try {
            const response = await axios.post(`${API_BASE_URL}/daraja/customer-payment`, {
                phoneNumber: phoneNumber.startsWith('0') ? `254${phoneNumber.slice(1)}` : phoneNumber,
                amount: selectedItem.price,
                merchantId: merchantId,
                description: `Payment for ${selectedItem.name}`,
            }, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });

            if (response.data.success) {
                setPaymentStatus({ 
                    type: 'success', 
                    msg: `Request sent to ${phoneNumber}. Enter M-Pesa PIN on your phone.` 
                });
                setTimeout(() => setSelectedItem(null), 5000); // Close after 5s
            }
        } catch (err) {
            setPaymentStatus({ type: 'error', msg: 'Payment request failed. Try again.' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading Menu...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            {/* Header */}
            <div className="bg-white px-6 py-8 shadow-sm text-center">
                <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Utensils className="text-white w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Digital Menu</h1>
                <p className="text-gray-500 text-sm">Tap an item to pay instantly</p>
            </div>

            <div className="max-w-2xl mx-auto p-4 mt-4">
                {/* Reusing MenuView with an onItemClick handler */}
                <MenuView 
                    items={menuData} 
                    onItemClick={(item) => item.isAvailable && setSelectedItem(item)} 
                />
            </div>

            {/* --- PAYMENT MODAL --- */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{selectedItem.name}</h3>
                                <p className="text-blue-600 font-bold text-lg">KES {selectedItem.price}</p>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">M-Pesa Phone Number</label>
                                <input 
                                    type="tel"
                                    placeholder="0712345678"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                                />
                            </div>

                            {paymentStatus.msg && (
                                <div className={`p-4 rounded-xl text-sm font-medium ${paymentStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {paymentStatus.msg}
                                </div>
                            )}

                            <button 
                                onClick={handleProcessPayment}
                                disabled={isProcessing}
                                className={`w-full py-4 rounded-2xl font-black text-white shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${isProcessing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                                {isProcessing ? 'Sending Request...' : 'Pay with M-Pesa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicMenuPage;