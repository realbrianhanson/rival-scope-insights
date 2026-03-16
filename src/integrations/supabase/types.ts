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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          competitor_id: string
          created_at: string
          description: string
          id: string
          is_read: boolean
          new_value: Json | null
          old_value: Json | null
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          competitor_id: string
          created_at?: string
          description: string
          id?: string
          is_read?: boolean
          new_value?: Json | null
          old_value?: Json | null
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          competitor_id?: string
          created_at?: string
          description?: string
          id?: string
          is_read?: boolean
          new_value?: Json | null
          old_value?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_reports: {
        Row: {
          ai_model_used: string
          competitor_id: string | null
          created_at: string
          full_report: Json
          id: string
          report_type: string
          source_scrape_ids: string[] | null
          summary: string
          title: string
          user_id: string
        }
        Insert: {
          ai_model_used: string
          competitor_id?: string | null
          created_at?: string
          full_report: Json
          id?: string
          report_type: string
          source_scrape_ids?: string[] | null
          summary: string
          title: string
          user_id: string
        }
        Update: {
          ai_model_used?: string
          competitor_id?: string | null
          created_at?: string
          full_report?: Json
          id?: string
          report_type?: string
          source_scrape_ids?: string[] | null
          summary?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_reports_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          app_name: string
          created_at: string
          id: string
          logo_url: string | null
          primary_color: string
          user_id: string
        }
        Insert: {
          app_name?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          user_id: string
        }
        Update: {
          app_name?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battlecards: {
        Row: {
          competitor_id: string
          counter_positioning: Json
          created_at: string
          id: string
          key_differentiators: Json
          last_updated_from_report_id: string | null
          overview: string
          pricing_comparison: Json | null
          talk_tracks: Json
          their_strengths: Json
          their_weaknesses: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          competitor_id: string
          counter_positioning: Json
          created_at?: string
          id?: string
          key_differentiators: Json
          last_updated_from_report_id?: string | null
          overview: string
          pricing_comparison?: Json | null
          talk_tracks: Json
          their_strengths: Json
          their_weaknesses: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          competitor_id?: string
          counter_positioning?: Json
          created_at?: string
          id?: string
          key_differentiators?: Json
          last_updated_from_report_id?: string | null
          overview?: string
          pricing_comparison?: Json | null
          talk_tracks?: Json
          their_strengths?: Json
          their_weaknesses?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battlecards_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlecards_last_updated_from_report_id_fkey"
            columns: ["last_updated_from_report_id"]
            isOneToOne: false
            referencedRelation: "analysis_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlecards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_matrices: {
        Row: {
          categories: Json
          competitor_ids: string[]
          created_at: string
          description: string | null
          id: string
          matrix_data: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categories: Json
          competitor_ids: string[]
          created_at?: string
          description?: string | null
          id?: string
          matrix_data: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json
          competitor_ids?: string[]
          created_at?: string
          description?: string | null
          id?: string
          matrix_data?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_matrices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_snapshots: {
        Row: {
          captured_at: string
          competitor_id: string
          content_hash: string
          id: string
          messaging_summary: string | null
          snapshot_data: Json
          tech_stack: Json | null
          user_id: string
        }
        Insert: {
          captured_at?: string
          competitor_id: string
          content_hash: string
          id?: string
          messaging_summary?: string | null
          snapshot_data: Json
          tech_stack?: Json | null
          user_id: string
        }
        Update: {
          captured_at?: string
          competitor_id?: string
          content_hash?: string
          id?: string
          messaging_summary?: string | null
          snapshot_data?: Json
          tech_stack?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_snapshots_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          name: string
          review_sources: Json | null
          status: string
          updated_at: string
          user_id: string
          website_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          name: string
          review_sources?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          website_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          name?: string
          review_sources?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_gaps: {
        Row: {
          competitor_id: string
          created_at: string
          evidence: string
          gap_category: string
          gap_description: string
          gap_title: string
          id: string
          opportunity_score: number
          report_id: string
          status: string
          user_id: string
        }
        Insert: {
          competitor_id: string
          created_at?: string
          evidence: string
          gap_category: string
          gap_description: string
          gap_title: string
          id?: string
          opportunity_score: number
          report_id: string
          status?: string
          user_id: string
        }
        Update: {
          competitor_id?: string
          created_at?: string
          evidence?: string
          gap_category?: string
          gap_description?: string
          gap_title?: string
          id?: string
          opportunity_score?: number
          report_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_gaps_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_gaps_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "analysis_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_gaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          industry: string | null
          plan_tier: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          industry?: string | null
          plan_tier?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          plan_tier?: string
        }
        Relationships: []
      }
      review_analyses: {
        Row: {
          analyzed_at: string
          competitor_id: string
          id: string
          negative_themes: Json
          overall_sentiment_score: number
          positive_themes: Json
          raw_review_data: string | null
          requested_features: Json
          review_count: number | null
          source: string
          user_id: string
        }
        Insert: {
          analyzed_at?: string
          competitor_id: string
          id?: string
          negative_themes: Json
          overall_sentiment_score: number
          positive_themes: Json
          raw_review_data?: string | null
          requested_features: Json
          review_count?: number | null
          source: string
          user_id: string
        }
        Update: {
          analyzed_at?: string
          competitor_id?: string
          id?: string
          negative_themes?: Json
          overall_sentiment_score?: number
          positive_themes?: Json
          raw_review_data?: string | null
          requested_features?: Json
          review_count?: number | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_analyses_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_jobs: {
        Row: {
          competitor_id: string
          completed_at: string | null
          error_message: string | null
          id: string
          job_type: string
          pages_scraped: number
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          competitor_id: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          pages_scraped?: number
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          competitor_id?: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          pages_scraped?: number
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_jobs_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrape_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_results: {
        Row: {
          competitor_id: string
          extracted_data: Json | null
          id: string
          page_type: string
          page_url: string
          raw_content: string
          scrape_job_id: string
          scraped_at: string
          user_id: string
        }
        Insert: {
          competitor_id: string
          extracted_data?: Json | null
          id?: string
          page_type: string
          page_url: string
          raw_content: string
          scrape_job_id: string
          scraped_at?: string
          user_id: string
        }
        Update: {
          competitor_id?: string
          extracted_data?: Json | null
          id?: string
          page_type?: string
          page_url?: string
          raw_content?: string
          scrape_job_id?: string
          scraped_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_results_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrape_results_scrape_job_id_fkey"
            columns: ["scrape_job_id"]
            isOneToOne: false
            referencedRelation: "scrape_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrape_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
