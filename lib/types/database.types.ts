export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      company_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          manufacturer_id: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          id?: string
          manufacturer_id: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          manufacturer_id?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_jobs: {
        Row: {
          actor_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          delete_members: boolean
          delete_self: boolean
          id: string
          state: string
        }
        Insert: {
          actor_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          delete_members: boolean
          delete_self: boolean
          id?: string
          state?: string
        }
        Update: {
          actor_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          delete_members?: boolean
          delete_self?: boolean
          id?: string
          state?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          description: string | null
          doc_type: string | null
          file_name: string | null
          file_path: string | null
          id: string
          name: string
          product_id: string
          uploaded_at: string
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          description?: string | null
          doc_type?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          name: string
          product_id: string
          uploaded_at?: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          description?: string | null
          doc_type?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          name?: string
          product_id?: string
          uploaded_at?: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      file_operations: {
        Row: {
          attempts: number
          created_at: string
          document_id: string | null
          file_name: string
          file_path: string
          id: string
          last_error: string | null
          manufacturer_id: string | null
          owner_id: string | null
          product_id: string
          purpose: string
          reason: string
          state: string
          validated: boolean
          validation_started_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          document_id?: string | null
          file_name: string
          file_path: string
          id?: string
          last_error?: string | null
          manufacturer_id?: string | null
          owner_id?: string | null
          product_id: string
          purpose?: string
          reason: string
          state: string
          validated?: boolean
          validation_started_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          document_id?: string | null
          file_name?: string
          file_path?: string
          id?: string
          last_error?: string | null
          manufacturer_id?: string | null
          owner_id?: string | null
          product_id?: string
          purpose?: string
          reason?: string
          state?: string
          validated?: boolean
          validation_started_at?: string | null
        }
        Relationships: []
      }
      manufacturer_memberships: {
        Row: {
          created_at: string
          manufacturer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          manufacturer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          manufacturer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturer_memberships_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          city: string | null
          company_name: string
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          postal_code: string | null
          street: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          city?: string | null
          company_name: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manufacturers_owner_membership_fkey"
            columns: ["id", "user_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_memberships"
            referencedColumns: ["manufacturer_id", "user_id"]
          },
        ]
      }
      product_materials: {
        Row: {
          created_at: string
          id: string
          material_name: string
          percentage: number
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_name: string
          percentage: number
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_name?: string
          percentage?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sustainability: {
        Row: {
          disposal_notes: string | null
          product_id: string
          recycling_notes: string | null
          repair_notes: string | null
          reusable_materials: string | null
        }
        Insert: {
          disposal_notes?: string | null
          product_id: string
          recycling_notes?: string | null
          repair_notes?: string | null
          reusable_materials?: string | null
        }
        Update: {
          disposal_notes?: string | null
          product_id?: string
          recycling_notes?: string | null
          repair_notes?: string | null
          reusable_materials?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sustainability_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_textile_data: {
        Row: {
          care_instructions: string | null
          color: string | null
          origin_country: string | null
          product_id: string
          size: string | null
          wash_instructions: string | null
        }
        Insert: {
          care_instructions?: string | null
          color?: string | null
          origin_country?: string | null
          product_id: string
          size?: string | null
          wash_instructions?: string | null
        }
        Update: {
          care_instructions?: string | null
          color?: string | null
          origin_country?: string | null
          product_id?: string
          size?: string | null
          wash_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_textile_data_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          article_number: string | null
          brand: string | null
          category: string
          created_at: string
          description: string
          editor_version: number
          gtin_ean: string | null
          id: string
          image_url: string | null
          manufacturer_id: string
          name: string
          public_id: string
          sku: string | null
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
        }
        Insert: {
          article_number?: string | null
          brand?: string | null
          category: string
          created_at?: string
          description: string
          editor_version?: number
          gtin_ean?: string | null
          id?: string
          image_url?: string | null
          manufacturer_id: string
          name: string
          public_id?: string
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
        }
        Update: {
          article_number?: string | null
          brand?: string | null
          category?: string
          created_at?: string
          description?: string
          editor_version?: number
          gtin_ean?: string | null
          id?: string
          image_url?: string | null
          manufacturer_id?: string
          name?: string
          public_id?: string
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_company_invitation: { Args: { p_token: string }; Returns: string }
      advance_deletion_job: { Args: { p_job_id: string }; Returns: boolean }
      attach_document_upload: {
        Args: {
          p_description: string
          p_doc_type: string
          p_name: string
          p_operation_id: string
        }
        Returns: {
          description: string | null
          doc_type: string | null
          file_name: string | null
          file_path: string | null
          id: string
          name: string
          product_id: string
          uploaded_at: string
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      begin_file_cleanup: {
        Args: { p_operation_id: string }
        Returns: {
          attempts: number
          created_at: string
          document_id: string | null
          file_name: string
          file_path: string
          id: string
          last_error: string | null
          manufacturer_id: string | null
          owner_id: string | null
          product_id: string
          purpose: string
          reason: string
          state: string
          validated: boolean
          validation_started_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "file_operations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      begin_file_validation: {
        Args: { p_operation_id: string }
        Returns: {
          attempts: number
          created_at: string
          document_id: string | null
          file_name: string
          file_path: string
          id: string
          last_error: string | null
          manufacturer_id: string | null
          owner_id: string | null
          product_id: string
          purpose: string
          reason: string
          state: string
          validated: boolean
          validation_started_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "file_operations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_write_product_file: { Args: { p_path: string }; Returns: boolean }
      company_deletion_preview: {
        Args: { p_company_id: string }
        Returns: Json
      }
      create_company_invitation: {
        Args: { p_email: string }
        Returns: {
          expires_at: string
          invitation_id: string
          token: string
        }[]
      }
      create_own_company: {
        Args: { p_name: string; p_request_id: string }
        Returns: string
      }
      deletion_job_batch: { Args: { p_job_id: string }; Returns: Json }
      finish_file_cleanup: {
        Args: { p_error_code?: string; p_operation_id: string }
        Returns: boolean
      }
      generate_product_public_id: { Args: never; Returns: string }
      get_company_entry_state: { Args: never; Returns: string }
      get_product_publication_review: {
        Args: { p_product_id: string }
        Returns: Json
      }
      get_published_file_path: {
        Args: { p_document_id?: string; p_public_id: string }
        Returns: string
      }
      get_published_product_pass: {
        Args: { p_public_id: string }
        Returns: Json
      }
      hersteller_hat_veroeffentlichtes_produkt: {
        Args: { p_manufacturer: string }
        Returns: boolean
      }
      is_company_member: { Args: { p_company_id: string }; Returns: boolean }
      is_company_owner: { Args: { p_company_id: string }; Returns: boolean }
      is_public_product_image: { Args: { p_path: string }; Returns: boolean }
      is_published_product_file: { Args: { p_path: string }; Returns: boolean }
      list_company_members: {
        Args: never
        Returns: {
          email: string
          joined_at: string
          role: string
          user_id: string
        }[]
      }
      mark_file_validated: {
        Args: { p_operation_id: string; p_owner_id: string }
        Returns: undefined
      }
      owns_product: { Args: { p_product: string }; Returns: boolean }
      produkt_ist_veroeffentlicht: {
        Args: { p_product: string }
        Returns: boolean
      }
      publish_product: { Args: { p_product_id: string }; Returns: undefined }
      publish_product_revision: {
        Args: {
          p_expected_token: string
          p_expected_version: number
          p_product_id: string
          p_publish: boolean
        }
        Returns: number
      }
      remove_company_member: { Args: { p_user_id: string }; Returns: undefined }
      replace_product_materials: {
        Args: { p_materials: Json; p_product_id: string }
        Returns: undefined
      }
      reserve_document_upload: {
        Args: { p_file_name: string; p_product_id: string }
        Returns: {
          attempts: number
          created_at: string
          document_id: string | null
          file_name: string
          file_path: string
          id: string
          last_error: string | null
          manufacturer_id: string | null
          owner_id: string | null
          product_id: string
          purpose: string
          reason: string
          state: string
          validated: boolean
          validation_started_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "file_operations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reserve_file_upload: {
        Args: { p_file_name: string; p_product_id: string; p_purpose: string }
        Returns: {
          attempts: number
          created_at: string
          document_id: string | null
          file_name: string
          file_path: string
          id: string
          last_error: string | null
          manufacturer_id: string | null
          owner_id: string | null
          product_id: string
          purpose: string
          reason: string
          state: string
          validated: boolean
          validation_started_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "file_operations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_company_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      save_product: {
        Args: {
          p_brand: string
          p_category: string
          p_description: string
          p_expected_status: Database["public"]["Enums"]["product_status"]
          p_materials: Json
          p_name: string
          p_product_id: string
          p_sustainability: Json
          p_textile_data: Json
        }
        Returns: undefined
      }
      save_product_checked: {
        Args: {
          p_article_number: string
          p_brand: string
          p_category: string
          p_description: string
          p_expected_status: Database["public"]["Enums"]["product_status"]
          p_expected_version: number
          p_materials: Json
          p_name: string
          p_product_id: string
          p_sustainability: Json
          p_textile_data: Json
        }
        Returns: number
      }
      save_product_with_article: {
        Args: {
          p_article_number: string
          p_brand: string
          p_category: string
          p_description: string
          p_expected_status: Database["public"]["Enums"]["product_status"]
          p_materials: Json
          p_name: string
          p_product_id: string
          p_sustainability: Json
          p_textile_data: Json
        }
        Returns: undefined
      }
      set_product_image: {
        Args: {
          p_expected_path: string
          p_new_path: string
          p_product_id: string
        }
        Returns: undefined
      }
      set_product_publication_checked: {
        Args: {
          p_expected_version: number
          p_product_id: string
          p_publish: boolean
        }
        Returns: number
      }
      start_account_deletion: { Args: { p_actor_id: string }; Returns: string }
      start_company_deletion: {
        Args: {
          p_actor_id: string
          p_company_id: string
          p_delete_members: boolean
          p_delete_self: boolean
          p_fingerprint: string
        }
        Returns: string
      }
      transfer_company_ownership: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      withdraw_product: { Args: { p_product_id: string }; Returns: undefined }
    }
    Enums: {
      document_visibility: "intern" | "oeffentlich"
      product_status: "entwurf" | "unvollstaendig" | "veroeffentlicht"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      document_visibility: ["intern", "oeffentlich"],
      product_status: ["entwurf", "unvollstaendig", "veroeffentlicht"],
    },
  },
} as const
