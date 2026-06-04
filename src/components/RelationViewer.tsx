import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { relationService } from '../services/relationService';
import { EntityType, NormalizedRelation } from '../services/relationTypes';
import { 
  Monitor, 
  User, 
  MapPin, 
  Building2, 
  FileText, 
  Key, 
  AppWindow, 
  Smartphone, 
  Link2,
  ChevronRight,
  Loader2,
  ArrowRightLeft
} from 'lucide-react';

interface RelationViewerProps {
  entityType: EntityType;
  entityId: string;
  title?: string;
  className?: string;
}

const getEntityIcon = (type: EntityType) => {
  switch (type) {
    case 'asset': return Monitor;
    case 'user': return User;
    case 'location': return MapPin;
    case 'supplier': return Building2;
    case 'contract': return FileText;
    case 'license': return Key;
    case 'software': return AppWindow;
    case 'phone_line': return Smartphone;
    default: return Link2;
  }
};

const getEntityLabel = (type: EntityType) => {
  switch (type) {
    case 'asset': return 'Matériel';
    case 'user': return 'Utilisateur';
    case 'location': return 'Lieu';
    case 'supplier': return 'Fournisseur';
    case 'contract': return 'Contrat';
    case 'license': return 'Licence';
    case 'software': return 'Logiciel';
    case 'phone_line': return 'Ligne';
    default: return 'Générique';
  }
};

export const RelationViewer: React.FC<RelationViewerProps> = ({ 
  entityType, 
  entityId, 
  title = "Écosystème lié",
  className = ""
}) => {
  const [relations, setRelations] = useState<NormalizedRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRelations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await relationService.getEntityRelationsOverview(entityType, entityId);
        setRelations(data);
      } catch (err) {
        console.error('Failed to fetch relations:', err);
        setError('Impossible de charger les relations.');
      } finally {
        setLoading(false);
      }
    };
    
    if (entityId) {
      fetchRelations();
    }
  }, [entityType, entityId]);

  // Handle clickable routes based on existing implementations
  const handleNav = (targetType: EntityType, targetId: string) => {
    switch(targetType) {
      case 'asset': navigate(`/assets/${targetId}`); break;
      case 'contract': navigate(`/contracts/${targetId}`); break;
      case 'license': navigate(`/licenses/${targetId}`); break;
      default: break; // do not navigate
    }
  };

  const isClickable = (type: EntityType) => {
    return ['asset', 'contract', 'license'].includes(type);
  };

  if (loading) {
    return (
      <div className={`p-6 border border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center ${className}`}>
        <Loader2 className="w-6 h-6 text-slate-400 mb-2 animate-spin" />
        <p className="text-sm text-slate-500">Chargement des relations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 border border-red-100 rounded-xl bg-red-50 text-red-600 flex items-center gap-3 ${className}`}>
         <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
           <Link2 className="w-4 h-4" />
         </div>
         <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (relations.length === 0) {
    return (
      <div className={`p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center text-center ${className}`}>
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
          <Link2 className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="font-medium text-slate-700 mb-1">{title}</h3>
        <p className="text-sm text-slate-500">Aucune relation trouvée pour cette fiche.</p>
      </div>
    );
  }

  // Grouper par Cible (Target Type)
  const grouped = relations.reduce((acc, rel) => {
    const t = rel.target.type;
    if (!acc[t]) acc[t] = [];
    acc[t].push(rel);
    return acc;
  }, {} as Record<EntityType, NormalizedRelation[]>);

  return (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <ArrowRightLeft className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      
      <div className="p-5 flex flex-col gap-6">
        {(Object.keys(grouped) as EntityType[]).map(type => {
          const groupIcons = getEntityIcon(type);
          const Icon = groupIcons;
          const groupLabel = getEntityLabel(type);
          
          return (
            <div key={type} className="flex flex-col gap-3">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                 <Icon className="w-4 h-4" />
                 {groupLabel}s ({grouped[type].length})
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                 {grouped[type].map(rel => {
                   const clickable = isClickable(rel.target.type);
                   return (
                     <div 
                        key={rel.id}
                        onClick={() => clickable && handleNav(rel.target.type, rel.target.id)}
                        className={`flex items-center justify-between p-3 border border-slate-200 rounded-lg group ${clickable ? 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm transition-all' : 'bg-slate-50/50'}`}
                     >
                        <div className="flex flex-col min-w-0 pr-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 truncate">
                            <span className="truncate">{rel.target.label || 'Non nommé'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                              {rel.relation_type.replace(/_/g, ' ')}
                            </span>
                            {rel.origin === 'generic' && (
                              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Générique</span>
                            )}
                          </div>
                        </div>
                        
                        {clickable && (
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0" />
                        )}
                     </div>
                   );
                 })}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
