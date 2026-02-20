import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Label from './ui/Label';
import Badge from './ui/Badge';
import { Building, Shield, UtensilsCrossed, Loader2, Store, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../utility/constants';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Added Link for better UX

// 1. CLEANER: No props needed
function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '', shortcode: '', accountType: 'paybill'
  });

  const [selectedPlan, setSelectedPlan] = useState('core');
  const [menuAddon, setMenuAddon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 2. LOGIC: We rely entirely on the router hook
  const navigate = useNavigate();

  const PLANS = {
    core: { name: 'Core Pay', price: 0, desc: 'QR Payments & basic tracking' },
    elite: { name: 'Elite Analytics', price: 1500, desc: 'Real-time revenue trends & pro ledger' }
  };
  const MENU_PRICE = 500;

  const calculateTotal = () => {
    let total = PLANS[selectedPlan].price;
    if (menuAddon) total += MENU_PRICE;
    return total;
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const setAccountType = (type) => setFormData({ ...formData, accountType: type });

  const handleNextStep = (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) return setError(validationError);
    setError('');
    setStep(2);
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword, phone, shortcode } = formData;
    if (!name || !email || !password || !confirmPassword || !phone || !shortcode) return 'All fields are required';
    if (password !== confirmPassword) return 'Passwords do not match';
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('254') || cleanPhone.length < 12) return 'Phone must be 254XXXXXXXXX';
    return null;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    const { name, email, password, phone, shortcode, accountType } = formData;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      const idToken = await user.getIdToken();

      const backendData = {
        uid: user.uid,
        email,
        name,
        phone: phone.replace(/\D/g, ''),
        shortcode,
        accountType,
        subscription: {
          tier: selectedPlan,
          addons: menuAddon ? ['menu'] : []
        },
        paymentRequired: false // Sandbox override
      };

      await axios.post(`${API_BASE_URL}/api/auth/signup`, backendData, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      setSuccess('Account Activated! Redirecting to Login...');

      // 3. CLEANER: Direct navigation after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-3 sm:p-4 md:p-8">
      <div className="w-full max-w-4xl space-y-4 md:space-y-6">

        {/* Step Indicator - Reduced margin on mobile */}
        <div className="flex justify-center gap-2 mb-4 md:mb-8">
          <div className={`h-1.5 w-12 md:w-16 rounded-full transition-all duration-500 ${step === 1 ? 'bg-orange-600 shadow-lg shadow-orange-500/30' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
          <div className={`h-1.5 w-12 md:w-16 rounded-full transition-all duration-500 ${step === 2 ? 'bg-orange-600 shadow-lg shadow-orange-500/30' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
        </div>

        {/* Adaptive border-radius for mobile */}
        <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-0">
            {/* Removed forced min-h on mobile so it hugs the content */}
            <div className="grid grid-cols-1 md:grid-cols-5 md:min-h-[600px]">

              {/* Left Sidebar - Reduced padding and spacing for mobile */}
              <div className="md:col-span-2 bg-zinc-950 p-6 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 space-y-4 md:space-y-6">
                  <div className="bg-orange-600/20 p-3 md:p-4 rounded-2xl w-fit backdrop-blur-sm border border-orange-600/30">
                    <Building className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
                  </div>
                  <div>
                    {/* Scaled text sizes for mobile */}
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic leading-none tracking-tight">Merchant<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Terminal</span></h2>
                    <p className="text-zinc-500 text-[10px] md:text-xs font-bold mt-2 md:mt-3 uppercase tracking-widest">Enterprise Edition 2026</p>
                  </div>
                </div>

                <div className="space-y-5 relative z-10 mt-6 md:mt-0">
                  <div className="flex gap-3 md:gap-4 items-center">
                    <div className="p-1.5 md:p-2 bg-zinc-900 rounded-lg"><Shield className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" /></div>
                    <div>
                      <p className="text-[10px] md:text-xs font-black uppercase text-white">Sandbox Mode</p>
                      <p className="text-[8px] md:text-[10px] text-zinc-500 font-medium">Testing Environment Active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side (Form) - Reduced padding to maximize input width on mobile */}
              <div className="md:col-span-3 p-5 sm:p-8 md:p-12 bg-white dark:bg-zinc-950 flex flex-col justify-center">

                {error && (
                  <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-[10px] md:text-xs font-black uppercase tracking-wide rounded-xl border border-red-100 dark:border-red-900/20 flex items-center gap-2">
                    <Shield className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 md:mb-6 p-3 md:p-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-wide rounded-xl border border-emerald-100 dark:border-emerald-900/20 flex items-center gap-2">
                    <Shield className="w-4 h-4 shrink-0" />
                    {success}
                  </div>
                )}

                {step === 1 ? (
                  <form onSubmit={handleNextStep} className="space-y-5 md:space-y-6 animate-in slide-in-from-right duration-500">
                    <div className="space-y-1">
                      <h3 className="text-lg md:text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Business Profile</h3>
                      <div className="flex flex-wrap gap-2 justify-between items-center">
                        <p className="text-[10px] md:text-xs text-zinc-500 font-medium">Configure your payment identity</p>
                        <Link to="/login" className="text-[10px] font-black uppercase text-orange-600 hover:underline">Have an account?</Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1 md:space-y-1.5 md:col-span-2">
                        <Label className="text-xs">Business Name</Label>
                        {/* FIXED: Added placeholder visibility & dark mode backgrounds */}
                        <Input name="name" placeholder="e.g., Urban Coffee House" value={formData.name} onChange={handleChange}
                          className="h-11 md:h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:border-orange-500 dark:focus:border-orange-500 transition-all text-sm" />
                      </div>

                      <div className="space-y-1 md:space-y-1.5 md:col-span-2">
                        <Label className="text-xs">Email Access</Label>
                        <Input name="email" type="email" placeholder="admin@business.com" value={formData.email} onChange={handleChange}
                          className="h-11 md:h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:border-orange-500 transition-all text-sm" />
                      </div>

                      <div className="space-y-1 md:space-y-1.5">
                        <Label className="text-xs">Password</Label>
                        <Input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange}
                          className="h-11 md:h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:border-orange-500 transition-all text-sm" />
                      </div>
                      <div className="space-y-1 md:space-y-1.5">
                        <Label className="text-xs">Confirm</Label>
                        <Input name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange}
                          className="h-11 md:h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:border-orange-500 transition-all text-sm" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3 md:space-y-4">
                      <Label className="text-orange-600 text-xs">Payment Configuration</Label>
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <div
                          onClick={() => setAccountType('paybill')}
                          className={`cursor-pointer p-2 sm:p-3 rounded-xl border transition-all flex items-center gap-2 sm:gap-3 ${formData.accountType === 'paybill' ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-500 ring-1 ring-orange-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                        >
                          <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${formData.accountType === 'paybill' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                            <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                          <div className="truncate">
                            <p className={`text-[10px] sm:text-xs font-black uppercase truncate ${formData.accountType === 'paybill' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Paybill</p>
                            <p className="text-[8px] sm:text-[9px] text-zinc-400 font-bold truncate">Business No.</p>
                          </div>
                        </div>
                        <div
                          onClick={() => setAccountType('till')}
                          className={`cursor-pointer p-2 sm:p-3 rounded-xl border transition-all flex items-center gap-2 sm:gap-3 ${formData.accountType === 'till' ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-500 ring-1 ring-orange-500' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                        >
                          <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${formData.accountType === 'till' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                            <Store className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                          <div className="truncate">
                            <p className={`text-[10px] sm:text-xs font-black uppercase truncate ${formData.accountType === 'till' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Till Number</p>
                            <p className="text-[8px] sm:text-[9px] text-zinc-400 font-bold truncate">Buy Goods</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1 md:space-y-1.5">
                          <Label className="text-xs">Phone Number</Label>
                          <Input name="phone" placeholder="2547..." value={formData.phone} onChange={handleChange}
                            className="h-11 md:h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-500 font-mono text-sm focus:border-orange-500 transition-all" />
                        </div>
                        <div className="space-y-1 md:space-y-1.5">
                          <Label className="text-xs truncate">{formData.accountType === 'till' ? 'Till Number' : 'Shortcode'}</Label>
                          <Input name="shortcode" placeholder={formData.accountType === 'till' ? "e.g. 123456" : "e.g. 888888"} value={formData.shortcode} onChange={handleChange}
                            className="h-11 md:h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-500 font-mono text-sm focus:border-orange-500 transition-all" />
                        </div>
                      </div>
                    </div>

<Button 
  type="submit" 
  className="w-full h-12 md:h-14 bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl shadow-xl shadow-orange-600/40 dark:shadow-orange-500/20 border border-orange-700/50 border-t-white/30 transition-all hover:translate-y-[-2px] active:scale-[0.95] active:translate-y-[0px] flex items-center justify-center gap-2"
>
  <ShieldCheck className="w-4 h-4" />
  Create Account
</Button>
                  </form>
                ) : (
                  /* --- STEP 2: PLANS (SANDBOX) --- */
                  <div className="space-y-5 md:space-y-6 animate-in slide-in-from-right duration-500">
                    <div className="space-y-1">
                      <h3 className="text-lg md:text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Select Power Level</h3>
                      <p className="text-[10px] md:text-xs text-zinc-500 font-medium">Sandbox: No payment will be processed</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Core Plan */}
                      <div
                        onClick={() => setSelectedPlan('core')}
                        className={`group relative p-3 md:p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedPlan === 'core'
                            ? 'border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          {/* FIXED: Text color now flips to white in dark mode */}
                          <h4 className={`font-black uppercase italic text-xs md:text-sm ${selectedPlan === 'core' ? 'text-orange-600' : 'text-zinc-900 dark:text-white'}`}>
                            Core Pay
                          </h4>
                          <Badge variant="secondary" className="text-[9px] md:text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            7-Day Free Trial
                          </Badge>
                           <span className="text-[10px] md:text-xs font-black text-orange-600">
                            KES 700<span className="text-[8px] md:text-[10px] text-zinc-400 font-normal">/mo</span>
                          </span>
                        </div>
                        <p className="text-[9px] md:text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-tight pr-4">
                          Standard QR Generation & 7-Day History
                        </p>
                      </div>

                      {/* Elite Plan */}
                      <div
                        onClick={() => setSelectedPlan('elite')}
                        className={`group relative p-3 md:p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedPlan === 'elite'
                            ? 'border-orange-600 bg-orange-50/50 dark:bg-orange-500/10'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h4 className={`font-black uppercase italic text-xs md:text-sm ${selectedPlan === 'elite' ? 'text-orange-600' : 'text-zinc-900 dark:text-white'}`}>
                            Elite Analytics
                          </h4>
                          <span className="text-[10px] md:text-xs font-black text-orange-600">
                            KES 1,500<span className="text-[8px] md:text-[10px] text-zinc-400 font-normal">/mo</span>
                          </span>
                        </div>
                        <p className="text-[9px] md:text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-tight pr-4">
                          Predictive AI, Unlimited History & Pro Ledger
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <Label className="mb-2 md:mb-3 block text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        Optional Modules
                      </Label>
                      <div
                        onClick={() => setMenuAddon(!menuAddon)}
                        className={`p-3 md:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${menuAddon
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                      >
                        <div className="flex items-center gap-3 md:gap-4 truncate">
                          <div className={`p-2 md:p-2.5 rounded-xl shrink-0 ${menuAddon ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                            <UtensilsCrossed className="w-4 h-4 md:w-5 md:h-5" />
                          </div>
                          <div className="truncate">
                            <h4 className={`font-black uppercase text-[10px] md:text-xs ${menuAddon ? 'text-emerald-900 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              Digital Menu
                            </h4>
                            <p className="text-[8px] md:text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-wide truncate">
                              QR-Linked Product Catalog
                            </p>
                          </div>
                        </div>
                        <div className="text-right pl-2 shrink-0">
                          <span className={`block text-[10px] md:text-xs font-black ${menuAddon ? 'text-emerald-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                            + KES 500
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button onClick={handleSubmit} disabled={loading} className="w-full h-14 md:h-16 text-xs md:text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/20 rounded-2xl transition-all active:scale-[0.98]">
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" />
                            <span>Creating Account...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full px-4">
                            <span className="font-black uppercase tracking-widest text-[10px] md:text-xs">Activate Sandbox Account</span>
                          </div>
                        )}
                      </Button>
                      <button onClick={() => setStep(1)} className="w-full mt-4 text-[9px] md:text-[10px] font-black uppercase text-zinc-400 tracking-widest hover:text-orange-600 transition-colors p-2">
                        ← Back to Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Register;