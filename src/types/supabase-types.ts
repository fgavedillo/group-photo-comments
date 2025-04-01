
/**
 * Type definitions for Supabase database
 * These types help ensure type safety when working with the Supabase database
 */
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
      issues: {
        Row: {
          id: number
          message: string
          username: string
          status: string
          security_improvement: string | null
          action_plan: string | null
          assigned_email: string | null
          area: string | null
          responsable: string | null
          url_key: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          id?: number
          message: string
          username?: string
          status?: string
          security_improvement?: string | null
          action_plan?: string | null
          assigned_email?: string | null
          area?: string | null
          responsable?: string | null
          url_key?: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          id?: number
          message?: string
          username?: string
          status?: string
          security_improvement?: string | null
          action_plan?: string | null
          assigned_email?: string | null
          area?: string | null
          responsable?: string | null
          url_key?: string
          timestamp?: string
          user_id?: string | null
        }
      }
      issue_images: {
        Row: {
          id: number
          issue_id: number | null
          image_url: string
          created_at: string | null
        }
        Insert: {
          id?: number
          issue_id?: number | null
          image_url: string
          created_at?: string | null
        }
        Update: {
          id?: number
          issue_id?: number | null
          image_url?: string
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          first_name: string | null
          last_name: string | null
          email: string | null
        }
        Insert: {
          id: string
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'user' | 'pending'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'admin' | 'user' | 'pending'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'user' | 'pending'
          created_at?: string
        }
      }
    }
    Views: {
      issue_details: {
        Row: {
          id: number | null
          message: string | null
          username: string | null
          status: string | null
          security_improvement: string | null
          action_plan: string | null
          assigned_email: string | null
          area: string | null
          responsable: string | null
          url_key: string | null
          timestamp: string | null
          user_id: string | null
          first_name: string | null
          last_name: string | null
          image_url: string | null
        }
      }
    }
    Functions: {
      [_ in string]: never
    }
    Enums: {
      [_ in string]: never
    }
  }
}
