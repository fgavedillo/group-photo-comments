export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_config: {
        Row: {
          company_id: string | null
          created_at: string | null
          from_email: string
          id: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_username: string
          updated_at: string | null
          use_tls: boolean | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          from_email: string
          id?: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_username: string
          updated_at?: string | null
          use_tls?: boolean | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          from_email?: string
          id?: string
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          smtp_username?: string
          updated_at?: string | null
          use_tls?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "email_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          cc_addresses: string[] | null
          created_at: string | null
          error: string | null
          html_content: string | null
          id: string
          is_periodic: boolean | null
          last_success: string | null
          period_type: string | null
          processed_at: string | null
          retry_count: number | null
          scheduled_for: string | null
          status: string | null
          subject: string | null
          to_addresses: string[] | null
        }
        Insert: {
          cc_addresses?: string[] | null
          created_at?: string | null
          error?: string | null
          html_content?: string | null
          id?: string
          is_periodic?: boolean | null
          last_success?: string | null
          period_type?: string | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
          subject?: string | null
          to_addresses?: string[] | null
        }
        Update: {
          cc_addresses?: string[] | null
          created_at?: string | null
          error?: string | null
          html_content?: string | null
          id?: string
          is_periodic?: boolean | null
          last_success?: string | null
          period_type?: string | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
          subject?: string | null
          to_addresses?: string[] | null
        }
        Relationships: []
      }
      issue_images: {
        Row: {
          created_at: string | null
          id: number
          image_url: string
          issue_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          image_url: string
          issue_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          image_url?: string
          issue_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_images_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_images_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          action_plan: string | null
          area: string | null
          assigned_email: string | null
          id: number
          message: string
          responsable: string | null
          security_improvement: string | null
          status: string | null
          timestamp: string | null
          url_key: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          action_plan?: string | null
          area?: string | null
          assigned_email?: string | null
          id?: number
          message: string
          responsable?: string | null
          security_improvement?: string | null
          status?: string | null
          timestamp?: string | null
          url_key?: string | null
          user_id?: string | null
          username?: string
        }
        Update: {
          action_plan?: string | null
          area?: string | null
          assigned_email?: string | null
          id?: number
          message?: string
          responsable?: string | null
          security_improvement?: string | null
          status?: string | null
          timestamp?: string | null
          url_key?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      issue_details: {
        Row: {
          action_plan: string | null
          area: string | null
          assigned_email: string | null
          first_name: string | null
          id: number | null
          image_url: string | null
          last_name: string | null
          message: string | null
          responsable: string | null
          security_improvement: string | null
          status: string | null
          timestamp: string | null
          url_key: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
