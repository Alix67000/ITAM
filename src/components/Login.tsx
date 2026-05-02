import React from 'react';
import { useAuth } from '../services/authContext';
import { Shield, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-white mb-2">Mini GLPI</h1>
          <p className="text-slate-400">Accès restreint aux administrateurs</p>
        </div>

        <button
          onClick={login}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Connexion avec Google
        </button>

        <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-center gap-2 text-slate-500 text-xs uppercase font-black tracking-widest">
          <Lock className="w-3 h-3" />
          Accès Sécurisé
        </div>
      </motion.div>
    </div>
  );
};
