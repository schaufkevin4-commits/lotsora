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
        Relationships: []
      }
      product_materials: {
        Row: {
          created_at: string
          id: string
          material_name: string
          percentage: number | null
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_name: string
          percentage?: number | null
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_name?: string
          percentage?: number | null
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
      generate_product_public_id: { Args: never; Returns: string }
      owns_product: { Args: { p_product: string }; Returns: boolean }
      replace_product_materials: {
        Args: { p_materials: Json; p_product_id: string }
        Returns: undefined
      }
      save_product: {
        Args: {
          p_brand: string
          p_category: string
          p_description: string
          p_materials: Json
          p_name: string
          p_product_id: string
          p_status: Database["public"]["Enums"]["product_status"]
          p_sustainability: Json
          p_textile_data: Json
        }
        Returns: undefined
      }
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
