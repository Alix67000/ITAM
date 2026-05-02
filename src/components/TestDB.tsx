import React, { useState } from 'react';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Database, Play, CheckCircle2, XCircle } from 'lucide-react';

export const TestDB: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [count, setCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const verifyConnection = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      // 1. Test d'écriture (Auto-création de la collection 'assets')
      console.log("Tentative d'écriture...");
      const docRef = await addDoc(collection(db, 'assets'), {
        name: "Test Asset " + new Date().toLocaleTimeString(),
        type: "Test",
        status: "Actif",
        created_at: new Date().toISOString()
      });
      console.log("Écriture réussie, ID:", docRef.id);

      // 2. Test de lecture
      const q = query(collection(db, 'assets'), limit(100));
      const querySnapshot = await getDocs(q);
      setCount(querySnapshot.size);
      
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || "Erreur inconnue");
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Database className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Diagnostic Firestore</h2>
          <p className="text-sm text-slate-500">Projet : itam-emmaus</p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={verifyConnection}
          disabled={status === 'loading'}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
        >
          {status === 'loading' ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          CRÉER & TESTER
        </button>

        {status === 'success' && (
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-900">Connexion ✅</p>
              <p className="text-xs text-emerald-700 mt-1">
                La collection <strong>assets</strong> est active.<br/>
                Total de documents lus : <strong>{count}</strong>
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
            <XCircle className="w-5 h-5 text-rose-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-900">Erreur ❌</p>
              <p className="text-xs text-rose-700 mt-1 font-mono">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
