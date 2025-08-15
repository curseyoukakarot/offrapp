export type DomainType = 'apex' | 'sub';

export interface TenantDomain {
  id: string;
  tenant_id: string;
  domain: string;
  type: DomainType;
  txt_token: string;
  verified_at: string | null;
  ssl_status: 'pending' | 'ready' | 'failed' | string;
  created_at: string;
}


