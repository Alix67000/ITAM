import React, { useEffect, useState } from 'react';
import { api, Asset, User, Location, Contract, License, Supplier } from '../../services/api';
import { cn } from '../../lib/utils';
import { theme } from '../../lib/theme';
import { Save, Cpu, Smartphone, Monitor, Printer, HardDrive, MousePointer2, Network, Box, Key, FileText, Calendar, Package } from 'lucide-react';

interface AssetFormProps {
  initialData?: Partial<Asset>;
  onSubmit: (data: Partial<Asset>, extra?: { license_id?: string | null; contract_id?: string | null }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  showLinks?: boolean;
}

export const AssetForm: React.FC<AssetFormProps> = ({ initialData, onSubmit, onCancel, isSaving, showLinks = false }) => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    label: '',
    serial: '',
    inventory_number: '',
    type: 'PC',
    subtype: '',
    status: 'Stock',
    location_id: null,
    supplier_id: null,
    assigned_user_id: null,
    specs: '',
    condition: 'neuf',
    value_euros: 0,
    manufacture_date: '',
    commissioning_date: '',
    has_warranty: false,
    warranty_end: '',
    ...initialData
  });

  const [extraData, setExtraData] = useState<{ license_id?: string | null; contract_id?: string | null }>({
    license_id: null,
    contract_id: null
  });

  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [u, l, lic, c, s] = await Promise.all([
        api.getUsers(), 
        api.getLocations(),
        api.getLicenses(),
        api.getContracts(),
        api.getSuppliers()
      ]);
      setUsers(u);
      setLocations(l);
      setLicenses(lic);
      setContracts(c);
      setSuppliers(s);
    };
    fetchData();
  }, []);

  // Inventory Auto-generation logic
  const isCreate = !initialData?.id;
  useEffect(() => {
    if (isCreate && formData.type) {
      const fetchNextNum = async () => {
        try {
          const { nextNumber } = await api.getNextInventoryNumber(formData.type);
          setFormData(prev => ({ ...prev, inventory_number: nextNumber }));
        } catch (e) {
          console.error("Error generating inventory number", e);
        }
      };
      fetchNextNum();
    }
  }, [formData.type, isCreate]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PC': return <Cpu className="w-4 h-4" />;
      case 'Téléphone': return <Smartphone className="w-4 h-4" />;
      case 'Imprimante': return <Printer className="w-4 h-4" />;
      case 'Écran': return <Monitor className="w-4 h-4" />;
      case 'Périphérique': return <MousePointer2 className="w-4 h-4" />;
      case 'Réseau': return <Network className="w-4 h-4" />;
      case 'Autre': return <Package className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  const types = ['PC', 'Téléphone', 'Imprimante', 'Écran', 'Périphérique', 'Réseau', 'Autre'];
  const statuses = ['Stock', 'En service', 'En réparation', 'Panne', 'Disparu', 'Réformé'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identité Section */}
        <div className={theme.formSection}>
          <div className={theme.formSectionTitle}>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Identité de l'Asset
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={theme.formLabel}>Nom / Libellé</label>
              <input 
                className={theme.inputBase}
                value={formData.label || ''}
                onChange={e => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ex: PC-042"
              />
            </div>

            <div className={theme.formGrid}>
              <div>
                <label className={theme.formLabel}>N° Série</label>
                <input 
                  className={cn(theme.inputBase, "font-mono")}
                  value={formData.serial || ''}
                  onChange={e => setFormData({ ...formData, serial: e.target.value })}
                  placeholder="SN..."
                />
              </div>
              <div>
                <label className={theme.formLabel}>N° Inventaire</label>
                <input 
                  readOnly={isCreate}
                  className={cn(
                    theme.inputBase,
                    "font-mono",
                    isCreate && "text-indigo-600 bg-indigo-50/50 border-indigo-100 cursor-not-allowed"
                  )}
                  value={formData.inventory_number || ''}
                  onChange={e => !isCreate && setFormData({ ...formData, inventory_number: e.target.value })}
                  placeholder="AUTO-GENERATED"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={theme.formLabel}>Classification</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                 {types.map(t => (
                   <button
                     key={t}
                     type="button"
                     onClick={() => setFormData({ ...formData, type: t })}
                     className={cn(
                       "flex items-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tight border transition-all",
                       formData.type === t 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                     )}
                   >
                     {getTypeIcon(t)}
                     {t}
                   </button>
                 ))}
              </div>
            </div>

            <div className="pt-2">
              <label className={theme.formLabel}>Type précis / Modèle (Subtype)</label>
              <input 
                className={theme.inputBase}
                value={formData.subtype || ''}
                onChange={e => setFormData({ ...formData, subtype: e.target.value })}
                placeholder="Ex: Latitude 5420, iPhone 13, HP LaserJet..."
              />
            </div>
          </div>
        </div>

        {/* Cycle de Vie Section */}
        <div className={theme.formSection}>
          <div className={theme.formSectionTitle}>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Cycle de Vie
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={theme.formLabel}>État à l'acquisition</label>
              <select 
                className={theme.inputBase}
                value={formData.condition || 'neuf'}
                onChange={e => setFormData({ ...formData, condition: e.target.value })}
              >
                <option value="neuf">Neuf</option>
                <option value="occasion">Occasion</option>
                <option value="reconditionné">Reconditionné</option>
              </select>
            </div>

            <div className={theme.formGrid}>
              <div>
                <label className={theme.formLabel}>Date de fabrication</label>
                <input 
                  type="date"
                  className={theme.inputBase}
                  value={formData.manufacture_date || ''}
                  onChange={e => setFormData({ ...formData, manufacture_date: e.target.value })}
                />
              </div>
              <div>
                <label className={theme.formLabel}>Mise en service</label>
                <input 
                  type="date"
                  className={theme.inputBase}
                  value={formData.commissioning_date || ''}
                  onChange={e => setFormData({ ...formData, commissioning_date: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financier & Garantie Section */}
        <div className={theme.formSection}>
          <div className={theme.formSectionTitle}>
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
             Finance & Garantie
          </div>

          <div className="space-y-4">
            <div>
              <label className={theme.formLabel}>Valeur d'achat (€)</label>
              <input 
                type="number"
                step="0.01"
                className={cn(theme.inputBase, "font-mono")}
                value={formData.value_euros || ''}
                onChange={e => setFormData({ ...formData, value_euros: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900">Sous garantie ?</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Activer pour définir une date de fin</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_warranty: !formData.has_warranty })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative outline-none focus:ring-2 focus:ring-indigo-100 focus:ring-offset-1",
                  formData.has_warranty ? "bg-indigo-600" : "bg-slate-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                  formData.has_warranty ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            {formData.has_warranty && (
              <div className="animate-in zoom-in-95 duration-200 pt-2">
                <label className={theme.formLabel}>Fin de garantie</label>
                <input 
                  type="date"
                  required={formData.has_warranty}
                  className={cn(theme.inputBase, "text-indigo-700 bg-indigo-50/50 border-indigo-100")}
                  value={formData.warranty_end || ''}
                  onChange={e => setFormData({ ...formData, warranty_end: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Affectation Section */}
        <div className={theme.formSection}>
          <div className={theme.formSectionTitle}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Affectation & Statut
          </div>

          <div className="space-y-4">
            <div className={theme.formGrid}>
              <div>
                <label className={theme.formLabel}>Lieu</label>
                <select 
                  className={theme.inputBase}
                  value={formData.location_id || ''}
                  onChange={e => setFormData({ ...formData, location_id: e.target.value || null })}
                >
                  <option value="">Non assigné</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className={theme.formLabel}>Utilisateur</label>
                <select 
                  className={theme.inputBase}
                  value={formData.assigned_user_id || ''}
                  onChange={e => setFormData({ ...formData, assigned_user_id: e.target.value || null })}
                >
                  <option value="">En stock</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={theme.formLabel}>État actuel</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: s })}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                      formData.status === s 
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                        : "bg-slate-100 border-transparent text-slate-500 hover:border-slate-200"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
                <label className={theme.formLabel}>Fournisseur</label>
                <select 
                  className={theme.inputBase}
                  value={formData.supplier_id || ''}
                  onChange={e => setFormData({ ...formData, supplier_id: e.target.value || null })}
                >
                  <option value="">Inconnu</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
          </div>
        </div>

        {/* Links Section (Optional) */}
        {showLinks && (
          <div className="lg:col-span-2 bg-indigo-900 rounded-3xl p-8 border border-indigo-800 shadow-xl text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
            <div className="flex items-center gap-2 relative border-b border-indigo-800/50 pb-4">
              <div className="p-2 bg-indigo-800/50 rounded-xl text-indigo-300">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Liens (Licences & Contrats)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                   <Key className="w-3 h-3" /> Licence à rattachée
                </label>
                <select 
                  className="w-full bg-indigo-950/50 border border-indigo-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  value={extraData.license_id || ''}
                  onChange={e => setExtraData({ ...extraData, license_id: e.target.value || null })}
                >
                  <option value="">Aucune licence</option>
                  {licenses.map(lic => <option key={lic.id} value={lic.id}>{lic.label} ({lic.software})</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                   <Calendar className="w-3 h-3" /> Contrat à rattaché
                </label>
                <select 
                  className="w-full bg-indigo-950/50 border border-indigo-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  value={extraData.contract_id || ''}
                  onChange={e => setExtraData({ ...extraData, contract_id: e.target.value || null })}
                >
                  <option value="">Aucun contrat</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.label} ({c.type})</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Spécifications Section (Full width) */}
        <div className={cn(theme.formSection, "lg:col-span-2")}>
          <div className={theme.formSectionTitle}>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Description & Spécifications Techniques
          </div>
          <textarea 
            className={cn(theme.inputBase, "min-h-[150px] resize-none")}
            value={formData.specs || ''}
            onChange={e => setFormData({ ...formData, specs: e.target.value })}
            placeholder="Détails techniques (CPU, RAM, OS, Modèle précis...) ou description libre de l'asset"
          />
        </div>
      </div>

      <div className={theme.modalFooter}>
        <button 
          type="button"
          onClick={onCancel}
          className={theme.btnSecondary}
        >
          Annuler
        </button>
        <button 
          onClick={() => {
            // Validations
            if (formData.value_euros !== undefined && formData.value_euros < 0) {
              alert("La valeur d'achat doit être positive");
              return;
            }
            if (formData.manufacture_date && formData.commissioning_date) {
              if (new Date(formData.manufacture_date) > new Date(formData.commissioning_date)) {
                alert("La date de fabrication ne peut pas être après la date de mise en service");
                return;
              }
            }
            if (formData.has_warranty && !formData.warranty_end) {
              alert("Veuillez renseigner la date de fin de garantie");
              return;
            }
            onSubmit(formData, extraData);
          }}
          disabled={isSaving || !formData.label}
          className={theme.btnPrimary}
        >
          {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>
    </div>
  );
};
