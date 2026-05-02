import React, { useEffect, useState } from 'react';
import { api, Stats, computeStats } from '../services/api';
import { Laptop, Users, MapPin, AlertCircle, TrendingUp, Clock, ShieldAlert, PieChart as PieIcon, BarChart3, LineChart as LineIcon, FileText, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
 } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      const [assets, phoneLines, users, locations, contracts, licenses] = await Promise.all([
        api.getAssets(),
        api.getPhoneLines(),
        api.getUsers(),
        api.getLocations(),
        api.getContracts(),
        api.getLicenses()
      ]);
      setStats(computeStats(assets, phoneLines, users, locations, contracts, licenses));
    };
    load();
  }, []);

  if (!stats) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 gap-4">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Chargement de l'intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header section with quick insight */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tableau de Bord</h2>
          <p className="text-slate-500 font-medium italic mt-1">Vue d'ensemble du parc informatique et des alertes critiques.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Système OK</span>
        </div>
      </div>

      {/* Top Row: Summary Stats (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative">Parc Matériel</p>
          <div className="flex items-end justify-between mt-4 relative">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.counts.assets}</h3>
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Laptop className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-blue-600 font-bold mt-6 flex items-center gap-1 uppercase tracking-tighter whitespace-nowrap">
             <TrendingUp className="w-3 h-3" /> Géré en temps réel
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative">Utilisateurs</p>
          <div className="flex items-end justify-between mt-4 relative">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.counts.users}</h3>
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-6 uppercase tracking-tighter">Profils collaborateur</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group overflow-hidden relative">
           <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative">Entités</p>
          <div className="flex items-end justify-between mt-4 relative">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.counts.locations}</h3>
            <div className="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-6 uppercase tracking-tighter">Sites & Services</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group overflow-hidden relative">
           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative">Contrats</p>
          <div className="flex items-end justify-between mt-4 relative">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.counts.contracts}</h3>
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-6 uppercase tracking-tighter">Engagements actifs</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative">Valeur du Parc</p>
          <div className="flex items-end justify-between mt-4 relative">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.counts.totalValue.toLocaleString('fr-FR')} €</h3>
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
               <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-blue-600 font-bold mt-6 uppercase tracking-tighter">Investissement total</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group overflow-hidden relative">
           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative">Taux Garantie</p>
          <div className="flex items-end justify-between mt-4 relative">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{Math.round(stats.counts.warrantyPercent)} %</h3>
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-6 uppercase tracking-tighter">Matériel converti</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-100 transition-all group overflow-hidden relative">
           <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative">Âge Moyen</p>
          <div className="flex items-end justify-between mt-4 relative">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.counts.averageAgeYears.toFixed(1)} <span className="text-xl">Ans</span></h3>
            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-amber-600 font-bold mt-6 uppercase tracking-tighter">Obsolescence moyenne</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest relative">État Critique</p>
          <div className="flex items-end justify-between mt-4 relative">
            <h3 className="text-4xl font-black text-red-700 tracking-tighter">{stats.counts.broken}</h3>
            <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 animate-pulse">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-red-600 font-bold mt-6 uppercase tracking-tighter">Matériels en panne</p>
        </motion.div>
      </div>

      {/* Middle Row: Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Area Chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LineIcon className="w-3 h-3 text-blue-600" /> Croissance du Parc
              </h4>
              <p className="text-xs text-slate-500 font-medium">Historique des acquisitions sur 6 mois</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold uppercase">
                 <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Assets
               </div>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={stats.charts.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'black', fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" name="Total" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="lg:col-span-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
          <div className="space-y-1 mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <PieIcon className="w-3 h-3 text-indigo-600" /> Mix Matériel
            </h4>
            <p className="text-xs text-slate-500 font-medium">Répartition par typologie</p>
          </div>
          <div className="flex-1 relative min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={stats.charts.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={200}
                >
                  {stats.charts.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">{stats.counts.assets}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {stats.charts.categories.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-bold text-slate-600 truncate">{cat.name}</span>
                <span className="text-[10px] font-black text-slate-400 ml-auto">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div className="space-y-1">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Activités Récentes
              </h4>
              <p className="text-xs text-slate-500 font-medium italic">Derniers mouvements logués</p>
            </div>
            <button className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all border border-blue-100 uppercase tracking-widest bg-white shadow-sm">
               Consulter l'historique
            </button>
          </div>
          <div className="p-2">
            <div className="space-y-1">
              {stats.recentEvents.map((event, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  key={event.id} 
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    event.action === 'Création' ? 'bg-blue-50 text-blue-600' :
                    event.action === 'Panne' ? 'bg-red-50 text-red-600' : 
                    'bg-slate-100 text-slate-500'
                  )}>
                    {event.action === 'Création' ? <Plus className="w-5 h-5" /> :
                     event.action === 'Panne' ? <AlertCircle className="w-5 h-5" /> :
                     <Edit2 className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h5 className="font-bold text-slate-900 truncate tracking-tight">{event.description}</h5>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(event.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-bold uppercase tracking-tight">
                        {event.asset_label || 'Système'}
                       </span>
                       <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 italic">
                         <div className="w-1 h-1 bg-slate-300 rounded-full" /> Juste à l'instant
                       </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </motion.div>
              ))}
              {stats.recentEvents.length === 0 && (
                <div className="py-12 text-center text-slate-400 font-medium italic text-sm">
                  Aucun mouvement enregistré pour le moment.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-amber-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-6 flex items-center gap-2 relative">
              <ShieldAlert className="w-4 h-4" /> Veille préventive
            </h4>
            
            <div className="space-y-4 relative">
              <p className="text-[11px] text-slate-400 font-black mb-2 uppercase tracking-widest border-b border-slate-50 pb-2">Échéances Proches</p>
              
              {stats.upcomingExpirations.map((exp, i) => {
                const diffDays = Math.ceil((new Date(exp.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = diffDays < 30;

                return (
                  <div key={i} className={cn(
                    "group/item flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer border",
                    isUrgent ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100 hover:border-amber-200"
                  )}>
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      exp.type === 'License' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    )}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="text-[11px] font-black text-slate-900 truncate pr-2 tracking-tight uppercase">{exp.name}</div>
                        <div className={cn(
                          "text-[9px] font-black whitespace-nowrap px-1.5 py-0.5 rounded ml-auto uppercase",
                          isUrgent ? "text-red-600 bg-red-100/50" : "text-amber-600 bg-amber-100/50"
                        )}>
                          J-{diffDays}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 font-medium">
                        <span className="font-bold">{exp.type}</span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="italic">{new Date(exp.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {stats.upcomingExpirations.length === 0 && (
                <div className="text-[10px] text-slate-400 font-bold italic py-8 text-center uppercase tracking-widest">
                  Parc conforme aux échéances.
                </div>
              )}
              
              <button 
                onClick={() => onNavigate?.('contracts')}
                className="w-full mt-4 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-200 transition-all active:scale-95"
              >
                Gérer les abonnements
              </button>
            </div>
          </div>

          {/* Quick Support Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl shadow-blue-200 text-white group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
            <h4 className="text-[11px] font-black uppercase tracking-widest opacity-80 mb-2">Besoin d'aide ?</h4>
            <h3 className="text-xl font-black mb-4 tracking-tight">Support IT Interne</h3>
            <p className="text-xs opacity-70 mb-6 leading-relaxed font-medium">Un incident technique ? Un renouvellement nécessaire ? Nos équipes sont là.</p>
            <button className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/10">
              Ouvrir un ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Edit2 = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');
