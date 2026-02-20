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
            // ALIGNMENT: Backend expects { phoneNumber, amount, merchantId, name, reference }
            const response = await axios.post(`${API_BASE_URL}/api/daraja/customer-payment`, {
                phoneNumber: phoneNumber.startsWith('0') ? `254${phoneNumber.slice(1)}` : phoneNumber,
                amount: selectedItem.price,
                merchantId: merchantId,
                name: selectedItem.name, // Maps to backend 'name'
                reference: `MNU-${selectedItem.id?.slice(-4) || 'ORDER'}` // Maps to backend 'reference'
            }, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });

            if (response.data.success) {
                setPaymentStatus({
                    type: 'success',
                    msg: `Request sent. Enter M-Pesa PIN on your phone.`
                });
                // Close modal after successful trigger
                setTimeout(() => setSelectedItem(null), 4000);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Payment request failed. Try again.';
            setPaymentStatus({ type: 'error', msg: errorMsg });
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
        // Rebranded: Deep Zinc background for that modern "OLED-ready" look
        <div className="min-h-screen bg-white dark:bg-zinc-950 pb-24 relative selection:bg-orange-600/30">

            {/* Header: High Contrast Black & Orange */}
            <div className="bg-zinc-100 dark:bg-zinc-900 px-6 py-10 shadow-2xl border-b border-zinc-200 dark:border-zinc-800 text-center">
                <div className="bg-orange-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-600/20 animate-in zoom-in-75 duration-500">
                    <Utensils className="text-zinc-950 dark:text-white w-7 h-7" />
                </div>
                <h1 className="text-3xl font-black text-zinc-950 dark:text-white tracking-tighter uppercase italic italic">
                    Digital <span className="text-orange-600">Menu</span>
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                    Select & Pay with M-Pesa
                </p>
            </div>

            <div className="max-w-2xl mx-auto p-4 mt-6">
                {/* Reusing the Rebranded MenuView with Orange accents */}
                <MenuView
                    items={menuData}
                    onItemClick={(item) => item.isAvailable && setSelectedItem(item)}
                />
            </div>

            {/* --- REBRANDED PAYMENT MODAL --- */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-4">
                    {/* Modal Card: Deep Zinc with White/Orange highlights */}
                    <div className="bg-zinc-100 dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-10 duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Confirm Order</p>
                                <h3 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">{selectedItem.name}</h3>
                                <p className="text-zinc-950 dark:text-white font-black text-2xl mt-1 italic tracking-tighter">
                                    KES {selectedItem.price}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl hover:bg-zinc-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-zinc-500 ml-1 tracking-widest">
                                    M-Pesa Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="07XXXXXXXX"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    // FIXED: placeholder:text-zinc-500 for visibility + dark mode support
                                    className="w-full p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-950 dark:text-white font-black text-xl outline-none focus:border-orange-600 transition-all placeholder:text-zinc-500 dark:placeholder:text-zinc-500"
                                />
                            </div>

                            {paymentStatus.msg && (
                                <div className={`p-4 rounded-2xl text-xs font-bold uppercase tracking-wide animate-in fade-in ${paymentStatus.type === 'success'
                                        ? 'bg-orange-600/10 text-orange-500 border border-orange-600/20'
                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>
                                    {paymentStatus.msg}
                                </div>
                            )}

                            <button
                                onClick={handleProcessPayment}
                                disabled={isProcessing}
                                // The "Action Orange" Button
                                className={`w-full py-5 rounded-[1.5rem] font-black text-zinc-950 dark:text-white uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isProcessing
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'
                                    }`}
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <Smartphone className="w-6 h-6" />
                                )}
                                <span className="text-lg">{isProcessing ? 'Processing...' : 'Pay with M-Pesa'}</span>
                            </button>
                        </div>

                        <p className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-8">
                            Secure payment powered by M-Pesa Daraja
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicMenuPage;