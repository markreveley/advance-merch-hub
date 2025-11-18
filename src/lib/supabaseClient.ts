import { supabase as typedClient } from "@/integrations/supabase/client";

// Re-export the main client to avoid multiple instances; keep it untyped for UI pages
export const supabase = typedClient as any;
