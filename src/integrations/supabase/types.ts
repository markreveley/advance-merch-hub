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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      advancing_checklists: {
        Row: {
          category: string | null
          checklist_item: string
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string | null
          show_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          checklist_item: string
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          show_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          checklist_item?: string
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          show_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advancing_checklists_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      advancing_drafts: {
        Row: {
          ai_generated: boolean | null
          content: string | null
          created_at: string | null
          draft_type: string
          id: string
          show_id: string
          status: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          content?: string | null
          created_at?: string | null
          draft_type: string
          id?: string
          show_id: string
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: string | null
          created_at?: string | null
          draft_type?: string
          id?: string
          show_id?: string
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advancing_drafts_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      advancing_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          template_content: string | null
          template_name: string
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          template_content?: string | null
          template_name: string
          template_type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          template_content?: string | null
          template_name?: string
          template_type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      agent_activity_log: {
        Row: {
          activity_description: string | null
          activity_type: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          show_id: string | null
          success: boolean | null
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          show_id?: string | null
          success?: boolean | null
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          show_id?: string | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_activity_log_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_drafts: {
        Row: {
          ai_confidence_score: number | null
          ai_model: string | null
          content: string | null
          created_at: string | null
          draft_type: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          sent_at: string | null
          show_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_model?: string | null
          content?: string | null
          created_at?: string | null
          draft_type: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          show_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_model?: string | null
          content?: string | null
          created_at?: string | null
          draft_type?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          show_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_drafts_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_learning_data: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          pattern_data: Json | null
          pattern_type: string
          sample_size: number | null
          success_rate: number | null
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          pattern_data?: Json | null
          pattern_type: string
          sample_size?: number | null
          success_rate?: number | null
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          pattern_data?: Json | null
          pattern_type?: string
          sample_size?: number | null
          success_rate?: number | null
          venue_id?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      email_extractions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          email_message_id: string
          extracted_data: Json | null
          extraction_type: string
          id: string
          needs_review: boolean | null
          reviewed: boolean | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          email_message_id: string
          extracted_data?: Json | null
          extraction_type: string
          id?: string
          needs_review?: boolean | null
          reviewed?: boolean | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          email_message_id?: string
          extracted_data?: Json | null
          extraction_type?: string
          id?: string
          needs_review?: boolean | null
          reviewed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "email_extractions_email_message_id_fkey"
            columns: ["email_message_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          body_html: string | null
          body_text: string | null
          cc_emails: string[] | null
          created_at: string | null
          id: string
          is_from_agent: boolean | null
          is_from_venue: boolean | null
          message_type: string | null
          recipient_emails: string[]
          sender_email: string
          sender_name: string | null
          sent_at: string | null
          subject: string
          thread_id: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          id?: string
          is_from_agent?: boolean | null
          is_from_venue?: boolean | null
          message_type?: string | null
          recipient_emails: string[]
          sender_email: string
          sender_name?: string | null
          sent_at?: string | null
          subject: string
          thread_id: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          id?: string
          is_from_agent?: boolean | null
          is_from_venue?: boolean | null
          message_type?: string | null
          recipient_emails?: string[]
          sender_email?: string
          sender_name?: string | null
          sent_at?: string | null
          subject?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_threads: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          show_id: string | null
          subject: string
          thread_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          show_id?: string | null
          subject: string
          thread_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          show_id?: string | null
          subject?: string
          thread_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_threads_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_snapshots: {
        Row: {
          created_at: string | null
          id: string
          product_variant_id: string
          quantity: number
          snapshot_date: string
          snapshot_type: string
          state: string
          tour_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_variant_id: string
          quantity: number
          snapshot_date: string
          snapshot_type: string
          state: string
          tour_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_variant_id?: string
          quantity?: number
          snapshot_date?: string
          snapshot_type?: string
          state?: string
          tour_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_snapshots_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "master_inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "inventory_snapshots_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_pricing_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "inventory_snapshots_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_states: {
        Row: {
          id: string
          last_counted_at: string | null
          location_details: string | null
          product_variant_id: string
          quantity: number | null
          state: string
          tour_id: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          last_counted_at?: string | null
          location_details?: string | null
          product_variant_id: string
          quantity?: number | null
          state: string
          tour_id?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          last_counted_at?: string | null
          location_details?: string | null
          product_variant_id?: string
          quantity?: number | null
          state?: string
          tour_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_states_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "master_inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "inventory_states_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_pricing_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "inventory_states_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_states_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          from_state: string | null
          id: string
          notes: string | null
          product_variant_id: string
          quantity: number
          show_id: string | null
          source: string
          to_state: string | null
          tour_id: string | null
          transaction_date: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          from_state?: string | null
          id?: string
          notes?: string | null
          product_variant_id: string
          quantity: number
          show_id?: string | null
          source: string
          to_state?: string | null
          tour_id?: string | null
          transaction_date?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          from_state?: string | null
          id?: string
          notes?: string | null
          product_variant_id?: string
          quantity?: number
          show_id?: string | null
          source?: string
          to_state?: string | null
          tour_id?: string | null
          transaction_date?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "master_inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_pricing_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      master_tour_cache: {
        Row: {
          cache_data: Json | null
          cache_key: string
          created_at: string | null
          expires_at: string | null
          id: string
          master_tour_id: string
        }
        Insert: {
          cache_data?: Json | null
          cache_key: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          master_tour_id: string
        }
        Update: {
          cache_data?: Json | null
          cache_key?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          master_tour_id?: string
        }
        Relationships: []
      }
      master_tour_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          shows_created: number | null
          shows_synced: number | null
          shows_updated: number | null
          started_at: string | null
          sync_status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          shows_created?: number | null
          shows_synced?: number | null
          shows_updated?: number | null
          started_at?: string | null
          sync_status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          shows_created?: number | null
          shows_synced?: number | null
          shows_updated?: number | null
          started_at?: string | null
          sync_status?: string
          sync_type?: string
        }
        Relationships: []
      }
      product_identifiers: {
        Row: {
          created_at: string | null
          id: string
          identifier_type: string
          identifier_value: string
          product_variant_id: string
          source: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          identifier_type: string
          identifier_value: string
          product_variant_id: string
          source: string
        }
        Update: {
          created_at?: string | null
          id?: string
          identifier_type?: string
          identifier_value?: string
          product_variant_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_identifiers_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "master_inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "product_identifiers_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_pricing_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "product_identifiers_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_metadata: {
        Row: {
          additional_fields: Json | null
          category: string | null
          created_at: string | null
          date_purchased: string | null
          id: string
          packaging_shipping_cost: number | null
          printing_manufacturing_cost: number | null
          product_variant_id: string
          supplier_manufacturer: string | null
          tax_paid: number | null
          units_purchased: number | null
          updated_at: string | null
          wholesale_cost_per_unit: number | null
        }
        Insert: {
          additional_fields?: Json | null
          category?: string | null
          created_at?: string | null
          date_purchased?: string | null
          id?: string
          packaging_shipping_cost?: number | null
          printing_manufacturing_cost?: number | null
          product_variant_id: string
          supplier_manufacturer?: string | null
          tax_paid?: number | null
          units_purchased?: number | null
          updated_at?: string | null
          wholesale_cost_per_unit?: number | null
        }
        Update: {
          additional_fields?: Json | null
          category?: string | null
          created_at?: string | null
          date_purchased?: string | null
          id?: string
          packaging_shipping_cost?: number | null
          printing_manufacturing_cost?: number | null
          product_variant_id?: string
          supplier_manufacturer?: string | null
          tax_paid?: number | null
          units_purchased?: number | null
          updated_at?: string | null
          wholesale_cost_per_unit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_metadata_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: true
            referencedRelation: "master_inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "product_metadata_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: true
            referencedRelation: "product_pricing_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "product_metadata_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pricing: {
        Row: {
          amount: number
          created_at: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          price_type: string
          product_variant_id: string
          source: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          price_type: string
          product_variant_id: string
          source: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          price_type?: string
          product_variant_id?: string
          source?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_pricing_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "master_inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "product_pricing_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_pricing_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "product_pricing_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string | null
          created_at: string | null
          id: string
          option1_name: string | null
          option1_value: string | null
          option2_name: string | null
          option2_value: string | null
          option3_name: string | null
          option3_value: string | null
          product_id: string
          sku: string
          updated_at: string | null
          variant_name: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          barcode?: string | null
          created_at?: string | null
          id?: string
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          product_id: string
          sku: string
          updated_at?: string | null
          variant_name?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          barcode?: string | null
          created_at?: string | null
          id?: string
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          product_id?: string
          sku?: string
          updated_at?: string | null
          variant_name?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ambient_inks_id: string | null
          created_at: string | null
          description: string | null
          handle: string
          id: string
          image_urls: string[] | null
          published: boolean | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          ambient_inks_id?: string | null
          created_at?: string | null
          description?: string | null
          handle: string
          id?: string
          image_urls?: string[] | null
          published?: boolean | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          ambient_inks_id?: string | null
          created_at?: string | null
          description?: string | null
          handle?: string
          id?: string
          image_urls?: string[] | null
          published?: boolean | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      sales_orders: {
        Row: {
          commission: number | null
          created_at: string | null
          deduction: number | null
          discounts: number | null
          gross_sales: number
          id: string
          net_sales: number
          order_date: string
          order_number: number
          payout: number
          product_name: string
          product_variant_id: string | null
          quantity: number
          sku: string | null
          source: string | null
        }
        Insert: {
          commission?: number | null
          created_at?: string | null
          deduction?: number | null
          discounts?: number | null
          gross_sales: number
          id?: string
          net_sales: number
          order_date: string
          order_number: number
          payout: number
          product_name: string
          product_variant_id?: string | null
          quantity: number
          sku?: string | null
          source?: string | null
        }
        Update: {
          commission?: number | null
          created_at?: string | null
          deduction?: number | null
          discounts?: number | null
          gross_sales?: number
          id?: string
          net_sales?: number
          order_date?: string
          order_number?: number
          payout?: number
          product_name?: string
          product_variant_id?: string | null
          quantity?: number
          sku?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "master_inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "sales_orders_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_pricing_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "sales_orders_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          advancing_status: string | null
          capacity: number | null
          city: string | null
          country: string | null
          created_at: string | null
          doors_time: string | null
          id: string
          last_synced_at: string | null
          load_in_time: string | null
          master_tour_id: string | null
          master_tour_sync_status: string | null
          merch_split_percentage: number | null
          notes: string | null
          primary_thread_id: string | null
          settlement_currency: string | null
          show_date: string
          show_time: string | null
          stage_info: string | null
          state: string | null
          tour_id: string | null
          updated_at: string | null
          venue: string
        }
        Insert: {
          advancing_status?: string | null
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          doors_time?: string | null
          id?: string
          last_synced_at?: string | null
          load_in_time?: string | null
          master_tour_id?: string | null
          master_tour_sync_status?: string | null
          merch_split_percentage?: number | null
          notes?: string | null
          primary_thread_id?: string | null
          settlement_currency?: string | null
          show_date: string
          show_time?: string | null
          stage_info?: string | null
          state?: string | null
          tour_id?: string | null
          updated_at?: string | null
          venue: string
        }
        Update: {
          advancing_status?: string | null
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          doors_time?: string | null
          id?: string
          last_synced_at?: string | null
          load_in_time?: string | null
          master_tour_id?: string | null
          master_tour_sync_status?: string | null
          merch_split_percentage?: number | null
          notes?: string | null
          primary_thread_id?: string | null
          settlement_currency?: string | null
          show_date?: string
          show_time?: string | null
          stage_info?: string | null
          state?: string | null
          tour_id?: string | null
          updated_at?: string | null
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "shows_primary_thread_id_fkey"
            columns: ["primary_thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shows_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_blocks: {
        Row: {
          block_name: string
          created_at: string | null
          end_date: string
          id: string
          start_date: string
          tour_id: string
          updated_at: string | null
        }
        Insert: {
          block_name: string
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
          tour_id: string
          updated_at?: string | null
        }
        Update: {
          block_name?: string
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          tour_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_blocks_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_reports: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          report_date: string
          sales_data: Json | null
          show_id: string | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          report_date: string
          sales_data?: Json | null
          show_id?: string | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          report_date?: string
          sales_data?: Json | null
          show_id?: string | null
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      tour_sales: {
        Row: {
          created_at: string | null
          gross_revenue: number | null
          id: string
          is_comp: boolean | null
          product_variant_id: string | null
          quantity_sold: number
          sale_date: string
          show_id: string
          source: string
          source_data: Json | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          gross_revenue?: number | null
          id?: string
          is_comp?: boolean | null
          product_variant_id?: string | null
          quantity_sold: number
          sale_date: string
          show_id: string
          source: string
          source_data?: Json | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          gross_revenue?: number | null
          id?: string
          is_comp?: boolean | null
          product_variant_id?: string | null
          quantity_sold?: number
          sale_date?: string
          show_id?: string
          source?: string
          source_data?: Json | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_sales_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "master_inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "tour_sales_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_pricing_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "tour_sales_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_sales_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          artist: string | null
          created_at: string | null
          end_date: string | null
          id: string
          master_tour_id: string | null
          name: string
          start_date: string | null
          status: string | null
          tour_manager_email: string | null
          tour_manager_name: string | null
          tour_manager_phone: string | null
          updated_at: string | null
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          master_tour_id?: string | null
          name: string
          start_date?: string | null
          status?: string | null
          tour_manager_email?: string | null
          tour_manager_name?: string | null
          tour_manager_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          master_tour_id?: string | null
          name?: string
          start_date?: string | null
          status?: string | null
          tour_manager_email?: string | null
          tour_manager_name?: string | null
          tour_manager_phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      venue_night_totals: {
        Row: {
          created_at: string | null
          id: string
          net_receipts: number
          sale_date: string
          show_id: string | null
          source: string
          total_fees: number
          total_receipts: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          net_receipts: number
          sale_date: string
          show_id?: string | null
          source: string
          total_fees: number
          total_receipts: number
        }
        Update: {
          created_at?: string | null
          id?: string
          net_receipts?: number
          sale_date?: string
          show_id?: string | null
          source?: string
          total_fees?: number
          total_receipts?: number
        }
        Relationships: [
          {
            foreignKeyName: "venue_night_totals_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      master_inventory_view: {
        Row: {
          color: string | null
          last_updated: string | null
          product_name: string | null
          product_type: string | null
          size: string | null
          sku: string | null
          total_qty: number | null
          tour_qty: number | null
          tour_start_qty: number | null
          transfer_qty: number | null
          variant_id: string | null
          variant_name: string | null
          venue_qty: number | null
          warehouse_qty: number | null
        }
        Relationships: []
      }
      product_pricing_view: {
        Row: {
          amount: number | null
          effective_from: string | null
          effective_to: string | null
          price_type: string | null
          product_name: string | null
          sku: string | null
          source: string | null
          variant_id: string | null
          variant_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_checklist_progress: {
        Args: { p_show_id: string }
        Returns: number
      }
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
