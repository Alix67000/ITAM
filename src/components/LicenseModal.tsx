import React, { useState } from 'react';
import { api, License } from '../services/api';
import { Modal } from './ui/Modal';
import { LicenseForm } from './forms/LicenseForm';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  license?: License | null;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose, onRefresh, license }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: Partial<License>, extra: { asset_ids: string[], user_ids: string[] }) => {
    setLoading(true);
    try {
      let licenseId = license?.id;
      if (licenseId) {
        await api.updateLicense(licenseId, formData);
      } else {
        const result = await api.createLicense(formData);
        licenseId = result.id;
      }

      if (licenseId) {
        const currentAttachedAssets = await api.getLicenseAssets(licenseId);
        const currentAssetIds = currentAttachedAssets.map(a => a.id);
        const newAssetIds = extra.asset_ids;

        for (const id of currentAssetIds) {
          if (!newAssetIds.includes(id)) await api.removeAssetFromLicense(licenseId, id);
        }
        for (const id of newAssetIds) {
          if (!currentAssetIds.includes(id)) await api.assignAssetToLicense(licenseId, id);
        }

        const currentAttachedUsers = await api.getLicenseUsers(licenseId);
        const currentUserIds = currentAttachedUsers.map(u => u.id);
        const newUserIds = extra.user_ids;

        for (const id of currentUserIds) {
          if (!newUserIds.includes(id)) await api.removeUserFromLicense(licenseId, id);
        }
        for (const id of newUserIds) {
          if (!currentUserIds.includes(id)) await api.assignUserToLicense(licenseId, id);
        }
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={license ? 'Modifier la licence' : 'Nouvelle licence'}
      subtitle={license ? `Clé: ${license.license_key || 'N/A'}` : 'Vérification de la conformité et des usages'}
      maxWidth="5xl"
    >
      <LicenseForm 
        initialData={license}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSaving={loading}
      />
    </Modal>
  );
};
