import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Laptop, Users, Building2, MapPin, FileText, Key, AppWindow, Smartphone, X, Zap, Plus
} from 'lucide-react';
import { AssetCreateView } from './AssetCreateView';
import { UserModal } from './UserModal';
import { LocationModal } from './LocationModal';
import { SupplierModal } from './SupplierModal';
import { ContractModal } from './ContractModal';
import { LicenseModal } from './LicenseModal';
import { SoftwareModal } from './SoftwareModal';
import { PhoneLineModal } from './PhoneLineModal';
import { WorkstationWizard } from './wizards/WorkstationWizard';

interface GlobalCreateHubProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreateType = 'asset' | 'user' | 'supplier' | 'location' | 'contract' | 'license' | 'software' | 'phone_line' | 'wizard' | null;

export const GlobalCreateHub: React.FC<GlobalCreateHubProps> = ({ isOpen, onClose }) => {
  const [activeType, setActiveType] = useState<CreateType>(null);

  // Close inner modal and hub
  const closeEverything = () => {
    setActiveType(null);
    onClose();
  };

  const closeInner = () => {
    setActiveType(null);
  };

  const menuItems = [
    { type: 'asset' as CreateType, label: 'Matériel', desc: 'Enregistrer un nouveau PC, écran, etc.', icon: Laptop },
    { type: 'user' as CreateType, label: 'Utilisateur', desc: 'Créer un collaborateur', icon: Users },
    { type: 'phone_line' as CreateType, label: 'Ligne Mobile', desc: 'Nouvelle ligne téléphonique', icon: Smartphone },
    { type: 'contract' as CreateType, label: 'Contrat', desc: 'Abonnement, garantie', icon: FileText },
    { type: 'license' as CreateType, label: 'Licence', desc: 'Licence logicielle', icon: Key },
    { type: 'software' as CreateType, label: 'Logiciel', desc: 'Logiciel standalone', icon: AppWindow },
    { type: 'supplier' as CreateType, label: 'Fournisseur', desc: 'Prestataire ou vendeur', icon: Building2 },
    { type: 'location' as CreateType, label: 'Lieu', desc: 'Entité ou localisation', icon: MapPin },
  ];

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {!activeType && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[180]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-20 md:inset-x-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[190] md:w-full md:max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Centre de création</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Que souhaitez-vous ajouter ?</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setActiveType(item.type)}
                      className="flex items-start text-left p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center flex-shrink-0 mr-4 transition-colors">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{item.label}</h3>
                        <p className="text-xs text-slate-500 leading-snug mt-1">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <button
                    onClick={() => setActiveType('wizard')}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all group shadow-sm hover:border-indigo-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">Poste Complet (Wizard)</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Provisionner en 1 clic un collaborateur + PC + Mobile + Licences.</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Rendu conditionnel des vues de création */}
      {activeType === 'asset' && (
        <div className="fixed inset-0 z-[200] overflow-hidden bg-white">
          <AssetCreateView 
            onClose={closeInner} 
            onRefresh={() => { /* Les listes se mettent à jour unmount/mount */ }} 
          />
        </div>
      )}
      {activeType === 'user' && <UserModal isOpen={true} onClose={closeInner} onRefresh={() => {}} />}
      {activeType === 'location' && <LocationModal isOpen={true} onClose={closeInner} onRefresh={() => {}} />}
      {activeType === 'supplier' && <SupplierModal isOpen={true} onClose={closeInner} onRefresh={() => {}} />}
      {activeType === 'contract' && <ContractModal isOpen={true} onClose={closeInner} onRefresh={() => {}} />}
      {activeType === 'license' && <LicenseModal isOpen={true} onClose={closeInner} onRefresh={() => {}} />}
      {activeType === 'software' && <SoftwareModal isOpen={true} onClose={closeInner} onRefresh={() => {}} />}
      {activeType === 'phone_line' && <PhoneLineModal isOpen={true} onClose={closeInner} onSuccess={() => {}} />}
      {activeType === 'wizard' && <WorkstationWizard onClose={closeInner} onSuccess={closeEverything} />}
    </>
  );
};
