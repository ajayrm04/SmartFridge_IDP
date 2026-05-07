export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          created_at: string
          generated_from: string | null
          id: number
          recommendation: string
          related_item: string | null
          severity: string
        }
        Insert: {
          created_at?: string
          generated_from?: string | null
          id?: number
          recommendation: string
          related_item?: string | null
          severity?: string
        }
        Update: {
          created_at?: string
          generated_from?: string | null
          id?: number
          recommendation?: string
          related_item?: string | null
          severity?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: number
          message: string
          resolved: boolean
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: number
          message: string
          resolved?: boolean
          severity: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: number
          message?: string
          resolved?: boolean
          severity?: string
        }
        Relationships: []
      }
      control_logs: {
        Row: {
          cooling_level: number | null
          created_at: string
          id: number
          pid_output: number | null
          prev_temp: number | null
          reason: string | null
          target_temp: number | null
        }
        Insert: {
          cooling_level?: number | null
          created_at?: string
          id?: number
          pid_output?: number | null
          prev_temp?: number | null
          reason?: string | null
          target_temp?: number | null
        }
        Update: {
          cooling_level?: number | null
          created_at?: string
          id?: number
          pid_output?: number | null
          prev_temp?: number | null
          reason?: string | null
          target_temp?: number | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          activation_energy_kj: number
          base_shelf_life_hours: number
          category: string
          id: string
          last_updated: string
          name: string
          scanned_expiry_at: string | null
          scanned_expiry_date: string | null
          spoilage_pct: number
          stored_at: string
          zone_id: string
        }
        Insert: {
          activation_energy_kj: number
          base_shelf_life_hours: number
          category: string
          id?: string
          last_updated?: string
          name: string
          scanned_expiry_at?: string | null
          scanned_expiry_date?: string | null
          spoilage_pct?: number
          stored_at?: string
          zone_id?: string
        }
        Update: {
          activation_energy_kj?: number
          base_shelf_life_hours?: number
          category?: string
          id?: string
          last_updated?: string
          name?: string
          scanned_expiry_at?: string | null
          scanned_expiry_date?: string | null
          spoilage_pct?: number
          stored_at?: string
          zone_id?: string
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
          ammonia: number
          compressor_on: boolean
          created_at: string
          energy_w: number
          fan_on: boolean
          humidity: number
          id: number
          temperature: number
          zone_id: string
        }
        Insert: {
          ammonia?: number
          compressor_on?: boolean
          created_at?: string
          energy_w?: number
          fan_on?: boolean
          humidity: number
          id?: number
          temperature: number
          zone_id?: string
        }
        Update: {
          ammonia?: number
          compressor_on?: boolean
          created_at?: string
          energy_w?: number
          fan_on?: boolean
          humidity?: number
          id?: number
          temperature?: number
          zone_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          compressor_manual: boolean
          fan_manual: boolean
          id: number
          kd: number
          ki: number
          kp: number
          manual_override: boolean
          target_temp: number
        }
        Insert: {
          compressor_manual?: boolean
          fan_manual?: boolean
          id?: number
          kd?: number
          ki?: number
          kp?: number
          manual_override?: boolean
          target_temp?: number
        }
        Update: {
          compressor_manual?: boolean
          fan_manual?: boolean
          id?: number
          kd?: number
          ki?: number
          kp?: number
          manual_override?: boolean
          target_temp?: number
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
