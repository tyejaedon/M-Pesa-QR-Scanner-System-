import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Zap, 
  Smartphone, 
  BarChart3, 
  ShieldCheck, 
  DollarSign, 
  ArrowUpRight,
  Menu,
    Check,       // <--- NEW IMPORT
  Utensils,    // <--- NEW IMPORT
  Plus         // <--- NEW IMPORT
} from 'lucide-react';



import ThemeToggle from './ui/Toggle'; 

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    // 1. GLOBAL CONTAINER
    <div className="min-h-screen w-full bg-white dark:bg-brand-black text-zinc-950 dark:text-white transition-colors duration-500 overflow-x-hidden">
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-200 dark:border-brand-gray/50 backdrop-blur-xl bg-white/80 dark:bg-brand-black/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-brand-orange p-2 rounded-xl shadow-lg shadow-brand-orange/20">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-zinc-950 fill-current" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter uppercase italic dark:text-white">
              Merchant<span className="text-brand-orange">Pro</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <ThemeToggle />
            <button 
              onClick={() => navigate('/login')}
              className="hidden md:block text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-brand-orange transition-colors italic"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="h-10 md:h-12 px-6 md:px-8 bg-brand-orange text-zinc-950 rounded-xl font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-brand-orange/20 active:scale-95 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 md:pt-48 pb-20 md:pb-32 px-4 md:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center space-y-8 md:space-y-10 relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 rounded-full bg-brand-orange text-zinc-950 shadow-2xl shadow-brand-orange/30 animate-in fade-in zoom-in duration-700">
            <Zap className="w-3 h-3 md:w-4 md:h-4 fill-current" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] italic">
              Nairobi's Elite Payment Hub
            </span>
          </div>

          {/* HEADLINE */}
          <h1 className="text-6xl sm:text-7xl md:text-9xl lg:text-[10rem] font-black tracking-tighter uppercase italic leading-[0.9] md:leading-[0.8] text-zinc-950 dark:text-white animate-in slide-in-from-bottom-12 duration-1000">
            Ditch Cash. <br />
            <span className="text-brand-orange">Take Control.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-zinc-500 dark:text-zinc-400 font-black uppercase italic tracking-tighter text-sm md:text-2xl animate-in fade-in duration-1000 delay-300 px-4">
            Turn your smartphone into a high-performance M-Pesa terminal.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 pt-8 md:pt-10 animate-in zoom-in-95 duration-1000 delay-500 w-full md:w-auto">
            <button 
              onClick={() => navigate('/register')}
              className="relative overflow-hidden w-full md:w-auto h-16 md:h-20 px-10 md:px-14 bg-brand-orange text-zinc-950 rounded-2xl md:rounded-[2rem] font-black uppercase italic tracking-widest shadow-2xl shadow-brand-orange/40 active:scale-95 transition-all group"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 text-lg md:text-xl">
                Open Storefront <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </span>
              <QrCode className="absolute -right-4 -bottom-4 h-20 w-20 md:h-24 md:w-24 text-zinc-950/10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            </button>
            <button className="w-full md:w-auto h-16 md:h-20 px-10 md:px-14 bg-white dark:bg-brand-black text-zinc-950 dark:text-white border-2 md:border-4 border-zinc-950 dark:border-zinc-700 rounded-2xl md:rounded-[2rem] font-black uppercase italic tracking-widest text-xs md:text-sm hover:bg-brand-orange hover:text-zinc-950 hover:border-brand-orange dark:hover:bg-brand-orange dark:hover:text-zinc-950 dark:hover:border-brand-orange transition-all">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Background Watermark */}
        <Smartphone className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[20rem] w-[20rem] md:h-[40rem] md:w-[40rem] text-zinc-100 dark:text-brand-gray/20 -z-0 rotate-12 pointer-events-none" />
      </section>

      {/* --- BENTO FEATURE GRID --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          {/* Main Card (Orange) */}
          <div className="md:col-span-2 bg-brand-orange text-zinc-950 shadow-2xl shadow-brand-orange/20 relative overflow-hidden rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 group">
            <div className="relative z-10">
              <p className="text-[10px] uppercase font-black tracking-[0.4em] mb-4 md:mb-6 opacity-70 italic">Core Technology</p>
              <h3 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.85] mb-6 md:mb-8">
                Dynamic <br /> Payment <br /> Links.
              </h3>
              <p className="max-w-xs font-bold text-xs md:text-sm uppercase italic leading-tight mb-6 md:mb-8">
                Generate markers that open M-Pesa instantly. Zero errors. Maximum speed.
              </p>
              <button className="bg-zinc-950 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-xl">
                Explore Engine
              </button>
            </div>
            <QrCode className="absolute -right-8 -bottom-8 md:-right-12 md:-bottom-12 h-48 w-48 md:h-80 md:w-80 text-zinc-950/10 -rotate-12 group-hover:rotate-0 transition-all duration-1000" />
          </div>

          {/* Elite Card (Black/OLED) */}
          <div className="bg-brand-black border border-brand-gray text-white relative overflow-hidden rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 group">
            <div className="relative z-10">
              <div className="bg-brand-gray/50 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8">
                <BarChart3 className="w-6 h-6 md:w-7 md:h-7 text-brand-orange" />
              </div>
              <p className="text-brand-orange text-[10px] uppercase font-black tracking-[0.4em] mb-4 italic">SubscriptionShield</p>
              <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-6">
                Elite <br /> Analytics.
              </h3>
              <p className="text-zinc-500 font-bold text-xs md:text-sm uppercase italic">
                Track revenue spikes and forecast your next month.
              </p>
            </div>
            <DollarSign className="absolute -right-6 -bottom-6 h-32 w-32 md:h-40 md:w-40 text-white/5 rotate-12 group-hover:rotate-0 transition-all duration-700" />
          </div>

          {/* Mini Tech Cards */}
          {[
            { label: 'Security', title: 'Daraja 2.0', icon: ShieldCheck, color: 'text-emerald-500' },
            { label: 'Hardware', title: 'Smartphone', icon: Smartphone, color: 'text-blue-500' },
            { label: 'Performance', title: 'Instant STK', icon: Zap, color: 'text-brand-orange' }
          ].map((item, idx) => (
            <div key={idx} className="bg-zinc-50 dark:bg-brand-gray border border-zinc-200 dark:border-brand-gray/50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex items-center gap-4 md:gap-6 group hover:border-brand-orange/50 transition-colors">
              <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-white dark:bg-brand-black shadow-sm`}>
                <item.icon className={`w-6 h-6 md:w-8 md:h-8 ${item.color}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-zinc-400 italic tracking-widest">{item.label}</p>
                <h4 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white">{item.title}</h4>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* --- NEW SECTION: PRICING & TIERS --- */}
    {/* --- NEW SECTION: PRICING & TIERS --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-20">
        <div className="mb-12 md:mb-20 text-center">
            <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white">
                Select Your <span className="text-brand-orange">Arsenal</span>
            </h2>
            <p className="text-zinc-500 font-black uppercase tracking-widest mt-4 text-xs md:text-sm">Scale your operation. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
            
            {/* 1. BASIC / STARTER TIER (Updated with Trial) */}
            <div className="bg-zinc-50 dark:bg-brand-black/40 border border-zinc-200 dark:border-brand-gray/50 rounded-[2rem] p-8 md:p-10 relative group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors overflow-hidden">
                
                {/* 10-DAY TRIAL BADGE */}
                <div className="absolute top-0 right-0 bg-zinc-200 dark:bg-zinc-800 px-6 py-2 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                    10-Day Free Trial
                </div>

                <div className="mb-8 mt-2">
                    <span className="bg-zinc-200 dark:bg-brand-gray text-zinc-600 dark:text-zinc-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Core Terminal
                    </span>
                </div>
                <h3 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white mb-2">Starter</h3>
                <p className="text-zinc-400 font-bold text-xs uppercase tracking-wide mb-8">Perfect for testing the waters.</p>
                
                <div className="space-y-4 mb-10">
                    {[
                        'Unlimited QR Generation', 
                        'Instant STK Pushes', 
                        'Basic Receipt Logs', 
                        'Next-Day Settlement'
                    ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Check className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wide">{feat}</span>
                        </div>
                    ))}
                </div>
                <button 
                  onClick={() => navigate('/register')}
                  className="w-full h-14 bg-zinc-200 dark:bg-brand-gray text-zinc-900 dark:text-white rounded-xl font-black uppercase italic tracking-widest text-xs hover:bg-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                >
                    Start 10-Day Trial
                </button>
            </div>

            {/* 2. ELITE / ANALYTICS TIER (Featured) */}
            <div className="bg-brand-black text-white border-2 border-brand-orange shadow-2xl shadow-brand-orange/20 rounded-[2.5rem] p-8 md:p-12 relative -my-4 md:-my-8 z-10">
                <div className="absolute top-0 right-0 bg-brand-orange text-zinc-950 px-6 py-2 rounded-bl-2xl rounded-tr-2xl text-[10px] font-black uppercase tracking-widest italic">
                    Best Value
                </div>
                <div className="mb-8 mt-2">
                    <span className="text-brand-orange flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <Zap className="w-4 h-4 fill-current" /> High Performance
                    </span>
                </div>
                <h3 className="text-5xl font-black uppercase italic tracking-tighter mb-2">Merchant Pro</h3>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide mb-8">Intelligence Engine Included.</p>
                
                <div className="space-y-5 mb-12">
                    {[
                        'Everything in Starter', 
                        'AI Revenue Prediction', 
                        'Hourly Heatmap Analytics', 
                        'Growth Velocity Charts',
                        'Priority Support'
                    ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="bg-brand-orange/20 p-1 rounded-full">
                                <Check className="w-3 h-3 text-brand-orange" />
                            </div>
                            <span className="text-xs font-bold uppercase text-white tracking-wide">{feat}</span>
                        </div>
                    ))}
                </div>
                <button 
                  onClick={() => navigate('/register')}
                  className="w-full h-16 bg-brand-orange text-zinc-950 rounded-2xl font-black uppercase italic tracking-widest text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-transform"
                >
                    Upgrade to Elite
                </button>
            </div>

            {/* 3. ADD-ON MODULE */}
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-brand-gray rounded-[2rem] p-8 md:p-10 relative group overflow-hidden">
                <div className="absolute -right-8 -top-8 text-zinc-200 dark:text-zinc-800 pointer-events-none">
                    <Utensils className="w-32 h-32 rotate-12" />
                </div>
                
                <div className="relative z-10 mb-8 mt-2">
                    <span className="border border-zinc-400 text-zinc-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center w-fit gap-2">
                        <Plus className="w-3 h-3" /> Add-on
                    </span>
                </div>
                <h3 className="relative z-10 text-3xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white mb-2">
                    Menu<br/>Module
                </h3>
                <p className="relative z-10 text-zinc-500 font-bold text-xs uppercase tracking-wide mb-8">
                    For Restaurants & Cafes.
                </p>
                
                <div className="relative z-10 space-y-4 mb-10">
                    {[
                        'Digital QR Menus', 
                        'Stock Management', 
                        'Order Syncing'
                    ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Check className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wide">{feat}</span>
                        </div>
                    ))}
                </div>
                <button className="relative z-10 w-full h-14 bg-white dark:bg-black border-2 border-zinc-950 dark:border-zinc-700 text-zinc-950 dark:text-white rounded-xl font-black uppercase italic tracking-widest text-xs hover:bg-zinc-950 hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 transition-colors">
                    Add for KSH 500
                </button>
            </div>
        </div>
      </section>

      {/* --- FINAL CALL TO ACTION --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32">
        <div className="bg-brand-orange text-zinc-950 rounded-[2.5rem] md:rounded-[4rem] p-10 md:p-24 text-center relative overflow-hidden">
          <div className="relative z-10 space-y-6 md:space-y-8">
            <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
              Ready to <br /> dominate?
            </h2>
            <button 
              onClick={() => navigate('/register')}
              className="h-16 md:h-20 px-10 md:px-16 bg-zinc-950 text-white rounded-2xl md:rounded-[2rem] font-black uppercase italic tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
            >
              Get Started Free
            </button>
          </div>
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[20rem] w-[20rem] md:h-[50rem] md:w-[50rem] text-zinc-950/5 -z-0" />
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="max-w-7xl mx-auto px-6 pb-12 md:pb-20 pt-10 border-t border-zinc-200 dark:border-brand-gray/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10">
          <div className="flex items-center gap-3">
             <span className="text-sm font-black uppercase italic text-zinc-950 dark:text-zinc-500">
               Merchant<span className="text-brand-orange">Pro</span> 2026
             </span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <span className="hover:text-brand-orange cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-brand-orange cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-brand-orange cursor-pointer transition-colors">Documentation</span>
          </div>
        </div>
        <p className="text-center md:text-left text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-8 md:mt-10">
          Informatics & Computer Science Project • Strathmore University
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
