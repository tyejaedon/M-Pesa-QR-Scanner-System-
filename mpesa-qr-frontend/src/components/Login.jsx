import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import Input from './ui/Input';
import Label from './ui/Label';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  QrCode,
  Store,
  Building,
  TrendingUp,
  Shield
} from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { API_BASE_URL } from '../utility/constants';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const Login = ({ onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { setMerchantData } = useAuth();
  const navigate = useNavigate();

  const handleMerchantLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Starting Firebase authentication...');
      
      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Firebase auth successful, getting token...');
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      console.log('🔑 Firebase ID token:', idToken);
      
      console.log('📞 Verifying with backend...' , `${API_BASE_URL}/api/auth/verify-token`);
      
      
      // Verify with backend and get user data
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-token`, {
        idToken: idToken
      }, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 10000 // 10 second timeout
      });
      console.log('📥 Backend response:', API_BASE_URL);

      console.log('📥 Backend response:', response.data);

  if (response.data.success) {
  const userData = {
    user: response.data.user,
    token: idToken
  };
  
  console.log('✅ Login successful, redirecting to dashboard...');
  
  // 1. Save to Storage
  localStorage.setItem('authToken', idToken);

  // 2. Update Context (This will trigger App.js to re-render and redirect)
  setMerchantData(response.data.user);
        
        console.log('✅ Login successful, redirecting to dashboard...');
      
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle different error types
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Backend server is not running. Please contact support.';
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Backend service unavailable. Please try again later.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message && !err.code) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
return (
    // Rebranded: Switched to a deep Zinc-Black background for AMOLED optimization
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        
        {/* Header - Rebranded with Orange/Black theme */}
        <div className="text-center space-y-4">
          <div className="bg-orange-600 p-4 rounded-3xl w-fit mx-auto shadow-2xl shadow-orange-900/20">
            <QrCode className="w-10 h-10 text-zinc-950 dark:text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-zinc-950 dark:text-white mb-1 uppercase tracking-tighter">
              M-Pesa <span className="text-orange-600">QR</span> Pay
            </h1>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
              Merchant Command Center
            </p>
          </div>
        </div>

        {/* Merchant Login Card - High Contrast White on Black */}
        <Card className="shadow-2xl border-0 bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center">
            <CardTitle className="text-3xl font-black text-zinc-950">Welcome Back</CardTitle>
            <CardDescription className="text-zinc-500 font-medium">
              Access your business dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-10">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 rounded-r-xl p-4 animate-shake">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm font-bold">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleMerchantLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-950 font-bold ml-1 text-xs uppercase tracking-wider">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your business email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  // Custom branding: High contrast border on focus
                  className="rounded-2xl border-zinc-200 bg-zinc-50 focus:border-orange-600 focus:ring-orange-600 h-14 font-medium"
                  icon={Mail}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-950 font-bold ml-1 text-xs uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="rounded-2xl border-zinc-200 bg-zinc-50 focus:border-orange-600 focus:ring-orange-600 h-14 pr-12 font-medium"
                    icon={Lock}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-orange-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                // Rebranded: Solid Orange with scale feedback for S22 touch
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-2xl font-black text-zinc-950 dark:text-white shadow-xl shadow-orange-600/20 transition-all duration-200 text-lg uppercase tracking-tight"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Enter Dashboard</span>
                )}
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-zinc-500 text-sm font-medium">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-orange-600 hover:text-orange-700 font-black underline underline-offset-4"
                  >
                    Register Business
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Features Section - Dark Mode Support */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-5 flex items-start gap-4 transition-all hover:border-orange-600/50">
            <div className="bg-orange-600/10 p-3 rounded-2xl">
              <QrCode className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 dark:text-white text-sm">Custom QR Codes</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Dynamic generation for instant merchant-to-customer deep linking.</p>
            </div>
          </div>
          
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-5 flex items-start gap-4 transition-all hover:border-orange-600/50">
            <div className="bg-orange-600/10 p-3 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 dark:text-white text-sm">Live Analytics</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Real-time monitoring of all incoming M-Pesa transactions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;