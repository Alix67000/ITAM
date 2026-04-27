import React, { useEffect, useState } from 'react';
import { api, Stats } from '../services/api';
import { Laptop, Users, MapPin, AlertCircle, TrendingUp, Clock, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.getStats().then(setStats);
  }, []);

  if (!stats) return <div className="animate-pulse flex items-center justify-center h-full text-slate-400">Initialisation du tableau de bord...</div>;

  return (
    <div className="grid grid-cols-4 grid-rows-3 gap-6 h-full min-h-[600px]">
      
      {/* Stat Card 1: Total Assets */}
      <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Assets</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900">{stats.counts.assets}</h3>
        </div>
        <div className="flex items-center text-green-600 text-xs font-bold mt-4">
          <TrendingUp className="w-4 h-4 mr-1" />
          Actifs & Gérés
        </div>
      </div>

      {/* Stat Card 2: Users */}
      <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilisateurs</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900">{stats.counts.users}</h3>
        </div>
        <p className="text-xs text-slate-500 mt-4">Personnels recensés</p>
      </div>

      {/* Inventory Bar Chart (Simplified representation) */}
      <div className="col-span-2 row-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
           <Laptop className="w-4 h-4 text-blue-600" /> Répartition du Parc
        </h4>
        <div className="flex h-full items-end gap-3 px-2">
          <div className="bg-blue-600 w-full rounded-t-lg transition-all hover:bg-blue-700" style={{ height: '80%' }}></div>
          <div className="bg-blue-400 w-full rounded-t-lg transition-all hover:bg-blue-500" style={{ height: '45%' }}></div>
          <div className="bg-slate-300 w-full rounded-t-lg transition-all hover:bg-slate-400" style={{ height: '25%' }}></div>
          <div className="bg-slate-200 w-full rounded-t-lg transition-all hover:bg-slate-300" style={{ height: '15%' }}></div>
          <div className="bg-slate-100 w-full rounded-t-lg transition-all hover:bg-slate-200" style={{ height: '10%' }}></div>
        </div>
        <div className="flex justify-between text-[8px] mt-3 text-slate-400 uppercase font-bold tracking-tighter">
          <span>Laptops</span><span>Mobiles</span><span>Écrans</span><span>Printers</span><span>Other</span>
        </div>
      </div>

      {/* Main Table Area: Recent Activities */}
      <div className="col-span-3 row-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
          <h4 className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Dernières Actions
          </h4>
          <button className="text-blue-600 text-xs font-semibold hover:underline">Voir tout l'historique</button>
        </div>
        <div className="flex-1 overflow-y-auto whitespace-nowrap">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 sticky top-0">
              <tr>
                <th className="px-6 py-3 font-semibold">Action</th>
                <th className="px-6 py-3 font-semibold">Asset / Contexte</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Détails</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {stats.recentEvents.map((event, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={event.id} 
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase">
                      {event.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{event.asset_label || 'Système'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">
                    {new Date(event.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[200px]">
                    {event.description}
                  </td>
                </motion.tr>
              ))}
              {stats.recentEvents.length === 0 && (
                 <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      Aucune activité enregistrée.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panels */}
      <div className="col-span-1 row-span-2 space-y-6">
        {/* Expiring Alerts */}
        <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl">
          <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-600" /> Alertes / Alertes
          </h4>
          <ul className="space-y-3">
             <li className="text-xs">
                <div className="font-bold text-orange-900">Maintenance Serveurs</div>
                <div className="text-orange-700 opacity-80 italic">Prévu dans 3 jours</div>
             </li>
             <li className="text-xs">
                <div className="font-bold text-orange-900">Licences Office 365</div>
                <div className="text-orange-700 opacity-80 italic">Renouveler avant le 30/11</div>
             </li>
          </ul>
        </div>

        {/* Quick Status */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-[230px]">
          <div>
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
               <AlertCircle className="w-4 h-4 text-red-500" /> État Critique
            </h4>
            <div className="text-4xl font-bold text-slate-900">{stats.counts.broken}</div>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-tight">Matériels en panne</p>
          </div>
          <button className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors">
             Ouvrir un Ticket
          </button>
        </div>
      </div>

    </div>
  );
};
