export type EntityType = 
  | 'asset'
  | 'user'
  | 'location'
  | 'supplier'
  | 'contract'
  | 'license'
  | 'software'
  | 'phone_line';

export interface EntityRef {
  type: EntityType;
  id: string;
  label?: string;
}

export interface GenericRelation {
  id?: string;
  from_type: EntityType;
  from_id: string;
  to_type: EntityType;
  to_id: string;
  relation_type: string;
  label?: string;
  status: string;
  is_primary?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface NormalizedRelation {
  id: string;
  direction: 'incoming' | 'outgoing';
  relation_type: string;
  source: EntityRef;
  target: EntityRef;
  label?: string;
  status: string;
  origin: 'legacy' | 'generic';
}
