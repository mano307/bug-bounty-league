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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          actor_name: string
          created_at: string
          detail: string | null
          event_type: string
          id: string
          register_number: string
          round: number | null
          user_id: string | null
        }
        Insert: {
          actor_name?: string
          created_at?: string
          detail?: string | null
          event_type: string
          id?: string
          register_number?: string
          round?: number | null
          user_id?: string | null
        }
        Update: {
          actor_name?: string
          created_at?: string
          detail?: string | null
          event_type?: string
          id?: string
          register_number?: string
          round?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      answers: {
        Row: {
          attempt_id: string
          code: string | null
          id: string
          question_id: string
          selected_index: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_id: string
          code?: string | null
          id?: string
          question_id: string
          selected_index?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_id?: string
          code?: string | null
          id?: string
          question_id?: string
          selected_index?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          ai_report: Json | null
          code: string | null
          correct_count: number
          duration_seconds: number | null
          id: string
          judge_remarks: string | null
          language: string | null
          manual_score: number | null
          max_score: number
          round: number
          score: number
          skipped_count: number
          started_at: string
          status: string
          submitted_at: string | null
          user_id: string
          warnings_count: number
          wrong_count: number
        }
        Insert: {
          ai_report?: Json | null
          code?: string | null
          correct_count?: number
          duration_seconds?: number | null
          id?: string
          judge_remarks?: string | null
          language?: string | null
          manual_score?: number | null
          max_score?: number
          round: number
          score?: number
          skipped_count?: number
          started_at?: string
          status?: string
          submitted_at?: string | null
          user_id: string
          warnings_count?: number
          wrong_count?: number
        }
        Update: {
          ai_report?: Json | null
          code?: string | null
          correct_count?: number
          duration_seconds?: number | null
          id?: string
          judge_remarks?: string | null
          language?: string | null
          manual_score?: number | null
          max_score?: number
          round?: number
          score?: number
          skipped_count?: number
          started_at?: string
          status?: string
          submitted_at?: string | null
          user_id?: string
          warnings_count?: number
          wrong_count?: number
        }
        Relationships: []
      }
      event_settings: {
        Row: {
          auto_submit: boolean
          event_name: string
          id: number
          leaderboard_frozen: boolean
          leaderboard_public: boolean
          max_warnings: number
          negative_marking: number
          results_published: boolean
          round1_minutes: number
          round1_status: string
          round2_minutes: number
          round2_status: string
          round3_minutes: number
          round3_status: string
          updated_at: string
          warning_penalty: number
        }
        Insert: {
          auto_submit?: boolean
          event_name?: string
          id?: number
          leaderboard_frozen?: boolean
          leaderboard_public?: boolean
          max_warnings?: number
          negative_marking?: number
          results_published?: boolean
          round1_minutes?: number
          round1_status?: string
          round2_minutes?: number
          round2_status?: string
          round3_minutes?: number
          round3_status?: string
          updated_at?: string
          warning_penalty?: number
        }
        Update: {
          auto_submit?: boolean
          event_name?: string
          id?: number
          leaderboard_frozen?: boolean
          leaderboard_public?: boolean
          max_warnings?: number
          negative_marking?: number
          results_published?: boolean
          round1_minutes?: number
          round1_status?: string
          round2_minutes?: number
          round2_status?: string
          round3_minutes?: number
          round3_status?: string
          updated_at?: string
          warning_penalty?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          college: string
          created_at: string
          department: string
          email: string
          full_name: string
          id: string
          register_number: string
          updated_at: string
          year: string
        }
        Insert: {
          college?: string
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          id: string
          register_number?: string
          updated_at?: string
          year?: string
        }
        Update: {
          college?: string
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          id?: string
          register_number?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          active: boolean
          category: string
          code: string | null
          constraints: string | null
          correct_index: number | null
          created_at: string
          difficulty: string
          expected_output: string | null
          id: string
          language: string | null
          marks: number
          options: Json
          prompt: string
          round: number
          sample_input: string | null
          sample_output: string | null
          test_cases: Json
          title: string
        }
        Insert: {
          active?: boolean
          category?: string
          code?: string | null
          constraints?: string | null
          correct_index?: number | null
          created_at?: string
          difficulty?: string
          expected_output?: string | null
          id?: string
          language?: string | null
          marks?: number
          options?: Json
          prompt: string
          round: number
          sample_input?: string | null
          sample_output?: string | null
          test_cases?: Json
          title?: string
        }
        Update: {
          active?: boolean
          category?: string
          code?: string | null
          constraints?: string | null
          correct_index?: number | null
          created_at?: string
          difficulty?: string
          expected_output?: string | null
          id?: string
          language?: string | null
          marks?: number
          options?: Json
          prompt?: string
          round?: number
          sample_input?: string | null
          sample_output?: string | null
          test_cases?: Json
          title?: string
        }
        Relationships: []
      }
      round_access: {
        Row: {
          id: string
          round: number
          state: Database["public"]["Enums"]["round_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          round: number
          state?: Database["public"]["Enums"]["round_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          round?: number
          state?: Database["public"]["Enums"]["round_state"]
          updated_at?: string
          user_id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      warnings: {
        Row: {
          created_at: string
          id: string
          reason: string
          round: number
          user_id: string
          warning_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          round: number
          user_id: string
          warning_number?: number
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          round?: number
          user_id?: string
          warning_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "participant"
      round_state:
        | "locked"
        | "unlocked"
        | "in_progress"
        | "submitted"
        | "eliminated"
        | "qualified"
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
      app_role: ["admin", "participant"],
      round_state: [
        "locked",
        "unlocked",
        "in_progress",
        "submitted",
        "eliminated",
        "qualified",
      ],
    },
  },
} as const
