import React, { useState } from 'react';
import { api, Contract } from '../services/api';
import { Modal } from './ui/Modal';
import { ContractForm } from './forms/ContractForm';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  contract?: Contract | null;
}

export const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, onRefresh, contract }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: Partial<Contract>, associations: { phoneLineIds: string[], userIds: string[], printerIds: string[] }) => {
    setLoading(true);
    try {
      let contractId = contract?.id;
      if (contractId) {
        await api.updateContract(contractId, formData);
      } else {
        const res = await api.createContract(formData);
        if (res?.id) contractId = res.id;
      }
      
      if (contractId) {
        await Promise.all([
          api.syncContractPhoneLines(contractId, associations.phoneLineIds),
          api.syncContractUsers(contractId, associations.userIds),
          api.syncContractPrinters(contractId, associations.printerIds)
        ]);
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contract ? 'Modifier le Contrat' : 'Nouveau Contrat'}
      subtitle={contract ? `Référence: ${contract.reference}` : 'Gestion des engagements et leasings'}
      maxWidth="3xl"
    >
      <ContractForm
        initialData={contract || undefined}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSaving={loading}
      />
    </Modal>
  );
};
