import React, { useState } from 'react';
import { api, Asset } from '../services/api';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { AssetForm } from './forms/AssetForm';
import { useToast } from '../services/toastContext';

interface AssetCreateViewProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const AssetCreateView: React.FC<AssetCreateViewProps> = ({ onClose, onRefresh }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<Asset>, extra?: { license_id?: string | null; contract_id?: string | null }) => {
    setLoading(true);
    try {
      const created = await api.createAsset(data);
      
      if (extra?.license_id) {
        await api.assignAssetToLicense(extra.license_id, created.id);
      }
      if (extra?.contract_id) {
        await api.assignContractToAsset(created.id, extra.contract_id);
      }

      onRefresh();
      showToast('Nouveau matériel enregistré avec succès', 'success');
      onClose();
    } catch (err) {
      showToast('Une erreur est survenue lors de la création', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-50 min-h-screen"
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-[100] px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Nouvel Asset</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Enregistrement manuel</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <AssetForm 
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSaving={loading}
          showLinks={true}
        />
      </div>
    </motion.div>
  );
};
