// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          company: string | null
          linkedin_cookie: string | null
          linkedin_profile: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          company?: string | null
          linkedin_cookie?: string | null
          linkedin_profile?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          company?: string | null
          linkedin_cookie?: string | null
          linkedin_profile?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      automations: {
        Row: {
          id: string
          user_id: string
          name: string
          post_url: string
          status: 'active' | 'paused' | 'error'
          keywords: string[]
          engagement_criteria: Json
          message_template: string
          resource_type: 'file' | 'link' | null
          resource_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          post_url: string
          status?: 'active' | 'paused' | 'error'
          keywords: string[]
          engagement_criteria?: Json
          message_template: string
          resource_type?: 'file' | 'link' | null
          resource_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          post_url?: string
          status?: 'active' | 'paused' | 'error'
          keywords?: string[]
          engagement_criteria?: Json
          message_template?: string
          resource_type?: 'file' | 'link' | null
          resource_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      processed_comments: {
        Row: {
          id: string
          automation_id: string
          comment_id: string
          user_profile: Json
          matched_keywords: string[] | null
          criteria_met: boolean | null
          dm_sent: boolean | null
          processed_at: string
          sent_at: string | null
        }
        Insert: {
          id?: string
          automation_id: string
          comment_id: string
          user_profile: Json
          matched_keywords?: string[] | null
          criteria_met?: boolean | null
          dm_sent?: boolean | null
          processed_at?: string
          sent_at?: string | null
        }
        Update: {
          id?: string
          automation_id?: string
          comment_id?: string
          user_profile?: Json
          matched_keywords?: string[] | null
          criteria_met?: boolean | null
          dm_sent?: boolean | null
          processed_at?: string
          sent_at?: string | null
        }
      }
      message_deliveries: {
        Row: {
          id: string
          automation_id: string
          recipient_profile: Json
          message_content: string
          delivery_status: 'pending' | 'sent' | 'failed' | 'retry'
          attempts: number | null
          error_message: string | null
          sent_at: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          automation_id: string
          recipient_profile: Json
          message_content: string
          delivery_status?: 'pending' | 'sent' | 'failed' | 'retry'
          attempts?: number | null
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          automation_id?: string
          recipient_profile?: Json
          message_content?: string
          delivery_status?: 'pending' | 'sent' | 'failed' | 'retry'
          attempts?: number | null
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          created_at?: string
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Automation = Database['public']['Tables']['automations']['Row']
export type ProcessedComment = Database['public']['Tables']['processed_comments']['Row']
export type MessageDelivery = Database['public']['Tables']['message_deliveries']['Row']

// Engagement criteria type
export interface EngagementCriteria {
  requireLike: boolean
  requireFollow: boolean
  requireConnection: boolean
}

// LinkedIn profile data structure
export interface LinkedInProfile {
  id: string
  name: string
  headline?: string
  profileUrl: string
  avatarUrl?: string
}