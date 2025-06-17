export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      instagram_accounts: {
        Row: {
          id: string
          user_id: string
          instagram_user_id: string
          username: string
          access_token: string
          token_expires_at: string
          account_type: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          instagram_user_id: string
          username: string
          access_token: string
          token_expires_at: string
          account_type?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          instagram_user_id?: string
          username?: string
          access_token?: string
          token_expires_at?: string
          account_type?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}