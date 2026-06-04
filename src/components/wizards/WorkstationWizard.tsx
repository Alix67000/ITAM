import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Laptop, Link2, Smartphone, AppWindow, CheckCircle, 
  ChevronRight, ChevronLeft, Plus, X, Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { relationService } from '../../services/relationService';
import { User, Location, Supplier, License } from '../../services/api';
import { useToast } from '../../services/toastContext';

interface WorkstationWizardProps {
  onClose: () => void;
}

export const WorkstationWizard: React.FC<WorkstationWizardProps> = ({ onClose }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference data
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [softwares, setSoftwares] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [u, l, s, lic, sw] = await Promise.all([
          api.getUsers(),
          api.getLocations(),
          api.getSuppliers(),
          api.getLicenses(),
          api.getSoftwares()
        ]);
        setUsers(u);
        setLocations(l);
        setSuppliers(s);
        setLicenses(lic);
        setSoftwares(sw);
      } catch (err) {
        console.error("Erreur lors du chargement des données de référence", err);
      }
    };
    fetchData();
  }, []);

  // --- STATE DRAFT ---
  // Step 1: User
  const [userMode, setUserMode] = useState<'existing' | 'new'>('existing');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', department: '' });

  // Step 2: Main Asset
  const [mainAsset, setMainAsset] = useState({
    label: '',
    subtype: 'Ordinateur portable',
    model: '',
    serial: '',
    supplier_id: '',
    location_id: ''
  });

  // Step 3: Linked Equipments
  const [equipments, setEquipments] = useState<Array<{ id: string, label: string, type: string, model: string, serial: string }>>([]);

  const addEquipment = () => {
    setEquipments([...equipments, { id: Math.random().toString(), label: '', type: 'Périphérique', model: '', serial: '' }]);
  };
  const updateEquipment = (id: string, field: string, value: string) => {
    setEquipments(equipments.map(eq => eq.id === id ? { ...eq, [field]: value } : eq));
  };
  const removeEquipment = (id: string) => {
    setEquipments(equipments.filter(eq => eq.id !== id));
  };

  // Step 4: Phone
  const [addPhone, setAddPhone] = useState(false);
  const [phone, setPhone] = useState({ label: '', number: '', type: 'Smartphone mobile' });

  // Step 5: Softwares & Licenses
  const [selectedSoftwares, setSelectedSoftwares] = useState<string[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);

  const toggleSelection = (selectedList: string[], setter: (val: string[]) => void, id: string) => {
    if (selectedList.includes(id)) {
      setter(selectedList.filter(x => x !== id));
    } else {
      setter([...selectedList, id]);
    }
  };

  // --- RENDERING VARIANTS ---
  const stepsList = [
    { id: 1, name: 'Collaborateur', icon: Users },
    { id: 2, name: 'Ordinateur', icon: Laptop },
    { id: 3, name: 'Équipements', icon: Link2 },
    { id: 4, name: 'Téléphonie', icon: Smartphone },
    { id: 5, name: 'Logiciels & Licences', icon: AppWindow },
    { id: 6, name: 'Validation', icon: CheckCircle },
  ];

  const handleNext = () => setStep(prev => Math.min(prev + 1, 6));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create or get User
      let userId = selectedUserId;
      if (userMode === 'new') {
        const u = await api.createUser({
          name: newUser.name,
          email: newUser.email,
          department: newUser.department,
          role: 'user',
          location_id: mainAsset.location_id || null
        });
        if (u && u.id) userId = u.id;
      }

      if (!userId) throw new Error("Utilisateur non défini.");

      // 2. Create Main Asset
      const pc = await api.createAsset({
        label: mainAsset.label || 'Ordinateur Principal',
        type: 'Ordinateur',
        subtype: mainAsset.subtype,
        specs: mainAsset.model,
        serial: mainAsset.serial,
        supplier_id: mainAsset.supplier_id || null,
        location_id: mainAsset.location_id || null,
        assigned_user_id: userId,
        status: 'active',
        condition: 'new'
      });
      const pcId = pc?.id;
      if (!pcId) throw new Error("Erreur de création de l'ordinateur principal.");

      // 3. Create & Link Equipments
      for (const eq of equipments) {
        if (!eq.label) continue;
        const eqAsset = await api.createAsset({
          label: eq.label,
          type: eq.type,
          subtype: 'Autre',
          specs: eq.model,
          serial: eq.serial,
          supplier_id: mainAsset.supplier_id || null,
          location_id: mainAsset.location_id || null,
          assigned_user_id: userId,
          status: 'active',
          condition: 'new'
        });

        if (eqAsset && eqAsset.id) {
          await api.linkAsset(pcId, eqAsset.id);
          // Optional: On pourrait aussi insérer la relation générique ici pour la formaliser
          await relationService.createRelation({
            from_type: 'asset',
            from_id: eqAsset.id,
            to_type: 'asset',
            to_id: pcId,
            relation_type: 'attached_to',
            status: 'active'
          });
        }
      }

      // 4. Create Phone Line
      if (addPhone && phone.number) {
        await api.createPhoneLine({
          label: phone.label || 'Ligne attribuée',
          number: phone.number,
          status: 'active',
          assigned_user_id: userId,
          location_id: mainAsset.location_id || null
        });
      }

      // 5. Link Softwares and Licenses
      for (const swId of selectedSoftwares) {
        await api.assignAssetToSoftware(swId, pcId);
      }
      for (const licId of selectedLicenses) {
        await api.assignUserToLicense(licId, userId);
      }

      showToast("Le poste complet a été créé et assigné avec succès !", "success");
      onClose(); // Fermer le wizard
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erreur lors du provisionnement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = userMode === 'existing' ? !!selectedUserId : !!newUser.name;
  const isStep2Valid = !!mainAsset.label;
  const canGoNext = (step === 1 && isStep1Valid) || (step === 2 && isStep2Valid) || (step > 2);

  return (
    <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Sidebar Steps */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto">
          <div className="mb-6 border-b border-slate-200 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Poste<br/>Complet</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Wizard</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            {stepsList.map(s => {
              const isActive = s.id === step;
              const isPast = s.id < step;
              return (
                <div 
                  key={s.id} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isActive ? 'bg-indigo-600 text-white shadow-md' :
                    isPast ? 'bg-indigo-50 text-indigo-900' :
                    'text-slate-400'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    isActive ? 'bg-indigo-500/50' : isPast ? 'bg-white/50 border border-indigo-100' : 'bg-slate-100'
                  }`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : isPast ? 'text-indigo-900' : 'text-slate-500'}`}>{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-8 pb-20">
              
              {/* STEP 1 */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Collaborateur</h3>
                    <p className="text-sm text-slate-500">À qui ce poste est-il destiné ?</p>
                  </div>
                  
                  <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                    <button 
                      onClick={() => setUserMode('existing')} 
                      className={`flex-1 text-sm font-bold py-2 px-4 rounded-lg transition-all ${userMode === 'existing' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                    >
                      Utilisateur existant
                    </button>
                    <button 
                      onClick={() => setUserMode('new')} 
                      className={`flex-1 text-sm font-bold py-2 px-4 rounded-lg transition-all ${userMode === 'new' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                    >
                      Nouvel utilisateur
                    </button>
                  </div>

                  {userMode === 'existing' ? (
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-slate-700">Sélectionner un collaborateur</label>
                      <select 
                        value={selectedUserId} 
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3"
                      >
                        <option value="">-- Choisir un utilisateur --</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email || 'Sans email'})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nom complet *</label>
                        <input 
                          type="text" 
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          placeholder="Ex: Jean Dupont"
                          className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                          <input 
                            type="email" 
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            placeholder="jean.dupont@emmaus.org"
                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Service / Pôle</label>
                          <input 
                            type="text" 
                            value={newUser.department}
                            onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                            placeholder="Ex: Administratif"
                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Ordinateur Principal</h3>
                    <p className="text-sm text-slate-500">Le matériel principal affecté au collaborateur.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                       <label className="block text-sm font-bold text-slate-700 mb-1">Nom / Label de l'ordinateur *</label>
                       <input 
                         type="text" 
                         value={mainAsset.label}
                         onChange={(e) => setMainAsset({...mainAsset, label: e.target.value})}
                         placeholder="Ex: PC-J-DUPONT-01"
                         className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3" 
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Type de poste</label>
                       <select 
                         value={mainAsset.subtype}
                         onChange={(e) => setMainAsset({...mainAsset, subtype: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3"
                       >
                          <option value="Ordinateur portable">Ordinateur portable</option>
                          <option value="Ordinateur de bureau">Ordinateur de bureau</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Modèle (optionnel)</label>
                       <input 
                         type="text" 
                         value={mainAsset.model}
                         onChange={(e) => setMainAsset({...mainAsset, model: e.target.value})}
                         placeholder="Ex: Dell Latitude 5420"
                         className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3" 
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">N° de Série S/N</label>
                       <input 
                         type="text" 
                         value={mainAsset.serial}
                         onChange={(e) => setMainAsset({...mainAsset, serial: e.target.value})}
                         placeholder="Série ou Service Tag"
                         className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3" 
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Localisation (Lieu)</label>
                       <select 
                         value={mainAsset.location_id}
                         onChange={(e) => setMainAsset({...mainAsset, location_id: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3"
                       >
                          <option value="">-- Sans localisation --</option>
                          {locations.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                       </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-1">Équipements liés</h3>
                      <p className="text-sm text-slate-500">Périphériques rattachés au poste principal.</p>
                    </div>
                    <button 
                      onClick={addEquipment}
                      className="px-3 py-2 bg-indigo-50 text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-100 flex items-center gap-1"
                    >
                       <Plus className="w-4 h-4" /> Ajouter
                    </button>
                  </div>
                  
                  {equipments.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center text-slate-500">
                      Aucun équipement lié.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {equipments.map((eq, i) => (
                        <div key={eq.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                          <button 
                            onClick={() => removeEquipment(eq.id)}
                            className="absolute -top-2 -right-2 bg-white text-rose-500 shadow border border-rose-100 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nom / Label *</label>
                               <input 
                                 type="text" 
                                 value={eq.label}
                                 onChange={(e) => updateEquipment(eq.id, 'label', e.target.value)}
                                 placeholder="Ex: Écran Dell 24 pouces"
                                 className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg p-2" 
                               />
                            </div>
                            <div>
                               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type</label>
                               <select 
                                 value={eq.type}
                                 onChange={(e) => updateEquipment(eq.id, 'type', e.target.value)}
                                 className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg p-2"
                               >
                                  <option value="Écran">Écran</option>
                                  <option value="Périphérique">Périphérique (Clavier, Souris...)</option>
                                  <option value="Docking Station">Docking Station</option>
                                  <option value="Audio">Audio / Micro casque</option>
                               </select>
                            </div>
                            <div>
                               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Modèle</label>
                               <input 
                                 type="text" 
                                 value={eq.model}
                                 onChange={(e) => updateEquipment(eq.id, 'model', e.target.value)}
                                 className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg p-2" 
                               />
                            </div>
                            <div>
                               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">S/N</label>
                               <input 
                                 type="text" 
                                 value={eq.serial}
                                 onChange={(e) => updateEquipment(eq.id, 'serial', e.target.value)}
                                 className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg p-2" 
                               />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Téléphonie (Optionnel)</h3>
                    <p className="text-sm text-slate-500">Attribuer une ligne mobile ou fixe au collaborateur.</p>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <input 
                      type="checkbox" 
                      id="addPhoneToggle"
                      checked={addPhone}
                      onChange={(e) => setAddPhone(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded bg-white border-slate-300"
                    />
                    <label htmlFor="addPhoneToggle" className="text-sm font-bold text-slate-800 cursor-pointer select-none">
                      Créer et attribuer une nouvelle ligne téléphonique
                    </label>
                  </div>

                  {addPhone && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 border border-indigo-100 rounded-2xl">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Numéro de ligne *</label>
                        <input 
                          type="text" 
                          value={phone.number}
                          onChange={(e) => setPhone({...phone, number: e.target.value})}
                          placeholder="Ex: 06 12 34 56 78"
                          className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Label</label>
                        <input 
                          type="text" 
                          value={phone.label}
                          onChange={(e) => setPhone({...phone, label: e.target.value})}
                          placeholder="Ex: Flotte Emmaüs"
                          className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Type de ligne</label>
                        <select 
                          value={phone.type}
                          onChange={(e) => setPhone({...phone, type: e.target.value})}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3"
                        >
                          <option value="Mobile">Mobile (Smartphone)</option>
                          <option value="Fixe">Ligne fixe DECT</option>
                          <option value="M2M">Données 4G (M2M)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 5 */}
              {step === 5 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Logiciels & Licences (Optionnel)</h3>
                    <p className="text-sm text-slate-500">Attribuer rapidement des éléments existants.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Logiciels (liés au PC)</h4>
                      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                         {softwares.map(sw => (
                           <label key={sw.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                             <input 
                               type="checkbox" 
                               checked={selectedSoftwares.includes(sw.id)}
                               onChange={() => toggleSelection(selectedSoftwares, setSelectedSoftwares, sw.id)}
                               className="w-4 h-4 text-indigo-600 rounded bg-white border-slate-300"
                             />
                             <span className="text-sm font-medium text-slate-700">{sw.name}</span>
                           </label>
                         ))}
                         {softwares.length === 0 && <p className="text-xs text-slate-400 italic">Aucun logiciel répertorié</p>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Licences (liées à l'Utilisateur)</h4>
                      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                         {licenses.map(lic => (
                           <label key={lic.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                             <input 
                               type="checkbox" 
                               checked={selectedLicenses.includes(lic.id)}
                               onChange={() => toggleSelection(selectedLicenses, setSelectedLicenses, lic.id)}
                               className="w-4 h-4 text-indigo-600 rounded bg-white border-slate-300"
                             />
                             <div className="flex flex-col">
                               <span className="text-sm font-medium text-slate-700">{lic.label}</span>
                               {lic.editor && <span className="text-[10px] text-slate-400">{lic.editor}</span>}
                             </div>
                           </label>
                         ))}
                         {licenses.length === 0 && <p className="text-xs text-slate-400 italic">Aucune licence répertoriée</p>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 6: Summary */}
              {step === 6 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Résumé avant création</h3>
                    <p className="text-sm text-slate-500">Vérifiez les informations qui vont être créées.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3"><Users className="w-3 h-3"/> Collaborateur</h4>
                      {userMode === 'existing' ? (
                        <p className="text-sm font-bold text-slate-800">{users.find(u => u.id === selectedUserId)?.name || 'Inconnu'}</p>
                      ) : (
                        <div>
                          <p className="text-sm font-bold text-slate-800">{newUser.name}</p>
                          <p className="text-xs text-slate-500">Nouveau collaborateur</p>
                        </div>
                      )}
                    </div>
                    <div className="p-5 border border-slate-200 rounded-2xl bg-indigo-50/50">
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3"><Laptop className="w-3 h-3"/> Poste Principal</h4>
                      <p className="text-sm font-bold text-indigo-900">{mainAsset.label}</p>
                      <p className="text-xs text-indigo-600/70">{mainAsset.subtype}</p>
                    </div>
                    {equipments.length > 0 && (
                      <div className="md:col-span-2 p-5 border border-slate-200 rounded-2xl bg-slate-50">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3"><Link2 className="w-3 h-3"/> Équipements LIÉS ({equipments.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {equipments.map(eq => (
                            <span key={eq.id} className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg">{eq.label || 'Sans nom'}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {addPhone && (
                      <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3"><Smartphone className="w-3 h-3"/> Ligne</h4>
                        <p className="text-sm font-bold text-slate-800">{phone.number || 'Non renseigné'}</p>
                        <p className="text-xs text-slate-500">{phone.type}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white border-t border-slate-100 p-6 flex justify-between items-center z-10 shrink-0">
            {step > 1 ? (
              <button 
                onClick={handlePrev}
                disabled={isSubmitting}
                className="px-6 py-3 font-bold text-sm text-slate-500 hover:text-slate-900 flex items-center gap-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Précédent
              </button>
            ) : <div />}

            {step < 6 ? (
              <button 
                onClick={handleNext}
                disabled={!canGoNext || isSubmitting}
                className="px-8 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-all disabled:opacity-50 disabled:bg-slate-300 shadow-sm"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Provisionnement...</>
                ) : (
                  <><CheckCircle className="w-5 h-5" /> Créer le poste complet</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
