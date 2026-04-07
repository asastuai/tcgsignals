export interface Database {
  public: {
    Tables: {
      tcgs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          color: string | null;
          card_count: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tcgs"]["Row"], "created_at" | "card_count"> & {
          card_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tcgs"]["Insert"]>;
      };
      sets: {
        Row: {
          id: string;
          tcg_id: string;
          name: string;
          slug: string;
          code: string | null;
          release_date: string | null;
          card_count: number;
          total_printed: number | null;
          image_url: string | null;
          series: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sets"]["Row"], "created_at" | "card_count"> & {
          card_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sets"]["Insert"]>;
      };
      cards: {
        Row: {
          id: string;
          tcg_id: string;
          set_id: string;
          name: string;
          number: string;
          rarity: string | null;
          supertype: string | null;
          subtypes: string[] | null;
          types: string[] | null;
          image_small: string | null;
          image_large: string | null;
          artist: string | null;
          flavor_text: string | null;
          hp: string | null;
          tcg_external_id: string | null;
          tcgplayer_url: string | null;
          cardmarket_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cards"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cards"]["Insert"]>;
      };
      prices: {
        Row: {
          id: number;
          card_id: string;
          source: string;
          price: number;
          condition: string;
          currency: string;
          recorded_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["prices"]["Row"], "id" | "recorded_at"> & {
          recorded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prices"]["Insert"]>;
      };
      price_summaries: {
        Row: {
          card_id: string;
          current_price: number | null;
          previous_price: number | null;
          price_change_24h: number | null;
          price_change_7d: number | null;
          low_30d: number | null;
          high_30d: number | null;
          avg_30d: number | null;
          last_sold_price: number | null;
          last_sold_platform: string | null;
          last_sold_date: string | null;
          last_sold_condition: string | null;
          volume_24h: number;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["price_summaries"]["Row"], "updated_at" | "volume_24h"> & {
          volume_24h?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["price_summaries"]["Insert"]>;
      };
      platform_listings: {
        Row: {
          id: number;
          card_id: string;
          platform: string;
          price: number;
          condition: string;
          url: string | null;
          in_stock: boolean;
          last_checked: string;
        };
        Insert: Omit<Database["public"]["Tables"]["platform_listings"]["Row"], "id" | "last_checked"> & {
          last_checked?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_listings"]["Insert"]>;
      };
    };
  };
}
