export type Profile = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  company_name: string | null;
  website: string | null;
};

export type InstagramRequest = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  instagram_handle: string;
  niche: string;
  goals: string[];
  email: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
};

export type Report = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  request_id: string | null;
  report_data: any;
  report_url: string | null;
  status: 'processing' | 'completed' | 'failed';
};

export type InstagramAccount = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  instagram_id: string;
  instagram_handle: string;
  access_token: string;
  token_expires_at: string | null;
  is_active: boolean;
};