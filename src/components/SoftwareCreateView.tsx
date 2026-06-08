import React, { useState } from 'react';
import { api } from '../services/api';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { SoftwareForm } from './forms/SoftwareForm';
import { useToast } from '../services/toastContext';

interface SoftwareCreateViewProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const SoftwareCreateView: React.FC<SoftwareCreateViewProps> = ({ onClose, onRefresh }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any, extra?: { asset_ids?: string[]; user_ids?: string[] }) => {
    setLoading(true);
    try {
      const result = await api.createSoftware(data);
      const softwareId = result.id;

      if (extra?.asset_ids) {
        for (const id of extra.asset_ids) {
          await api.assignAssetToSoftware(softwareId, id);
        }
      }
      
      if (extra?.user_ids) {
        for (const id of extra.user_ids) {
          await api.assignUserToSoftware(softwareId, id);
        }
      }

      onRefresh();
      showToast('Logiciel enregistré avec succès', 'success');
      onClose();
    } catch (err) {
      console.error('Error creating software:', err);
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
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Nouveau Logiciel</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Enregistrement au catalogue</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <SoftwareForm 
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSaving={loading}
        />
      </div>
    </motion.div>
  );
};
