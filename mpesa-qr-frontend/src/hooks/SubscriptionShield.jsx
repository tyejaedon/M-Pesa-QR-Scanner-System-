import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { useSubscription } from './SubscriptionProvider';
import Button from '../components/ui/Button';

const SubscriptionShield = ({ 
  children, 
  requiredTier = 'BASIC', // Matches your "BASIC" | "ELITE" schema
  requiredAddon = null,   // Matches "menuEnabled"
  featureName = "this feature" 
}) => {
  const { tier, isValid, menuEnabled } = useSubscription();

  // --- HCI Logic ---
  // 1. Premium users always have access to Basic features
  // 2. Access is only granted if the subscription is valid (not expired)
  const hasTierAccess = (tier === 'ELITE') || (tier === requiredTier);
  
  // 3. Addon check: If required, check menuEnabled boolean
  const hasAddonAccess = requiredAddon ? menuEnabled : true;
  
  // 4. Final Verdict
  const isLocked = !isValid || !hasTierAccess || !hasAddonAccess;

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    // Rebranded: Use the Zinc-950 backdrop to match your AMOLED theme
    <div className="relative group overflow-hidden rounded-[2.5rem] min-h-[300px] flex flex-col">
      
      {/* 1. The Teaser Layer: Blurred & Grayscale */}
      <div className="blur-xl pointer-events-none select-none filter grayscale opacity-20 transition-all duration-700 flex-1">
        {children}
      </div>

      {/* 2. The Interactive Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950/60 backdrop-blur-[4px] animate-in fade-in duration-500">
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(234,88,12,0.1)] text-center max-w-sm">
          
          {/* Animated Icon Container */}
          <div className="bg-orange-600/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-600/20 shadow-inner">
            <Lock className="w-10 h-10 text-orange-600 animate-pulse" />
          </div>
          
          <div className="space-y-2 mb-8">
            <h3 className="text-zinc-950 dark:text-white font-black uppercase italic tracking-tighter text-2xl leading-tight">
              Unlock <span className="text-orange-600">{featureName}</span>
            </h3>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">
              Required: {requiredAddon ? "Menu Add-on" : "Premium Subscription"}
            </p>
          </div>

          <Button 
            variant="default" 
            className="w-full h-16 text-xs shadow-orange-600/40" 
            onClick={() => window.location.href = '/upgrade'}
          >
            <Zap className="w-5 h-5 mr-3 fill-current" />
            Upgrade Terminal
          </Button>

          <p className="mt-6 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            Instant Activation via M-Pesa
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionShield;