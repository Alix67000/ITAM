import React, { useEffect, useState } from 'react';
import { api, Stats } from '../services/api';
import { Laptop, Users, MapPin, AlertCircle, TrendingUp, Clock, ShieldAlert, PieChart as PieIcon, BarChart3, LineChart as LineIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.getStats().then(setStats);
  }, []);

  if (!stats) return <div className="animate-pulse flex items-center justify-center h-full text-slate-400">Initialisation du tableau de bord...</div>;

  return (
    <div className="space-y-6">
      {/* Top Row: Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Assets</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-3xl font-black text-slate-900">{stats.counts.assets}</h3>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-green-600 font-bold mt-4 flex items-center gap-1 uppercase">
            <TrendingUp className="w-3 h-3" /> Actifs & Gérés
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Utilisateurs</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-3xl font-black text-slate-900">{stats.counts.users}</h3>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase">Affectés au parc</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entités</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-3xl font-black text-slate-900">{stats.counts.locations}</h3>
            <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase">Sites & Services</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">État Critique</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-3xl font-black text-red-700">{stats.counts.broken}</h3>
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-red-600 font-bold mt-4 uppercase">En attente de réparation</p>
        </motion.div>
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <LineIcon className="w-3 h-3 text-blue-600" /> Tendance d'acquisition (6 mois)
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.charts.trends}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" name="Assets" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <PieIcon className="w-3 h-3 text-indigo-600" /> Répartition par type
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.charts.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.charts.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <BarChart3 className="w-3 h-3 text-emerald-600" /> État du parc
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts.statuses}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={8} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Bar dataKey="value" name="Nombre" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activities & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Activités Récentes
            </h4>
            <button className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 uppercase tracking-wider">
              Journal Complet
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-slate-50 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {stats.recentEvents.map((event, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    key={event.id} className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        event.action === 'Création' ? 'bg-blue-50 text-blue-600' :
                        event.action === 'Panne' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {event.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 tracking-tight">{event.asset_label || 'Système'}</td>
                    <td className="px-6 py-4 text-[10px] font-mono text-slate-400">{new Date(event.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[300px]">{event.description}</td>
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

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl overflow-hidden relative">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-400" /> Maintenance
            </h4>
            <div className="space-y-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="text-[11px] font-bold text-white group-hover:text-blue-400 transition-colors">Serveurs R&D</div>
                <div className="text-[9px] text-slate-400 mt-1 italic">Mise à jour dans 2h</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="text-[11px] font-bold text-white group-hover:text-blue-400 transition-colors">Licences Azure</div>
                <div className="text-[9px] text-slate-400 mt-1 italic">Expiration le 12/05</div>
              </div>
            </div>
          </div>

          <button className="w-full group bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between">
            <div className="text-left">
              <div className="text-xs font-black text-slate-900 uppercase">Support IT</div>
              <div className="text-[9px] text-slate-400">Signaler un incident</div>
            </div>
            <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <AlertCircle className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
