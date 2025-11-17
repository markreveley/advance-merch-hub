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
      products: {
        Row: {
          id: string
          product_id: number
          sku: string
          name: string
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: number
          sku: string
          name: string
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: number
          sku?: string
          name?: string
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          quantity: number
          location: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          location: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          location?: string
          updated_at?: string
        }
      }
      sales_orders: {
        Row: {
          id: string
          order_number: number
          order_date: string
          product_id: string | null
          quantity: number
          gross_sales: number
          discounts: number
          net_sales: number
          commission: number
          deduction: number
          payout: number
          created_at: string
        }
        Insert: {
          id?: string
          order_number: number
          order_date: string
          product_id?: string | null
          quantity: number
          gross_sales: number
          discounts: number
          net_sales: number
          commission: number
          deduction: number
          payout: number
          created_at?: string
        }
        Update: {
          id?: string
          order_number?: number
          order_date?: string
          product_id?: string | null
          quantity?: number
          gross_sales?: number
          discounts?: number
          net_sales?: number
          commission?: number
          deduction?: number
          payout?: number
          created_at?: string
        }
      }
      tour_reports: {
        Row: {
          id: string
          show_id: string | null
          report_date: string
          venue: string
          location: string
          sales_data: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          show_id?: string | null
          report_date: string
          venue: string
          location: string
          sales_data: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          show_id?: string | null
          report_date?: string
          venue?: string
          location?: string
          sales_data?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tours: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      shows: {
        Row: {
          id: string
          tour_id: string | null
          show_date: string
          venue: string
          city: string
          state: string
          country: string
          master_tour_id: string | null
          advancing_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tour_id?: string | null
          show_date: string
          venue: string
          city: string
          state: string
          country?: string
          master_tour_id?: string | null
          advancing_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tour_id?: string | null
          show_date?: string
          venue?: string
          city?: string
          state?: string
          country?: string
          master_tour_id?: string | null
          advancing_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      advancing_drafts: {
        Row: {
          id: string
          show_id: string | null
          draft_type: string
          content: string
          ai_generated: boolean
          version: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          show_id?: string | null
          draft_type: string
          content: string
          ai_generated?: boolean
          version?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          show_id?: string | null
          draft_type?: string
          content?: string
          ai_generated?: boolean
          version?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
