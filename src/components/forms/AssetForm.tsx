import React, { useEffect, useState } from 'react';
import { api, Asset, User, Location, Contract, License, Supplier } from '../../services/api';
import { cn } from '../../lib/utils';
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Identité Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-50 pb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <h3 className="text-xs font-black uppercase tracking-widest">Identité de l'Asset</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Nom / Libellé</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.label || ''}
                onChange={e => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ex: PC-042"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">N° Série</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:bg-white focus:border-blue-500 outline-none transition-all"
                  value={formData.serial || ''}
                  onChange={e => setFormData({ ...formData, serial: e.target.value })}
                  placeholder="SN..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">N° Inventaire</label>
                <input 
                  readOnly={isCreate}
                  className={cn(
                    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all",
                    isCreate ? "text-blue-600 bg-blue-50/50 border-blue-100 cursor-not-allowed" : "focus:bg-white focus:border-blue-500"
                  )}
                  value={formData.inventory_number || ''}
                  onChange={e => !isCreate && setFormData({ ...formData, inventory_number: e.target.value })}
                  placeholder="AUTO-GENERATED"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Classification</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                 {types.map(t => (
                   <button
                     key={t}
                     type="button"
                     onClick={() => setFormData({ ...formData, type: t })}
                     className={cn(
                       "flex items-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tight border transition-all",
                       formData.type === t 
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                     )}
                   >
                     {getTypeIcon(t)}
                     {t}
                   </button>
                 ))}
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Type précis / Modèle (Subtype)</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                value={formData.subtype || ''}
                onChange={e => setFormData({ ...formData, subtype: e.target.value })}
                placeholder="Ex: Latitude 5420, iPhone 13, HP LaserJet..."
              />
            </div>
          </div>
        </div>

        {/* Cycle de Vie Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-50 pb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <h3 className="text-xs font-black uppercase tracking-widest">Cycle de Vie</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">État à l'acquisition</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-blue-500"
                value={formData.condition || 'neuf'}
                onChange={e => setFormData({ ...formData, condition: e.target.value })}
              >
                <option value="neuf">Neuf</option>
                <option value="occasion">Occasion</option>
                <option value="reconditionné">Reconditionné</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Date de fabrication</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                  value={formData.manufacture_date || ''}
                  onChange={e => setFormData({ ...formData, manufacture_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Mise en service</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                  value={formData.commissioning_date || ''}
                  onChange={e => setFormData({ ...formData, commissioning_date: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financier & Garantie Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-slate-100 border-b border-indigo-50/10 pb-3">
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Finance & Garantie</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Valeur d'achat (€)</label>
              <input 
                type="number"
                step="0.01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                value={formData.value_euros || ''}
                onChange={e => setFormData({ ...formData, value_euros: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900">Sous garantie ?</p>
                <p className="text-[10px] text-slate-400 font-medium">Activer pour définir une date de fin</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_warranty: !formData.has_warranty })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  formData.has_warranty ? "bg-blue-600" : "bg-slate-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                  formData.has_warranty ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            {formData.has_warranty && (
              <div className="space-y-1 animate-in zoom-in-95 duration-200">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Fin de garantie</label>
                <input 
                  type="date"
                  required={formData.has_warranty}
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-blue-700 focus:bg-white focus:border-blue-500 outline-none transition-all"
                  value={formData.warranty_end || ''}
                  onChange={e => setFormData({ ...formData, warranty_end: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Affectation Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-50 pb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <h3 className="text-xs font-black uppercase tracking-widest">Affectation & Statut</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Lieu</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-blue-500"
                  value={formData.location_id || ''}
                  onChange={e => setFormData({ ...formData, location_id: e.target.value || null })}
                >
                  <option value="">Non assigné</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Utilisateur</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-blue-500"
                  value={formData.assigned_user_id || ''}
                  onChange={e => setFormData({ ...formData, assigned_user_id: e.target.value || null })}
                >
                  <option value="">En stock</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">État actuel</label>
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

            <div className="space-y-1 pt-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Fournisseur</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-blue-500"
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
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-50 pb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-widest">Description & Spécifications Techniques</h3>
          </div>
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all min-h-[150px] resize-none"
            value={formData.specs || ''}
            onChange={e => setFormData({ ...formData, specs: e.target.value })}
            placeholder="Détails techniques (CPU, RAM, OS, Modèle précis...) ou description libre de l'asset"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-200 z-[110] flex items-center justify-between">
        <button 
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
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
          className="flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-2xl text-sm font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:grayscale disabled:translate-y-0"
        >
          {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          ENREGISTRER L'ASSET
        </button>
      </div>
    </div>
  );
};
