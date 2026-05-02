import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { Cloud, CloudOff } from 'lucide-react';

export const FooterStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Basic check: if db exists, we consider it initialized for this dev phase
    if (db) {
      setIsConnected(true);
    }
  }, []);

  return (
    <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Version 1.0.0 (Bêta)
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isConnected ? '● Connecté' : '● Hors ligne'}
            </span>
            {isConnected ? (
              <Cloud className="w-3 h-3 text-emerald-500" />
            ) : (
              <CloudOff className="w-3 h-3 text-rose-500" />
            )}
          </div>
        </div>
        
        <div className="text-[10px] text-slate-400 font-medium leading-tight">
          © 2026 ITAM.<br />
          Créé par <span className="font-bold text-slate-600">Ali Ahmadi</span>
        </div>
      </div>
    </div>
  );
};
