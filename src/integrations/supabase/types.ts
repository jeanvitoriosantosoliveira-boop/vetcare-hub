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
      alerts: {
        Row: {
          category: Database["public"]["Enums"]["alert_category"]
          clinic_id: string
          created_at: string
          id: string
          level: Database["public"]["Enums"]["alert_level"]
          message: string
          pet_id: string | null
          resolved: boolean
          resolved_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["alert_category"]
          clinic_id: string
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["alert_level"]
          message: string
          pet_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["alert_category"]
          clinic_id?: string
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["alert_level"]
          message?: string
          pet_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          clinic_id: string
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          pet_id: string
          scheduled_at: string
          service_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          tutor_id: string
          updated_at: string
          veterinarian_id: string | null
        }
        Insert: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          clinic_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          pet_id: string
          scheduled_at: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          tutor_id: string
          updated_at?: string
          veterinarian_id?: string | null
        }
        Update: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          clinic_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          pet_id?: string
          scheduled_at?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          tutor_id?: string
          updated_at?: string
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          business_hours: Json | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          phone: string | null
          status: Database["public"]["Enums"]["clinic_status"]
          updated_at: string
          vaccine_alert_days: number
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: Json | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean
          phone?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          updated_at?: string
          vaccine_alert_days?: number
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: Json | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          phone?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          updated_at?: string
          vaccine_alert_days?: number
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      exam_files: {
        Row: {
          clinic_id: string
          content_type: string | null
          created_at: string
          file_name: string
          file_url: string
          id: string
          medical_record_id: string | null
          pet_id: string
        }
        Insert: {
          clinic_id: string
          content_type?: string | null
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          medical_record_id?: string | null
          pet_id: string
        }
        Update: {
          clinic_id?: string
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          medical_record_id?: string | null
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_files_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_files_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_files_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          anamnesis: string | null
          appointment_id: string | null
          clinic_id: string
          closed: boolean
          complaint: string | null
          created_at: string
          diagnosis: string | null
          exam_notes: string | null
          heart_rate: number | null
          hydration: string | null
          id: string
          internal_notes: string | null
          lymph_nodes: string | null
          mucous: string | null
          pet_id: string
          respiratory_rate: number | null
          return_date: string | null
          return_recommended: boolean | null
          temperature: number | null
          treatment: string | null
          tutor_summary: string | null
          updated_at: string
          veterinarian_id: string | null
          weight_kg: number | null
        }
        Insert: {
          anamnesis?: string | null
          appointment_id?: string | null
          clinic_id: string
          closed?: boolean
          complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          exam_notes?: string | null
          heart_rate?: number | null
          hydration?: string | null
          id?: string
          internal_notes?: string | null
          lymph_nodes?: string | null
          mucous?: string | null
          pet_id: string
          respiratory_rate?: number | null
          return_date?: string | null
          return_recommended?: boolean | null
          temperature?: number | null
          treatment?: string | null
          tutor_summary?: string | null
          updated_at?: string
          veterinarian_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          anamnesis?: string | null
          appointment_id?: string | null
          clinic_id?: string
          closed?: boolean
          complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          exam_notes?: string | null
          heart_rate?: number | null
          hydration?: string | null
          id?: string
          internal_notes?: string | null
          lymph_nodes?: string | null
          mucous?: string | null
          pet_id?: string
          respiratory_rate?: number | null
          return_date?: string | null
          return_recommended?: boolean | null
          temperature?: number | null
          treatment?: string | null
          tutor_summary?: string | null
          updated_at?: string
          veterinarian_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          clinic_id: string
          created_at: string
          description: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          notes: string | null
          paid_at: string | null
          pet_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tutor_id: string | null
        }
        Insert: {
          amount?: number
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          paid_at?: string | null
          pet_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tutor_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          paid_at?: string | null
          pet_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tutor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          allergies: string | null
          birth_date: string | null
          breed: string | null
          color: string | null
          conditions: string | null
          created_at: string
          id: string
          microchip: string | null
          name: string
          neutered: boolean | null
          photo_url: string | null
          qr_token: string | null
          sex: Database["public"]["Enums"]["pet_sex"] | null
          species: Database["public"]["Enums"]["pet_species"]
          tutor_id: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          allergies?: string | null
          birth_date?: string | null
          breed?: string | null
          color?: string | null
          conditions?: string | null
          created_at?: string
          id?: string
          microchip?: string | null
          name: string
          neutered?: boolean | null
          photo_url?: string | null
          qr_token?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"] | null
          species: Database["public"]["Enums"]["pet_species"]
          tutor_id: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          allergies?: string | null
          birth_date?: string | null
          breed?: string | null
          color?: string | null
          conditions?: string | null
          created_at?: string
          id?: string
          microchip?: string | null
          name?: string
          neutered?: boolean | null
          photo_url?: string | null
          qr_token?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"] | null
          species?: Database["public"]["Enums"]["pet_species"]
          tutor_id?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          created_at: string
          dose: string | null
          duration: string | null
          frequency: string | null
          id: string
          medical_record_id: string
          medication: string
        }
        Insert: {
          created_at?: string
          dose?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medical_record_id: string
          medication: string
        }
        Update: {
          created_at?: string
          dose?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medical_record_id?: string
          medication?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          clinic_id: string
          created_at: string
          duration_minutes: number
          id: string
          name: string
          price: number
        }
        Insert: {
          active?: boolean
          clinic_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name: string
          price?: number
        }
        Update: {
          active?: boolean
          clinic_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          active: boolean
          clinic_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          active?: boolean
          clinic_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          active?: boolean
          clinic_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccine_types: {
        Row: {
          clinic_id: string
          created_at: string
          default_interval_days: number
          id: string
          name: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          default_interval_days?: number
          id?: string
          name: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          default_interval_days?: number
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccine_types_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccines: {
        Row: {
          applied_at: string
          clinic_id: string
          created_at: string
          id: string
          lot: string | null
          manufacturer: string | null
          next_dose_at: string | null
          notes: string | null
          pet_id: string
          vaccine_name: string
          vaccine_type_id: string | null
          veterinarian_id: string | null
        }
        Insert: {
          applied_at?: string
          clinic_id: string
          created_at?: string
          id?: string
          lot?: string | null
          manufacturer?: string | null
          next_dose_at?: string | null
          notes?: string | null
          pet_id: string
          vaccine_name: string
          vaccine_type_id?: string | null
          veterinarian_id?: string | null
        }
        Update: {
          applied_at?: string
          clinic_id?: string
          created_at?: string
          id?: string
          lot?: string | null
          manufacturer?: string | null
          next_dose_at?: string | null
          notes?: string | null
          pet_id?: string
          vaccine_name?: string
          vaccine_type_id?: string | null
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccines_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_vaccine_type_id_fkey"
            columns: ["vaccine_type_id"]
            isOneToOne: false
            referencedRelation: "vaccine_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_clinic_role: {
        Args: {
          _clinic_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clinic_member: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      user_clinic_ids: { Args: { _user_id: string }; Returns: string[] }
    }
    Enums: {
      alert_category: "vacina" | "agendamento" | "prontuario" | "retorno"
      alert_level: "critico" | "atencao" | "informativo"
      app_role:
        | "super_admin"
        | "clinic_admin"
        | "veterinarian"
        | "receptionist"
        | "tutor"
      appointment_status:
        | "pendente"
        | "confirmado"
        | "em_atendimento"
        | "concluido"
        | "cancelado"
      appointment_type:
        | "consulta"
        | "retorno"
        | "banho_tosa"
        | "vacinacao"
        | "emergencia"
      clinic_status: "ativa" | "inativa" | "trial"
      payment_method:
        | "dinheiro"
        | "pix"
        | "cartao_debito"
        | "cartao_credito"
        | "transferencia"
      payment_status: "pago" | "pendente" | "cancelado"
      pet_sex: "macho" | "femea"
      pet_species: "cao" | "gato" | "ave" | "roedor" | "reptil" | "outro"
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
    Enums: {
      alert_category: ["vacina", "agendamento", "prontuario", "retorno"],
      alert_level: ["critico", "atencao", "informativo"],
      app_role: [
        "super_admin",
        "clinic_admin",
        "veterinarian",
        "receptionist",
        "tutor",
      ],
      appointment_status: [
        "pendente",
        "confirmado",
        "em_atendimento",
        "concluido",
        "cancelado",
      ],
      appointment_type: [
        "consulta",
        "retorno",
        "banho_tosa",
        "vacinacao",
        "emergencia",
      ],
      clinic_status: ["ativa", "inativa", "trial"],
      payment_method: [
        "dinheiro",
        "pix",
        "cartao_debito",
        "cartao_credito",
        "transferencia",
      ],
      payment_status: ["pago", "pendente", "cancelado"],
      pet_sex: ["macho", "femea"],
      pet_species: ["cao", "gato", "ave", "roedor", "reptil", "outro"],
    },
  },
} as const
