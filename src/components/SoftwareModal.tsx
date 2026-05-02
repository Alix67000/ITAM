import React, { useState } from 'react';
import { api } from '../services/api';
import { Save } from 'lucide-react';
import { Modal } from './ui/Modal';
import { SoftwareForm } from './forms/SoftwareForm';

interface SoftwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  software?: any | null;
}

export const SoftwareModal: React.FC<SoftwareModalProps> = ({ isOpen, onClose, onRefresh, software }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any, extra?: { asset_ids?: string[]; user_ids?: string[] }) => {
    setLoading(true);
    try {
      let softwareId = software?.id;
      if (softwareId) {
        await api.updateSoftwareById(softwareId, formData);
      } else {
        const result = await api.createSoftware(formData);
        softwareId = result.id;
      }

      if (softwareId && extra) {
        // Sync Assets
        const currentAttachedAssets = await api.getSoftwareAssets(softwareId);
        const currentAssetIds = currentAttachedAssets.map((a: any) => a.id);
        const newAssetIds = extra.asset_ids || [];

        for (const id of currentAssetIds) {
          if (!newAssetIds.includes(id)) await api.removeAssetFromSoftware(softwareId, id);
        }
        for (const id of newAssetIds) {
          if (!currentAssetIds.includes(id)) await api.assignAssetToSoftware(softwareId, id);
        }

        // Sync Users
        const currentAttachedUsers = await api.getSoftwareUsers(softwareId);
        const currentUserIds = currentAttachedUsers.map((u: any) => u.id);
        const newUserIds = extra.user_ids || [];

        for (const id of currentUserIds) {
          if (!newUserIds.includes(id)) await api.removeUserFromSoftware(softwareId, id);
        }
        for (const id of newUserIds) {
          if (!currentUserIds.includes(id)) await api.assignUserToSoftware(softwareId, id);
        }
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error saving software:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={software ? 'Modifier le logiciel' : 'Nouveau Logiciel'}
      subtitle={software ? `Édition de ${software.name}` : 'Gestion du catalogue logiciel'}
      maxWidth="5xl"
    >
      <SoftwareForm 
        initialData={software}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSaving={loading}
      />
    </Modal>
  );
};
