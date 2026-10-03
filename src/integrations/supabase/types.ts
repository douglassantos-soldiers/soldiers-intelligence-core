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
      _ad_hoje: {
        Row: {
          ad_id: string | null
          ad_nome: string | null
          campanha: string | null
          cliques_link: number | null
          compras: number | null
          conjunto: string | null
          cpc: number | null
          ctr_link: number | null
          ctr_todos: number | null
          gasto: number | null
          impr: number | null
          lpv: number | null
        }
        Insert: {
          ad_id?: string | null
          ad_nome?: string | null
          campanha?: string | null
          cliques_link?: number | null
          compras?: number | null
          conjunto?: string | null
          cpc?: number | null
          ctr_link?: number | null
          ctr_todos?: number | null
          gasto?: number | null
          impr?: number | null
          lpv?: number | null
        }
        Update: {
          ad_id?: string | null
          ad_nome?: string | null
          campanha?: string | null
          cliques_link?: number | null
          compras?: number | null
          conjunto?: string | null
          cpc?: number | null
          ctr_link?: number | null
          ctr_todos?: number | null
          gasto?: number | null
          impr?: number | null
          lpv?: number | null
        }
        Relationships: []
      }
      _adset_camp: {
        Row: {
          adset_id: string
          adset_nome: string | null
          camp_id: string | null
          camp_nome: string | null
        }
        Insert: {
          adset_id: string
          adset_nome?: string | null
          camp_id?: string | null
          camp_nome?: string | null
        }
        Update: {
          adset_id?: string
          adset_nome?: string | null
          camp_id?: string | null
          camp_nome?: string | null
        }
        Relationships: []
      }
      _ativar: {
        Row: {
          adset_id: string | null
          conjunto: string | null
          req: number | null
        }
        Insert: {
          adset_id?: string | null
          conjunto?: string | null
          req?: number | null
        }
        Update: {
          adset_id?: string | null
          conjunto?: string | null
          req?: number | null
        }
        Relationships: []
      }
      _attr: {
        Row: {
          adset_id: string | null
          adset_nome: string | null
          adset_status: string | null
          camp_id: string | null
          camp_nome: string | null
          camp_status: string | null
          efetivo: string | null
          objetivo: string | null
          orcamento: number | null
          otimizacao: string | null
          spec: Json | null
        }
        Insert: {
          adset_id?: string | null
          adset_nome?: string | null
          adset_status?: string | null
          camp_id?: string | null
          camp_nome?: string | null
          camp_status?: string | null
          efetivo?: string | null
          objetivo?: string | null
          orcamento?: number | null
          otimizacao?: string | null
          spec?: Json | null
        }
        Update: {
          adset_id?: string | null
          adset_nome?: string | null
          adset_status?: string | null
          camp_id?: string | null
          camp_nome?: string | null
          camp_status?: string | null
          efetivo?: string | null
          objetivo?: string | null
          orcamento?: number | null
          otimizacao?: string | null
          spec?: Json | null
        }
        Relationships: []
      }
      _attr_copia: {
        Row: {
          criado: string | null
          novo_adset: string | null
          orig_adset: string
          req_ads: number | null
          req_ads2: number | null
          req_create: number | null
        }
        Insert: {
          criado?: string | null
          novo_adset?: string | null
          orig_adset: string
          req_ads?: number | null
          req_ads2?: number | null
          req_create?: number | null
        }
        Update: {
          criado?: string | null
          novo_adset?: string | null
          orig_adset?: string
          req_ads?: number | null
          req_ads2?: number | null
          req_create?: number | null
        }
        Relationships: []
      }
      _audit: {
        Row: {
          ad_id: string | null
          adset_id: string | null
          anuncio: string | null
          cj_status: string | null
          conjunto: string | null
          creative_id: string | null
          descricao: string | null
          estado: string | null
          link: string | null
          msg: string | null
          titulo: string | null
          video_id: string | null
        }
        Insert: {
          ad_id?: string | null
          adset_id?: string | null
          anuncio?: string | null
          cj_status?: string | null
          conjunto?: string | null
          creative_id?: string | null
          descricao?: string | null
          estado?: string | null
          link?: string | null
          msg?: string | null
          titulo?: string | null
          video_id?: string | null
        }
        Update: {
          ad_id?: string | null
          adset_id?: string | null
          anuncio?: string | null
          cj_status?: string | null
          conjunto?: string | null
          creative_id?: string | null
          descricao?: string | null
          estado?: string | null
          link?: string | null
          msg?: string | null
          titulo?: string | null
          video_id?: string | null
        }
        Relationships: []
      }
      _audit2: {
        Row: {
          ad_id: string | null
          adset_id: string | null
          anuncio: string | null
          cj_status: string | null
          conjunto: string | null
          estado: string | null
          link: string | null
          msg: string | null
          titulo: string | null
        }
        Insert: {
          ad_id?: string | null
          adset_id?: string | null
          anuncio?: string | null
          cj_status?: string | null
          conjunto?: string | null
          estado?: string | null
          link?: string | null
          msg?: string | null
          titulo?: string | null
        }
        Update: {
          ad_id?: string | null
          adset_id?: string | null
          anuncio?: string | null
          cj_status?: string | null
          conjunto?: string | null
          estado?: string | null
          link?: string | null
          msg?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      _backup_cron_competicao: {
        Row: {
          command: string | null
          jobid: number | null
          jobname: string | null
          salvo_em: string | null
          schedule: string | null
        }
        Insert: {
          command?: string | null
          jobid?: number | null
          jobname?: string | null
          salvo_em?: string | null
          schedule?: string | null
        }
        Update: {
          command?: string | null
          jobid?: number | null
          jobname?: string | null
          salvo_em?: string | null
          schedule?: string | null
        }
        Relationships: []
      }
      _bkp_ads_campanha_fantasma_20260831: {
        Row: {
          acos: number | null
          ad_type: string | null
          atualizado_em: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          conversions_14d: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          data: string | null
          fonte: string | null
          impressions: number | null
          purchases_14d: number | null
          purchases_1d: number | null
          purchases_30d: number | null
          purchases_7d: number | null
          roas: number | null
          sales_14d: number | null
          sales_1d: number | null
          sales_30d: number | null
          sales_7d: number | null
          top_search_is: number | null
          units_14d: number | null
          units_1d: number | null
          units_30d: number | null
          units_7d: number | null
        }
        Insert: {
          acos?: number | null
          ad_type?: string | null
          atualizado_em?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          conversions_14d?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string | null
          fonte?: string | null
          impressions?: number | null
          purchases_14d?: number | null
          purchases_1d?: number | null
          purchases_30d?: number | null
          purchases_7d?: number | null
          roas?: number | null
          sales_14d?: number | null
          sales_1d?: number | null
          sales_30d?: number | null
          sales_7d?: number | null
          top_search_is?: number | null
          units_14d?: number | null
          units_1d?: number | null
          units_30d?: number | null
          units_7d?: number | null
        }
        Update: {
          acos?: number | null
          ad_type?: string | null
          atualizado_em?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          conversions_14d?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string | null
          fonte?: string | null
          impressions?: number | null
          purchases_14d?: number | null
          purchases_1d?: number | null
          purchases_30d?: number | null
          purchases_7d?: number | null
          roas?: number | null
          sales_14d?: number | null
          sales_1d?: number | null
          sales_30d?: number | null
          sales_7d?: number | null
          top_search_is?: number | null
          units_14d?: number | null
          units_1d?: number | null
          units_30d?: number | null
          units_7d?: number | null
        }
        Relationships: []
      }
      _camp_dia: {
        Row: {
          camp_id: string | null
          camp_nome: string | null
          compras: number | null
          declarado: number | null
          dia: string | null
          gasto: number | null
        }
        Insert: {
          camp_id?: string | null
          camp_nome?: string | null
          compras?: number | null
          declarado?: number | null
          dia?: string | null
          gasto?: number | null
        }
        Update: {
          camp_id?: string | null
          camp_nome?: string | null
          compras?: number | null
          declarado?: number | null
          dia?: string | null
          gasto?: number | null
        }
        Relationships: []
      }
      _campanha14: {
        Row: {
          camp_id: string
          camp_nome: string | null
          compras: number | null
          declarado: number | null
          gasto: number | null
          r_clique: number | null
          r_view: number | null
        }
        Insert: {
          camp_id: string
          camp_nome?: string | null
          compras?: number | null
          declarado?: number | null
          gasto?: number | null
          r_clique?: number | null
          r_view?: number | null
        }
        Update: {
          camp_id?: string
          camp_nome?: string | null
          compras?: number | null
          declarado?: number | null
          gasto?: number | null
          r_clique?: number | null
          r_view?: number | null
        }
        Relationships: []
      }
      _cant_req: {
        Row: {
          iframe: string | null
          req_id: number | null
          seg: number | null
          vid: string | null
        }
        Insert: {
          iframe?: string | null
          req_id?: number | null
          seg?: number | null
          vid?: string | null
        }
        Update: {
          iframe?: string | null
          req_id?: number | null
          seg?: number | null
          vid?: string | null
        }
        Relationships: []
      }
      _cant_url: {
        Row: {
          bitrate: number | null
          seg: number | null
          tag: string | null
          url: string | null
          vid: string | null
        }
        Insert: {
          bitrate?: number | null
          seg?: number | null
          tag?: string | null
          url?: string | null
          vid?: string | null
        }
        Update: {
          bitrate?: number | null
          seg?: number | null
          tag?: string | null
          url?: string | null
          vid?: string | null
        }
        Relationships: []
      }
      _chk_req: {
        Row: {
          iframe: string | null
          quem: string | null
          req: number | null
        }
        Insert: {
          iframe?: string | null
          quem?: string | null
          req?: number | null
        }
        Update: {
          iframe?: string | null
          quem?: string | null
          req?: number | null
        }
        Relationships: []
      }
      _core_ads: {
        Row: {
          ad_id: string | null
          ad_nome: string | null
          campanha: string | null
          conjunto: string | null
          creative_id: string | null
          estado: string | null
          video_id: string | null
        }
        Insert: {
          ad_id?: string | null
          ad_nome?: string | null
          campanha?: string | null
          conjunto?: string | null
          creative_id?: string | null
          estado?: string | null
          video_id?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_nome?: string | null
          campanha?: string | null
          conjunto?: string | null
          creative_id?: string | null
          estado?: string | null
          video_id?: string | null
        }
        Relationships: []
      }
      _core_adset: {
        Row: {
          adset_id: string | null
          link: string | null
          nome: string | null
          req: number | null
        }
        Insert: {
          adset_id?: string | null
          link?: string | null
          nome?: string | null
          req?: number | null
        }
        Update: {
          adset_id?: string | null
          link?: string | null
          nome?: string | null
          req?: number | null
        }
        Relationships: []
      }
      _core_cand: {
        Row: {
          creative_id: string | null
          criador: string | null
          ctr: number | null
          iframe: string | null
          req_html: number | null
          req_prev: number | null
          url_mp4: string | null
          video_id: string | null
        }
        Insert: {
          creative_id?: string | null
          criador?: string | null
          ctr?: number | null
          iframe?: string | null
          req_html?: number | null
          req_prev?: number | null
          url_mp4?: string | null
          video_id?: string | null
        }
        Update: {
          creative_id?: string | null
          criador?: string | null
          ctr?: number | null
          iframe?: string | null
          req_html?: number | null
          req_prev?: number | null
          url_mp4?: string | null
          video_id?: string | null
        }
        Relationships: []
      }
      _core_mat: {
        Row: {
          adset_id: string | null
          conjunto: string | null
          creative_id: string | null
          criador: string | null
          descricao: string | null
          link: string | null
          nome_ad: string | null
          req_ad: number | null
          req_cria: number | null
          titulo: string | null
          uri: string | null
          video_id: string | null
        }
        Insert: {
          adset_id?: string | null
          conjunto?: string | null
          creative_id?: string | null
          criador?: string | null
          descricao?: string | null
          link?: string | null
          nome_ad?: string | null
          req_ad?: number | null
          req_cria?: number | null
          titulo?: string | null
          uri?: string | null
          video_id?: string | null
        }
        Update: {
          adset_id?: string | null
          conjunto?: string | null
          creative_id?: string | null
          criador?: string | null
          descricao?: string | null
          link?: string | null
          nome_ad?: string | null
          req_ad?: number | null
          req_cria?: number | null
          titulo?: string | null
          uri?: string | null
          video_id?: string | null
        }
        Relationships: []
      }
      _core_vid: {
        Row: {
          criador: string | null
          req_thumb: number | null
          uri: string | null
          video_id: string | null
        }
        Insert: {
          criador?: string | null
          req_thumb?: number | null
          uri?: string | null
          video_id?: string | null
        }
        Update: {
          criador?: string | null
          req_thumb?: number | null
          uri?: string | null
          video_id?: string | null
        }
        Relationships: []
      }
      _fix: {
        Row: {
          ad_id: string | null
          creative_novo: string | null
          descricao: string | null
          link: string | null
          nome_ad: string | null
          req_cria: number | null
          req_troca: number | null
          titulo: string | null
          uri: string | null
          video_id: string | null
        }
        Insert: {
          ad_id?: string | null
          creative_novo?: string | null
          descricao?: string | null
          link?: string | null
          nome_ad?: string | null
          req_cria?: number | null
          req_troca?: number | null
          titulo?: string | null
          uri?: string | null
          video_id?: string | null
        }
        Update: {
          ad_id?: string | null
          creative_novo?: string | null
          descricao?: string | null
          link?: string | null
          nome_ad?: string | null
          req_cria?: number | null
          req_troca?: number | null
          titulo?: string | null
          uri?: string | null
          video_id?: string | null
        }
        Relationships: []
      }
      _fix2: {
        Row: {
          ad_id: string | null
          anuncio: string | null
          conjunto: string | null
          creative_id: string | null
          creative_novo: string | null
          msg: string | null
          msg_ok: string | null
          req_cria: number | null
          req_le: number | null
          req_troca: number | null
          titulo: string | null
          titulo_ok: string | null
        }
        Insert: {
          ad_id?: string | null
          anuncio?: string | null
          conjunto?: string | null
          creative_id?: string | null
          creative_novo?: string | null
          msg?: string | null
          msg_ok?: string | null
          req_cria?: number | null
          req_le?: number | null
          req_troca?: number | null
          titulo?: string | null
          titulo_ok?: string | null
        }
        Update: {
          ad_id?: string | null
          anuncio?: string | null
          conjunto?: string | null
          creative_id?: string | null
          creative_novo?: string | null
          msg?: string | null
          msg_ok?: string | null
          req_cria?: number | null
          req_le?: number | null
          req_troca?: number | null
          titulo?: string | null
          titulo_ok?: string | null
        }
        Relationships: []
      }
      _meta14: {
        Row: {
          c_clique: number | null
          c_view: number | null
          dia: string
          gasto: number | null
          r_clique: number | null
          r_view: number | null
        }
        Insert: {
          c_clique?: number | null
          c_view?: number | null
          dia: string
          gasto?: number | null
          r_clique?: number | null
          r_view?: number | null
        }
        Update: {
          c_clique?: number | null
          c_view?: number | null
          dia?: string
          gasto?: number | null
          r_clique?: number | null
          r_view?: number | null
        }
        Relationships: []
      }
      _mkt_adset: {
        Row: {
          adset_id: string | null
          nome: string | null
          req: number | null
        }
        Insert: {
          adset_id?: string | null
          nome?: string | null
          req?: number | null
        }
        Update: {
          adset_id?: string | null
          nome?: string | null
          req?: number | null
        }
        Relationships: []
      }
      _mkt_plano: {
        Row: {
          acao: string | null
          adset_novo: string | null
          alvo_ad: string | null
          base_req: number | null
          canal: string | null
          conjunto_nome: string | null
          creative_novo: string | null
          descricao: string | null
          link: string | null
          nome: string | null
          ord: number | null
          produto: string | null
          req_ad: number | null
          req_cria: number | null
          titulo: string | null
        }
        Insert: {
          acao?: string | null
          adset_novo?: string | null
          alvo_ad?: string | null
          base_req?: number | null
          canal?: string | null
          conjunto_nome?: string | null
          creative_novo?: string | null
          descricao?: string | null
          link?: string | null
          nome?: string | null
          ord?: number | null
          produto?: string | null
          req_ad?: number | null
          req_cria?: number | null
          titulo?: string | null
        }
        Update: {
          acao?: string | null
          adset_novo?: string | null
          alvo_ad?: string | null
          base_req?: number | null
          canal?: string | null
          conjunto_nome?: string | null
          creative_novo?: string | null
          descricao?: string | null
          link?: string | null
          nome?: string | null
          ord?: number | null
          produto?: string | null
          req_ad?: number | null
          req_cria?: number | null
          titulo?: string | null
        }
        Relationships: []
      }
      _ml_creat_video: {
        Row: {
          cita_preco: boolean | null
          creative_id: string | null
          criador: string | null
          gram: string | null
          html_req: number | null
          lote: number | null
          mp4: string | null
          picture: string | null
          prev_req: number | null
          preview_url: string | null
          seg: number | null
          titulo: string | null
          transcricao: string | null
          vid: string
        }
        Insert: {
          cita_preco?: boolean | null
          creative_id?: string | null
          criador?: string | null
          gram?: string | null
          html_req?: number | null
          lote?: number | null
          mp4?: string | null
          picture?: string | null
          prev_req?: number | null
          preview_url?: string | null
          seg?: number | null
          titulo?: string | null
          transcricao?: string | null
          vid: string
        }
        Update: {
          cita_preco?: boolean | null
          creative_id?: string | null
          criador?: string | null
          gram?: string | null
          html_req?: number | null
          lote?: number | null
          mp4?: string | null
          picture?: string | null
          prev_req?: number | null
          preview_url?: string | null
          seg?: number | null
          titulo?: string | null
          transcricao?: string | null
          vid?: string
        }
        Relationships: []
      }
      _ml_req: {
        Row: {
          lote: number
          req: number | null
        }
        Insert: {
          lote: number
          req?: number | null
        }
        Update: {
          lote?: number
          req?: number | null
        }
        Relationships: []
      }
      _parar: {
        Row: {
          ad_id: string | null
          anuncio: string | null
          conjunto: string | null
          link: string | null
          req: number | null
        }
        Insert: {
          ad_id?: string | null
          anuncio?: string | null
          conjunto?: string | null
          link?: string | null
          req?: number | null
        }
        Update: {
          ad_id?: string | null
          anuncio?: string | null
          conjunto?: string | null
          link?: string | null
          req?: number | null
        }
        Relationships: []
      }
      _pb_adset: {
        Row: {
          adset_id: string | null
          nome: string | null
          req: number | null
        }
        Insert: {
          adset_id?: string | null
          nome?: string | null
          req?: number | null
        }
        Update: {
          adset_id?: string | null
          nome?: string | null
          req?: number | null
        }
        Relationships: []
      }
      _pb_cand: {
        Row: {
          ad_id: string | null
          creative_id: string | null
          iframe: string | null
          produto: string | null
          quem: string | null
          req_html: number | null
          req_prev: number | null
          url_mp4: string | null
        }
        Insert: {
          ad_id?: string | null
          creative_id?: string | null
          iframe?: string | null
          produto?: string | null
          quem?: string | null
          req_html?: number | null
          req_prev?: number | null
          url_mp4?: string | null
        }
        Update: {
          ad_id?: string | null
          creative_id?: string | null
          iframe?: string | null
          produto?: string | null
          quem?: string | null
          req_html?: number | null
          req_prev?: number | null
          url_mp4?: string | null
        }
        Relationships: []
      }
      _pb_plano: {
        Row: {
          acao: string | null
          alvo: string | null
          creative_novo: string | null
          descricao: string | null
          link: string | null
          nome_ad: string | null
          ord: number | null
          req_ad: number | null
          req_cria: number | null
          titulo: string | null
          uri: string | null
          video_id: string | null
        }
        Insert: {
          acao?: string | null
          alvo?: string | null
          creative_novo?: string | null
          descricao?: string | null
          link?: string | null
          nome_ad?: string | null
          ord?: number | null
          req_ad?: number | null
          req_cria?: number | null
          titulo?: string | null
          uri?: string | null
          video_id?: string | null
        }
        Update: {
          acao?: string | null
          alvo?: string | null
          creative_novo?: string | null
          descricao?: string | null
          link?: string | null
          nome_ad?: string | null
          ord?: number | null
          req_ad?: number | null
          req_cria?: number | null
          titulo?: string | null
          uri?: string | null
          video_id?: string | null
        }
        Relationships: []
      }
      _prints: {
        Row: {
          ad_id: string | null
          iframe: string | null
          req_prev: number | null
          rotulo: string | null
        }
        Insert: {
          ad_id?: string | null
          iframe?: string | null
          req_prev?: number | null
          rotulo?: string | null
        }
        Update: {
          ad_id?: string | null
          iframe?: string | null
          req_prev?: number | null
          rotulo?: string | null
        }
        Relationships: []
      }
      _prod_hoje: {
        Row: {
          ad_id: string | null
          ad_nome: string | null
          campanha: string | null
          cliques_link: number | null
          compras: number | null
          conjunto: string | null
          cpc: number | null
          ctr_link: number | null
          ctr_todos: number | null
          gasto: number | null
          impr: number | null
          lpv: number | null
          produto: string | null
          t: string | null
        }
        Insert: {
          ad_id?: string | null
          ad_nome?: string | null
          campanha?: string | null
          cliques_link?: number | null
          compras?: number | null
          conjunto?: string | null
          cpc?: number | null
          ctr_link?: number | null
          ctr_todos?: number | null
          gasto?: number | null
          impr?: number | null
          lpv?: number | null
          produto?: string | null
          t?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_nome?: string | null
          campanha?: string | null
          cliques_link?: number | null
          compras?: number | null
          conjunto?: string | null
          cpc?: number | null
          ctr_link?: number | null
          ctr_todos?: number | null
          gasto?: number | null
          impr?: number | null
          lpv?: number | null
          produto?: string | null
          t?: string | null
        }
        Relationships: []
      }
      _prod7: {
        Row: {
          ad_nome: string | null
          campanha: string | null
          cliques_link: number | null
          compras: number | null
          conjunto: string | null
          gasto: number | null
          impr: number | null
          produto: string | null
          t: string | null
        }
        Insert: {
          ad_nome?: string | null
          campanha?: string | null
          cliques_link?: number | null
          compras?: number | null
          conjunto?: string | null
          gasto?: number | null
          impr?: number | null
          produto?: string | null
          t?: string | null
        }
        Update: {
          ad_nome?: string | null
          campanha?: string | null
          cliques_link?: number | null
          compras?: number | null
          conjunto?: string | null
          gasto?: number | null
          impr?: number | null
          produto?: string | null
          t?: string | null
        }
        Relationships: []
      }
      _sarro_v2: {
        Row: {
          ad_id: string | null
          conjunto: string | null
          creative_novo: string | null
          descricao: string | null
          link: string | null
          nome_ad: string | null
          req_cria: number | null
          req_troca: number | null
          titulo: string | null
          uri: string | null
        }
        Insert: {
          ad_id?: string | null
          conjunto?: string | null
          creative_novo?: string | null
          descricao?: string | null
          link?: string | null
          nome_ad?: string | null
          req_cria?: number | null
          req_troca?: number | null
          titulo?: string | null
          uri?: string | null
        }
        Update: {
          ad_id?: string | null
          conjunto?: string | null
          creative_novo?: string | null
          descricao?: string | null
          link?: string | null
          nome_ad?: string | null
          req_cria?: number | null
          req_troca?: number | null
          titulo?: string | null
          uri?: string | null
        }
        Relationships: []
      }
      _sec_backup_anon_20260924_final: {
        Row: {
          privilege_type: string | null
          table_name: unknown
        }
        Insert: {
          privilege_type?: string | null
          table_name?: unknown
        }
        Update: {
          privilege_type?: string | null
          table_name?: unknown
        }
        Relationships: []
      }
      _sec_backup_auth_20260924: {
        Row: {
          privilege_type: string | null
          table_name: unknown
        }
        Insert: {
          privilege_type?: string | null
          table_name?: unknown
        }
        Update: {
          privilege_type?: string | null
          table_name?: unknown
        }
        Relationships: []
      }
      _sec_backup_cron_20260925: {
        Row: {
          command: string | null
          jobid: number
          jobname: string | null
          salvo_em: string | null
        }
        Insert: {
          command?: string | null
          jobid: number
          jobname?: string | null
          salvo_em?: string | null
        }
        Update: {
          command?: string | null
          jobid?: number
          jobname?: string | null
          salvo_em?: string | null
        }
        Relationships: []
      }
      _sec_backup_grants_20260924: {
        Row: {
          anon_select: boolean | null
          em: string | null
          relkind: unknown
          relname: unknown
        }
        Insert: {
          anon_select?: boolean | null
          em?: string | null
          relkind?: unknown
          relname?: unknown
        }
        Update: {
          anon_select?: boolean | null
          em?: string | null
          relkind?: unknown
          relname?: unknown
        }
        Relationships: []
      }
      _sec_backup_papel_20260928: {
        Row: {
          email: string | null
          origem: string | null
          papel: string | null
          removido_em: string | null
          user_id: string | null
        }
        Insert: {
          email?: string | null
          origem?: string | null
          papel?: string | null
          removido_em?: string | null
          user_id?: string | null
        }
        Update: {
          email?: string | null
          origem?: string | null
          papel?: string | null
          removido_em?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      _sec_falhas: {
        Row: {
          em: string | null
          erro: string | null
          nome: string | null
        }
        Insert: {
          em?: string | null
          erro?: string | null
          nome?: string | null
        }
        Update: {
          em?: string | null
          erro?: string | null
          nome?: string | null
        }
        Relationships: []
      }
      _sec_whitelist_app: {
        Row: {
          nome: string
        }
        Insert: {
          nome: string
        }
        Update: {
          nome?: string
        }
        Relationships: []
      }
      _sec_whitelist_app_v2: {
        Row: {
          nome: string
        }
        Insert: {
          nome: string
        }
        Update: {
          nome?: string
        }
        Relationships: []
      }
      _shop_adset: {
        Row: {
          adset_id: string | null
          ped: number | null
          receita: number | null
        }
        Insert: {
          adset_id?: string | null
          ped?: number | null
          receita?: number | null
        }
        Update: {
          adset_id?: string | null
          ped?: number | null
          receita?: number | null
        }
        Relationships: []
      }
      _shop_any: {
        Row: {
          camp_id: string | null
          dia: string | null
          ped: number | null
          ped_ultimo_clique: number | null
          receita: number | null
        }
        Insert: {
          camp_id?: string | null
          dia?: string | null
          ped?: number | null
          ped_ultimo_clique?: number | null
          receita?: number | null
        }
        Update: {
          camp_id?: string | null
          dia?: string | null
          ped?: number | null
          ped_ultimo_clique?: number | null
          receita?: number | null
        }
        Relationships: []
      }
      _shop_dia_camp: {
        Row: {
          camp_id: string | null
          dia: string | null
          ped: number | null
          receita: number | null
        }
        Insert: {
          camp_id?: string | null
          dia?: string | null
          ped?: number | null
          receita?: number | null
        }
        Update: {
          camp_id?: string | null
          dia?: string | null
          ped?: number | null
          receita?: number | null
        }
        Relationships: []
      }
      _shopify_completar_req: {
        Row: {
          criado: string | null
          erro: string | null
          inseridas: number | null
          processado: boolean | null
          req_id: number
        }
        Insert: {
          criado?: string | null
          erro?: string | null
          inseridas?: number | null
          processado?: boolean | null
          req_id: number
        }
        Update: {
          criado?: string | null
          erro?: string | null
          inseridas?: number | null
          processado?: boolean | null
          req_id?: number
        }
        Relationships: []
      }
      _shopify_fv_backfill: {
        Row: {
          aplicado: boolean | null
          atualizadas: number | null
          criado: string | null
          fim: boolean | null
          req_id: number
        }
        Insert: {
          aplicado?: boolean | null
          atualizadas?: number | null
          criado?: string | null
          fim?: boolean | null
          req_id: number
        }
        Update: {
          aplicado?: boolean | null
          atualizadas?: number | null
          criado?: string | null
          fim?: boolean | null
          req_id?: number
        }
        Relationships: []
      }
      _shopify_fv_req: {
        Row: {
          atualizadas: number | null
          criado: string
          cursor_after: string | null
          desde: string
          erro: string | null
          processado: boolean
          req_id: number
        }
        Insert: {
          atualizadas?: number | null
          criado?: string
          cursor_after?: string | null
          desde: string
          erro?: string | null
          processado?: boolean
          req_id: number
        }
        Update: {
          atualizadas?: number | null
          criado?: string
          cursor_after?: string | null
          desde?: string
          erro?: string | null
          processado?: boolean
          req_id?: number
        }
        Relationships: []
      }
      _utm_fix: {
        Row: {
          ad_id: string
          ad_name: string | null
          adset_id: string | null
          aplicado_em: string | null
          campanha: string | null
          creative_id: string | null
          criativo_novo: string | null
          erro: string | null
          lote: number | null
          req_id: number | null
          status: string | null
          story_id: string | null
          url_tags_atual: string | null
          url_tags_novo: string | null
        }
        Insert: {
          ad_id: string
          ad_name?: string | null
          adset_id?: string | null
          aplicado_em?: string | null
          campanha?: string | null
          creative_id?: string | null
          criativo_novo?: string | null
          erro?: string | null
          lote?: number | null
          req_id?: number | null
          status?: string | null
          story_id?: string | null
          url_tags_atual?: string | null
          url_tags_novo?: string | null
        }
        Update: {
          ad_id?: string
          ad_name?: string | null
          adset_id?: string | null
          aplicado_em?: string | null
          campanha?: string | null
          creative_id?: string | null
          criativo_novo?: string | null
          erro?: string | null
          lote?: number | null
          req_id?: number | null
          status?: string | null
          story_id?: string | null
          url_tags_atual?: string | null
          url_tags_novo?: string | null
        }
        Relationships: []
      }
      amazon_ads_backfill_fila: {
        Row: {
          atualizado_em: string | null
          dia: string
          erro: string | null
          grao: string
          id: number
          status: string
          tentativas: number
        }
        Insert: {
          atualizado_em?: string | null
          dia: string
          erro?: string | null
          grao: string
          id?: never
          status?: string
          tentativas?: number
        }
        Update: {
          atualizado_em?: string | null
          dia?: string
          erro?: string | null
          grao?: string
          id?: never
          status?: string
          tentativas?: number
        }
        Relationships: []
      }
      amazon_ads_credentials: {
        Row: {
          access_token: string | null
          access_token_expires_at: string | null
          atualizado_em: string | null
          client_id: string
          id: number
          profile_country: string | null
          profile_id: string | null
          refresh_token: string | null
          region_endpoint: string | null
        }
        Insert: {
          access_token?: string | null
          access_token_expires_at?: string | null
          atualizado_em?: string | null
          client_id: string
          id?: number
          profile_country?: string | null
          profile_id?: string | null
          refresh_token?: string | null
          region_endpoint?: string | null
        }
        Update: {
          access_token?: string | null
          access_token_expires_at?: string | null
          atualizado_em?: string | null
          client_id?: string
          id?: number
          profile_country?: string | null
          profile_id?: string | null
          refresh_token?: string | null
          region_endpoint?: string | null
        }
        Relationships: []
      }
      amazon_ads_report_fila: {
        Row: {
          atualizado_em: string
          criado_em: string
          dia: string
          erro: string | null
          grao: string
          id: number
          linhas: number | null
          report_id: string | null
          status: string
          tentativas: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          dia: string
          erro?: string | null
          grao: string
          id?: never
          linhas?: number | null
          report_id?: string | null
          status?: string
          tentativas?: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          dia?: string
          erro?: string | null
          grao?: string
          id?: never
          linhas?: number | null
          report_id?: string | null
          status?: string
          tentativas?: number
        }
        Relationships: []
      }
      amazon_cliente_fila: {
        Row: {
          claimed_em: string | null
          data_venda: string | null
          estado: string
          feito_em: string | null
          pedido_id: string
          tentativas: number
        }
        Insert: {
          claimed_em?: string | null
          data_venda?: string | null
          estado?: string
          feito_em?: string | null
          pedido_id: string
          tentativas?: number
        }
        Update: {
          claimed_em?: string | null
          data_venda?: string | null
          estado?: string
          feito_em?: string | null
          pedido_id?: string
          tentativas?: number
        }
        Relationships: []
      }
      amazon_sp_asin_fila: {
        Row: {
          atualizado: string
          dia: string
          erro: string | null
          status: string
          tentativas: number
        }
        Insert: {
          atualizado?: string
          dia: string
          erro?: string | null
          status?: string
          tentativas?: number
        }
        Update: {
          atualizado?: string
          dia?: string
          erro?: string | null
          status?: string
          tentativas?: number
        }
        Relationships: []
      }
      amazon_sp_credentials: {
        Row: {
          access_expires_at: string | null
          access_token: string | null
          atualizado_em: string | null
          client_id: string
          client_secret: string
          id: number
          marketplace_id: string
          refresh_token: string
          region_endpoint: string
          seller_id: string | null
        }
        Insert: {
          access_expires_at?: string | null
          access_token?: string | null
          atualizado_em?: string | null
          client_id: string
          client_secret: string
          id?: number
          marketplace_id?: string
          refresh_token: string
          region_endpoint?: string
          seller_id?: string | null
        }
        Update: {
          access_expires_at?: string | null
          access_token?: string | null
          atualizado_em?: string | null
          client_id?: string
          client_secret?: string
          id?: number
          marketplace_id?: string
          refresh_token?: string
          region_endpoint?: string
          seller_id?: string | null
        }
        Relationships: []
      }
      amazon_sp_estado: {
        Row: {
          atualizado_em: string | null
          chave: string
          next_token: string | null
        }
        Insert: {
          atualizado_em?: string | null
          chave: string
          next_token?: string | null
        }
        Update: {
          atualizado_em?: string | null
          chave?: string
          next_token?: string | null
        }
        Relationships: []
      }
      amazon_st_fila: {
        Row: {
          atualizado_em: string | null
          data: string
          linhas: number | null
          status: string
          tentativas: number | null
        }
        Insert: {
          atualizado_em?: string | null
          data: string
          linhas?: number | null
          status?: string
          tentativas?: number | null
        }
        Update: {
          atualizado_em?: string | null
          data?: string
          linhas?: number | null
          status?: string
          tentativas?: number | null
        }
        Relationships: []
      }
      analise_def: {
        Row: {
          analise_nome: string
          analise_slug: string
          ativo: boolean
          canal: string
          canal_slug: string
          chave: string
          excel_sheets: Json
          ordem: number | null
          payload_views: Json
          prompt: string
          think: boolean
        }
        Insert: {
          analise_nome: string
          analise_slug: string
          ativo?: boolean
          canal: string
          canal_slug: string
          chave: string
          excel_sheets?: Json
          ordem?: number | null
          payload_views?: Json
          prompt: string
          think?: boolean
        }
        Update: {
          analise_nome?: string
          analise_slug?: string
          ativo?: boolean
          canal?: string
          canal_slug?: string
          chave?: string
          excel_sheets?: Json
          ordem?: number | null
          payload_views?: Json
          prompt?: string
          think?: boolean
        }
        Relationships: []
      }
      analise_resultado: {
        Row: {
          analise_slug: string | null
          canal_slug: string | null
          chave: string | null
          criado_em: string | null
          data_ref: string
          email_id: string | null
          id: number
          metricas: Json | null
          modelo: string | null
          pdf_path: string | null
          texto: string | null
          tokens_in: number | null
          tokens_out: number | null
          tokens_think: number | null
          xlsx_path: string | null
        }
        Insert: {
          analise_slug?: string | null
          canal_slug?: string | null
          chave?: string | null
          criado_em?: string | null
          data_ref: string
          email_id?: string | null
          id?: number
          metricas?: Json | null
          modelo?: string | null
          pdf_path?: string | null
          texto?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          tokens_think?: number | null
          xlsx_path?: string | null
        }
        Update: {
          analise_slug?: string | null
          canal_slug?: string | null
          chave?: string | null
          criado_em?: string | null
          data_ref?: string
          email_id?: string | null
          id?: number
          metricas?: Json | null
          modelo?: string | null
          pdf_path?: string | null
          texto?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          tokens_think?: number | null
          xlsx_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analise_resultado_chave_fkey"
            columns: ["chave"]
            isOneToOne: false
            referencedRelation: "analise_def"
            referencedColumns: ["chave"]
          },
        ]
      }
      app_papel: {
        Row: {
          criado_em: string
          email: string | null
          papel: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          email?: string | null
          papel?: string
          user_id: string
        }
        Update: {
          criado_em?: string
          email?: string | null
          papel?: string
          user_id?: string
        }
        Relationships: []
      }
      app_papel_convite: {
        Row: {
          criado_em: string
          email: string
          papel: string
        }
        Insert: {
          criado_em?: string
          email: string
          papel?: string
        }
        Update: {
          criado_em?: string
          email?: string
          papel?: string
        }
        Relationships: []
      }
      auditoria_search_path: {
        Row: {
          aplicado_em: string
          funcao: string
          tinha_config: string[] | null
        }
        Insert: {
          aplicado_em?: string
          funcao: string
          tinha_config?: string[] | null
        }
        Update: {
          aplicado_em?: string
          funcao?: string
          tinha_config?: string[] | null
        }
        Relationships: []
      }
      auditoria_view_invoker: {
        Row: {
          aplicado_em: string | null
          erro: string | null
          linhas_antes: number | null
          linhas_depois: number | null
          view_nome: string | null
        }
        Insert: {
          aplicado_em?: string | null
          erro?: string | null
          linhas_antes?: number | null
          linhas_depois?: number | null
          view_nome?: string | null
        }
        Update: {
          aplicado_em?: string | null
          erro?: string | null
          linhas_antes?: number | null
          linhas_depois?: number | null
          view_nome?: string | null
        }
        Relationships: []
      }
      awin_transacao: {
        Row: {
          atualizado_em: string
          bruto: Json | null
          click_date: string | null
          cliente_novo: boolean | null
          comissao: number
          cupom: string | null
          data_venda: string
          decline_reason: string | null
          dispositivo: string | null
          id: number
          order_ref: string | null
          pago_publisher: boolean | null
          pedido_nome: string | null
          publisher: string | null
          publisher_id: number | null
          status: string
          taxa_awin: number
          transaction_date: string
          validation_date: string | null
          venda: number
        }
        Insert: {
          atualizado_em?: string
          bruto?: Json | null
          click_date?: string | null
          cliente_novo?: boolean | null
          comissao?: number
          cupom?: string | null
          data_venda: string
          decline_reason?: string | null
          dispositivo?: string | null
          id: number
          order_ref?: string | null
          pago_publisher?: boolean | null
          pedido_nome?: string | null
          publisher?: string | null
          publisher_id?: number | null
          status: string
          taxa_awin?: number
          transaction_date: string
          validation_date?: string | null
          venda?: number
        }
        Update: {
          atualizado_em?: string
          bruto?: Json | null
          click_date?: string | null
          cliente_novo?: boolean | null
          comissao?: number
          cupom?: string | null
          data_venda?: string
          decline_reason?: string | null
          dispositivo?: string | null
          id?: number
          order_ref?: string | null
          pago_publisher?: boolean | null
          pedido_nome?: string | null
          publisher?: string | null
          publisher_id?: number | null
          status?: string
          taxa_awin?: number
          transaction_date?: string
          validation_date?: string | null
          venda?: number
        }
        Relationships: []
      }
      bkp_atribuicao_site_20260915_defs: {
        Row: {
          def: string | null
          nome: unknown
        }
        Insert: {
          def?: string | null
          nome?: unknown
        }
        Update: {
          def?: string | null
          nome?: unknown
        }
        Relationships: []
      }
      bkp_atribuicao_site_20260915_fact: {
        Row: {
          canal_venda: string | null
          carregado_em: string | null
          data: string | null
          invest_ads: number | null
          invest_afiliados: number | null
          pedidos: number | null
          receita_ads: number | null
          receita_total: number | null
        }
        Insert: {
          canal_venda?: string | null
          carregado_em?: string | null
          data?: string | null
          invest_ads?: number | null
          invest_afiliados?: number | null
          pedidos?: number | null
          receita_ads?: number | null
          receita_total?: number | null
        }
        Update: {
          canal_venda?: string | null
          carregado_em?: string | null
          data?: string | null
          invest_ads?: number | null
          invest_afiliados?: number | null
          pedidos?: number | null
          receita_ads?: number | null
          receita_total?: number | null
        }
        Relationships: []
      }
      bkp_atribuicao_site_20260915_geral: {
        Row: {
          acos_ads: number | null
          data: string | null
          desconto: number | null
          devolucoes: number | null
          faturamento_bruto: number | null
          faturamento_liquido: number | null
          frete: number | null
          invest_ads: number | null
          pct_cliente_novo: number | null
          pedidos: number | null
          pedidos_cliente_novo: number | null
          receita_ads: number | null
          roas_ads: number | null
          roas_total: number | null
          share_ads_pct: number | null
          tacos: number | null
          ticket_medio: number | null
          total_pago: number | null
          unidades: number | null
          unidades_devolvidas: number | null
          venda_total: number | null
        }
        Insert: {
          acos_ads?: number | null
          data?: string | null
          desconto?: number | null
          devolucoes?: number | null
          faturamento_bruto?: number | null
          faturamento_liquido?: number | null
          frete?: number | null
          invest_ads?: number | null
          pct_cliente_novo?: number | null
          pedidos?: number | null
          pedidos_cliente_novo?: number | null
          receita_ads?: number | null
          roas_ads?: number | null
          roas_total?: number | null
          share_ads_pct?: number | null
          tacos?: number | null
          ticket_medio?: number | null
          total_pago?: number | null
          unidades?: number | null
          unidades_devolvidas?: number | null
          venda_total?: number | null
        }
        Update: {
          acos_ads?: number | null
          data?: string | null
          desconto?: number | null
          devolucoes?: number | null
          faturamento_bruto?: number | null
          faturamento_liquido?: number | null
          frete?: number | null
          invest_ads?: number | null
          pct_cliente_novo?: number | null
          pedidos?: number | null
          pedidos_cliente_novo?: number | null
          receita_ads?: number | null
          roas_ads?: number | null
          roas_total?: number | null
          share_ads_pct?: number | null
          tacos?: number | null
          ticket_medio?: number | null
          total_pago?: number | null
          unidades?: number | null
          unidades_devolvidas?: number | null
          venda_total?: number | null
        }
        Relationships: []
      }
      bkp_atribuicao_site_20260915_tipo: {
        Row: {
          acos: number | null
          canal: string | null
          cliques: number | null
          data: string | null
          impressoes: number | null
          investimento: number | null
          receita: number | null
          roas: number | null
          tipo: string | null
          tipo_raw: string | null
        }
        Insert: {
          acos?: number | null
          canal?: string | null
          cliques?: number | null
          data?: string | null
          impressoes?: number | null
          investimento?: number | null
          receita?: number | null
          roas?: number | null
          tipo?: string | null
          tipo_raw?: string | null
        }
        Update: {
          acos?: number | null
          canal?: string | null
          cliques?: number | null
          data?: string | null
          impressoes?: number | null
          investimento?: number | null
          receita?: number | null
          roas?: number | null
          tipo?: string | null
          tipo_raw?: string | null
        }
        Relationships: []
      }
      bkp_def_shopee_venda_20260910: {
        Row: {
          def: string | null
          nome: string | null
          salvo_em: string | null
          tipo: string | null
        }
        Insert: {
          def?: string | null
          nome?: string | null
          salvo_em?: string | null
          tipo?: string | null
        }
        Update: {
          def?: string | null
          nome?: string | null
          salvo_em?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      bkp_receita_diaria_20260916: {
        Row: {
          canal_venda: string | null
          carregado_em: string | null
          data: string | null
          invest_ads: number | null
          invest_afiliados: number | null
          pedidos: number | null
          receita_ads: number | null
          receita_total: number | null
        }
        Insert: {
          canal_venda?: string | null
          carregado_em?: string | null
          data?: string | null
          invest_ads?: number | null
          invest_afiliados?: number | null
          pedidos?: number | null
          receita_ads?: number | null
          receita_total?: number | null
        }
        Update: {
          canal_venda?: string | null
          carregado_em?: string | null
          data?: string | null
          invest_ads?: number | null
          invest_afiliados?: number | null
          pedidos?: number | null
          receita_ads?: number | null
          receita_total?: number | null
        }
        Relationships: []
      }
      bkp_shopify_api_inseridos_20260914: {
        Row: {
          inserido_em: string | null
          line_item__id: string
          order_id: string | null
        }
        Insert: {
          inserido_em?: string | null
          line_item__id: string
          order_id?: string | null
        }
        Update: {
          inserido_em?: string | null
          line_item__id?: string
          order_id?: string | null
        }
        Relationships: []
      }
      bkp_shopify_api_resposta_20260914: {
        Row: {
          criado_em: string | null
          janela: string
          req_id: number | null
          resposta: Json | null
        }
        Insert: {
          criado_em?: string | null
          janela: string
          req_id?: number | null
          resposta?: Json | null
        }
        Update: {
          criado_em?: string | null
          janela?: string
          req_id?: number | null
          resposta?: Json | null
        }
        Relationships: []
      }
      cliente_ponte_email_doc: {
        Row: {
          atualizado: string | null
          doc_hash: string
          email_hash: string
          pedidos: number | null
        }
        Insert: {
          atualizado?: string | null
          doc_hash: string
          email_hash: string
          pedidos?: number | null
        }
        Update: {
          atualizado?: string | null
          doc_hash?: string
          email_hash?: string
          pedidos?: number | null
        }
        Relationships: []
      }
      config_atribuicao_site: {
        Row: {
          chave: string
          inicio: string
          obs: string | null
        }
        Insert: {
          chave: string
          inicio: string
          obs?: string | null
        }
        Update: {
          chave?: string
          inicio?: string
          obs?: string | null
        }
        Relationships: []
      }
      cria_asset: {
        Row: {
          atualizado_em: string
          criado_em: string
          criativo_id: string
          erro_codigo: string | null
          erro_msg: string | null
          estado: string
          id: string
          image_hash: string | null
          plataforma: string
          proxima_tentativa: string | null
          tentativas: number
          thumbnail_url: string | null
          video_id: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criativo_id: string
          erro_codigo?: string | null
          erro_msg?: string | null
          estado?: string
          id?: string
          image_hash?: string | null
          plataforma?: string
          proxima_tentativa?: string | null
          tentativas?: number
          thumbnail_url?: string | null
          video_id?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criativo_id?: string
          erro_codigo?: string | null
          erro_msg?: string | null
          estado?: string
          id?: string
          image_hash?: string | null
          plataforma?: string
          proxima_tentativa?: string | null
          tentativas?: number
          thumbnail_url?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cria_asset_criativo_id_fkey"
            columns: ["criativo_id"]
            isOneToOne: false
            referencedRelation: "cria_criativo"
            referencedColumns: ["id"]
          },
        ]
      }
      cria_campanha_config: {
        Row: {
          adset_id: string | null
          adset_molde_id: string | null
          ativo: boolean
          atualizado_em: string
          campaign_id: string
          campaign_name: string | null
          criado_em: string
          criar_anuncio: boolean
          formatos: string[]
          modelo_id: string | null
          modo_conjunto: string
          publicar: boolean
        }
        Insert: {
          adset_id?: string | null
          adset_molde_id?: string | null
          ativo?: boolean
          atualizado_em?: string
          campaign_id: string
          campaign_name?: string | null
          criado_em?: string
          criar_anuncio?: boolean
          formatos?: string[]
          modelo_id?: string | null
          modo_conjunto?: string
          publicar?: boolean
        }
        Update: {
          adset_id?: string | null
          adset_molde_id?: string | null
          ativo?: boolean
          atualizado_em?: string
          campaign_id?: string
          campaign_name?: string | null
          criado_em?: string
          criar_anuncio?: boolean
          formatos?: string[]
          modelo_id?: string | null
          modo_conjunto?: string
          publicar?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cria_campanha_config_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "cria_modelo"
            referencedColumns: ["id"]
          },
        ]
      }
      cria_conta_config: {
        Row: {
          atualizado_em: string
          id: number
          instagram_actor_id: string | null
          link_padrao: string | null
          page_id: string | null
          pixel_id: string | null
          tracking_padrao: string | null
        }
        Insert: {
          atualizado_em?: string
          id?: number
          instagram_actor_id?: string | null
          link_padrao?: string | null
          page_id?: string | null
          pixel_id?: string | null
          tracking_padrao?: string | null
        }
        Update: {
          atualizado_em?: string
          id?: number
          instagram_actor_id?: string | null
          link_padrao?: string | null
          page_id?: string | null
          pixel_id?: string | null
          tracking_padrao?: string | null
        }
        Relationships: []
      }
      cria_criativo: {
        Row: {
          altura: number | null
          atualizado_em: string
          criado_em: string
          duracao_seg: number | null
          hash: string
          id: string
          largura: number | null
          mime: string | null
          nome: string
          origem: string | null
          origem_item_nome: string | null
          origem_item_url: string | null
          origem_ref: string | null
          origem_url: string | null
          storage_path: string
          tamanho_bytes: number | null
          tipo: string
        }
        Insert: {
          altura?: number | null
          atualizado_em?: string
          criado_em?: string
          duracao_seg?: number | null
          hash: string
          id?: string
          largura?: number | null
          mime?: string | null
          nome: string
          origem?: string | null
          origem_item_nome?: string | null
          origem_item_url?: string | null
          origem_ref?: string | null
          origem_url?: string | null
          storage_path: string
          tamanho_bytes?: number | null
          tipo?: string
        }
        Update: {
          altura?: number | null
          atualizado_em?: string
          criado_em?: string
          duracao_seg?: number | null
          hash?: string
          id?: string
          largura?: number | null
          mime?: string | null
          nome?: string
          origem?: string | null
          origem_item_nome?: string | null
          origem_item_url?: string | null
          origem_ref?: string | null
          origem_url?: string | null
          storage_path?: string
          tamanho_bytes?: number | null
          tipo?: string
        }
        Relationships: []
      }
      cria_cron_token: {
        Row: {
          criado_em: string
          id: number
          token: string
        }
        Insert: {
          criado_em?: string
          id?: number
          token?: string
        }
        Update: {
          criado_em?: string
          id?: number
          token?: string
        }
        Relationships: []
      }
      cria_distribuicao: {
        Row: {
          ad_id: string | null
          adcreative_id: string | null
          adset_id: string | null
          atualizado_em: string
          campaign_id: string
          campaign_name: string | null
          criado_em: string
          criativo_id: string
          cta: string | null
          descricao: string | null
          erro_codigo: string | null
          erro_msg: string | null
          estado: string
          etapa: string
          id: string
          link: string | null
          modelo_id: string | null
          plataforma: string
          proxima_tentativa: string | null
          publicar: boolean
          tentativas: number
          texto: string | null
          titulo: string | null
        }
        Insert: {
          ad_id?: string | null
          adcreative_id?: string | null
          adset_id?: string | null
          atualizado_em?: string
          campaign_id: string
          campaign_name?: string | null
          criado_em?: string
          criativo_id: string
          cta?: string | null
          descricao?: string | null
          erro_codigo?: string | null
          erro_msg?: string | null
          estado?: string
          etapa?: string
          id?: string
          link?: string | null
          modelo_id?: string | null
          plataforma?: string
          proxima_tentativa?: string | null
          publicar?: boolean
          tentativas?: number
          texto?: string | null
          titulo?: string | null
        }
        Update: {
          ad_id?: string | null
          adcreative_id?: string | null
          adset_id?: string | null
          atualizado_em?: string
          campaign_id?: string
          campaign_name?: string | null
          criado_em?: string
          criativo_id?: string
          cta?: string | null
          descricao?: string | null
          erro_codigo?: string | null
          erro_msg?: string | null
          estado?: string
          etapa?: string
          id?: string
          link?: string | null
          modelo_id?: string | null
          plataforma?: string
          proxima_tentativa?: string | null
          publicar?: boolean
          tentativas?: number
          texto?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cria_distribuicao_criativo_id_fkey"
            columns: ["criativo_id"]
            isOneToOne: false
            referencedRelation: "cria_criativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cria_distribuicao_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "cria_modelo"
            referencedColumns: ["id"]
          },
        ]
      }
      cria_evento: {
        Row: {
          codigo: string | null
          criado_em: string
          criativo_id: string | null
          distribuicao_id: string | null
          etapa: string
          id: number
          mensagem: string | null
          resultado: string
        }
        Insert: {
          codigo?: string | null
          criado_em?: string
          criativo_id?: string | null
          distribuicao_id?: string | null
          etapa: string
          id?: number
          mensagem?: string | null
          resultado?: string
        }
        Update: {
          codigo?: string | null
          criado_em?: string
          criativo_id?: string | null
          distribuicao_id?: string | null
          etapa?: string
          id?: number
          mensagem?: string | null
          resultado?: string
        }
        Relationships: [
          {
            foreignKeyName: "cria_evento_criativo_id_fkey"
            columns: ["criativo_id"]
            isOneToOne: false
            referencedRelation: "cria_criativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cria_evento_distribuicao_id_fkey"
            columns: ["distribuicao_id"]
            isOneToOne: false
            referencedRelation: "cria_distribuicao"
            referencedColumns: ["id"]
          },
        ]
      }
      cria_lock: {
        Row: {
          expira_em: string
          nome: string
        }
        Insert: {
          expira_em: string
          nome: string
        }
        Update: {
          expira_em?: string
          nome?: string
        }
        Relationships: []
      }
      cria_modelo: {
        Row: {
          atualizado_em: string
          criado_em: string
          cta: string
          descricao: string | null
          id: string
          link: string | null
          nome: string
          texto: string | null
          titulo: string | null
          tracking: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          cta?: string
          descricao?: string | null
          id?: string
          link?: string | null
          nome: string
          texto?: string | null
          titulo?: string | null
          tracking?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          cta?: string
          descricao?: string | null
          id?: string
          link?: string | null
          nome?: string
          texto?: string | null
          titulo?: string | null
          tracking?: string | null
        }
        Relationships: []
      }
      cria_regra: {
        Row: {
          ativo: boolean
          atualizado_em: string
          campanhas: string[]
          criado_em: string
          id: string
          prioridade: number
          trecho: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          campanhas?: string[]
          criado_em?: string
          id?: string
          prioridade?: number
          trecho: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          campanhas?: string[]
          criado_em?: string
          id?: string
          prioridade?: number
          trecho?: string
        }
        Relationships: []
      }
      dim_amazon_ads_campanha: {
        Row: {
          ad_type: string
          atualizado_em: string | null
          budget: number | null
          campaign_id: string
          campaign_name: string | null
          segmentacao: string | null
          status: string | null
        }
        Insert: {
          ad_type: string
          atualizado_em?: string | null
          budget?: number | null
          campaign_id: string
          campaign_name?: string | null
          segmentacao?: string | null
          status?: string | null
        }
        Update: {
          ad_type?: string
          atualizado_em?: string | null
          budget?: number | null
          campaign_id?: string
          campaign_name?: string | null
          segmentacao?: string | null
          status?: string | null
        }
        Relationships: []
      }
      dim_amazon_buybox: {
        Row: {
          asin: string
          atualizado_em: string | null
          buybox_fba: boolean | null
          buybox_preco: number | null
          concorrente_no_bb: boolean | null
          ganho_buybox: boolean | null
          menor_preco_concorrente: number | null
          meu_preco: number | null
          n_concorrentes: number | null
          n_ofertas: number | null
          status: string | null
        }
        Insert: {
          asin: string
          atualizado_em?: string | null
          buybox_fba?: boolean | null
          buybox_preco?: number | null
          concorrente_no_bb?: boolean | null
          ganho_buybox?: boolean | null
          menor_preco_concorrente?: number | null
          meu_preco?: number | null
          n_concorrentes?: number | null
          n_ofertas?: number | null
          status?: string | null
        }
        Update: {
          asin?: string
          atualizado_em?: string | null
          buybox_fba?: boolean | null
          buybox_preco?: number | null
          concorrente_no_bb?: boolean | null
          ganho_buybox?: boolean | null
          menor_preco_concorrente?: number | null
          meu_preco?: number | null
          n_concorrentes?: number | null
          n_ofertas?: number | null
          status?: string | null
        }
        Relationships: []
      }
      dim_amazon_cadastro: {
        Row: {
          asin: string
          atualizado_em: string | null
          bsr: number | null
          bsr_categoria: string | null
          categoria: string | null
          comprimento_titulo: number | null
          fabricante: string | null
          faltas: string[] | null
          health: number | null
          marca: string | null
          n_atributos: number | null
          n_bullets: number | null
          n_fotos: number | null
          product_type: string | null
          tem_aplus: boolean | null
          tem_descricao: boolean | null
          tem_ingredientes: boolean | null
          titulo: string | null
          website_group: string | null
        }
        Insert: {
          asin: string
          atualizado_em?: string | null
          bsr?: number | null
          bsr_categoria?: string | null
          categoria?: string | null
          comprimento_titulo?: number | null
          fabricante?: string | null
          faltas?: string[] | null
          health?: number | null
          marca?: string | null
          n_atributos?: number | null
          n_bullets?: number | null
          n_fotos?: number | null
          product_type?: string | null
          tem_aplus?: boolean | null
          tem_descricao?: boolean | null
          tem_ingredientes?: boolean | null
          titulo?: string | null
          website_group?: string | null
        }
        Update: {
          asin?: string
          atualizado_em?: string | null
          bsr?: number | null
          bsr_categoria?: string | null
          categoria?: string | null
          comprimento_titulo?: number | null
          fabricante?: string | null
          faltas?: string[] | null
          health?: number | null
          marca?: string | null
          n_atributos?: number | null
          n_bullets?: number | null
          n_fotos?: number | null
          product_type?: string | null
          tem_aplus?: boolean | null
          tem_descricao?: boolean | null
          tem_ingredientes?: boolean | null
          titulo?: string | null
          website_group?: string | null
        }
        Relationships: []
      }
      dim_amazon_estoque: {
        Row: {
          asin: string | null
          atualizado_em: string | null
          disponivel: number | null
          inbound_shipped: number | null
          inbound_working: number | null
          preco: number | null
          product_name: string | null
          reservado: number | null
          sku: string
          total: number | null
          unsellable: number | null
        }
        Insert: {
          asin?: string | null
          atualizado_em?: string | null
          disponivel?: number | null
          inbound_shipped?: number | null
          inbound_working?: number | null
          preco?: number | null
          product_name?: string | null
          reservado?: number | null
          sku: string
          total?: number | null
          unsellable?: number | null
        }
        Update: {
          asin?: string | null
          atualizado_em?: string | null
          disponivel?: number | null
          inbound_shipped?: number | null
          inbound_working?: number | null
          preco?: number | null
          product_name?: string | null
          reservado?: number | null
          sku?: string
          total?: number | null
          unsellable?: number | null
        }
        Relationships: []
      }
      dim_amazon_estoque_sp: {
        Row: {
          asin: string | null
          atualizado_amazon: string | null
          atualizado_em: string | null
          condicao: string | null
          fnsku: string | null
          fulfillable: number | null
          future_disponivel: number | null
          future_reservado: number | null
          imprestavel_danificado_armazem: number | null
          imprestavel_danificado_cliente: number | null
          imprestavel_defeito: number | null
          imprestavel_total: number | null
          imprestavel_vencido: number | null
          inbound_receiving: number | null
          inbound_shipped: number | null
          inbound_working: number | null
          pesquisa_total: number | null
          product_name: string | null
          reservado_fc: number | null
          reservado_pedido: number | null
          reservado_total: number | null
          reservado_transito: number | null
          seller_sku: string
          total: number | null
        }
        Insert: {
          asin?: string | null
          atualizado_amazon?: string | null
          atualizado_em?: string | null
          condicao?: string | null
          fnsku?: string | null
          fulfillable?: number | null
          future_disponivel?: number | null
          future_reservado?: number | null
          imprestavel_danificado_armazem?: number | null
          imprestavel_danificado_cliente?: number | null
          imprestavel_defeito?: number | null
          imprestavel_total?: number | null
          imprestavel_vencido?: number | null
          inbound_receiving?: number | null
          inbound_shipped?: number | null
          inbound_working?: number | null
          pesquisa_total?: number | null
          product_name?: string | null
          reservado_fc?: number | null
          reservado_pedido?: number | null
          reservado_total?: number | null
          reservado_transito?: number | null
          seller_sku: string
          total?: number | null
        }
        Update: {
          asin?: string | null
          atualizado_amazon?: string | null
          atualizado_em?: string | null
          condicao?: string | null
          fnsku?: string | null
          fulfillable?: number | null
          future_disponivel?: number | null
          future_reservado?: number | null
          imprestavel_danificado_armazem?: number | null
          imprestavel_danificado_cliente?: number | null
          imprestavel_defeito?: number | null
          imprestavel_total?: number | null
          imprestavel_vencido?: number | null
          inbound_receiving?: number | null
          inbound_shipped?: number | null
          inbound_working?: number | null
          pesquisa_total?: number | null
          product_name?: string | null
          reservado_fc?: number | null
          reservado_pedido?: number | null
          reservado_total?: number | null
          reservado_transito?: number | null
          seller_sku?: string
          total?: number | null
        }
        Relationships: []
      }
      dim_amazon_produto: {
        Row: {
          asin: string
          atualizado_em: string | null
          preco: number | null
          sku: string | null
          status: string | null
          titulo: string | null
        }
        Insert: {
          asin: string
          atualizado_em?: string | null
          preco?: number | null
          sku?: string | null
          status?: string | null
          titulo?: string | null
        }
        Update: {
          asin?: string
          atualizado_em?: string | null
          preco?: number | null
          sku?: string | null
          status?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      dim_amazon_reposicao: {
        Row: {
          alerta: string | null
          asin: string | null
          atualizado_em: string
          cobertura_dias: number | null
          cobertura_transito: number | null
          em_fba: boolean
          enviar_30d: number
          fba_a_caminho: number
          fba_disponivel: number
          fba_reservado: number
          fba_total: number
          media_diaria: number | null
          sku: string
          titulo: string | null
          vendas_14d: number
          vendas_21d: number
          vendas_7d: number
          vendas_d1: number
          vendas_hoje: number
        }
        Insert: {
          alerta?: string | null
          asin?: string | null
          atualizado_em?: string
          cobertura_dias?: number | null
          cobertura_transito?: number | null
          em_fba?: boolean
          enviar_30d?: number
          fba_a_caminho?: number
          fba_disponivel?: number
          fba_reservado?: number
          fba_total?: number
          media_diaria?: number | null
          sku: string
          titulo?: string | null
          vendas_14d?: number
          vendas_21d?: number
          vendas_7d?: number
          vendas_d1?: number
          vendas_hoje?: number
        }
        Update: {
          alerta?: string | null
          asin?: string | null
          atualizado_em?: string
          cobertura_dias?: number | null
          cobertura_transito?: number | null
          em_fba?: boolean
          enviar_30d?: number
          fba_a_caminho?: number
          fba_disponivel?: number
          fba_reservado?: number
          fba_total?: number
          media_diaria?: number | null
          sku?: string
          titulo?: string | null
          vendas_14d?: number
          vendas_21d?: number
          vendas_7d?: number
          vendas_d1?: number
          vendas_hoje?: number
        }
        Relationships: []
      }
      dim_cliente: {
        Row: {
          cliente_chave: string
          cliente_id: number
          criado_em: string | null
        }
        Insert: {
          cliente_chave: string
          cliente_id?: number
          criado_em?: string | null
        }
        Update: {
          cliente_chave?: string
          cliente_id?: number
          criado_em?: string | null
        }
        Relationships: []
      }
      dim_custo_sku: {
        Row: {
          atualizado_em: string
          custo_unitario: number
          observacao: string | null
          sku: string
          vigencia_inicio: string
        }
        Insert: {
          atualizado_em?: string
          custo_unitario: number
          observacao?: string | null
          sku: string
          vigencia_inicio?: string
        }
        Update: {
          atualizado_em?: string
          custo_unitario?: number
          observacao?: string | null
          sku?: string
          vigencia_inicio?: string
        }
        Relationships: []
      }
      dim_google_anuncio: {
        Row: {
          ad_descriptions: string | null
          ad_group_id: string | null
          ad_headlines: string | null
          ad_id: string
          ad_name: string | null
          ad_strength: string | null
          ad_type: string | null
          campaign_id: string | null
          carregado_em: string
          final_urls: string | null
          path1: string | null
          path2: string | null
          status: string | null
        }
        Insert: {
          ad_descriptions?: string | null
          ad_group_id?: string | null
          ad_headlines?: string | null
          ad_id: string
          ad_name?: string | null
          ad_strength?: string | null
          ad_type?: string | null
          campaign_id?: string | null
          carregado_em?: string
          final_urls?: string | null
          path1?: string | null
          path2?: string | null
          status?: string | null
        }
        Update: {
          ad_descriptions?: string | null
          ad_group_id?: string | null
          ad_headlines?: string | null
          ad_id?: string
          ad_name?: string | null
          ad_strength?: string | null
          ad_type?: string | null
          campaign_id?: string | null
          carregado_em?: string
          final_urls?: string | null
          path1?: string | null
          path2?: string | null
          status?: string | null
        }
        Relationships: []
      }
      dim_google_anuncio_asset: {
        Row: {
          ad_id: string
          asset_tipo: string
          carregado_em: string | null
          performance_label: string | null
          pinned_field: string | null
          posicao: number
          texto: string
        }
        Insert: {
          ad_id: string
          asset_tipo: string
          carregado_em?: string | null
          performance_label?: string | null
          pinned_field?: string | null
          posicao: number
          texto: string
        }
        Update: {
          ad_id?: string
          asset_tipo?: string
          carregado_em?: string | null
          performance_label?: string | null
          pinned_field?: string | null
          posicao?: number
          texto?: string
        }
        Relationships: []
      }
      dim_google_campanha: {
        Row: {
          advertising_channel_sub_type: string | null
          advertising_channel_type: string | null
          bidding_strategy_type: string | null
          budget_amount: number | null
          budget_delivery: string | null
          campaign_id: string
          campaign_name: string | null
          carregado_em: string
          end_date: string | null
          optimization_score: number | null
          start_date: string | null
          status: string | null
          target_cpa: number | null
          target_roas: number | null
        }
        Insert: {
          advertising_channel_sub_type?: string | null
          advertising_channel_type?: string | null
          bidding_strategy_type?: string | null
          budget_amount?: number | null
          budget_delivery?: string | null
          campaign_id: string
          campaign_name?: string | null
          carregado_em?: string
          end_date?: string | null
          optimization_score?: number | null
          start_date?: string | null
          status?: string | null
          target_cpa?: number | null
          target_roas?: number | null
        }
        Update: {
          advertising_channel_sub_type?: string | null
          advertising_channel_type?: string | null
          bidding_strategy_type?: string | null
          budget_amount?: number | null
          budget_delivery?: string | null
          campaign_id?: string
          campaign_name?: string | null
          carregado_em?: string
          end_date?: string | null
          optimization_score?: number | null
          start_date?: string | null
          status?: string | null
          target_cpa?: number | null
          target_roas?: number | null
        }
        Relationships: []
      }
      dim_google_grupo: {
        Row: {
          ad_group_id: string
          ad_group_name: string | null
          campaign_id: string | null
          carregado_em: string
          status: string | null
        }
        Insert: {
          ad_group_id: string
          ad_group_name?: string | null
          campaign_id?: string | null
          carregado_em?: string
          status?: string | null
        }
        Update: {
          ad_group_id?: string
          ad_group_name?: string | null
          campaign_id?: string | null
          carregado_em?: string
          status?: string | null
        }
        Relationships: []
      }
      dim_google_keyword: {
        Row: {
          ad_group_id: string
          carregado_em: string
          creative_quality_score: string | null
          expected_ctr: string | null
          keyword_text: string
          match_type: string | null
          post_click_quality_score: string | null
          quality_score: number | null
          status: string | null
        }
        Insert: {
          ad_group_id: string
          carregado_em?: string
          creative_quality_score?: string | null
          expected_ctr?: string | null
          keyword_text: string
          match_type?: string | null
          post_click_quality_score?: string | null
          quality_score?: number | null
          status?: string | null
        }
        Update: {
          ad_group_id?: string
          carregado_em?: string
          creative_quality_score?: string | null
          expected_ctr?: string | null
          keyword_text?: string
          match_type?: string | null
          post_click_quality_score?: string | null
          quality_score?: number | null
          status?: string | null
        }
        Relationships: []
      }
      dim_google_negativa: {
        Row: {
          carregado_em: string | null
          keyword_text: string
          match_type: string
          nivel: string
          owner_id: string
        }
        Insert: {
          carregado_em?: string | null
          keyword_text: string
          match_type: string
          nivel: string
          owner_id: string
        }
        Update: {
          carregado_em?: string | null
          keyword_text?: string
          match_type?: string
          nivel?: string
          owner_id?: string
        }
        Relationships: []
      }
      dim_google_pmax_asset: {
        Row: {
          asset_group_id: string
          asset_id: string
          asset_type: string | null
          carregado_em: string | null
          field_type: string
          image_url: string | null
          performance_label: string | null
          status: string | null
          texto: string | null
          youtube_video_id: string | null
        }
        Insert: {
          asset_group_id: string
          asset_id: string
          asset_type?: string | null
          carregado_em?: string | null
          field_type: string
          image_url?: string | null
          performance_label?: string | null
          status?: string | null
          texto?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          asset_group_id?: string
          asset_id?: string
          asset_type?: string | null
          carregado_em?: string | null
          field_type?: string
          image_url?: string | null
          performance_label?: string | null
          status?: string | null
          texto?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      dim_google_pmax_asset_group: {
        Row: {
          asset_group_id: string
          asset_group_name: string | null
          campaign_id: string | null
          carregado_em: string | null
          status: string | null
        }
        Insert: {
          asset_group_id: string
          asset_group_name?: string | null
          campaign_id?: string | null
          carregado_em?: string | null
          status?: string | null
        }
        Update: {
          asset_group_id?: string
          asset_group_name?: string | null
          campaign_id?: string | null
          carregado_em?: string | null
          status?: string | null
        }
        Relationships: []
      }
      dim_google_produto: {
        Row: {
          brand: string | null
          carregado_em: string
          product_channel: string | null
          product_condition: string | null
          product_item_id: string
          product_title: string | null
          product_type_l1: string | null
        }
        Insert: {
          brand?: string | null
          carregado_em?: string
          product_channel?: string | null
          product_condition?: string | null
          product_item_id: string
          product_title?: string | null
          product_type_l1?: string | null
        }
        Update: {
          brand?: string | null
          carregado_em?: string
          product_channel?: string | null
          product_condition?: string | null
          product_item_id?: string
          product_title?: string | null
          product_type_l1?: string | null
        }
        Relationships: []
      }
      dim_influenciador: {
        Row: {
          cache_fixo: number | null
          carregado_em: string | null
          categoria: string | null
          cidade: string | null
          comissao_pct: number | null
          creator_id: string
          cupom: string | null
          custo_total: number | null
          data_fim: string | null
          data_inicio: string | null
          estado: string | null
          grupo_cupom: string | null
          ig_username: string | null
          modelo_remuneracao: string | null
          nome: string
          seguidores_ig: number | null
          seguidores_tt: number | null
          status: string | null
          subsegmento: string | null
          tier: string | null
          tiktok_username: string | null
        }
        Insert: {
          cache_fixo?: number | null
          carregado_em?: string | null
          categoria?: string | null
          cidade?: string | null
          comissao_pct?: number | null
          creator_id: string
          cupom?: string | null
          custo_total?: number | null
          data_fim?: string | null
          data_inicio?: string | null
          estado?: string | null
          grupo_cupom?: string | null
          ig_username?: string | null
          modelo_remuneracao?: string | null
          nome: string
          seguidores_ig?: number | null
          seguidores_tt?: number | null
          status?: string | null
          subsegmento?: string | null
          tier?: string | null
          tiktok_username?: string | null
        }
        Update: {
          cache_fixo?: number | null
          carregado_em?: string | null
          categoria?: string | null
          cidade?: string | null
          comissao_pct?: number | null
          creator_id?: string
          cupom?: string | null
          custo_total?: number | null
          data_fim?: string | null
          data_inicio?: string | null
          estado?: string | null
          grupo_cupom?: string | null
          ig_username?: string | null
          modelo_remuneracao?: string | null
          nome?: string
          seguidores_ig?: number | null
          seguidores_tt?: number | null
          status?: string | null
          subsegmento?: string | null
          tier?: string | null
          tiktok_username?: string | null
        }
        Relationships: []
      }
      dim_meta_anuncio: {
        Row: {
          ad_id: string
          ad_name: string | null
          adset_id: string | null
          body: string | null
          campaign_id: string | null
          carregado_em: string
          conversion_rate_ranking: string | null
          creative_id: string | null
          effective_status: string | null
          engagement_rate_ranking: string | null
          estimated_ad_recall_rate: number | null
          facebook_permalink_url: string | null
          image_url: string | null
          instagram_permalink_url: string | null
          link_url: string | null
          object_type: string | null
          optimization_type: string | null
          quality_ranking: string | null
          status: string | null
          status_atualizado_em: string | null
          thumbnail_url: string | null
          title: string | null
          website_destination_url: string | null
        }
        Insert: {
          ad_id: string
          ad_name?: string | null
          adset_id?: string | null
          body?: string | null
          campaign_id?: string | null
          carregado_em?: string
          conversion_rate_ranking?: string | null
          creative_id?: string | null
          effective_status?: string | null
          engagement_rate_ranking?: string | null
          estimated_ad_recall_rate?: number | null
          facebook_permalink_url?: string | null
          image_url?: string | null
          instagram_permalink_url?: string | null
          link_url?: string | null
          object_type?: string | null
          optimization_type?: string | null
          quality_ranking?: string | null
          status?: string | null
          status_atualizado_em?: string | null
          thumbnail_url?: string | null
          title?: string | null
          website_destination_url?: string | null
        }
        Update: {
          ad_id?: string
          ad_name?: string | null
          adset_id?: string | null
          body?: string | null
          campaign_id?: string | null
          carregado_em?: string
          conversion_rate_ranking?: string | null
          creative_id?: string | null
          effective_status?: string | null
          engagement_rate_ranking?: string | null
          estimated_ad_recall_rate?: number | null
          facebook_permalink_url?: string | null
          image_url?: string | null
          instagram_permalink_url?: string | null
          link_url?: string | null
          object_type?: string | null
          optimization_type?: string | null
          quality_ranking?: string | null
          status?: string | null
          status_atualizado_em?: string | null
          thumbnail_url?: string | null
          title?: string | null
          website_destination_url?: string | null
        }
        Relationships: []
      }
      dim_meta_campanha: {
        Row: {
          bid_strategy: string | null
          budget_remaining: number | null
          buying_type: string | null
          campaign_id: string
          campaign_name: string | null
          carregado_em: string
          configured_status: string | null
          created_time: string | null
          daily_budget: number | null
          effective_status: string | null
          lifetime_budget: number | null
          objetivo: string | null
          special_ad_category: string | null
          spend_cap: number | null
          start_time: string | null
          stop_time: string | null
        }
        Insert: {
          bid_strategy?: string | null
          budget_remaining?: number | null
          buying_type?: string | null
          campaign_id: string
          campaign_name?: string | null
          carregado_em?: string
          configured_status?: string | null
          created_time?: string | null
          daily_budget?: number | null
          effective_status?: string | null
          lifetime_budget?: number | null
          objetivo?: string | null
          special_ad_category?: string | null
          spend_cap?: number | null
          start_time?: string | null
          stop_time?: string | null
        }
        Update: {
          bid_strategy?: string | null
          budget_remaining?: number | null
          buying_type?: string | null
          campaign_id?: string
          campaign_name?: string | null
          carregado_em?: string
          configured_status?: string | null
          created_time?: string | null
          daily_budget?: number | null
          effective_status?: string | null
          lifetime_budget?: number | null
          objetivo?: string | null
          special_ad_category?: string | null
          spend_cap?: number | null
          start_time?: string | null
          stop_time?: string | null
        }
        Relationships: []
      }
      dim_meta_conjunto: {
        Row: {
          adset_id: string
          adset_name: string | null
          bid_amount: number | null
          bid_strategy: string | null
          budget_remaining: number | null
          campaign_id: string | null
          carregado_em: string
          created_time: string | null
          daily_budget: number | null
          destination_type: string | null
          effective_status: string | null
          end_time: string | null
          lifetime_budget: number | null
          optimization_goal: string | null
          start_time: string | null
          status: string | null
          updated_time: string | null
        }
        Insert: {
          adset_id: string
          adset_name?: string | null
          bid_amount?: number | null
          bid_strategy?: string | null
          budget_remaining?: number | null
          campaign_id?: string | null
          carregado_em?: string
          created_time?: string | null
          daily_budget?: number | null
          destination_type?: string | null
          effective_status?: string | null
          end_time?: string | null
          lifetime_budget?: number | null
          optimization_goal?: string | null
          start_time?: string | null
          status?: string | null
          updated_time?: string | null
        }
        Update: {
          adset_id?: string
          adset_name?: string | null
          bid_amount?: number | null
          bid_strategy?: string | null
          budget_remaining?: number | null
          campaign_id?: string | null
          carregado_em?: string
          created_time?: string | null
          daily_budget?: number | null
          destination_type?: string | null
          effective_status?: string | null
          end_time?: string | null
          lifetime_budget?: number | null
          optimization_goal?: string | null
          start_time?: string | null
          status?: string | null
          updated_time?: string | null
        }
        Relationships: []
      }
      dim_ml_concorrente: {
        Row: {
          acompanhado: boolean
          alias: string
          atualizado_em: string
          col_planilha: string | null
          nome: string
          observacao: string | null
          tipo: string
        }
        Insert: {
          acompanhado?: boolean
          alias: string
          atualizado_em?: string
          col_planilha?: string | null
          nome: string
          observacao?: string | null
          tipo?: string
        }
        Update: {
          acompanhado?: boolean
          alias?: string
          atualizado_em?: string
          col_planilha?: string | null
          nome?: string
          observacao?: string | null
          tipo?: string
        }
        Relationships: []
      }
      dim_ml_estoque_full: {
        Row: {
          atualizado_em: string
          atualizado_vendas: string | null
          disponivel: number | null
          em_transferencia: number | null
          indisponivel: number | null
          indisponivel_detalhe: Json | null
          inventory_id: string
          item_id: string | null
          qty_anuncio: number | null
          seller_sku: string | null
          title: string | null
          total: number | null
          vendas_14d: number
          vendas_21d: number
          vendas_7d: number
          vendas_d1: number
          vendas_hoje: number
        }
        Insert: {
          atualizado_em?: string
          atualizado_vendas?: string | null
          disponivel?: number | null
          em_transferencia?: number | null
          indisponivel?: number | null
          indisponivel_detalhe?: Json | null
          inventory_id: string
          item_id?: string | null
          qty_anuncio?: number | null
          seller_sku?: string | null
          title?: string | null
          total?: number | null
          vendas_14d?: number
          vendas_21d?: number
          vendas_7d?: number
          vendas_d1?: number
          vendas_hoje?: number
        }
        Update: {
          atualizado_em?: string
          atualizado_vendas?: string | null
          disponivel?: number | null
          em_transferencia?: number | null
          indisponivel?: number | null
          indisponivel_detalhe?: Json | null
          inventory_id?: string
          item_id?: string | null
          qty_anuncio?: number | null
          seller_sku?: string | null
          title?: string | null
          total?: number | null
          vendas_14d?: number
          vendas_21d?: number
          vendas_7d?: number
          vendas_d1?: number
          vendas_hoje?: number
        }
        Relationships: []
      }
      dim_ml_produto: {
        Row: {
          alerta: string | null
          atualizado_em: string
          cobertura_dias: number | null
          cobertura_transito: number | null
          em_full: boolean
          enviar_30d: number | null
          full_disponivel: number
          full_em_transferencia: number
          full_total: number
          media_diaria: number | null
          seller_sku: string
          title: string | null
          vendas_14d: number
          vendas_21d: number
          vendas_7d: number
          vendas_d1: number
          vendas_hoje: number
        }
        Insert: {
          alerta?: string | null
          atualizado_em?: string
          cobertura_dias?: number | null
          cobertura_transito?: number | null
          em_full?: boolean
          enviar_30d?: number | null
          full_disponivel?: number
          full_em_transferencia?: number
          full_total?: number
          media_diaria?: number | null
          seller_sku: string
          title?: string | null
          vendas_14d?: number
          vendas_21d?: number
          vendas_7d?: number
          vendas_d1?: number
          vendas_hoje?: number
        }
        Update: {
          alerta?: string | null
          atualizado_em?: string
          cobertura_dias?: number | null
          cobertura_transito?: number | null
          em_full?: boolean
          enviar_30d?: number | null
          full_disponivel?: number
          full_em_transferencia?: number
          full_total?: number
          media_diaria?: number | null
          seller_sku?: string
          title?: string | null
          vendas_14d?: number
          vendas_21d?: number
          vendas_7d?: number
          vendas_d1?: number
          vendas_hoje?: number
        }
        Relationships: []
      }
      dim_param_canal: {
        Row: {
          atualizado_em: string
          canal: string
          frete_estimado_pct: number | null
          frete_flex_fixo: number | null
          imposto_pct: number
          observacao: string | null
          receita_gross_up: number
          taxa_mkt_estimada_pct: number | null
        }
        Insert: {
          atualizado_em?: string
          canal: string
          frete_estimado_pct?: number | null
          frete_flex_fixo?: number | null
          imposto_pct?: number
          observacao?: string | null
          receita_gross_up?: number
          taxa_mkt_estimada_pct?: number | null
        }
        Update: {
          atualizado_em?: string
          canal?: string
          frete_estimado_pct?: number | null
          frete_flex_fixo?: number | null
          imposto_pct?: number
          observacao?: string | null
          receita_gross_up?: number
          taxa_mkt_estimada_pct?: number | null
        }
        Relationships: []
      }
      dim_shopee_ads_campanha: {
        Row: {
          ad_name: string | null
          ad_type: string | null
          atualizado_em: string
          bidding_method: string | null
          campaign_budget: number | null
          campaign_id: number
          campaign_placement: string | null
          campaign_status: string | null
          fim: string | null
          inicio: string | null
          item_id_list: string[] | null
          itens: number | null
          roas_target: number | null
        }
        Insert: {
          ad_name?: string | null
          ad_type?: string | null
          atualizado_em?: string
          bidding_method?: string | null
          campaign_budget?: number | null
          campaign_id: number
          campaign_placement?: string | null
          campaign_status?: string | null
          fim?: string | null
          inicio?: string | null
          item_id_list?: string[] | null
          itens?: number | null
          roas_target?: number | null
        }
        Update: {
          ad_name?: string | null
          ad_type?: string | null
          atualizado_em?: string
          bidding_method?: string | null
          campaign_budget?: number | null
          campaign_id?: number
          campaign_placement?: string | null
          campaign_status?: string | null
          fim?: string | null
          inicio?: string | null
          item_id_list?: string[] | null
          itens?: number | null
          roas_target?: number | null
        }
        Relationships: []
      }
      dim_shopee_estoque: {
        Row: {
          atualizado_em: string
          estoque_normal: number | null
          estoque_reservado: number | null
          estoque_total: number | null
          item_id: string
          item_sku: string | null
          model_id: string
          model_name: string | null
          model_sku: string | null
          preco_atual: number | null
          preco_original: number | null
        }
        Insert: {
          atualizado_em?: string
          estoque_normal?: number | null
          estoque_reservado?: number | null
          estoque_total?: number | null
          item_id: string
          item_sku?: string | null
          model_id: string
          model_name?: string | null
          model_sku?: string | null
          preco_atual?: number | null
          preco_original?: number | null
        }
        Update: {
          atualizado_em?: string
          estoque_normal?: number | null
          estoque_reservado?: number | null
          estoque_total?: number | null
          item_id?: string
          item_sku?: string | null
          model_id?: string
          model_name?: string | null
          model_sku?: string | null
          preco_atual?: number | null
          preco_original?: number | null
        }
        Relationships: []
      }
      dim_shopee_produto: {
        Row: {
          atualizado_fonte: string | null
          carregado_em: string
          categoria: string | null
          categoria_id: string | null
          condicao: string | null
          criado_fonte: string | null
          descricao_len: number | null
          estoque_total: number | null
          fotos: number | null
          item_id: string
          item_sku: string | null
          likes: number | null
          marca: string | null
          nome: string | null
          peso: number | null
          preco_max: number | null
          preco_min: number | null
          rating: number | null
          raw: Json | null
          status: string | null
          tem_dimensoes: boolean | null
          variacoes: number | null
          views: number | null
        }
        Insert: {
          atualizado_fonte?: string | null
          carregado_em?: string
          categoria?: string | null
          categoria_id?: string | null
          condicao?: string | null
          criado_fonte?: string | null
          descricao_len?: number | null
          estoque_total?: number | null
          fotos?: number | null
          item_id: string
          item_sku?: string | null
          likes?: number | null
          marca?: string | null
          nome?: string | null
          peso?: number | null
          preco_max?: number | null
          preco_min?: number | null
          rating?: number | null
          raw?: Json | null
          status?: string | null
          tem_dimensoes?: boolean | null
          variacoes?: number | null
          views?: number | null
        }
        Update: {
          atualizado_fonte?: string | null
          carregado_em?: string
          categoria?: string | null
          categoria_id?: string | null
          condicao?: string | null
          criado_fonte?: string | null
          descricao_len?: number | null
          estoque_total?: number | null
          fotos?: number | null
          item_id?: string
          item_sku?: string | null
          likes?: number | null
          marca?: string | null
          nome?: string | null
          peso?: number | null
          preco_max?: number | null
          preco_min?: number | null
          rating?: number | null
          raw?: Json | null
          status?: string | null
          tem_dimensoes?: boolean | null
          variacoes?: number | null
          views?: number | null
        }
        Relationships: []
      }
      dim_shopify_produto: {
        Row: {
          alerta: string | null
          atualizado_em: string
          cobertura_dias: number | null
          estoque: number
          media_diaria: number | null
          placeholder: boolean
          repor_30d: number
          sku: string
          status: string | null
          title: string | null
          vendas_14d: number
          vendas_21d: number
          vendas_7d: number
          vendas_d1: number
          vendas_hoje: number
          vendor: string | null
        }
        Insert: {
          alerta?: string | null
          atualizado_em?: string
          cobertura_dias?: number | null
          estoque?: number
          media_diaria?: number | null
          placeholder?: boolean
          repor_30d?: number
          sku: string
          status?: string | null
          title?: string | null
          vendas_14d?: number
          vendas_21d?: number
          vendas_7d?: number
          vendas_d1?: number
          vendas_hoje?: number
          vendor?: string | null
        }
        Update: {
          alerta?: string | null
          atualizado_em?: string
          cobertura_dias?: number | null
          estoque?: number
          media_diaria?: number | null
          placeholder?: boolean
          repor_30d?: number
          sku?: string
          status?: string | null
          title?: string | null
          vendas_14d?: number
          vendas_21d?: number
          vendas_7d?: number
          vendas_d1?: number
          vendas_hoje?: number
          vendor?: string | null
        }
        Relationships: []
      }
      dim_site_produto_pagina: {
        Row: {
          ativo: boolean
          lp_prefixo: string
          ordem: number
          pdp_handle: string
          produto: string
        }
        Insert: {
          ativo?: boolean
          lp_prefixo: string
          ordem?: number
          pdp_handle: string
          produto: string
        }
        Update: {
          ativo?: boolean
          lp_prefixo?: string
          ordem?: number
          pdp_handle?: string
          produto?: string
        }
        Relationships: []
      }
      dim_tiktok_estoque: {
        Row: {
          atualizado_em: string | null
          preco: number | null
          product_id: string
          quantidade: number | null
          seller_sku: string | null
          sku_id: string
          titulo: string | null
          warehouse_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          preco?: number | null
          product_id: string
          quantidade?: number | null
          seller_sku?: string | null
          sku_id: string
          titulo?: string | null
          warehouse_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          preco?: number | null
          product_id?: string
          quantidade?: number | null
          seller_sku?: string | null
          sku_id?: string
          titulo?: string | null
          warehouse_id?: string | null
        }
        Relationships: []
      }
      dim_tiktok_produto: {
        Row: {
          atributos: number | null
          atualizado_fonte: string | null
          carregado_em: string | null
          categoria: string | null
          categoria_id: string | null
          certificacoes: number | null
          criado_em: string | null
          descricao_len: number | null
          estoque_total: number | null
          faltas: string | null
          fotos: number | null
          health: number | null
          is_cod: boolean | null
          marca: string | null
          nao_a_venda: boolean | null
          preco_max: number | null
          preco_min: number | null
          product_id: string
          product_status: string | null
          raw: Json | null
          seller_skus: string | null
          skus: number | null
          skus_sem_estoque: number | null
          status: string | null
          tem_dimensoes: boolean | null
          tem_peso: boolean | null
          titulo: string | null
        }
        Insert: {
          atributos?: number | null
          atualizado_fonte?: string | null
          carregado_em?: string | null
          categoria?: string | null
          categoria_id?: string | null
          certificacoes?: number | null
          criado_em?: string | null
          descricao_len?: number | null
          estoque_total?: number | null
          faltas?: string | null
          fotos?: number | null
          health?: number | null
          is_cod?: boolean | null
          marca?: string | null
          nao_a_venda?: boolean | null
          preco_max?: number | null
          preco_min?: number | null
          product_id: string
          product_status?: string | null
          raw?: Json | null
          seller_skus?: string | null
          skus?: number | null
          skus_sem_estoque?: number | null
          status?: string | null
          tem_dimensoes?: boolean | null
          tem_peso?: boolean | null
          titulo?: string | null
        }
        Update: {
          atributos?: number | null
          atualizado_fonte?: string | null
          carregado_em?: string | null
          categoria?: string | null
          categoria_id?: string | null
          certificacoes?: number | null
          criado_em?: string | null
          descricao_len?: number | null
          estoque_total?: number | null
          faltas?: string | null
          fotos?: number | null
          health?: number | null
          is_cod?: boolean | null
          marca?: string | null
          nao_a_venda?: boolean | null
          preco_max?: number | null
          preco_min?: number | null
          product_id?: string
          product_status?: string | null
          raw?: Json | null
          seller_skus?: string | null
          skus?: number | null
          skus_sem_estoque?: number | null
          status?: string | null
          tem_dimensoes?: boolean | null
          tem_peso?: boolean | null
          titulo?: string | null
        }
        Relationships: []
      }
      eventos_conversao_enviados: {
        Row: {
          enviado_em: string
          event_id: string
          id: string
          moeda: string | null
          nome_evento: string
          order_id: string
          plataforma: string
          resposta_api: Json | null
          status_envio: string
          valor: number | null
        }
        Insert: {
          enviado_em?: string
          event_id: string
          id?: string
          moeda?: string | null
          nome_evento: string
          order_id: string
          plataforma: string
          resposta_api?: Json | null
          status_envio: string
          valor?: number | null
        }
        Update: {
          enviado_em?: string
          event_id?: string
          id?: string
          moeda?: string | null
          nome_evento?: string
          order_id?: string
          plataforma?: string
          resposta_api?: Json | null
          status_envio?: string
          valor?: number | null
        }
        Relationships: []
      }
      fact_amazon_ads_campanha_dia: {
        Row: {
          acos: number | null
          ad_type: string
          atualizado_em: string | null
          campaign_id: string
          campaign_name: string | null
          clicks: number | null
          conversions_14d: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          data: string
          fonte: string | null
          impressions: number | null
          purchases_14d: number | null
          purchases_1d: number | null
          purchases_30d: number | null
          purchases_7d: number | null
          roas: number | null
          sales_14d: number | null
          sales_1d: number | null
          sales_30d: number | null
          sales_7d: number | null
          top_search_is: number | null
          units_14d: number | null
          units_1d: number | null
          units_30d: number | null
          units_7d: number | null
        }
        Insert: {
          acos?: number | null
          ad_type: string
          atualizado_em?: string | null
          campaign_id: string
          campaign_name?: string | null
          clicks?: number | null
          conversions_14d?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data: string
          fonte?: string | null
          impressions?: number | null
          purchases_14d?: number | null
          purchases_1d?: number | null
          purchases_30d?: number | null
          purchases_7d?: number | null
          roas?: number | null
          sales_14d?: number | null
          sales_1d?: number | null
          sales_30d?: number | null
          sales_7d?: number | null
          top_search_is?: number | null
          units_14d?: number | null
          units_1d?: number | null
          units_30d?: number | null
          units_7d?: number | null
        }
        Update: {
          acos?: number | null
          ad_type?: string
          atualizado_em?: string | null
          campaign_id?: string
          campaign_name?: string | null
          clicks?: number | null
          conversions_14d?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string
          fonte?: string | null
          impressions?: number | null
          purchases_14d?: number | null
          purchases_1d?: number | null
          purchases_30d?: number | null
          purchases_7d?: number | null
          roas?: number | null
          sales_14d?: number | null
          sales_1d?: number | null
          sales_30d?: number | null
          sales_7d?: number | null
          top_search_is?: number | null
          units_14d?: number | null
          units_1d?: number | null
          units_30d?: number | null
          units_7d?: number | null
        }
        Relationships: []
      }
      fact_amazon_ads_keyword_dia: {
        Row: {
          acos: number | null
          ad_type: string
          atualizado_em: string | null
          campaign_id: string | null
          campaign_name: string
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          data: string
          fonte: string | null
          impressions: number | null
          keyword: string
          match_type: string
          purchases_14d: number | null
          purchases_1d: number | null
          purchases_30d: number | null
          purchases_7d: number | null
          roas: number | null
          sales_14d: number | null
          sales_1d: number | null
          sales_30d: number | null
          sales_7d: number | null
          top_search_is: number | null
          units_14d: number | null
          units_1d: number | null
          units_30d: number | null
          units_7d: number | null
        }
        Insert: {
          acos?: number | null
          ad_type: string
          atualizado_em?: string | null
          campaign_id?: string | null
          campaign_name: string
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data: string
          fonte?: string | null
          impressions?: number | null
          keyword: string
          match_type: string
          purchases_14d?: number | null
          purchases_1d?: number | null
          purchases_30d?: number | null
          purchases_7d?: number | null
          roas?: number | null
          sales_14d?: number | null
          sales_1d?: number | null
          sales_30d?: number | null
          sales_7d?: number | null
          top_search_is?: number | null
          units_14d?: number | null
          units_1d?: number | null
          units_30d?: number | null
          units_7d?: number | null
        }
        Update: {
          acos?: number | null
          ad_type?: string
          atualizado_em?: string | null
          campaign_id?: string | null
          campaign_name?: string
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string
          fonte?: string | null
          impressions?: number | null
          keyword?: string
          match_type?: string
          purchases_14d?: number | null
          purchases_1d?: number | null
          purchases_30d?: number | null
          purchases_7d?: number | null
          roas?: number | null
          sales_14d?: number | null
          sales_1d?: number | null
          sales_30d?: number | null
          sales_7d?: number | null
          top_search_is?: number | null
          units_14d?: number | null
          units_1d?: number | null
          units_30d?: number | null
          units_7d?: number | null
        }
        Relationships: []
      }
      fact_amazon_ads_produto_dia: {
        Row: {
          acos: number | null
          ad_type: string
          asin: string
          atualizado_em: string | null
          campaign_id: string | null
          campaign_name: string
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          data: string
          impressions: number | null
          purchases_14d: number | null
          roas: number | null
          sales_14d: number | null
          sku: string | null
          units_14d: number | null
        }
        Insert: {
          acos?: number | null
          ad_type: string
          asin: string
          atualizado_em?: string | null
          campaign_id?: string | null
          campaign_name: string
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data: string
          impressions?: number | null
          purchases_14d?: number | null
          roas?: number | null
          sales_14d?: number | null
          sku?: string | null
          units_14d?: number | null
        }
        Update: {
          acos?: number | null
          ad_type?: string
          asin?: string
          atualizado_em?: string | null
          campaign_id?: string | null
          campaign_name?: string
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string
          impressions?: number | null
          purchases_14d?: number | null
          roas?: number | null
          sales_14d?: number | null
          sku?: string | null
          units_14d?: number | null
        }
        Relationships: []
      }
      fact_amazon_ads_sb_campanha_dia: {
        Row: {
          acos: number | null
          atualizado_em: string | null
          branded_searches: number | null
          campaign_id: string
          campaign_name: string | null
          campaign_status: string | null
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          data: string
          detail_page_views: number | null
          impressions: number | null
          ntb_purchases: number | null
          ntb_sales: number | null
          ntb_units: number | null
          purchases: number | null
          purchases_promoted: number | null
          roas: number | null
          sales: number | null
          sales_promoted: number | null
          units_sold: number | null
          vctr: number | null
          video_5s_views: number | null
          video_complete_views: number | null
          video_first_quartile: number | null
          video_midpoint: number | null
          video_third_quartile: number | null
        }
        Insert: {
          acos?: number | null
          atualizado_em?: string | null
          branded_searches?: number | null
          campaign_id: string
          campaign_name?: string | null
          campaign_status?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data: string
          detail_page_views?: number | null
          impressions?: number | null
          ntb_purchases?: number | null
          ntb_sales?: number | null
          ntb_units?: number | null
          purchases?: number | null
          purchases_promoted?: number | null
          roas?: number | null
          sales?: number | null
          sales_promoted?: number | null
          units_sold?: number | null
          vctr?: number | null
          video_5s_views?: number | null
          video_complete_views?: number | null
          video_first_quartile?: number | null
          video_midpoint?: number | null
          video_third_quartile?: number | null
        }
        Update: {
          acos?: number | null
          atualizado_em?: string | null
          branded_searches?: number | null
          campaign_id?: string
          campaign_name?: string | null
          campaign_status?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string
          detail_page_views?: number | null
          impressions?: number | null
          ntb_purchases?: number | null
          ntb_sales?: number | null
          ntb_units?: number | null
          purchases?: number | null
          purchases_promoted?: number | null
          roas?: number | null
          sales?: number | null
          sales_promoted?: number | null
          units_sold?: number | null
          vctr?: number | null
          video_5s_views?: number | null
          video_complete_views?: number | null
          video_first_quartile?: number | null
          video_midpoint?: number | null
          video_third_quartile?: number | null
        }
        Relationships: []
      }
      fact_amazon_ads_sb_search_term_dia: {
        Row: {
          acos: number | null
          atualizado_em: string | null
          campaign_name: string
          clicks: number | null
          cost: number | null
          data: string
          impressions: number | null
          keyword: string
          match_type: string
          purchases: number | null
          roas: number | null
          sales: number | null
          search_term: string
        }
        Insert: {
          acos?: number | null
          atualizado_em?: string | null
          campaign_name: string
          clicks?: number | null
          cost?: number | null
          data: string
          impressions?: number | null
          keyword: string
          match_type: string
          purchases?: number | null
          roas?: number | null
          sales?: number | null
          search_term: string
        }
        Update: {
          acos?: number | null
          atualizado_em?: string | null
          campaign_name?: string
          clicks?: number | null
          cost?: number | null
          data?: string
          impressions?: number | null
          keyword?: string
          match_type?: string
          purchases?: number | null
          roas?: number | null
          sales?: number | null
          search_term?: string
        }
        Relationships: []
      }
      fact_amazon_ads_sb_target_dia: {
        Row: {
          acos: number | null
          atualizado_em: string | null
          campaign_id: string
          campaign_name: string | null
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          data: string
          impressions: number | null
          keyword: string
          match_type: string
          ntb_purchases: number | null
          ntb_sales: number | null
          purchases: number | null
          roas: number | null
          sales: number | null
          units_sold: number | null
        }
        Insert: {
          acos?: number | null
          atualizado_em?: string | null
          campaign_id: string
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data: string
          impressions?: number | null
          keyword: string
          match_type: string
          ntb_purchases?: number | null
          ntb_sales?: number | null
          purchases?: number | null
          roas?: number | null
          sales?: number | null
          units_sold?: number | null
        }
        Update: {
          acos?: number | null
          atualizado_em?: string | null
          campaign_id?: string
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string
          impressions?: number | null
          keyword?: string
          match_type?: string
          ntb_purchases?: number | null
          ntb_sales?: number | null
          purchases?: number | null
          roas?: number | null
          sales?: number | null
          units_sold?: number | null
        }
        Relationships: []
      }
      fact_amazon_ads_sd_campanha_dia: {
        Row: {
          acos: number | null
          add_to_cart_views: number | null
          atualizado_em: string | null
          campaign_id: string
          campaign_name: string | null
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          data: string
          detail_page_views: number | null
          impressions: number | null
          ntb_purchases_clicks: number | null
          ntb_sales_clicks: number | null
          purchases: number | null
          purchases_clicks: number | null
          roas: number | null
          sales: number | null
          units_sold: number | null
          vctr: number | null
          viewability_rate: number | null
        }
        Insert: {
          acos?: number | null
          add_to_cart_views?: number | null
          atualizado_em?: string | null
          campaign_id: string
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data: string
          detail_page_views?: number | null
          impressions?: number | null
          ntb_purchases_clicks?: number | null
          ntb_sales_clicks?: number | null
          purchases?: number | null
          purchases_clicks?: number | null
          roas?: number | null
          sales?: number | null
          units_sold?: number | null
          vctr?: number | null
          viewability_rate?: number | null
        }
        Update: {
          acos?: number | null
          add_to_cart_views?: number | null
          atualizado_em?: string | null
          campaign_id?: string
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string
          detail_page_views?: number | null
          impressions?: number | null
          ntb_purchases_clicks?: number | null
          ntb_sales_clicks?: number | null
          purchases?: number | null
          purchases_clicks?: number | null
          roas?: number | null
          sales?: number | null
          units_sold?: number | null
          vctr?: number | null
          viewability_rate?: number | null
        }
        Relationships: []
      }
      fact_amazon_ads_sd_produto_dia: {
        Row: {
          acos: number | null
          asin: string
          atualizado_em: string | null
          campaign_id: string
          campaign_name: string | null
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          data: string
          impressions: number | null
          purchases: number | null
          roas: number | null
          sales: number | null
          sku: string | null
        }
        Insert: {
          acos?: number | null
          asin: string
          atualizado_em?: string | null
          campaign_id: string
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data: string
          impressions?: number | null
          purchases?: number | null
          roas?: number | null
          sales?: number | null
          sku?: string | null
        }
        Update: {
          acos?: number | null
          asin?: string
          atualizado_em?: string | null
          campaign_id?: string
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string
          impressions?: number | null
          purchases?: number | null
          roas?: number | null
          sales?: number | null
          sku?: string | null
        }
        Relationships: []
      }
      fact_amazon_ads_sd_target_dia: {
        Row: {
          acos: number | null
          atualizado_em: string | null
          campaign_id: string
          campaign_name: string | null
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          data: string
          impressions: number | null
          purchases: number | null
          purchases_clicks: number | null
          roas: number | null
          sales: number | null
          targeting: string
          targeting_text: string | null
        }
        Insert: {
          acos?: number | null
          atualizado_em?: string | null
          campaign_id: string
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data: string
          impressions?: number | null
          purchases?: number | null
          purchases_clicks?: number | null
          roas?: number | null
          sales?: number | null
          targeting: string
          targeting_text?: string | null
        }
        Update: {
          acos?: number | null
          atualizado_em?: string | null
          campaign_id?: string
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string
          impressions?: number | null
          purchases?: number | null
          purchases_clicks?: number | null
          roas?: number | null
          sales?: number | null
          targeting?: string
          targeting_text?: string | null
        }
        Relationships: []
      }
      fact_amazon_ads_search_term_dia: {
        Row: {
          acos: number | null
          atualizado_em: string | null
          campaign_name: string
          clicks: number | null
          cost: number | null
          data: string
          impressions: number | null
          keyword_text: string
          match_type: string
          purchases_14d: number | null
          roas: number | null
          sales_14d: number | null
          search_term: string
        }
        Insert: {
          acos?: number | null
          atualizado_em?: string | null
          campaign_name?: string
          clicks?: number | null
          cost?: number | null
          data: string
          impressions?: number | null
          keyword_text?: string
          match_type?: string
          purchases_14d?: number | null
          roas?: number | null
          sales_14d?: number | null
          search_term: string
        }
        Update: {
          acos?: number | null
          atualizado_em?: string | null
          campaign_name?: string
          clicks?: number | null
          cost?: number | null
          data?: string
          impressions?: number | null
          keyword_text?: string
          match_type?: string
          purchases_14d?: number | null
          roas?: number | null
          sales_14d?: number | null
          search_term?: string
        }
        Relationships: []
      }
      fact_amazon_brand_search_term: {
        Row: {
          asin: string
          atualizado_em: string
          click_share: number | null
          conversion_share: number | null
          nosso: boolean
          posicao: number | null
          produto: string | null
          rank_busca: number | null
          semana_fim: string
          semana_ini: string
          termo: string
        }
        Insert: {
          asin: string
          atualizado_em?: string
          click_share?: number | null
          conversion_share?: number | null
          nosso?: boolean
          posicao?: number | null
          produto?: string | null
          rank_busca?: number | null
          semana_fim: string
          semana_ini: string
          termo: string
        }
        Update: {
          asin?: string
          atualizado_em?: string
          click_share?: number | null
          conversion_share?: number | null
          nosso?: boolean
          posicao?: number | null
          produto?: string | null
          rank_busca?: number | null
          semana_fim?: string
          semana_ini?: string
          termo?: string
        }
        Relationships: []
      }
      fact_amazon_pedido: {
        Row: {
          amazon_order_id: string
          asin: string | null
          atualizado_em: string | null
          fulfillment_channel: string | null
          item_price: number | null
          last_updated_date: string | null
          order_status: string | null
          payment_method_details: string[] | null
          purchase_date: string | null
          purchase_dia: string | null
          quantity: number | null
          ship_city: string | null
          ship_postal_code: string | null
          ship_state: string | null
          sku: string
        }
        Insert: {
          amazon_order_id: string
          asin?: string | null
          atualizado_em?: string | null
          fulfillment_channel?: string | null
          item_price?: number | null
          last_updated_date?: string | null
          order_status?: string | null
          payment_method_details?: string[] | null
          purchase_date?: string | null
          purchase_dia?: string | null
          quantity?: number | null
          ship_city?: string | null
          ship_postal_code?: string | null
          ship_state?: string | null
          sku: string
        }
        Update: {
          amazon_order_id?: string
          asin?: string | null
          atualizado_em?: string | null
          fulfillment_channel?: string | null
          item_price?: number | null
          last_updated_date?: string | null
          order_status?: string | null
          payment_method_details?: string[] | null
          purchase_date?: string | null
          purchase_dia?: string | null
          quantity?: number | null
          ship_city?: string | null
          ship_postal_code?: string | null
          ship_state?: string | null
          sku?: string
        }
        Relationships: []
      }
      fact_amazon_recompra_asin: {
        Row: {
          asin: string
          atualizado_em: string
          clientes_unicos: number | null
          mes_fim: string
          mes_ini: string
          pct_clientes_repetem: number | null
          pct_receita_recompra: number | null
          pedidos: number | null
          receita_recompra: number | null
        }
        Insert: {
          asin: string
          atualizado_em?: string
          clientes_unicos?: number | null
          mes_fim: string
          mes_ini: string
          pct_clientes_repetem?: number | null
          pct_receita_recompra?: number | null
          pedidos?: number | null
          receita_recompra?: number | null
        }
        Update: {
          asin?: string
          atualizado_em?: string
          clientes_unicos?: number | null
          mes_fim?: string
          mes_ini?: string
          pct_clientes_repetem?: number | null
          pct_receita_recompra?: number | null
          pedidos?: number | null
          receita_recompra?: number | null
        }
        Relationships: []
      }
      fact_amazon_venda_asin_dia: {
        Row: {
          buybox_pct: number | null
          child_asin: string
          data: string
          em_consolidacao: boolean | null
          pageviews: number | null
          parent_asin: string | null
          pedidos_itens: number | null
          preco_medio: number | null
          sessoes: number | null
          taxa_conversao: number | null
          unidades: number | null
          vendas: number | null
        }
        Insert: {
          buybox_pct?: number | null
          child_asin: string
          data: string
          em_consolidacao?: boolean | null
          pageviews?: number | null
          parent_asin?: string | null
          pedidos_itens?: number | null
          preco_medio?: number | null
          sessoes?: number | null
          taxa_conversao?: number | null
          unidades?: number | null
          vendas?: number | null
        }
        Update: {
          buybox_pct?: number | null
          child_asin?: string
          data?: string
          em_consolidacao?: boolean | null
          pageviews?: number | null
          parent_asin?: string | null
          pedidos_itens?: number | null
          preco_medio?: number | null
          sessoes?: number | null
          taxa_conversao?: number | null
          unidades?: number | null
          vendas?: number | null
        }
        Relationships: []
      }
      fact_amazon_venda_hora: {
        Row: {
          atualizado_em: string | null
          data: string
          hora: number
          hora_inicio: string
          itens: number | null
          pedidos: number | null
          preco_medio: number | null
          unidades: number | null
          venda: number | null
        }
        Insert: {
          atualizado_em?: string | null
          data: string
          hora: number
          hora_inicio: string
          itens?: number | null
          pedidos?: number | null
          preco_medio?: number | null
          unidades?: number | null
          venda?: number | null
        }
        Update: {
          atualizado_em?: string | null
          data?: string
          hora?: number
          hora_inicio?: string
          itens?: number | null
          pedidos?: number | null
          preco_medio?: number | null
          unidades?: number | null
          venda?: number | null
        }
        Relationships: []
      }
      fact_amazon_venda_trafego_dia: {
        Row: {
          atualizado_em: string | null
          buybox_pct: number | null
          data: string
          em_consolidacao: boolean | null
          pageviews: number | null
          pedidos_enviados: number | null
          pedidos_itens: number | null
          preco_medio: number | null
          sessoes: number | null
          taxa_conversao: number | null
          taxa_devolucao: number | null
          unidades: number | null
          unidades_devolvidas: number | null
          vendas: number | null
        }
        Insert: {
          atualizado_em?: string | null
          buybox_pct?: number | null
          data: string
          em_consolidacao?: boolean | null
          pageviews?: number | null
          pedidos_enviados?: number | null
          pedidos_itens?: number | null
          preco_medio?: number | null
          sessoes?: number | null
          taxa_conversao?: number | null
          taxa_devolucao?: number | null
          unidades?: number | null
          unidades_devolvidas?: number | null
          vendas?: number | null
        }
        Update: {
          atualizado_em?: string | null
          buybox_pct?: number | null
          data?: string
          em_consolidacao?: boolean | null
          pageviews?: number | null
          pedidos_enviados?: number | null
          pedidos_itens?: number | null
          preco_medio?: number | null
          sessoes?: number | null
          taxa_conversao?: number | null
          taxa_devolucao?: number | null
          unidades?: number | null
          unidades_devolvidas?: number | null
          vendas?: number | null
        }
        Relationships: []
      }
      fact_pedido_cliente: {
        Row: {
          atualizado_em: string | null
          bairro: string | null
          canal: string
          cep: string | null
          cidade: string | null
          cliente_chave: string | null
          cnpj: string | null
          complemento: string | null
          cpf: string | null
          data: string | null
          data_hora: string | null
          desconto: number | null
          doc_hash: string | null
          email: string | null
          email_hash: string | null
          frete: number | null
          itens: number | null
          logradouro: string | null
          nome: string | null
          numero: string | null
          pagamento_metodo: string | null
          pais: string | null
          parcelas: number | null
          pedido_grupo_id: string | null
          pedido_id: string
          sobrenome: string | null
          status: string | null
          status_detalhe: string | null
          telefone: string | null
          uf: string | null
          valor: number | null
          valor_bruto: number | null
        }
        Insert: {
          atualizado_em?: string | null
          bairro?: string | null
          canal: string
          cep?: string | null
          cidade?: string | null
          cliente_chave?: string | null
          cnpj?: string | null
          complemento?: string | null
          cpf?: string | null
          data?: string | null
          data_hora?: string | null
          desconto?: number | null
          doc_hash?: string | null
          email?: string | null
          email_hash?: string | null
          frete?: number | null
          itens?: number | null
          logradouro?: string | null
          nome?: string | null
          numero?: string | null
          pagamento_metodo?: string | null
          pais?: string | null
          parcelas?: number | null
          pedido_grupo_id?: string | null
          pedido_id: string
          sobrenome?: string | null
          status?: string | null
          status_detalhe?: string | null
          telefone?: string | null
          uf?: string | null
          valor?: number | null
          valor_bruto?: number | null
        }
        Update: {
          atualizado_em?: string | null
          bairro?: string | null
          canal?: string
          cep?: string | null
          cidade?: string | null
          cliente_chave?: string | null
          cnpj?: string | null
          complemento?: string | null
          cpf?: string | null
          data?: string | null
          data_hora?: string | null
          desconto?: number | null
          doc_hash?: string | null
          email?: string | null
          email_hash?: string | null
          frete?: number | null
          itens?: number | null
          logradouro?: string | null
          nome?: string | null
          numero?: string | null
          pagamento_metodo?: string | null
          pais?: string | null
          parcelas?: number | null
          pedido_grupo_id?: string | null
          pedido_id?: string
          sobrenome?: string | null
          status?: string | null
          status_detalhe?: string | null
          telefone?: string | null
          uf?: string | null
          valor?: number | null
          valor_bruto?: number | null
        }
        Relationships: []
      }
      fact_pedido_item_cliente: {
        Row: {
          atualizado_em: string | null
          canal: string
          categoria: string | null
          data: string | null
          desconto: number | null
          item_id: string | null
          linha: string
          listing_type_id: string | null
          logistic_type: string | null
          pedido_id: string
          preco_unitario: number | null
          produto: string | null
          quantidade: number | null
          sale_fee: number | null
          sku: string | null
          valor_total: number | null
          variacao: string | null
        }
        Insert: {
          atualizado_em?: string | null
          canal: string
          categoria?: string | null
          data?: string | null
          desconto?: number | null
          item_id?: string | null
          linha: string
          listing_type_id?: string | null
          logistic_type?: string | null
          pedido_id: string
          preco_unitario?: number | null
          produto?: string | null
          quantidade?: number | null
          sale_fee?: number | null
          sku?: string | null
          valor_total?: number | null
          variacao?: string | null
        }
        Update: {
          atualizado_em?: string | null
          canal?: string
          categoria?: string | null
          data?: string | null
          desconto?: number | null
          item_id?: string | null
          linha?: string
          listing_type_id?: string | null
          logistic_type?: string | null
          pedido_id?: string
          preco_unitario?: number | null
          produto?: string | null
          quantidade?: number | null
          sale_fee?: number | null
          sku?: string | null
          valor_total?: number | null
          variacao?: string | null
        }
        Relationships: []
      }
      fact_receita_diaria: {
        Row: {
          canal_venda: string
          carregado_em: string
          data: string
          invest_ads: number | null
          invest_afiliados: number | null
          pedidos: number | null
          receita_ads: number | null
          receita_total: number | null
        }
        Insert: {
          canal_venda: string
          carregado_em?: string
          data: string
          invest_ads?: number | null
          invest_afiliados?: number | null
          pedidos?: number | null
          receita_ads?: number | null
          receita_total?: number | null
        }
        Update: {
          canal_venda?: string
          carregado_em?: string
          data?: string
          invest_ads?: number | null
          invest_afiliados?: number | null
          pedidos?: number | null
          receita_ads?: number | null
          receita_total?: number | null
        }
        Relationships: []
      }
      fact_shopee_ads_campanha_dia: {
        Row: {
          ad_type: string | null
          atualizado_em: string
          broad_cir: number | null
          broad_gmv: number | null
          broad_order: number | null
          broad_order_amount: number | null
          broad_roi: number | null
          campaign_id: number
          campaign_placement: string | null
          clicks: number | null
          cpc: number | null
          cpdc: number | null
          cr: number | null
          ctr: number | null
          data: string
          direct_cir: number | null
          direct_cr: number | null
          direct_gmv: number | null
          direct_order: number | null
          direct_order_amount: number | null
          direct_roi: number | null
          expense: number | null
          impression: number | null
        }
        Insert: {
          ad_type?: string | null
          atualizado_em?: string
          broad_cir?: number | null
          broad_gmv?: number | null
          broad_order?: number | null
          broad_order_amount?: number | null
          broad_roi?: number | null
          campaign_id: number
          campaign_placement?: string | null
          clicks?: number | null
          cpc?: number | null
          cpdc?: number | null
          cr?: number | null
          ctr?: number | null
          data: string
          direct_cir?: number | null
          direct_cr?: number | null
          direct_gmv?: number | null
          direct_order?: number | null
          direct_order_amount?: number | null
          direct_roi?: number | null
          expense?: number | null
          impression?: number | null
        }
        Update: {
          ad_type?: string | null
          atualizado_em?: string
          broad_cir?: number | null
          broad_gmv?: number | null
          broad_order?: number | null
          broad_order_amount?: number | null
          broad_roi?: number | null
          campaign_id?: number
          campaign_placement?: string | null
          clicks?: number | null
          cpc?: number | null
          cpdc?: number | null
          cr?: number | null
          ctr?: number | null
          data?: string
          direct_cir?: number | null
          direct_cr?: number | null
          direct_gmv?: number | null
          direct_order?: number | null
          direct_order_amount?: number | null
          direct_roi?: number | null
          expense?: number | null
          impression?: number | null
        }
        Relationships: []
      }
      fact_shopee_ads_hora: {
        Row: {
          atualizado_em: string
          broad_gmv: number | null
          broad_order: number | null
          broad_roas: number | null
          clicks: number | null
          ctr: number | null
          data: string
          direct_gmv: number | null
          direct_order: number | null
          direct_roas: number | null
          expense: number | null
          hora: number
          impression: number | null
        }
        Insert: {
          atualizado_em?: string
          broad_gmv?: number | null
          broad_order?: number | null
          broad_roas?: number | null
          clicks?: number | null
          ctr?: number | null
          data: string
          direct_gmv?: number | null
          direct_order?: number | null
          direct_roas?: number | null
          expense?: number | null
          hora: number
          impression?: number | null
        }
        Update: {
          atualizado_em?: string
          broad_gmv?: number | null
          broad_order?: number | null
          broad_roas?: number | null
          clicks?: number | null
          ctr?: number | null
          data?: string
          direct_gmv?: number | null
          direct_order?: number | null
          direct_roas?: number | null
          expense?: number | null
          hora?: number
          impression?: number | null
        }
        Relationships: []
      }
      fact_shopee_ads_total_dia: {
        Row: {
          atualizado_em: string
          broad_conversions: number | null
          broad_gmv: number | null
          broad_item_sold: number | null
          broad_order: number | null
          broad_roas: number | null
          clicks: number | null
          cost_per_conversion: number | null
          ctr: number | null
          data: string
          direct_conversions: number | null
          direct_gmv: number | null
          direct_item_sold: number | null
          direct_order: number | null
          direct_roas: number | null
          expense: number | null
          impression: number | null
        }
        Insert: {
          atualizado_em?: string
          broad_conversions?: number | null
          broad_gmv?: number | null
          broad_item_sold?: number | null
          broad_order?: number | null
          broad_roas?: number | null
          clicks?: number | null
          cost_per_conversion?: number | null
          ctr?: number | null
          data: string
          direct_conversions?: number | null
          direct_gmv?: number | null
          direct_item_sold?: number | null
          direct_order?: number | null
          direct_roas?: number | null
          expense?: number | null
          impression?: number | null
        }
        Update: {
          atualizado_em?: string
          broad_conversions?: number | null
          broad_gmv?: number | null
          broad_item_sold?: number | null
          broad_order?: number | null
          broad_roas?: number | null
          clicks?: number | null
          cost_per_conversion?: number | null
          ctr?: number | null
          data?: string
          direct_conversions?: number | null
          direct_gmv?: number | null
          direct_item_sold?: number | null
          direct_order?: number | null
          direct_roas?: number | null
          expense?: number | null
          impression?: number | null
        }
        Relationships: []
      }
      fact_shopee_financeiro: {
        Row: {
          actual_shipping_fee: number | null
          buyer_paid_shipping_fee: number | null
          buyer_payment_method: string | null
          buyer_total_amount: number | null
          buyer_transaction_fee: number | null
          campaign_fee: number | null
          carregado_em: string
          coins: number | null
          comissao_afiliado: number | null
          commission_fee: number | null
          create_dia: string | null
          escrow_amount: number | null
          escrow_tax: number | null
          fbs_fee: number | null
          final_shipping_fee: number | null
          order_discounted_price: number | null
          order_original_price: number | null
          order_selling_price: number | null
          order_sn: string
          order_status: string | null
          payment_promotion: number | null
          pix_discount: number | null
          reverse_shipping_fee: number | null
          seller_discount: number | null
          seller_return_refund: number | null
          seller_shipping_discount: number | null
          seller_transaction_fee: number | null
          service_fee: number | null
          shopee_discount: number | null
          shopee_shipping_rebate: number | null
          total_adjustment_amount: number | null
          voucher_from_seller: number | null
          voucher_from_shopee: number | null
          withholding_tax: number | null
        }
        Insert: {
          actual_shipping_fee?: number | null
          buyer_paid_shipping_fee?: number | null
          buyer_payment_method?: string | null
          buyer_total_amount?: number | null
          buyer_transaction_fee?: number | null
          campaign_fee?: number | null
          carregado_em?: string
          coins?: number | null
          comissao_afiliado?: number | null
          commission_fee?: number | null
          create_dia?: string | null
          escrow_amount?: number | null
          escrow_tax?: number | null
          fbs_fee?: number | null
          final_shipping_fee?: number | null
          order_discounted_price?: number | null
          order_original_price?: number | null
          order_selling_price?: number | null
          order_sn: string
          order_status?: string | null
          payment_promotion?: number | null
          pix_discount?: number | null
          reverse_shipping_fee?: number | null
          seller_discount?: number | null
          seller_return_refund?: number | null
          seller_shipping_discount?: number | null
          seller_transaction_fee?: number | null
          service_fee?: number | null
          shopee_discount?: number | null
          shopee_shipping_rebate?: number | null
          total_adjustment_amount?: number | null
          voucher_from_seller?: number | null
          voucher_from_shopee?: number | null
          withholding_tax?: number | null
        }
        Update: {
          actual_shipping_fee?: number | null
          buyer_paid_shipping_fee?: number | null
          buyer_payment_method?: string | null
          buyer_total_amount?: number | null
          buyer_transaction_fee?: number | null
          campaign_fee?: number | null
          carregado_em?: string
          coins?: number | null
          comissao_afiliado?: number | null
          commission_fee?: number | null
          create_dia?: string | null
          escrow_amount?: number | null
          escrow_tax?: number | null
          fbs_fee?: number | null
          final_shipping_fee?: number | null
          order_discounted_price?: number | null
          order_original_price?: number | null
          order_selling_price?: number | null
          order_sn?: string
          order_status?: string | null
          payment_promotion?: number | null
          pix_discount?: number | null
          reverse_shipping_fee?: number | null
          seller_discount?: number | null
          seller_return_refund?: number | null
          seller_shipping_discount?: number | null
          seller_transaction_fee?: number | null
          service_fee?: number | null
          shopee_discount?: number | null
          shopee_shipping_rebate?: number | null
          total_adjustment_amount?: number | null
          voucher_from_seller?: number | null
          voucher_from_shopee?: number | null
          withholding_tax?: number | null
        }
        Relationships: []
      }
      fact_shopee_frete_dia: {
        Row: {
          afiliados: number | null
          atualizado_em: string
          cancelados: number | null
          cancelamento_pct: number | null
          cobertura_financeiro_pct: number | null
          comissao: number | null
          data: string
          faturamento_cancelado: number | null
          frete_medio: number | null
          frete_real: number | null
          pedidos: number | null
          peso_medio_g: number | null
          preco_medio: number | null
          produtos: number | null
          receita: number | null
          taxa_servico: number | null
          ticket_medio: number | null
          transportadora: string
          unid_por_pedido: number | null
          unidades: number | null
        }
        Insert: {
          afiliados?: number | null
          atualizado_em?: string
          cancelados?: number | null
          cancelamento_pct?: number | null
          cobertura_financeiro_pct?: number | null
          comissao?: number | null
          data: string
          faturamento_cancelado?: number | null
          frete_medio?: number | null
          frete_real?: number | null
          pedidos?: number | null
          peso_medio_g?: number | null
          preco_medio?: number | null
          produtos?: number | null
          receita?: number | null
          taxa_servico?: number | null
          ticket_medio?: number | null
          transportadora: string
          unid_por_pedido?: number | null
          unidades?: number | null
        }
        Update: {
          afiliados?: number | null
          atualizado_em?: string
          cancelados?: number | null
          cancelamento_pct?: number | null
          cobertura_financeiro_pct?: number | null
          comissao?: number | null
          data?: string
          faturamento_cancelado?: number | null
          frete_medio?: number | null
          frete_real?: number | null
          pedidos?: number | null
          peso_medio_g?: number | null
          preco_medio?: number | null
          produtos?: number | null
          receita?: number | null
          taxa_servico?: number | null
          ticket_medio?: number | null
          transportadora?: string
          unid_por_pedido?: number | null
          unidades?: number | null
        }
        Relationships: []
      }
      fact_shopee_frete_produto_dia: {
        Row: {
          atualizado_em: string
          data: string | null
          faturamento: number | null
          faturamento_cancelado: number | null
          item_id: string | null
          pedidos: number | null
          pedidos_cancelados: number | null
          preco_medio: number | null
          seller_sku: string | null
          titulo: string | null
          transportadora: string | null
          unidades: number | null
        }
        Insert: {
          atualizado_em?: string
          data?: string | null
          faturamento?: number | null
          faturamento_cancelado?: number | null
          item_id?: string | null
          pedidos?: number | null
          pedidos_cancelados?: number | null
          preco_medio?: number | null
          seller_sku?: string | null
          titulo?: string | null
          transportadora?: string | null
          unidades?: number | null
        }
        Update: {
          atualizado_em?: string
          data?: string | null
          faturamento?: number | null
          faturamento_cancelado?: number | null
          item_id?: string | null
          pedidos?: number | null
          pedidos_cancelados?: number | null
          preco_medio?: number | null
          seller_sku?: string | null
          titulo?: string | null
          transportadora?: string | null
          unidades?: number | null
        }
        Relationships: []
      }
      fact_shopee_pedido_venda: {
        Row: {
          atualizado_em: string
          create_dia: string
          order_sn: string
          order_status: string | null
          valor_itens: number
          venda: number
          voucher_loja: number
        }
        Insert: {
          atualizado_em?: string
          create_dia: string
          order_sn: string
          order_status?: string | null
          valor_itens?: number
          venda?: number
          voucher_loja?: number
        }
        Update: {
          atualizado_em?: string
          create_dia?: string
          order_sn?: string
          order_status?: string | null
          valor_itens?: number
          venda?: number
          voucher_loja?: number
        }
        Relationships: []
      }
      fact_shopee_venda_dia: {
        Row: {
          atualizado_em: string
          compradores_unicos: number | null
          data: string
          desconto_vendedor: number | null
          faturamento: number | null
          faturamento_cancelado: number | null
          faturamento_nao_pago: number | null
          frete_real: number | null
          frete_reverso: number | null
          gmv_bruto: number | null
          pedidos: number | null
          pedidos_cancelados: number | null
          pedidos_nao_pagos: number | null
          taxa_cancelamento_pct: number | null
          ticket_medio: number | null
          unidades: number | null
        }
        Insert: {
          atualizado_em?: string
          compradores_unicos?: number | null
          data: string
          desconto_vendedor?: number | null
          faturamento?: number | null
          faturamento_cancelado?: number | null
          faturamento_nao_pago?: number | null
          frete_real?: number | null
          frete_reverso?: number | null
          gmv_bruto?: number | null
          pedidos?: number | null
          pedidos_cancelados?: number | null
          pedidos_nao_pagos?: number | null
          taxa_cancelamento_pct?: number | null
          ticket_medio?: number | null
          unidades?: number | null
        }
        Update: {
          atualizado_em?: string
          compradores_unicos?: number | null
          data?: string
          desconto_vendedor?: number | null
          faturamento?: number | null
          faturamento_cancelado?: number | null
          faturamento_nao_pago?: number | null
          frete_real?: number | null
          frete_reverso?: number | null
          gmv_bruto?: number | null
          pedidos?: number | null
          pedidos_cancelados?: number | null
          pedidos_nao_pagos?: number | null
          taxa_cancelamento_pct?: number | null
          ticket_medio?: number | null
          unidades?: number | null
        }
        Relationships: []
      }
      fact_shopee_venda_produto_dia: {
        Row: {
          atualizado_em: string
          data: string
          desconto: number | null
          item_id: string
          item_sku: string | null
          model_id: string
          model_sku: string | null
          pedidos: number | null
          preco_medio: number | null
          produto: string | null
          receita: number | null
          unidades: number | null
          variacao: string | null
        }
        Insert: {
          atualizado_em?: string
          data: string
          desconto?: number | null
          item_id: string
          item_sku?: string | null
          model_id: string
          model_sku?: string | null
          pedidos?: number | null
          preco_medio?: number | null
          produto?: string | null
          receita?: number | null
          unidades?: number | null
          variacao?: string | null
        }
        Update: {
          atualizado_em?: string
          data?: string
          desconto?: number | null
          item_id?: string
          item_sku?: string | null
          model_id?: string
          model_sku?: string | null
          pedidos?: number | null
          preco_medio?: number | null
          produto?: string | null
          receita?: number | null
          unidades?: number | null
          variacao?: string | null
        }
        Relationships: []
      }
      fact_site_pagina_canal_dia: {
        Row: {
          atualizado_em: string
          data: string
          pagina_path: string
          sessoes: number
          sessoes_checkout: number
          utm_medium: string
          utm_source: string
        }
        Insert: {
          atualizado_em?: string
          data: string
          pagina_path: string
          sessoes?: number
          sessoes_checkout?: number
          utm_medium?: string
          utm_source?: string
        }
        Update: {
          atualizado_em?: string
          data?: string
          pagina_path?: string
          sessoes?: number
          sessoes_checkout?: number
          utm_medium?: string
          utm_source?: string
        }
        Relationships: []
      }
      fact_site_pagina_dia: {
        Row: {
          atualizado_em: string
          data: string
          pagina_path: string
          sessoes: number
          sessoes_checkout: number
        }
        Insert: {
          atualizado_em?: string
          data: string
          pagina_path: string
          sessoes?: number
          sessoes_checkout?: number
        }
        Update: {
          atualizado_em?: string
          data?: string
          pagina_path?: string
          sessoes?: number
          sessoes_checkout?: number
        }
        Relationships: []
      }
      fact_tiktok_ads_campanha_gmv_dia: {
        Row: {
          atualizado_em: string | null
          campaign_id: string
          campanha: string | null
          data: string
          invest: number | null
          net_cost: number | null
          pedidos: number | null
          receita: number | null
          roi: number | null
          tipo: string | null
        }
        Insert: {
          atualizado_em?: string | null
          campaign_id: string
          campanha?: string | null
          data: string
          invest?: number | null
          net_cost?: number | null
          pedidos?: number | null
          receita?: number | null
          roi?: number | null
          tipo?: string | null
        }
        Update: {
          atualizado_em?: string | null
          campaign_id?: string
          campanha?: string | null
          data?: string
          invest?: number | null
          net_cost?: number | null
          pedidos?: number | null
          receita?: number | null
          roi?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      fact_tiktok_ads_criativo_dia: {
        Row: {
          atualizado_em: string | null
          campaign_id: string
          data: string
          invest: number | null
          item_group_id: string
          item_id: string
          pedidos: number | null
          receita: number | null
        }
        Insert: {
          atualizado_em?: string | null
          campaign_id: string
          data: string
          invest?: number | null
          item_group_id: string
          item_id: string
          pedidos?: number | null
          receita?: number | null
        }
        Update: {
          atualizado_em?: string | null
          campaign_id?: string
          data?: string
          invest?: number | null
          item_group_id?: string
          item_id?: string
          pedidos?: number | null
          receita?: number | null
        }
        Relationships: []
      }
      fact_tiktok_ads_dia: {
        Row: {
          atualizado_em: string | null
          campaign_id: string
          campanha: string | null
          custo_por_pedido: number | null
          data: string
          invest: number | null
          pedidos: number | null
          product_id: string
          receita: number | null
          roas: number | null
        }
        Insert: {
          atualizado_em?: string | null
          campaign_id: string
          campanha?: string | null
          custo_por_pedido?: number | null
          data: string
          invest?: number | null
          pedidos?: number | null
          product_id?: string
          receita?: number | null
          roas?: number | null
        }
        Update: {
          atualizado_em?: string | null
          campaign_id?: string
          campanha?: string | null
          custo_por_pedido?: number | null
          data?: string
          invest?: number | null
          pedidos?: number | null
          product_id?: string
          receita?: number | null
          roas?: number | null
        }
        Relationships: []
      }
      fact_tiktok_ads_total_dia: {
        Row: {
          atualizado_em: string | null
          custo_por_pedido: number | null
          data: string
          invest: number | null
          pedidos: number | null
          receita: number | null
          roas: number | null
        }
        Insert: {
          atualizado_em?: string | null
          custo_por_pedido?: number | null
          data: string
          invest?: number | null
          pedidos?: number | null
          receita?: number | null
          roas?: number | null
        }
        Update: {
          atualizado_em?: string | null
          custo_por_pedido?: number | null
          data?: string
          invest?: number | null
          pedidos?: number | null
          receita?: number | null
          roas?: number | null
        }
        Relationships: []
      }
      fact_tiktok_conteudo_dia: {
        Row: {
          atualizado_em: string | null
          cancelamentos: number | null
          compradores: number | null
          compradores_card: number | null
          compradores_live: number | null
          compradores_video: number | null
          conversao_pct: number | null
          data: string
          devolucoes: number | null
          gmv: number | null
          gmv_card: number | null
          gmv_live: number | null
          gmv_video: number | null
          impressoes: number | null
          impressoes_card: number | null
          impressoes_live: number | null
          impressoes_video: number | null
          pageviews: number | null
          pageviews_card: number | null
          pageviews_live: number | null
          pageviews_video: number | null
          pedidos: number | null
          sku_orders: number | null
          ticket_medio: number | null
          unidades: number | null
          visit_card: number | null
          visit_live: number | null
          visit_video: number | null
          visitantes: number | null
        }
        Insert: {
          atualizado_em?: string | null
          cancelamentos?: number | null
          compradores?: number | null
          compradores_card?: number | null
          compradores_live?: number | null
          compradores_video?: number | null
          conversao_pct?: number | null
          data: string
          devolucoes?: number | null
          gmv?: number | null
          gmv_card?: number | null
          gmv_live?: number | null
          gmv_video?: number | null
          impressoes?: number | null
          impressoes_card?: number | null
          impressoes_live?: number | null
          impressoes_video?: number | null
          pageviews?: number | null
          pageviews_card?: number | null
          pageviews_live?: number | null
          pageviews_video?: number | null
          pedidos?: number | null
          sku_orders?: number | null
          ticket_medio?: number | null
          unidades?: number | null
          visit_card?: number | null
          visit_live?: number | null
          visit_video?: number | null
          visitantes?: number | null
        }
        Update: {
          atualizado_em?: string | null
          cancelamentos?: number | null
          compradores?: number | null
          compradores_card?: number | null
          compradores_live?: number | null
          compradores_video?: number | null
          conversao_pct?: number | null
          data?: string
          devolucoes?: number | null
          gmv?: number | null
          gmv_card?: number | null
          gmv_live?: number | null
          gmv_video?: number | null
          impressoes?: number | null
          impressoes_card?: number | null
          impressoes_live?: number | null
          impressoes_video?: number | null
          pageviews?: number | null
          pageviews_card?: number | null
          pageviews_live?: number | null
          pageviews_video?: number | null
          pedidos?: number | null
          sku_orders?: number | null
          ticket_medio?: number | null
          unidades?: number | null
          visit_card?: number | null
          visit_live?: number | null
          visit_video?: number | null
          visitantes?: number | null
        }
        Relationships: []
      }
      fact_tiktok_devolucao: {
        Row: {
          atualizado_em: string | null
          desconto_plataforma: number | null
          desconto_vendedor: number | null
          dia: string | null
          motivo: string | null
          order_id: string | null
          return_id: string
          status: string | null
          tipo: string | null
          valor_reembolso: number | null
        }
        Insert: {
          atualizado_em?: string | null
          desconto_plataforma?: number | null
          desconto_vendedor?: number | null
          dia?: string | null
          motivo?: string | null
          order_id?: string | null
          return_id: string
          status?: string | null
          tipo?: string | null
          valor_reembolso?: number | null
        }
        Update: {
          atualizado_em?: string | null
          desconto_plataforma?: number | null
          desconto_vendedor?: number | null
          dia?: string | null
          motivo?: string | null
          order_id?: string | null
          return_id?: string
          status?: string | null
          tipo?: string | null
          valor_reembolso?: number | null
        }
        Relationships: []
      }
      fact_tiktok_financeiro: {
        Row: {
          atualizado_em: string | null
          comissao_afiliado: number | null
          comissao_afiliado_ads: number | null
          comissao_parceiro: number | null
          comissao_plataforma: number | null
          desconto_plataforma: number | null
          desconto_vendedor: number | null
          frete_cliente: number | null
          frete_custo: number | null
          imposto: number | null
          order_dia: string | null
          order_id: string
          receita_bruta: number | null
          receita_liquida: number | null
          reembolso: number | null
          settlement: number | null
          statement_dia: string | null
          statement_id: string | null
          taxa_referral: number | null
          taxa_transacao: number | null
          taxas_total: number | null
          tipo: string | null
        }
        Insert: {
          atualizado_em?: string | null
          comissao_afiliado?: number | null
          comissao_afiliado_ads?: number | null
          comissao_parceiro?: number | null
          comissao_plataforma?: number | null
          desconto_plataforma?: number | null
          desconto_vendedor?: number | null
          frete_cliente?: number | null
          frete_custo?: number | null
          imposto?: number | null
          order_dia?: string | null
          order_id: string
          receita_bruta?: number | null
          receita_liquida?: number | null
          reembolso?: number | null
          settlement?: number | null
          statement_dia?: string | null
          statement_id?: string | null
          taxa_referral?: number | null
          taxa_transacao?: number | null
          taxas_total?: number | null
          tipo?: string | null
        }
        Update: {
          atualizado_em?: string | null
          comissao_afiliado?: number | null
          comissao_afiliado_ads?: number | null
          comissao_parceiro?: number | null
          comissao_plataforma?: number | null
          desconto_plataforma?: number | null
          desconto_vendedor?: number | null
          frete_cliente?: number | null
          frete_custo?: number | null
          imposto?: number | null
          order_dia?: string | null
          order_id?: string
          receita_bruta?: number | null
          receita_liquida?: number | null
          reembolso?: number | null
          settlement?: number | null
          statement_dia?: string | null
          statement_id?: string | null
          taxa_referral?: number | null
          taxa_transacao?: number | null
          taxas_total?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      fact_tiktok_produto_perf_dia: {
        Row: {
          atualizado_em: string | null
          ctr: number | null
          data: string
          gmv: number | null
          pedidos: number | null
          produto_id: string
          unidades: number | null
        }
        Insert: {
          atualizado_em?: string | null
          ctr?: number | null
          data: string
          gmv?: number | null
          pedidos?: number | null
          produto_id: string
          unidades?: number | null
        }
        Update: {
          atualizado_em?: string | null
          ctr?: number | null
          data?: string
          gmv?: number | null
          pedidos?: number | null
          produto_id?: string
          unidades?: number | null
        }
        Relationships: []
      }
      fact_tiktok_venda_dia: {
        Row: {
          amostras_pedidos: number | null
          amostras_unidades: number | null
          atualizado_em: string | null
          clientes_unicos: number | null
          data: string
          desconto_plataforma: number | null
          desconto_vendedor: number | null
          faturamento: number | null
          faturamento_cancelado: number | null
          frete_cobrado: number | null
          frete_subsidiado: number | null
          gmv_bruto: number | null
          pedidos: number | null
          pedidos_cancelados: number | null
          sub_total: number | null
          taxa_cancelamento_pct: number | null
          ticket_medio: number | null
          unidades: number | null
        }
        Insert: {
          amostras_pedidos?: number | null
          amostras_unidades?: number | null
          atualizado_em?: string | null
          clientes_unicos?: number | null
          data: string
          desconto_plataforma?: number | null
          desconto_vendedor?: number | null
          faturamento?: number | null
          faturamento_cancelado?: number | null
          frete_cobrado?: number | null
          frete_subsidiado?: number | null
          gmv_bruto?: number | null
          pedidos?: number | null
          pedidos_cancelados?: number | null
          sub_total?: number | null
          taxa_cancelamento_pct?: number | null
          ticket_medio?: number | null
          unidades?: number | null
        }
        Update: {
          amostras_pedidos?: number | null
          amostras_unidades?: number | null
          atualizado_em?: string | null
          clientes_unicos?: number | null
          data?: string
          desconto_plataforma?: number | null
          desconto_vendedor?: number | null
          faturamento?: number | null
          faturamento_cancelado?: number | null
          frete_cobrado?: number | null
          frete_subsidiado?: number | null
          gmv_bruto?: number | null
          pedidos?: number | null
          pedidos_cancelados?: number | null
          sub_total?: number | null
          taxa_cancelamento_pct?: number | null
          ticket_medio?: number | null
          unidades?: number | null
        }
        Relationships: []
      }
      fact_tiktok_venda_produto_dia: {
        Row: {
          amostras_unidades: number | null
          atualizado_em: string | null
          data: string
          desconto_plataforma: number | null
          desconto_vendedor: number | null
          pedidos: number | null
          preco_medio: number | null
          product_id: string | null
          produto: string | null
          receita: number | null
          seller_sku: string
          sku_name: string | null
          unidades: number | null
        }
        Insert: {
          amostras_unidades?: number | null
          atualizado_em?: string | null
          data: string
          desconto_plataforma?: number | null
          desconto_vendedor?: number | null
          pedidos?: number | null
          preco_medio?: number | null
          product_id?: string | null
          produto?: string | null
          receita?: number | null
          seller_sku: string
          sku_name?: string | null
          unidades?: number | null
        }
        Update: {
          amostras_unidades?: number | null
          atualizado_em?: string | null
          data?: string
          desconto_plataforma?: number | null
          desconto_vendedor?: number | null
          pedidos?: number | null
          preco_medio?: number | null
          product_id?: string | null
          produto?: string | null
          receita?: number | null
          seller_sku?: string
          sku_name?: string | null
          unidades?: number | null
        }
        Relationships: []
      }
      fact_tiktok_video_dia: {
        Row: {
          atualizado_em: string | null
          criador: string | null
          ctr: number | null
          data: string
          gmv: number | null
          gpm: number | null
          produto_id: string | null
          produto_nome: string | null
          publicado_em: string | null
          sku_orders: number | null
          titulo: string | null
          unidades: number | null
          video_id: string
          views: number | null
        }
        Insert: {
          atualizado_em?: string | null
          criador?: string | null
          ctr?: number | null
          data: string
          gmv?: number | null
          gpm?: number | null
          produto_id?: string | null
          produto_nome?: string | null
          publicado_em?: string | null
          sku_orders?: number | null
          titulo?: string | null
          unidades?: number | null
          video_id: string
          views?: number | null
        }
        Update: {
          atualizado_em?: string | null
          criador?: string | null
          ctr?: number | null
          data?: string
          gmv?: number | null
          gpm?: number | null
          produto_id?: string | null
          produto_nome?: string | null
          publicado_em?: string | null
          sku_orders?: number | null
          titulo?: string | null
          unidades?: number | null
          video_id?: string
          views?: number | null
        }
        Relationships: []
      }
      fact_venda_dia: {
        Row: {
          advertiser_id: string
          comissao_ml: number | null
          congelado_em: string
          data: string
          frete_total: number | null
          pedidos: number | null
          ticket_medio: number | null
          unidades: number | null
          venda_bruta: number | null
          venda_liquida: number | null
        }
        Insert: {
          advertiser_id?: string
          comissao_ml?: number | null
          congelado_em?: string
          data: string
          frete_total?: number | null
          pedidos?: number | null
          ticket_medio?: number | null
          unidades?: number | null
          venda_bruta?: number | null
          venda_liquida?: number | null
        }
        Update: {
          advertiser_id?: string
          comissao_ml?: number | null
          congelado_em?: string
          data?: string
          frete_total?: number | null
          pedidos?: number | null
          ticket_medio?: number | null
          unidades?: number | null
          venda_bruta?: number | null
          venda_liquida?: number | null
        }
        Relationships: []
      }
      fact_venda_hora: {
        Row: {
          atualizado_em: string
          canal: string
          data: string
          hora: number
          pedidos: number
          ultimo_ts: string | null
          valor: number
        }
        Insert: {
          atualizado_em?: string
          canal: string
          data: string
          hora: number
          pedidos?: number
          ultimo_ts?: string | null
          valor?: number
        }
        Update: {
          atualizado_em?: string
          canal?: string
          data?: string
          hora?: number
          pedidos?: number
          ultimo_ts?: string | null
          valor?: number
        }
        Relationships: []
      }
      fact_venda_produto_dia: {
        Row: {
          advertiser_id: string
          comissao: number | null
          congelado_em: string
          data: string
          item_id: string
          pedidos: number | null
          receita: number | null
          seller_sku: string | null
          title: string | null
          unidades: number | null
        }
        Insert: {
          advertiser_id?: string
          comissao?: number | null
          congelado_em?: string
          data: string
          item_id: string
          pedidos?: number | null
          receita?: number | null
          seller_sku?: string | null
          title?: string | null
          unidades?: number | null
        }
        Update: {
          advertiser_id?: string
          comissao?: number | null
          congelado_em?: string
          data?: string
          item_id?: string
          pedidos?: number | null
          receita?: number | null
          seller_sku?: string | null
          title?: string | null
          unidades?: number | null
        }
        Relationships: []
      }
      google_ads_intraday: {
        Row: {
          campaign_id: string
          captured_at: string
          data: string
          metrica: string
          valor: number | null
        }
        Insert: {
          campaign_id: string
          captured_at: string
          data: string
          metrica: string
          valor?: number | null
        }
        Update: {
          campaign_id?: string
          captured_at?: string
          data?: string
          metrica?: string
          valor?: number | null
        }
        Relationships: []
      }
      google_anuncio_metricas: {
        Row: {
          ad_id: string
          carregado_em: string
          data: string
          metrica: string
          valor: number | null
        }
        Insert: {
          ad_id: string
          carregado_em?: string
          data: string
          metrica: string
          valor?: number | null
        }
        Update: {
          ad_id?: string
          carregado_em?: string
          data?: string
          metrica?: string
          valor?: number | null
        }
        Relationships: []
      }
      google_campanha_metricas: {
        Row: {
          campaign_id: string
          carregado_em: string
          data: string
          metrica: string
          valor: number | null
        }
        Insert: {
          campaign_id: string
          carregado_em?: string
          data: string
          metrica: string
          valor?: number | null
        }
        Update: {
          campaign_id?: string
          carregado_em?: string
          data?: string
          metrica?: string
          valor?: number | null
        }
        Relationships: []
      }
      google_keyword_metricas: {
        Row: {
          ad_group_id: string
          carregado_em: string
          data: string
          keyword_text: string
          metrica: string
          valor: number | null
        }
        Insert: {
          ad_group_id: string
          carregado_em?: string
          data: string
          keyword_text: string
          metrica: string
          valor?: number | null
        }
        Update: {
          ad_group_id?: string
          carregado_em?: string
          data?: string
          keyword_text?: string
          metrica?: string
          valor?: number | null
        }
        Relationships: []
      }
      google_produto_metricas: {
        Row: {
          campaign_id: string
          carregado_em: string
          data: string
          metrica: string
          product_item_id: string
          valor: number | null
        }
        Insert: {
          campaign_id: string
          carregado_em?: string
          data: string
          metrica: string
          product_item_id: string
          valor?: number | null
        }
        Update: {
          campaign_id?: string
          carregado_em?: string
          data?: string
          metrica?: string
          product_item_id?: string
          valor?: number | null
        }
        Relationships: []
      }
      google_termo_metricas: {
        Row: {
          ad_group_id: string
          carregado_em: string
          data: string
          metrica: string
          search_term: string
          valor: number | null
        }
        Insert: {
          ad_group_id: string
          carregado_em?: string
          data: string
          metrica: string
          search_term: string
          valor?: number | null
        }
        Update: {
          ad_group_id?: string
          carregado_em?: string
          data?: string
          metrica?: string
          search_term?: string
          valor?: number | null
        }
        Relationships: []
      }
      growth_acoes: {
        Row: {
          alterado_em: string | null
          alterado_por: string | null
          canal: string | null
          chave: string | null
          contexto: string | null
          criada_em: string
          esforco: string | null
          id: string
          impacto_estimado: number | null
          prazo: string | null
          prioridade: number | null
          responsavel: string | null
          status: string
          titulo: string
        }
        Insert: {
          alterado_em?: string | null
          alterado_por?: string | null
          canal?: string | null
          chave?: string | null
          contexto?: string | null
          criada_em?: string
          esforco?: string | null
          id?: string
          impacto_estimado?: number | null
          prazo?: string | null
          prioridade?: number | null
          responsavel?: string | null
          status?: string
          titulo: string
        }
        Update: {
          alterado_em?: string | null
          alterado_por?: string | null
          canal?: string | null
          chave?: string | null
          contexto?: string | null
          criada_em?: string
          esforco?: string | null
          id?: string
          impacto_estimado?: number | null
          prazo?: string | null
          prioridade?: number | null
          responsavel?: string | null
          status?: string
          titulo?: string
        }
        Relationships: []
      }
      growth_resultados: {
        Row: {
          acao_id: string
          alterado_em: string | null
          alterado_por: string | null
          id: string
          metrica_antes: number | null
          metrica_depois: number | null
          observacao: string | null
          registrado_em: string
          resultado: string | null
        }
        Insert: {
          acao_id: string
          alterado_em?: string | null
          alterado_por?: string | null
          id?: string
          metrica_antes?: number | null
          metrica_depois?: number | null
          observacao?: string | null
          registrado_em?: string
          resultado?: string | null
        }
        Update: {
          acao_id?: string
          alterado_em?: string | null
          alterado_por?: string | null
          id?: string
          metrica_antes?: number | null
          metrica_depois?: number | null
          observacao?: string | null
          registrado_em?: string
          resultado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_resultados_acao_id_fkey"
            columns: ["acao_id"]
            isOneToOne: false
            referencedRelation: "growth_acoes"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_fluxo: {
        Row: {
          filtro: Json | null
          id_gatilho: string | null
          msgs: Json | null
          nome: string | null
          novo_id: string | null
          ord: number
          pf: Json | null
          reentrada: Json | null
          req: number | null
          req_del: number | null
          substitui: string | null
          tipo_gatilho: string | null
        }
        Insert: {
          filtro?: Json | null
          id_gatilho?: string | null
          msgs?: Json | null
          nome?: string | null
          novo_id?: string | null
          ord: number
          pf?: Json | null
          reentrada?: Json | null
          req?: number | null
          req_del?: number | null
          substitui?: string | null
          tipo_gatilho?: string | null
        }
        Update: {
          filtro?: Json | null
          id_gatilho?: string | null
          msgs?: Json | null
          nome?: string | null
          novo_id?: string | null
          ord?: number
          pf?: Json | null
          reentrada?: Json | null
          req?: number | null
          req_del?: number | null
          substitui?: string | null
          tipo_gatilho?: string | null
        }
        Relationships: []
      }
      kb_html: {
        Row: {
          arquivo: string
          html: string
        }
        Insert: {
          arquivo: string
          html: string
        }
        Update: {
          arquivo?: string
          html?: string
        }
        Relationships: []
      }
      kb_mapa: {
        Row: {
          arquivo: string
          origem: string | null
          template_id: string
        }
        Insert: {
          arquivo: string
          origem?: string | null
          template_id: string
        }
        Update: {
          arquivo?: string
          origem?: string | null
          template_id?: string
        }
        Relationships: []
      }
      kb_novo: {
        Row: {
          arquivo: string
          nome: string | null
          req: number | null
          template_id: string | null
        }
        Insert: {
          arquivo: string
          nome?: string | null
          req?: number | null
          template_id?: string | null
        }
        Update: {
          arquivo?: string
          nome?: string | null
          req?: number | null
          template_id?: string | null
        }
        Relationships: []
      }
      kb_render: {
        Row: {
          arquivo: string
          req: number | null
          template_id: string | null
        }
        Insert: {
          arquivo: string
          req?: number | null
          template_id?: string | null
        }
        Update: {
          arquivo?: string
          req?: number | null
          template_id?: string | null
        }
        Relationships: []
      }
      kb_tmp_perfil: {
        Row: {
          pid: string
          req: number | null
        }
        Insert: {
          pid: string
          req?: number | null
        }
        Update: {
          pid?: string
          req?: number | null
        }
        Relationships: []
      }
      kb_tmpl: {
        Row: {
          arquivo: string | null
          feito_em: string | null
          html: string
          req: number | null
          template_id: string
        }
        Insert: {
          arquivo?: string | null
          feito_em?: string | null
          html: string
          req?: number | null
          template_id: string
        }
        Update: {
          arquivo?: string | null
          feito_em?: string | null
          html?: string
          req?: number | null
          template_id?: string
        }
        Relationships: []
      }
      klaviyo_resgate_log: {
        Row: {
          erro: string | null
          executado_em: string
          http_status: number | null
          id: number
          job_id: string | null
          modo: string
          ok: boolean
          perfis_no_segmento: number | null
        }
        Insert: {
          erro?: string | null
          executado_em?: string
          http_status?: number | null
          id?: never
          job_id?: string | null
          modo: string
          ok: boolean
          perfis_no_segmento?: number | null
        }
        Update: {
          erro?: string | null
          executado_em?: string
          http_status?: number | null
          id?: never
          job_id?: string | null
          modo?: string
          ok?: boolean
          perfis_no_segmento?: number | null
        }
        Relationships: []
      }
      live_cupom: {
        Row: {
          cupom: string
          live_id: number
        }
        Insert: {
          cupom: string
          live_id: number
        }
        Update: {
          cupom?: string
          live_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_cupom_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "live_sessao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_cupom_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "vw_live_classificacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_cupom_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "vw_live_sessao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_cupom_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "vw_live_site_cupom"
            referencedColumns: ["live_id"]
          },
          {
            foreignKeyName: "live_cupom_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "vw_live_top"
            referencedColumns: ["id"]
          },
        ]
      }
      live_marcador_site: {
        Row: {
          ativo: boolean
          criado_em: string
          cupom: string
          observacao: string | null
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          cupom: string
          observacao?: string | null
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          cupom?: string
          observacao?: string | null
        }
        Relationships: []
      }
      live_pedido_atribuido: {
        Row: {
          atualizado_em: string
          bruto: Json | null
          canal: string
          criado_em_fonte: string | null
          fonte: string
          live_id: number | null
          moeda: string | null
          pedido_ref: string
          tipo_atribuicao: string | null
          valor: number | null
        }
        Insert: {
          atualizado_em?: string
          bruto?: Json | null
          canal: string
          criado_em_fonte?: string | null
          fonte: string
          live_id?: number | null
          moeda?: string | null
          pedido_ref: string
          tipo_atribuicao?: string | null
          valor?: number | null
        }
        Update: {
          atualizado_em?: string
          bruto?: Json | null
          canal?: string
          criado_em_fonte?: string | null
          fonte?: string
          live_id?: number | null
          moeda?: string | null
          pedido_ref?: string
          tipo_atribuicao?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_pedido_atribuido_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "live_sessao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_pedido_atribuido_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "vw_live_classificacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_pedido_atribuido_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "vw_live_sessao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_pedido_atribuido_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "vw_live_site_cupom"
            referencedColumns: ["live_id"]
          },
          {
            foreignKeyName: "live_pedido_atribuido_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "vw_live_top"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessao: {
        Row: {
          apresentador: string | null
          atualizado_em: string
          bruto: Json | null
          canal: string
          clientes: number | null
          cliques_produto: number | null
          comentarios: number | null
          compartilhamentos: number | null
          curtidas: number | null
          espectadores: number | null
          fim: string | null
          fonte: string
          gmv: number | null
          id: number
          impressoes_produto: number | null
          inicio: string | null
          interna: boolean
          novos_seguidores: number | null
          observacao: string | null
          pedidos: number | null
          produtos_distintos: number | null
          ref_externa: string
          tempo_medio_seg: number | null
          titulo: string | null
          unidades: number | null
          visualizacoes: number | null
        }
        Insert: {
          apresentador?: string | null
          atualizado_em?: string
          bruto?: Json | null
          canal: string
          clientes?: number | null
          cliques_produto?: number | null
          comentarios?: number | null
          compartilhamentos?: number | null
          curtidas?: number | null
          espectadores?: number | null
          fim?: string | null
          fonte: string
          gmv?: number | null
          id?: number
          impressoes_produto?: number | null
          inicio?: string | null
          interna?: boolean
          novos_seguidores?: number | null
          observacao?: string | null
          pedidos?: number | null
          produtos_distintos?: number | null
          ref_externa: string
          tempo_medio_seg?: number | null
          titulo?: string | null
          unidades?: number | null
          visualizacoes?: number | null
        }
        Update: {
          apresentador?: string | null
          atualizado_em?: string
          bruto?: Json | null
          canal?: string
          clientes?: number | null
          cliques_produto?: number | null
          comentarios?: number | null
          compartilhamentos?: number | null
          curtidas?: number | null
          espectadores?: number | null
          fim?: string | null
          fonte?: string
          gmv?: number | null
          id?: number
          impressoes_produto?: number | null
          inicio?: string | null
          interna?: boolean
          novos_seguidores?: number | null
          observacao?: string | null
          pedidos?: number | null
          produtos_distintos?: number | null
          ref_externa?: string
          tempo_medio_seg?: number | null
          titulo?: string | null
          unidades?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      live_shopee_produto: {
        Row: {
          atc: number | null
          cliques: number | null
          item_id: number
          itens_confirmados: number | null
          itens_feitos: number | null
          pedidos_confirmados: number | null
          pedidos_feitos: number | null
          sessao_id: number
          vendas_confirmadas: number | null
          vendas_feitas: number | null
        }
        Insert: {
          atc?: number | null
          cliques?: number | null
          item_id: number
          itens_confirmados?: number | null
          itens_feitos?: number | null
          pedidos_confirmados?: number | null
          pedidos_feitos?: number | null
          sessao_id: number
          vendas_confirmadas?: number | null
          vendas_feitas?: number | null
        }
        Update: {
          atc?: number | null
          cliques?: number | null
          item_id?: number
          itens_confirmados?: number | null
          itens_feitos?: number | null
          pedidos_confirmados?: number | null
          pedidos_feitos?: number | null
          sessao_id?: number
          vendas_confirmadas?: number | null
          vendas_feitas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_shopee_produto_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "live_shopee_sessao"
            referencedColumns: ["sessao_id"]
          },
          {
            foreignKeyName: "live_shopee_produto_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "vw_live_shopee_produto"
            referencedColumns: ["sessao_id"]
          },
        ]
      }
      live_shopee_sessao: {
        Row: {
          atc: number | null
          atualizado_em: string
          blocos_30min: number | null
          comentarios: number | null
          duracao_seg: number | null
          espectadores: number | null
          espectadores_engajados: number | null
          inicio: string
          itens_confirmados: number | null
          itens_feitos: number | null
          pedidos_confirmados: number | null
          pedidos_feitos: number | null
          sessao_id: number
          status: number | null
          tempo_medio_seg: number | null
          titulo: string | null
          vendas_confirmadas: number | null
          vendas_feitas: number | null
        }
        Insert: {
          atc?: number | null
          atualizado_em?: string
          blocos_30min?: number | null
          comentarios?: number | null
          duracao_seg?: number | null
          espectadores?: number | null
          espectadores_engajados?: number | null
          inicio: string
          itens_confirmados?: number | null
          itens_feitos?: number | null
          pedidos_confirmados?: number | null
          pedidos_feitos?: number | null
          sessao_id: number
          status?: number | null
          tempo_medio_seg?: number | null
          titulo?: string | null
          vendas_confirmadas?: number | null
          vendas_feitas?: number | null
        }
        Update: {
          atc?: number | null
          atualizado_em?: string
          blocos_30min?: number | null
          comentarios?: number | null
          duracao_seg?: number | null
          espectadores?: number | null
          espectadores_engajados?: number | null
          inicio?: string
          itens_confirmados?: number | null
          itens_feitos?: number | null
          pedidos_confirmados?: number | null
          pedidos_feitos?: number | null
          sessao_id?: number
          status?: number | null
          tempo_medio_seg?: number | null
          titulo?: string | null
          vendas_confirmadas?: number | null
          vendas_feitas?: number | null
        }
        Relationships: []
      }
      live_site_atribuicao_dia: {
        Row: {
          atualizado_em: string
          dia: string
          fonte: string
          pedidos: number
          tipo: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          dia: string
          fonte?: string
          pedidos: number
          tipo: string
          valor: number
        }
        Update: {
          atualizado_em?: string
          dia?: string
          fonte?: string
          pedidos?: number
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      log_windsor_rodada_20260914: {
        Row: {
          disparado_em: string | null
          req_id: number | null
          rotulo: string
        }
        Insert: {
          disparado_em?: string | null
          req_id?: number | null
          rotulo: string
        }
        Update: {
          disparado_em?: string | null
          req_id?: number | null
          rotulo?: string
        }
        Relationships: []
      }
      map_utm_campanha: {
        Row: {
          campaign_id: string
          fonte: string
          utm_campaign: string
        }
        Insert: {
          campaign_id: string
          fonte: string
          utm_campaign: string
        }
        Update: {
          campaign_id?: string
          fonte?: string
          utm_campaign?: string
        }
        Relationships: []
      }
      "Meta Ads": {
        Row: {
          account_name: string | null
          campaign: string | null
          clicks: number | null
          datasource: string | null
          date: string | null
          source: string | null
          spend: number | null
        }
        Insert: {
          account_name?: string | null
          campaign?: string | null
          clicks?: number | null
          datasource?: string | null
          date?: string | null
          source?: string | null
          spend?: number | null
        }
        Update: {
          account_name?: string | null
          campaign?: string | null
          clicks?: number | null
          datasource?: string | null
          date?: string | null
          source?: string | null
          spend?: number | null
        }
        Relationships: []
      }
      meta_ads_asset: {
        Row: {
          ad_id: string
          asset_conteudo: string | null
          asset_id: string
          asset_tipo: string
          carregado_em: string
          data: string
          metrica: string
          valor: number | null
        }
        Insert: {
          ad_id: string
          asset_conteudo?: string | null
          asset_id: string
          asset_tipo: string
          carregado_em?: string
          data: string
          metrica: string
          valor?: number | null
        }
        Update: {
          ad_id?: string
          asset_conteudo?: string | null
          asset_id?: string
          asset_tipo?: string
          carregado_em?: string
          data?: string
          metrica?: string
          valor?: number | null
        }
        Relationships: []
      }
      meta_ads_demografia: {
        Row: {
          ad_id: string
          carregado_em: string
          data: string
          faixa_idade: string
          genero: string
          metrica: string
          valor: number | null
        }
        Insert: {
          ad_id: string
          carregado_em?: string
          data: string
          faixa_idade: string
          genero: string
          metrica: string
          valor?: number | null
        }
        Update: {
          ad_id?: string
          carregado_em?: string
          data?: string
          faixa_idade?: string
          genero?: string
          metrica?: string
          valor?: number | null
        }
        Relationships: []
      }
      meta_ads_hora: {
        Row: {
          ad_id: string
          carregado_em: string
          data: string
          hora: string
          metrica: string
          valor: number | null
        }
        Insert: {
          ad_id: string
          carregado_em?: string
          data: string
          hora: string
          metrica: string
          valor?: number | null
        }
        Update: {
          ad_id?: string
          carregado_em?: string
          data?: string
          hora?: string
          metrica?: string
          valor?: number | null
        }
        Relationships: []
      }
      meta_ads_intraday: {
        Row: {
          ad_id: string
          captured_at: string
          data: string
          metrica: string
          valor: number | null
        }
        Insert: {
          ad_id: string
          captured_at?: string
          data: string
          metrica: string
          valor?: number | null
        }
        Update: {
          ad_id?: string
          captured_at?: string
          data?: string
          metrica?: string
          valor?: number | null
        }
        Relationships: []
      }
      meta_ads_intraday_conta: {
        Row: {
          captured_at: string
          data: string
          metrica: string
          valor: number | null
        }
        Insert: {
          captured_at: string
          data: string
          metrica: string
          valor?: number | null
        }
        Update: {
          captured_at?: string
          data?: string
          metrica?: string
          valor?: number | null
        }
        Relationships: []
      }
      meta_ads_metricas: {
        Row: {
          ad_id: string
          carregado_em: string
          data: string
          metrica: string
          valor: number | null
        }
        Insert: {
          ad_id: string
          carregado_em?: string
          data: string
          metrica: string
          valor?: number | null
        }
        Update: {
          ad_id?: string
          carregado_em?: string
          data?: string
          metrica?: string
          valor?: number | null
        }
        Relationships: []
      }
      meta_ads_posicionamento: {
        Row: {
          ad_id: string
          carregado_em: string
          data: string
          dispositivo: string
          metrica: string
          plataforma: string
          posicionamento: string
          valor: number | null
        }
        Insert: {
          ad_id: string
          carregado_em?: string
          data: string
          dispositivo: string
          metrica: string
          plataforma: string
          posicionamento: string
          valor?: number | null
        }
        Update: {
          ad_id?: string
          carregado_em?: string
          data?: string
          dispositivo?: string
          metrica?: string
          plataforma?: string
          posicionamento?: string
          valor?: number | null
        }
        Relationships: []
      }
      meta_ads_regiao: {
        Row: {
          ad_id: string
          carregado_em: string
          data: string
          metrica: string
          regiao: string
          valor: number | null
        }
        Insert: {
          ad_id: string
          carregado_em?: string
          data: string
          metrica: string
          regiao: string
          valor?: number | null
        }
        Update: {
          ad_id?: string
          carregado_em?: string
          data?: string
          metrica?: string
          regiao?: string
          valor?: number | null
        }
        Relationships: []
      }
      meta_ads_tipo_mes: {
        Row: {
          alterado_em: string | null
          alterado_por: string | null
          canal: string
          invest_meta: number
          mes: string
          origem: string
          tipo: string
        }
        Insert: {
          alterado_em?: string | null
          alterado_por?: string | null
          canal: string
          invest_meta: number
          mes: string
          origem?: string
          tipo: string
        }
        Update: {
          alterado_em?: string | null
          alterado_por?: string | null
          canal?: string
          invest_meta?: number
          mes?: string
          origem?: string
          tipo?: string
        }
        Relationships: []
      }
      meta_canal_mes: {
        Row: {
          alterado_em: string | null
          alterado_por: string | null
          atualizado_em: string
          canal: string
          comissao_afil_meta: number | null
          invest_ads_meta: number | null
          invest_afil_meta: number | null
          mes: string
          receita_ads_meta: number | null
          receita_afil_meta: number | null
          receita_total_meta: number | null
          share_afil_meta: number | null
        }
        Insert: {
          alterado_em?: string | null
          alterado_por?: string | null
          atualizado_em?: string
          canal: string
          comissao_afil_meta?: number | null
          invest_ads_meta?: number | null
          invest_afil_meta?: number | null
          mes: string
          receita_ads_meta?: number | null
          receita_afil_meta?: number | null
          receita_total_meta?: number | null
          share_afil_meta?: number | null
        }
        Update: {
          alterado_em?: string | null
          alterado_por?: string | null
          atualizado_em?: string
          canal?: string
          comissao_afil_meta?: number | null
          invest_ads_meta?: number | null
          invest_afil_meta?: number | null
          mes?: string
          receita_ads_meta?: number | null
          receita_afil_meta?: number | null
          receita_total_meta?: number | null
          share_afil_meta?: number | null
        }
        Relationships: []
      }
      meta_credentials: {
        Row: {
          access_token: string | null
          ad_account_id: string | null
          app_id: string | null
          atualizado_em: string | null
          business_id: string | null
          id: number
          system_user_id: string | null
          token_expira_em: string | null
          token_scopes: string | null
        }
        Insert: {
          access_token?: string | null
          ad_account_id?: string | null
          app_id?: string | null
          atualizado_em?: string | null
          business_id?: string | null
          id?: number
          system_user_id?: string | null
          token_expira_em?: string | null
          token_scopes?: string | null
        }
        Update: {
          access_token?: string | null
          ad_account_id?: string | null
          app_id?: string | null
          atualizado_em?: string | null
          business_id?: string | null
          id?: number
          system_user_id?: string | null
          token_expira_em?: string | null
          token_scopes?: string | null
        }
        Relationships: []
      }
      meta_curva_dia: {
        Row: {
          alterado_em: string | null
          alterado_por: string | null
          canal: string
          data: string
          mes: string
          peso: number
        }
        Insert: {
          alterado_em?: string | null
          alterado_por?: string | null
          canal: string
          data: string
          mes: string
          peso: number
        }
        Update: {
          alterado_em?: string | null
          alterado_por?: string | null
          canal?: string
          data?: string
          mes?: string
          peso?: number
        }
        Relationships: []
      }
      meta_evento: {
        Row: {
          alterado_em: string | null
          alterado_por: string | null
          data: string
          obs: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          alterado_em?: string | null
          alterado_por?: string | null
          data: string
          obs?: string | null
          tipo?: string
          titulo: string
        }
        Update: {
          alterado_em?: string | null
          alterado_por?: string | null
          data?: string
          obs?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      meta_intraday_erro: {
        Row: {
          calculado_em: string
          canal: string
          hora: number
          n_dias: number | null
          q10: number | null
          q50: number | null
          q90: number | null
        }
        Insert: {
          calculado_em?: string
          canal: string
          hora: number
          n_dias?: number | null
          q10?: number | null
          q50?: number | null
          q90?: number | null
        }
        Update: {
          calculado_em?: string
          canal?: string
          hora?: number
          n_dias?: number | null
          q10?: number | null
          q50?: number | null
          q90?: number | null
        }
        Relationships: []
      }
      metas: {
        Row: {
          canal_venda: string
          mes: string
          meta_receita: number | null
        }
        Insert: {
          canal_venda: string
          mes: string
          meta_receita?: number | null
        }
        Update: {
          canal_venda?: string
          mes?: string
          meta_receita?: number | null
        }
        Relationships: []
      }
      midia_observacao_dia: {
        Row: {
          alterado_em: string | null
          alterado_por: string | null
          atualizado_em: string
          canal: string | null
          criado_em: string
          data: string
          id: string
          texto: string
          tipo: string
        }
        Insert: {
          alterado_em?: string | null
          alterado_por?: string | null
          atualizado_em?: string
          canal?: string | null
          criado_em?: string
          data: string
          id?: string
          texto: string
          tipo?: string
        }
        Update: {
          alterado_em?: string | null
          alterado_por?: string | null
          atualizado_em?: string
          canal?: string | null
          criado_em?: string
          data?: string
          id?: string
          texto?: string
          tipo?: string
        }
        Relationships: []
      }
      ml_afiliado_config: {
        Row: {
          atualizado_em: string
          id: number
          push_token_sha256: string
        }
        Insert: {
          atualizado_em?: string
          id?: number
          push_token_sha256: string
        }
        Update: {
          atualizado_em?: string
          id?: number
          push_token_sha256?: string
        }
        Relationships: []
      }
      ml_afiliado_fila: {
        Row: {
          atualizado_em: string
          data: string
          erro: string | null
          linhas: number | null
          paginas: number | null
          status: string
          tentativas: number
          total_ml: number | null
        }
        Insert: {
          atualizado_em?: string
          data: string
          erro?: string | null
          linhas?: number | null
          paginas?: number | null
          status?: string
          tentativas?: number
          total_ml?: number | null
        }
        Update: {
          atualizado_em?: string
          data?: string
          erro?: string | null
          linhas?: number | null
          paginas?: number | null
          status?: string
          tentativas?: number
          total_ml?: number | null
        }
        Relationships: []
      }
      ml_afiliado_venda: {
        Row: {
          afiliado_nome: string | null
          afiliado_username: string | null
          campanha_id: string | null
          campanha_tipo: string | null
          carregado_em: string
          casou_pedido: boolean
          categoria: string | null
          comissao_pedido: number | null
          comissao_unidade: number | null
          conversao_fim: string | null
          data_ml: string
          data_venda: string | null
          fee: number | null
          fee_pct: number | null
          item_id: string
          item_id_ml: string | null
          pedido_id: number
          preco: number | null
          quantidade: number | null
          raw: Json | null
          seller_sku: string | null
          titulo: string | null
          valor_venda: number | null
          verificado: string | null
        }
        Insert: {
          afiliado_nome?: string | null
          afiliado_username?: string | null
          campanha_id?: string | null
          campanha_tipo?: string | null
          carregado_em?: string
          casou_pedido?: boolean
          categoria?: string | null
          comissao_pedido?: number | null
          comissao_unidade?: number | null
          conversao_fim?: string | null
          data_ml: string
          data_venda?: string | null
          fee?: number | null
          fee_pct?: number | null
          item_id: string
          item_id_ml?: string | null
          pedido_id: number
          preco?: number | null
          quantidade?: number | null
          raw?: Json | null
          seller_sku?: string | null
          titulo?: string | null
          valor_venda?: number | null
          verificado?: string | null
        }
        Update: {
          afiliado_nome?: string | null
          afiliado_username?: string | null
          campanha_id?: string | null
          campanha_tipo?: string | null
          carregado_em?: string
          casou_pedido?: boolean
          categoria?: string | null
          comissao_pedido?: number | null
          comissao_unidade?: number | null
          conversao_fim?: string | null
          data_ml?: string
          data_venda?: string | null
          fee?: number | null
          fee_pct?: number | null
          item_id?: string
          item_id_ml?: string | null
          pedido_id?: number
          preco?: number | null
          quantidade?: number | null
          raw?: Json | null
          seller_sku?: string | null
          titulo?: string | null
          valor_venda?: number | null
          verificado?: string | null
        }
        Relationships: []
      }
      ml_anuncio_hist: {
        Row: {
          campo: string
          id: number
          item_id: string
          mudou_em: string | null
          valor_antigo: string | null
          valor_novo: string | null
        }
        Insert: {
          campo: string
          id?: number
          item_id: string
          mudou_em?: string | null
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo?: string
          id?: number
          item_id?: string
          mudou_em?: string | null
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      ml_brand_ads_campanha: {
        Row: {
          advertiser_id: string
          atualizado_em: string
          budget_amount: number | null
          budget_currency: string | null
          campaign_id: number
          campaign_type: string | null
          cpc: number | null
          destination_id: number | null
          end_date: string | null
          headline: string | null
          name: string | null
          status: string | null
        }
        Insert: {
          advertiser_id: string
          atualizado_em?: string
          budget_amount?: number | null
          budget_currency?: string | null
          campaign_id: number
          campaign_type?: string | null
          cpc?: number | null
          destination_id?: number | null
          end_date?: string | null
          headline?: string | null
          name?: string | null
          status?: string | null
        }
        Update: {
          advertiser_id?: string
          atualizado_em?: string
          budget_amount?: number | null
          budget_currency?: string | null
          campaign_id?: number
          campaign_type?: string | null
          cpc?: number | null
          destination_id?: number | null
          end_date?: string | null
          headline?: string | null
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ml_brand_ads_item: {
        Row: {
          advertiser_id: string
          atualizado_em: string
          campaign_id: number
          item_id: string
          status: string | null
        }
        Insert: {
          advertiser_id: string
          atualizado_em?: string
          campaign_id: number
          item_id: string
          status?: string | null
        }
        Update: {
          advertiser_id?: string
          atualizado_em?: string
          campaign_id?: number
          item_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_brand_ads_item_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_brand_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "ml_brand_ads_item_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_brand_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      ml_brand_ads_keyword: {
        Row: {
          advertiser_id: string
          atualizado_em: string
          campaign_id: number | null
          cpc: number | null
          is_negative: boolean | null
          keyword_id: number
          match_type: string | null
          term: string | null
          type: string | null
        }
        Insert: {
          advertiser_id: string
          atualizado_em?: string
          campaign_id?: number | null
          cpc?: number | null
          is_negative?: boolean | null
          keyword_id: number
          match_type?: string | null
          term?: string | null
          type?: string | null
        }
        Update: {
          advertiser_id?: string
          atualizado_em?: string
          campaign_id?: number | null
          cpc?: number | null
          is_negative?: boolean | null
          keyword_id?: number
          match_type?: string | null
          term?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_brand_ads_keyword_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_brand_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "ml_brand_ads_keyword_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_brand_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      ml_brand_ads_keyword_metricas: {
        Row: {
          acos: number | null
          advertiser_id: string
          attribution_order_amount: number | null
          attribution_order_conversions: number | null
          atualizado_em: string
          campaign_id: number | null
          clicks: number | null
          consumed_budget: number | null
          cost_per_clicks: number | null
          cpc_below_recommended: boolean | null
          ctr: number | null
          cvr: number | null
          date: string
          goal_cpc_max: number | null
          id: number
          is_deleted: boolean | null
          keyword: string | null
          keyword_id: number
          leads: number | null
          prints: number | null
          recommended_cpc: number | null
          roas: number | null
          won_auctions: number | null
        }
        Insert: {
          acos?: number | null
          advertiser_id: string
          attribution_order_amount?: number | null
          attribution_order_conversions?: number | null
          atualizado_em?: string
          campaign_id?: number | null
          clicks?: number | null
          consumed_budget?: number | null
          cost_per_clicks?: number | null
          cpc_below_recommended?: boolean | null
          ctr?: number | null
          cvr?: number | null
          date: string
          goal_cpc_max?: number | null
          id?: never
          is_deleted?: boolean | null
          keyword?: string | null
          keyword_id: number
          leads?: number | null
          prints?: number | null
          recommended_cpc?: number | null
          roas?: number | null
          won_auctions?: number | null
        }
        Update: {
          acos?: number | null
          advertiser_id?: string
          attribution_order_amount?: number | null
          attribution_order_conversions?: number | null
          atualizado_em?: string
          campaign_id?: number | null
          clicks?: number | null
          consumed_budget?: number | null
          cost_per_clicks?: number | null
          cpc_below_recommended?: boolean | null
          ctr?: number | null
          cvr?: number | null
          date?: string
          goal_cpc_max?: number | null
          id?: never
          is_deleted?: boolean | null
          keyword?: string | null
          keyword_id?: number
          leads?: number | null
          prints?: number | null
          recommended_cpc?: number | null
          roas?: number | null
          won_auctions?: number | null
        }
        Relationships: []
      }
      ml_brand_ads_metricas_dia: {
        Row: {
          acos: number | null
          advertiser_id: string
          attribution_order_amount: number | null
          attribution_order_conversions: number | null
          atualizado_em: string
          clicks: number | null
          consumed_budget: number | null
          cost_per_clicks: number | null
          ctr: number | null
          cvr: number | null
          date: string
          id: number
          leads: number | null
          prints: number | null
          roas: number | null
        }
        Insert: {
          acos?: number | null
          advertiser_id: string
          attribution_order_amount?: number | null
          attribution_order_conversions?: number | null
          atualizado_em?: string
          clicks?: number | null
          consumed_budget?: number | null
          cost_per_clicks?: number | null
          ctr?: number | null
          cvr?: number | null
          date: string
          id?: never
          leads?: number | null
          prints?: number | null
          roas?: number | null
        }
        Update: {
          acos?: number | null
          advertiser_id?: string
          attribution_order_amount?: number | null
          attribution_order_conversions?: number | null
          atualizado_em?: string
          clicks?: number | null
          consumed_budget?: number | null
          cost_per_clicks?: number | null
          ctr?: number | null
          cvr?: number | null
          date?: string
          id?: never
          leads?: number | null
          prints?: number | null
          roas?: number | null
        }
        Relationships: []
      }
      ml_categoria_snapshot: {
        Row: {
          categoria: string
          coletado_em: string
          data_ref: string
          preco_medio: number | null
          tendencia_pct: number | null
          unidades: number | null
          vendas_brutas: number | null
        }
        Insert: {
          categoria: string
          coletado_em?: string
          data_ref: string
          preco_medio?: number | null
          tendencia_pct?: number | null
          unidades?: number | null
          vendas_brutas?: number | null
        }
        Update: {
          categoria?: string
          coletado_em?: string
          data_ref?: string
          preco_medio?: number | null
          tendencia_pct?: number | null
          unidades?: number | null
          vendas_brutas?: number | null
        }
        Relationships: []
      }
      ml_cliente_fila: {
        Row: {
          claimed_em: string | null
          data_venda: string | null
          estado: string
          feito_em: string | null
          pedido_id: number
          tentativas: number
        }
        Insert: {
          claimed_em?: string | null
          data_venda?: string | null
          estado?: string
          feito_em?: string | null
          pedido_id: number
          tentativas?: number
        }
        Update: {
          claimed_em?: string | null
          data_venda?: string | null
          estado?: string
          feito_em?: string | null
          pedido_id?: number
          tentativas?: number
        }
        Relationships: []
      }
      ml_concorrente_snapshot: {
        Row: {
          alias: string
          base_anterior_acum: number | null
          base_estimada: boolean
          base_fonte: string
          categoria: string
          coletado_em: string
          conversao_pct: number | null
          data_ref: string
          eh_piso: boolean
          posicao: number | null
          receita_acum: number | null
          unidades_acum: number | null
          vendas_acum: number | null
          visitas_acum: number | null
        }
        Insert: {
          alias: string
          base_anterior_acum?: number | null
          base_estimada?: boolean
          base_fonte?: string
          categoria: string
          coletado_em?: string
          conversao_pct?: number | null
          data_ref: string
          eh_piso?: boolean
          posicao?: number | null
          receita_acum?: number | null
          unidades_acum?: number | null
          vendas_acum?: number | null
          visitas_acum?: number | null
        }
        Update: {
          alias?: string
          base_anterior_acum?: number | null
          base_estimada?: boolean
          base_fonte?: string
          categoria?: string
          coletado_em?: string
          conversao_pct?: number | null
          data_ref?: string
          eh_piso?: boolean
          posicao?: number | null
          receita_acum?: number | null
          unidades_acum?: number | null
          vendas_acum?: number | null
          visitas_acum?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_concorrente_snapshot_alias_fkey"
            columns: ["alias"]
            isOneToOne: false
            referencedRelation: "dim_ml_concorrente"
            referencedColumns: ["alias"]
          },
        ]
      }
      ml_credentials: {
        Row: {
          access_token: string | null
          account_name: string | null
          advertiser_id: string
          client_id: string
          client_secret: string
          expires_at: string | null
          refresh_token: string
          seller_id: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          account_name?: string | null
          advertiser_id: string
          client_id: string
          client_secret: string
          expires_at?: string | null
          refresh_token: string
          seller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          account_name?: string | null
          advertiser_id?: string
          client_id?: string
          client_secret?: string
          expires_at?: string | null
          refresh_token?: string
          seller_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ml_cupom_dia: {
        Row: {
          carregado_em: string
          cupom_meli: number
          cupom_vendedor: number
          data_venda: string
          fonte: string
          pedidos: number
          receita: number
        }
        Insert: {
          carregado_em?: string
          cupom_meli: number
          cupom_vendedor: number
          data_venda: string
          fonte?: string
          pedidos: number
          receita: number
        }
        Update: {
          carregado_em?: string
          cupom_meli?: number
          cupom_vendedor?: number
          data_venda?: string
          fonte?: string
          pedidos?: number
          receita?: number
        }
        Relationships: []
      }
      ml_cupom_sku_mes: {
        Row: {
          carregado_em: string
          competencia: string
          cupom_meli: number
          cupom_vendedor: number
          fonte: string
          pedidos: number
          receita: number
          seller_sku: string
        }
        Insert: {
          carregado_em?: string
          competencia: string
          cupom_meli: number
          cupom_vendedor: number
          fonte?: string
          pedidos: number
          receita: number
          seller_sku: string
        }
        Update: {
          carregado_em?: string
          competencia?: string
          cupom_meli?: number
          cupom_vendedor?: number
          fonte?: string
          pedidos?: number
          receita?: number
          seller_sku?: string
        }
        Relationships: []
      }
      ml_display_campanha: {
        Row: {
          advertiser_id: string
          campaign_id: number
          end_date: string | null
          goal: string | null
          name: string | null
          site_id: string | null
          start_date: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          advertiser_id: string
          campaign_id: number
          end_date?: string | null
          goal?: string | null
          name?: string | null
          site_id?: string | null
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string
          campaign_id?: number
          end_date?: string | null
          goal?: string | null
          name?: string | null
          site_id?: string | null
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ml_display_campanha_metricas: {
        Row: {
          active_views: number | null
          advertiser_id: string
          average_frequency: number | null
          campaign_id: number | null
          clicks: number | null
          completed_views: number | null
          consumed_budget: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          currency: string | null
          date: string
          et_attribution_add_to_cart: number | null
          et_attribution_bookmark: number | null
          et_attribution_checkout: number | null
          et_attribution_leads: number | null
          et_attribution_ppv: number | null
          et_cpa_order: number | null
          et_cpa_ppv: number | null
          et_cpl: number | null
          et_direct_amount: number | null
          et_direct_item_quantity: number | null
          et_roas: number | null
          et_units_quantity: number | null
          id: number
          prints: number | null
          q100: number | null
          q25: number | null
          q50: number | null
          q75: number | null
          reach: number | null
          site_id: string | null
          tp_attribution_add_to_cart: number | null
          tp_attribution_bookmark: number | null
          tp_attribution_checkout: number | null
          tp_attribution_leads: number | null
          tp_attribution_ppv: number | null
          tp_cpa_order: number | null
          tp_cpa_ppv: number | null
          tp_cpl: number | null
          tp_direct_amount: number | null
          tp_direct_item_quantity: number | null
          tp_roas: number | null
          tp_units_quantity: number | null
        }
        Insert: {
          active_views?: number | null
          advertiser_id: string
          average_frequency?: number | null
          campaign_id?: number | null
          clicks?: number | null
          completed_views?: number | null
          consumed_budget?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          currency?: string | null
          date: string
          et_attribution_add_to_cart?: number | null
          et_attribution_bookmark?: number | null
          et_attribution_checkout?: number | null
          et_attribution_leads?: number | null
          et_attribution_ppv?: number | null
          et_cpa_order?: number | null
          et_cpa_ppv?: number | null
          et_cpl?: number | null
          et_direct_amount?: number | null
          et_direct_item_quantity?: number | null
          et_roas?: number | null
          et_units_quantity?: number | null
          id?: number
          prints?: number | null
          q100?: number | null
          q25?: number | null
          q50?: number | null
          q75?: number | null
          reach?: number | null
          site_id?: string | null
          tp_attribution_add_to_cart?: number | null
          tp_attribution_bookmark?: number | null
          tp_attribution_checkout?: number | null
          tp_attribution_leads?: number | null
          tp_attribution_ppv?: number | null
          tp_cpa_order?: number | null
          tp_cpa_ppv?: number | null
          tp_cpl?: number | null
          tp_direct_amount?: number | null
          tp_direct_item_quantity?: number | null
          tp_roas?: number | null
          tp_units_quantity?: number | null
        }
        Update: {
          active_views?: number | null
          advertiser_id?: string
          average_frequency?: number | null
          campaign_id?: number | null
          clicks?: number | null
          completed_views?: number | null
          consumed_budget?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          currency?: string | null
          date?: string
          et_attribution_add_to_cart?: number | null
          et_attribution_bookmark?: number | null
          et_attribution_checkout?: number | null
          et_attribution_leads?: number | null
          et_attribution_ppv?: number | null
          et_cpa_order?: number | null
          et_cpa_ppv?: number | null
          et_cpl?: number | null
          et_direct_amount?: number | null
          et_direct_item_quantity?: number | null
          et_roas?: number | null
          et_units_quantity?: number | null
          id?: number
          prints?: number | null
          q100?: number | null
          q25?: number | null
          q50?: number | null
          q75?: number | null
          reach?: number | null
          site_id?: string | null
          tp_attribution_add_to_cart?: number | null
          tp_attribution_bookmark?: number | null
          tp_attribution_checkout?: number | null
          tp_attribution_leads?: number | null
          tp_attribution_ppv?: number | null
          tp_cpa_order?: number | null
          tp_cpa_ppv?: number | null
          tp_cpl?: number | null
          tp_direct_amount?: number | null
          tp_direct_item_quantity?: number | null
          tp_roas?: number | null
          tp_units_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_display_campanha_metricas_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_display_campanha"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      ml_display_criativo: {
        Row: {
          advertiser_id: string
          campaign_id: number
          creative_id: number
          line_item_id: number
          name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          advertiser_id: string
          campaign_id: number
          creative_id: number
          line_item_id: number
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string
          campaign_id?: number
          creative_id?: number
          line_item_id?: number
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_display_criativo_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_display_campanha"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "ml_display_criativo_line_item_id_fkey"
            columns: ["line_item_id"]
            isOneToOne: false
            referencedRelation: "ml_display_line_item"
            referencedColumns: ["line_item_id"]
          },
        ]
      }
      ml_display_criativo_metricas: {
        Row: {
          active_views: number | null
          advertiser_id: string
          average_frequency: number | null
          campaign_id: number
          clicks: number | null
          completed_views: number | null
          consumed_budget: number | null
          cpc: number | null
          cpm: number | null
          creative_id: number
          ctr: number | null
          currency: string | null
          date: string
          et_attribution_add_to_cart: number | null
          et_attribution_bookmark: number | null
          et_attribution_checkout: number | null
          et_attribution_leads: number | null
          et_attribution_ppv: number | null
          et_cpa_order: number | null
          et_cpa_ppv: number | null
          et_cpl: number | null
          et_direct_amount: number | null
          et_direct_item_quantity: number | null
          et_roas: number | null
          et_units_quantity: number | null
          id: number
          line_item_id: number
          prints: number | null
          q100: number | null
          q25: number | null
          q50: number | null
          q75: number | null
          reach: number | null
          site_id: string | null
          tp_attribution_add_to_cart: number | null
          tp_attribution_bookmark: number | null
          tp_attribution_checkout: number | null
          tp_attribution_leads: number | null
          tp_attribution_ppv: number | null
          tp_cpa_order: number | null
          tp_cpa_ppv: number | null
          tp_cpl: number | null
          tp_direct_amount: number | null
          tp_direct_item_quantity: number | null
          tp_roas: number | null
          tp_units_quantity: number | null
        }
        Insert: {
          active_views?: number | null
          advertiser_id: string
          average_frequency?: number | null
          campaign_id: number
          clicks?: number | null
          completed_views?: number | null
          consumed_budget?: number | null
          cpc?: number | null
          cpm?: number | null
          creative_id: number
          ctr?: number | null
          currency?: string | null
          date: string
          et_attribution_add_to_cart?: number | null
          et_attribution_bookmark?: number | null
          et_attribution_checkout?: number | null
          et_attribution_leads?: number | null
          et_attribution_ppv?: number | null
          et_cpa_order?: number | null
          et_cpa_ppv?: number | null
          et_cpl?: number | null
          et_direct_amount?: number | null
          et_direct_item_quantity?: number | null
          et_roas?: number | null
          et_units_quantity?: number | null
          id?: number
          line_item_id: number
          prints?: number | null
          q100?: number | null
          q25?: number | null
          q50?: number | null
          q75?: number | null
          reach?: number | null
          site_id?: string | null
          tp_attribution_add_to_cart?: number | null
          tp_attribution_bookmark?: number | null
          tp_attribution_checkout?: number | null
          tp_attribution_leads?: number | null
          tp_attribution_ppv?: number | null
          tp_cpa_order?: number | null
          tp_cpa_ppv?: number | null
          tp_cpl?: number | null
          tp_direct_amount?: number | null
          tp_direct_item_quantity?: number | null
          tp_roas?: number | null
          tp_units_quantity?: number | null
        }
        Update: {
          active_views?: number | null
          advertiser_id?: string
          average_frequency?: number | null
          campaign_id?: number
          clicks?: number | null
          completed_views?: number | null
          consumed_budget?: number | null
          cpc?: number | null
          cpm?: number | null
          creative_id?: number
          ctr?: number | null
          currency?: string | null
          date?: string
          et_attribution_add_to_cart?: number | null
          et_attribution_bookmark?: number | null
          et_attribution_checkout?: number | null
          et_attribution_leads?: number | null
          et_attribution_ppv?: number | null
          et_cpa_order?: number | null
          et_cpa_ppv?: number | null
          et_cpl?: number | null
          et_direct_amount?: number | null
          et_direct_item_quantity?: number | null
          et_roas?: number | null
          et_units_quantity?: number | null
          id?: number
          line_item_id?: number
          prints?: number | null
          q100?: number | null
          q25?: number | null
          q50?: number | null
          q75?: number | null
          reach?: number | null
          site_id?: string | null
          tp_attribution_add_to_cart?: number | null
          tp_attribution_bookmark?: number | null
          tp_attribution_checkout?: number | null
          tp_attribution_leads?: number | null
          tp_attribution_ppv?: number | null
          tp_cpa_order?: number | null
          tp_cpa_ppv?: number | null
          tp_cpl?: number | null
          tp_direct_amount?: number | null
          tp_direct_item_quantity?: number | null
          tp_roas?: number | null
          tp_units_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_display_criativo_metricas_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_display_campanha"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "ml_display_criativo_metricas_creative_id_line_item_id_fkey"
            columns: ["creative_id", "line_item_id"]
            isOneToOne: false
            referencedRelation: "ml_display_criativo"
            referencedColumns: ["creative_id", "line_item_id"]
          },
        ]
      }
      ml_display_line_item: {
        Row: {
          advertiser_id: string
          campaign_id: number | null
          end_date: string | null
          line_item_id: number
          name: string | null
          start_date: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          advertiser_id: string
          campaign_id?: number | null
          end_date?: string | null
          line_item_id: number
          name?: string | null
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string
          campaign_id?: number | null
          end_date?: string | null
          line_item_id?: number
          name?: string | null
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_display_line_item_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_display_campanha"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      ml_display_line_item_metricas: {
        Row: {
          active_views: number | null
          advertiser_id: string
          average_frequency: number | null
          campaign_id: number | null
          clicks: number | null
          completed_views: number | null
          consumed_budget: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          currency: string | null
          date: string
          et_attribution_add_to_cart: number | null
          et_attribution_bookmark: number | null
          et_attribution_checkout: number | null
          et_attribution_leads: number | null
          et_attribution_ppv: number | null
          et_cpa_order: number | null
          et_cpa_ppv: number | null
          et_cpl: number | null
          et_direct_amount: number | null
          et_direct_item_quantity: number | null
          et_roas: number | null
          et_units_quantity: number | null
          id: number
          line_item_id: number | null
          prints: number | null
          q100: number | null
          q25: number | null
          q50: number | null
          q75: number | null
          reach: number | null
          site_id: string | null
          tp_attribution_add_to_cart: number | null
          tp_attribution_bookmark: number | null
          tp_attribution_checkout: number | null
          tp_attribution_leads: number | null
          tp_attribution_ppv: number | null
          tp_cpa_order: number | null
          tp_cpa_ppv: number | null
          tp_cpl: number | null
          tp_direct_amount: number | null
          tp_direct_item_quantity: number | null
          tp_roas: number | null
          tp_units_quantity: number | null
        }
        Insert: {
          active_views?: number | null
          advertiser_id: string
          average_frequency?: number | null
          campaign_id?: number | null
          clicks?: number | null
          completed_views?: number | null
          consumed_budget?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          currency?: string | null
          date: string
          et_attribution_add_to_cart?: number | null
          et_attribution_bookmark?: number | null
          et_attribution_checkout?: number | null
          et_attribution_leads?: number | null
          et_attribution_ppv?: number | null
          et_cpa_order?: number | null
          et_cpa_ppv?: number | null
          et_cpl?: number | null
          et_direct_amount?: number | null
          et_direct_item_quantity?: number | null
          et_roas?: number | null
          et_units_quantity?: number | null
          id?: number
          line_item_id?: number | null
          prints?: number | null
          q100?: number | null
          q25?: number | null
          q50?: number | null
          q75?: number | null
          reach?: number | null
          site_id?: string | null
          tp_attribution_add_to_cart?: number | null
          tp_attribution_bookmark?: number | null
          tp_attribution_checkout?: number | null
          tp_attribution_leads?: number | null
          tp_attribution_ppv?: number | null
          tp_cpa_order?: number | null
          tp_cpa_ppv?: number | null
          tp_cpl?: number | null
          tp_direct_amount?: number | null
          tp_direct_item_quantity?: number | null
          tp_roas?: number | null
          tp_units_quantity?: number | null
        }
        Update: {
          active_views?: number | null
          advertiser_id?: string
          average_frequency?: number | null
          campaign_id?: number | null
          clicks?: number | null
          completed_views?: number | null
          consumed_budget?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          currency?: string | null
          date?: string
          et_attribution_add_to_cart?: number | null
          et_attribution_bookmark?: number | null
          et_attribution_checkout?: number | null
          et_attribution_leads?: number | null
          et_attribution_ppv?: number | null
          et_cpa_order?: number | null
          et_cpa_ppv?: number | null
          et_cpl?: number | null
          et_direct_amount?: number | null
          et_direct_item_quantity?: number | null
          et_roas?: number | null
          et_units_quantity?: number | null
          id?: number
          line_item_id?: number | null
          prints?: number | null
          q100?: number | null
          q25?: number | null
          q50?: number | null
          q75?: number | null
          reach?: number | null
          site_id?: string | null
          tp_attribution_add_to_cart?: number | null
          tp_attribution_bookmark?: number | null
          tp_attribution_checkout?: number | null
          tp_attribution_leads?: number | null
          tp_attribution_ppv?: number | null
          tp_cpa_order?: number | null
          tp_cpa_ppv?: number | null
          tp_cpl?: number | null
          tp_direct_amount?: number | null
          tp_direct_item_quantity?: number | null
          tp_roas?: number | null
          tp_units_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_display_line_item_metricas_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_display_campanha"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "ml_display_line_item_metricas_line_item_id_fkey"
            columns: ["line_item_id"]
            isOneToOne: false
            referencedRelation: "ml_display_line_item"
            referencedColumns: ["line_item_id"]
          },
        ]
      }
      ml_display_metricas: {
        Row: {
          advertiser_id: string
          campaign_id: string
          clicks: number | null
          consumed_budget: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          date: string
          et_attribution_add_to_cart: number | null
          et_attribution_checkout: number | null
          et_attribution_ppv: number | null
          et_cpa_order: number | null
          et_direct_amount: number | null
          et_roas: number | null
          et_units_quantity: number | null
          id: number
          prints: number | null
          reach: number | null
          tp_cpa_order: number | null
          tp_direct_amount: number | null
          tp_roas: number | null
          tp_units_quantity: number | null
        }
        Insert: {
          advertiser_id: string
          campaign_id: string
          clicks?: number | null
          consumed_budget?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          date: string
          et_attribution_add_to_cart?: number | null
          et_attribution_checkout?: number | null
          et_attribution_ppv?: number | null
          et_cpa_order?: number | null
          et_direct_amount?: number | null
          et_roas?: number | null
          et_units_quantity?: number | null
          id?: number
          prints?: number | null
          reach?: number | null
          tp_cpa_order?: number | null
          tp_direct_amount?: number | null
          tp_roas?: number | null
          tp_units_quantity?: number | null
        }
        Update: {
          advertiser_id?: string
          campaign_id?: string
          clicks?: number | null
          consumed_budget?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          date?: string
          et_attribution_add_to_cart?: number | null
          et_attribution_checkout?: number | null
          et_attribution_ppv?: number | null
          et_cpa_order?: number | null
          et_direct_amount?: number | null
          et_roas?: number | null
          et_units_quantity?: number | null
          id?: number
          prints?: number | null
          reach?: number | null
          tp_cpa_order?: number | null
          tp_direct_amount?: number | null
          tp_roas?: number | null
          tp_units_quantity?: number | null
        }
        Relationships: []
      }
      ml_historico_fila: {
        Row: {
          atualizado: string | null
          auditado_em: string | null
          completo: boolean | null
          dia: string
          itens: number | null
          itens_status: string | null
          no_banco: number | null
          pedidos: number | null
          refaz_hora: number | null
          refaz_status: string | null
          status: string
          tentativas: number
          total_api: number | null
        }
        Insert: {
          atualizado?: string | null
          auditado_em?: string | null
          completo?: boolean | null
          dia: string
          itens?: number | null
          itens_status?: string | null
          no_banco?: number | null
          pedidos?: number | null
          refaz_hora?: number | null
          refaz_status?: string | null
          status?: string
          tentativas?: number
          total_api?: number | null
        }
        Update: {
          atualizado?: string | null
          auditado_em?: string | null
          completo?: boolean | null
          dia?: string
          itens?: number | null
          itens_status?: string | null
          no_banco?: number | null
          pedidos?: number | null
          refaz_hora?: number | null
          refaz_status?: string | null
          status?: string
          tentativas?: number
          total_api?: number | null
        }
        Relationships: []
      }
      ml_item: {
        Row: {
          advertiser_id: string
          available_quantity: number | null
          base_price: number | null
          carregado_em: string
          catalog_listing: boolean | null
          catalog_product_id: string | null
          category_id: string | null
          condition: string | null
          domain_id: string | null
          em_promocao: boolean | null
          free_shipping: boolean | null
          health: number | null
          initial_quantity: number | null
          item_id: string
          item_last_updated: string | null
          listing_type_id: string | null
          logistic_type: string | null
          official_store_id: number | null
          original_price: number | null
          permalink: string | null
          preco_regular: number | null
          preco_venda: number | null
          price: number | null
          promo_campanha: string | null
          raw: Json
          seller_id: string | null
          seller_sku: string | null
          sold_quantity: number | null
          start_time: string | null
          status: string | null
          sub_status: Json | null
          tags: Json | null
          thumbnail: string | null
          tipo_promocao: string | null
          title: string | null
        }
        Insert: {
          advertiser_id?: string
          available_quantity?: number | null
          base_price?: number | null
          carregado_em?: string
          catalog_listing?: boolean | null
          catalog_product_id?: string | null
          category_id?: string | null
          condition?: string | null
          domain_id?: string | null
          em_promocao?: boolean | null
          free_shipping?: boolean | null
          health?: number | null
          initial_quantity?: number | null
          item_id: string
          item_last_updated?: string | null
          listing_type_id?: string | null
          logistic_type?: string | null
          official_store_id?: number | null
          original_price?: number | null
          permalink?: string | null
          preco_regular?: number | null
          preco_venda?: number | null
          price?: number | null
          promo_campanha?: string | null
          raw: Json
          seller_id?: string | null
          seller_sku?: string | null
          sold_quantity?: number | null
          start_time?: string | null
          status?: string | null
          sub_status?: Json | null
          tags?: Json | null
          thumbnail?: string | null
          tipo_promocao?: string | null
          title?: string | null
        }
        Update: {
          advertiser_id?: string
          available_quantity?: number | null
          base_price?: number | null
          carregado_em?: string
          catalog_listing?: boolean | null
          catalog_product_id?: string | null
          category_id?: string | null
          condition?: string | null
          domain_id?: string | null
          em_promocao?: boolean | null
          free_shipping?: boolean | null
          health?: number | null
          initial_quantity?: number | null
          item_id?: string
          item_last_updated?: string | null
          listing_type_id?: string | null
          logistic_type?: string | null
          official_store_id?: number | null
          original_price?: number | null
          permalink?: string | null
          preco_regular?: number | null
          preco_venda?: number | null
          price?: number | null
          promo_campanha?: string | null
          raw?: Json
          seller_id?: string | null
          seller_sku?: string | null
          sold_quantity?: number | null
          start_time?: string | null
          status?: string | null
          sub_status?: Json | null
          tags?: Json | null
          thumbnail?: string | null
          tipo_promocao?: string | null
          title?: string | null
        }
        Relationships: []
      }
      ml_item_competicao: {
        Row: {
          atualizado_em: string | null
          boosted: boolean | null
          boosts: Json | null
          catalog_product_id: string | null
          competitors: Json | null
          currency_id: string | null
          current_price: number | null
          http_status: number | null
          item_id: string
          item_status: string | null
          price_to_win: number | null
          raw: Json | null
          reason: Json | null
          status: string | null
          visit_share: number | null
          winner_item_id: string | null
          winner_price: number | null
          winner_seller_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          boosted?: boolean | null
          boosts?: Json | null
          catalog_product_id?: string | null
          competitors?: Json | null
          currency_id?: string | null
          current_price?: number | null
          http_status?: number | null
          item_id: string
          item_status?: string | null
          price_to_win?: number | null
          raw?: Json | null
          reason?: Json | null
          status?: string | null
          visit_share?: number | null
          winner_item_id?: string | null
          winner_price?: number | null
          winner_seller_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          boosted?: boolean | null
          boosts?: Json | null
          catalog_product_id?: string | null
          competitors?: Json | null
          currency_id?: string | null
          current_price?: number | null
          http_status?: number | null
          item_id?: string
          item_status?: string | null
          price_to_win?: number | null
          raw?: Json | null
          reason?: Json | null
          status?: string | null
          visit_share?: number | null
          winner_item_id?: string | null
          winner_price?: number | null
          winner_seller_id?: string | null
        }
        Relationships: []
      }
      ml_item_visitas_dia: {
        Row: {
          advertiser_id: string
          carregado_em: string
          data: string
          item_id: string
          visitas: number
          visits_detail: Json | null
        }
        Insert: {
          advertiser_id?: string
          carregado_em?: string
          data: string
          item_id: string
          visitas?: number
          visits_detail?: Json | null
        }
        Update: {
          advertiser_id?: string
          carregado_em?: string
          data?: string
          item_id?: string
          visitas?: number
          visits_detail?: Json | null
        }
        Relationships: []
      }
      ml_logistic_resolved: {
        Row: {
          logistic_type: string
          pedido_id: number
          resolved_at: string
        }
        Insert: {
          logistic_type: string
          pedido_id: number
          resolved_at?: string
        }
        Update: {
          logistic_type?: string
          pedido_id?: number
          resolved_at?: string
        }
        Relationships: []
      }
      ml_pedido: {
        Row: {
          advertiser_id: string
          buyer_id: number | null
          buying_mode: string | null
          carregado_em: string
          channel: string | null
          currency_id: string | null
          data_venda: string | null
          date_closed: string | null
          date_created: string | null
          date_last_updated: string | null
          frete_diferenca: number | null
          last_updated: string | null
          n_items: number | null
          pack_id: number | null
          paid_amount: number | null
          pedido_id: number
          seller_id: string | null
          shipping_cost: number | null
          shipping_id: number | null
          site_id: string | null
          status: string | null
          status_detail: string | null
          tags: Json | null
          total_amount: number | null
          total_marketplace_fee: number | null
          total_sale_fee: number | null
        }
        Insert: {
          advertiser_id?: string
          buyer_id?: number | null
          buying_mode?: string | null
          carregado_em?: string
          channel?: string | null
          currency_id?: string | null
          data_venda?: string | null
          date_closed?: string | null
          date_created?: string | null
          date_last_updated?: string | null
          frete_diferenca?: number | null
          last_updated?: string | null
          n_items?: number | null
          pack_id?: number | null
          paid_amount?: number | null
          pedido_id: number
          seller_id?: string | null
          shipping_cost?: number | null
          shipping_id?: number | null
          site_id?: string | null
          status?: string | null
          status_detail?: string | null
          tags?: Json | null
          total_amount?: number | null
          total_marketplace_fee?: number | null
          total_sale_fee?: number | null
        }
        Update: {
          advertiser_id?: string
          buyer_id?: number | null
          buying_mode?: string | null
          carregado_em?: string
          channel?: string | null
          currency_id?: string | null
          data_venda?: string | null
          date_closed?: string | null
          date_created?: string | null
          date_last_updated?: string | null
          frete_diferenca?: number | null
          last_updated?: string | null
          n_items?: number | null
          pack_id?: number | null
          paid_amount?: number | null
          pedido_id?: number
          seller_id?: string | null
          shipping_cost?: number | null
          shipping_id?: number | null
          site_id?: string | null
          status?: string | null
          status_detail?: string | null
          tags?: Json | null
          total_amount?: number | null
          total_marketplace_fee?: number | null
          total_sale_fee?: number | null
        }
        Relationships: []
      }
      ml_pedido_cupom: {
        Row: {
          aprovado_em: string | null
          carregado_em: string
          cupom_meli: number
          cupom_pagamento: number
          cupom_vendedor: number
          data_venda: string
          fonte: string
          frete_comprador: number
          meio_pagamento: string | null
          parcelas: number | null
          pedido_id: number
          tipo_pagamento: string | null
        }
        Insert: {
          aprovado_em?: string | null
          carregado_em?: string
          cupom_meli?: number
          cupom_pagamento?: number
          cupom_vendedor?: number
          data_venda: string
          fonte?: string
          frete_comprador?: number
          meio_pagamento?: string | null
          parcelas?: number | null
          pedido_id: number
          tipo_pagamento?: string | null
        }
        Update: {
          aprovado_em?: string | null
          carregado_em?: string
          cupom_meli?: number
          cupom_pagamento?: number
          cupom_vendedor?: number
          data_venda?: string
          fonte?: string
          frete_comprador?: number
          meio_pagamento?: string | null
          parcelas?: number | null
          pedido_id?: number
          tipo_pagamento?: string | null
        }
        Relationships: []
      }
      ml_pedido_frete: {
        Row: {
          base_cost: number | null
          cost_comprador: number | null
          frete_vendedor: number | null
          list_cost: number | null
          logistic_type: string | null
          pedido_id: number
          peso_g: number | null
          resolvido_em: string
          shipping_id: number | null
          status: string
          tentativas: number
        }
        Insert: {
          base_cost?: number | null
          cost_comprador?: number | null
          frete_vendedor?: number | null
          list_cost?: number | null
          logistic_type?: string | null
          pedido_id: number
          peso_g?: number | null
          resolvido_em?: string
          shipping_id?: number | null
          status?: string
          tentativas?: number
        }
        Update: {
          base_cost?: number | null
          cost_comprador?: number | null
          frete_vendedor?: number | null
          list_cost?: number | null
          logistic_type?: string | null
          pedido_id?: number
          peso_g?: number | null
          resolvido_em?: string
          shipping_id?: number | null
          status?: string
          tentativas?: number
        }
        Relationships: []
      }
      ml_pedido_item: {
        Row: {
          advertiser_id: string
          carregado_em: string
          category_id: string | null
          data_venda: string | null
          gross_price: number | null
          id: number
          item_id: string | null
          listing_type_id: string | null
          logistic_claim_at: string | null
          logistic_node: string | null
          logistic_type: string | null
          pedido_id: number
          quantity: number | null
          sale_fee: number | null
          seller_sku: string | null
          title: string | null
          unit_price: number | null
          variation_id: string | null
        }
        Insert: {
          advertiser_id?: string
          carregado_em?: string
          category_id?: string | null
          data_venda?: string | null
          gross_price?: number | null
          id?: never
          item_id?: string | null
          listing_type_id?: string | null
          logistic_claim_at?: string | null
          logistic_node?: string | null
          logistic_type?: string | null
          pedido_id: number
          quantity?: number | null
          sale_fee?: number | null
          seller_sku?: string | null
          title?: string | null
          unit_price?: number | null
          variation_id?: string | null
        }
        Update: {
          advertiser_id?: string
          carregado_em?: string
          category_id?: string | null
          data_venda?: string | null
          gross_price?: number | null
          id?: never
          item_id?: string | null
          listing_type_id?: string | null
          logistic_claim_at?: string | null
          logistic_node?: string | null
          logistic_type?: string | null
          pedido_id?: number
          quantity?: number | null
          sale_fee?: number | null
          seller_sku?: string | null
          title?: string | null
          unit_price?: number | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_pedido_item_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "ml_pedido"
            referencedColumns: ["pedido_id"]
          },
        ]
      }
      ml_pedido_item_rt: {
        Row: {
          advertiser_id: string
          carregado_em: string
          category_id: string | null
          data_venda: string | null
          gross_price: number | null
          id: number
          item_id: string | null
          listing_type_id: string | null
          logistic_claim_at: string | null
          logistic_node: string | null
          logistic_type: string | null
          pedido_id: number
          quantity: number | null
          sale_fee: number | null
          seller_sku: string | null
          title: string | null
          unit_price: number | null
          variation_id: string | null
        }
        Insert: {
          advertiser_id?: string
          carregado_em?: string
          category_id?: string | null
          data_venda?: string | null
          gross_price?: number | null
          id?: never
          item_id?: string | null
          listing_type_id?: string | null
          logistic_claim_at?: string | null
          logistic_node?: string | null
          logistic_type?: string | null
          pedido_id: number
          quantity?: number | null
          sale_fee?: number | null
          seller_sku?: string | null
          title?: string | null
          unit_price?: number | null
          variation_id?: string | null
        }
        Update: {
          advertiser_id?: string
          carregado_em?: string
          category_id?: string | null
          data_venda?: string | null
          gross_price?: number | null
          id?: never
          item_id?: string | null
          listing_type_id?: string | null
          logistic_claim_at?: string | null
          logistic_node?: string | null
          logistic_type?: string | null
          pedido_id?: number
          quantity?: number | null
          sale_fee?: number | null
          seller_sku?: string | null
          title?: string | null
          unit_price?: number | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_pedido_item_rt_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "ml_pedido_rt"
            referencedColumns: ["pedido_id"]
          },
        ]
      }
      ml_pedido_rt: {
        Row: {
          advertiser_id: string
          buyer_id: number | null
          buying_mode: string | null
          carregado_em: string
          channel: string | null
          currency_id: string | null
          data_venda: string | null
          date_closed: string | null
          date_created: string | null
          date_last_updated: string | null
          frete_diferenca: number | null
          last_updated: string | null
          n_items: number | null
          pack_id: number | null
          paid_amount: number | null
          pedido_id: number
          seller_id: string | null
          shipping_cost: number | null
          shipping_id: number | null
          site_id: string | null
          status: string | null
          status_detail: string | null
          tags: Json | null
          total_amount: number | null
          total_marketplace_fee: number | null
          total_sale_fee: number | null
        }
        Insert: {
          advertiser_id?: string
          buyer_id?: number | null
          buying_mode?: string | null
          carregado_em?: string
          channel?: string | null
          currency_id?: string | null
          data_venda?: string | null
          date_closed?: string | null
          date_created?: string | null
          date_last_updated?: string | null
          frete_diferenca?: number | null
          last_updated?: string | null
          n_items?: number | null
          pack_id?: number | null
          paid_amount?: number | null
          pedido_id: number
          seller_id?: string | null
          shipping_cost?: number | null
          shipping_id?: number | null
          site_id?: string | null
          status?: string | null
          status_detail?: string | null
          tags?: Json | null
          total_amount?: number | null
          total_marketplace_fee?: number | null
          total_sale_fee?: number | null
        }
        Update: {
          advertiser_id?: string
          buyer_id?: number | null
          buying_mode?: string | null
          carregado_em?: string
          channel?: string | null
          currency_id?: string | null
          data_venda?: string | null
          date_closed?: string | null
          date_created?: string | null
          date_last_updated?: string | null
          frete_diferenca?: number | null
          last_updated?: string | null
          n_items?: number | null
          pack_id?: number | null
          paid_amount?: number | null
          pedido_id?: number
          seller_id?: string | null
          shipping_cost?: number | null
          shipping_id?: number | null
          site_id?: string | null
          status?: string | null
          status_detail?: string | null
          tags?: Json | null
          total_amount?: number | null
          total_marketplace_fee?: number | null
          total_sale_fee?: number | null
        }
        Relationships: []
      }
      ml_probe_out: {
        Row: {
          at: string | null
          body: Json | null
          id: number
          item_id: string | null
          path: string | null
          status: number | null
        }
        Insert: {
          at?: string | null
          body?: Json | null
          id?: number
          item_id?: string | null
          path?: string | null
          status?: number | null
        }
        Update: {
          at?: string | null
          body?: Json | null
          id?: number
          item_id?: string | null
          path?: string | null
          status?: number | null
        }
        Relationships: []
      }
      ml_product_ads_campanha: {
        Row: {
          acos_target: number | null
          acos_top_search_target: number | null
          advertiser_id: string
          atualizado_em: string
          automatic_budget: boolean | null
          budget: number | null
          campaign_id: number
          channel: string | null
          currency_id: string | null
          date_created: string | null
          last_updated: string | null
          name: string | null
          roas_target: number | null
          salesforce_event_id: number | null
          status: string | null
          strategy: string | null
        }
        Insert: {
          acos_target?: number | null
          acos_top_search_target?: number | null
          advertiser_id: string
          atualizado_em?: string
          automatic_budget?: boolean | null
          budget?: number | null
          campaign_id: number
          channel?: string | null
          currency_id?: string | null
          date_created?: string | null
          last_updated?: string | null
          name?: string | null
          roas_target?: number | null
          salesforce_event_id?: number | null
          status?: string | null
          strategy?: string | null
        }
        Update: {
          acos_target?: number | null
          acos_top_search_target?: number | null
          advertiser_id?: string
          atualizado_em?: string
          automatic_budget?: boolean | null
          budget?: number | null
          campaign_id?: number
          channel?: string | null
          currency_id?: string | null
          date_created?: string | null
          last_updated?: string | null
          name?: string | null
          roas_target?: number | null
          salesforce_event_id?: number | null
          status?: string | null
          strategy?: string | null
        }
        Relationships: []
      }
      ml_product_ads_campanha_metricas: {
        Row: {
          acos_benchmark: number | null
          advertiser_id: string
          advertising_items_quantity: number | null
          atualizado_em: string
          campaign_id: number
          clicks: number | null
          cost: number | null
          currency: string | null
          date: string
          direct_amount: number | null
          direct_items_quantity: number | null
          direct_units_quantity: number | null
          id: number
          impression_share: number | null
          indirect_amount: number | null
          indirect_items_quantity: number | null
          indirect_units_quantity: number | null
          lost_impression_share_by_ad_rank: number | null
          lost_impression_share_by_budget: number | null
          organic_items_quantity: number | null
          organic_units_amount: number | null
          organic_units_quantity: number | null
          prints: number | null
          sov: number | null
          top_impression_share: number | null
          total_amount: number | null
          units_quantity: number | null
        }
        Insert: {
          acos_benchmark?: number | null
          advertiser_id: string
          advertising_items_quantity?: number | null
          atualizado_em?: string
          campaign_id: number
          clicks?: number | null
          cost?: number | null
          currency?: string | null
          date: string
          direct_amount?: number | null
          direct_items_quantity?: number | null
          direct_units_quantity?: number | null
          id?: never
          impression_share?: number | null
          indirect_amount?: number | null
          indirect_items_quantity?: number | null
          indirect_units_quantity?: number | null
          lost_impression_share_by_ad_rank?: number | null
          lost_impression_share_by_budget?: number | null
          organic_items_quantity?: number | null
          organic_units_amount?: number | null
          organic_units_quantity?: number | null
          prints?: number | null
          sov?: number | null
          top_impression_share?: number | null
          total_amount?: number | null
          units_quantity?: number | null
        }
        Update: {
          acos_benchmark?: number | null
          advertiser_id?: string
          advertising_items_quantity?: number | null
          atualizado_em?: string
          campaign_id?: number
          clicks?: number | null
          cost?: number | null
          currency?: string | null
          date?: string
          direct_amount?: number | null
          direct_items_quantity?: number | null
          direct_units_quantity?: number | null
          id?: never
          impression_share?: number | null
          indirect_amount?: number | null
          indirect_items_quantity?: number | null
          indirect_units_quantity?: number | null
          lost_impression_share_by_ad_rank?: number | null
          lost_impression_share_by_budget?: number | null
          organic_items_quantity?: number | null
          organic_units_amount?: number | null
          organic_units_quantity?: number | null
          prints?: number | null
          sov?: number | null
          top_impression_share?: number | null
          total_amount?: number | null
          units_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_product_ads_campanha_metricas_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_product_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "ml_product_ads_campanha_metricas_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_ml_pads_campanha_lista"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      ml_product_ads_item: {
        Row: {
          advertiser_id: string
          atualizado_em: string
          brand_value_id: string | null
          brand_value_name: string | null
          buy_box_winner: boolean | null
          campaign_id: number | null
          catalog_listing: boolean | null
          channel: string | null
          condition: string | null
          domain_id: string | null
          has_discount: boolean | null
          item_id: string
          listing_type_id: string | null
          logistic_type: string | null
          official_store_id: number | null
          permalink: string | null
          price: number | null
          recommended: boolean | null
          status: string | null
          tags: Json | null
          thumbnail: string | null
          title: string | null
        }
        Insert: {
          advertiser_id: string
          atualizado_em?: string
          brand_value_id?: string | null
          brand_value_name?: string | null
          buy_box_winner?: boolean | null
          campaign_id?: number | null
          catalog_listing?: boolean | null
          channel?: string | null
          condition?: string | null
          domain_id?: string | null
          has_discount?: boolean | null
          item_id: string
          listing_type_id?: string | null
          logistic_type?: string | null
          official_store_id?: number | null
          permalink?: string | null
          price?: number | null
          recommended?: boolean | null
          status?: string | null
          tags?: Json | null
          thumbnail?: string | null
          title?: string | null
        }
        Update: {
          advertiser_id?: string
          atualizado_em?: string
          brand_value_id?: string | null
          brand_value_name?: string | null
          buy_box_winner?: boolean | null
          campaign_id?: number | null
          catalog_listing?: boolean | null
          channel?: string | null
          condition?: string | null
          domain_id?: string | null
          has_discount?: boolean | null
          item_id?: string
          listing_type_id?: string | null
          logistic_type?: string | null
          official_store_id?: number | null
          permalink?: string | null
          price?: number | null
          recommended?: boolean | null
          status?: string | null
          tags?: Json | null
          thumbnail?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_product_ads_item_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_product_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "ml_product_ads_item_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_ml_pads_campanha_lista"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      ml_product_ads_item_metricas: {
        Row: {
          acos_benchmark: number | null
          advertiser_id: string
          advertising_items_quantity: number | null
          atualizado_em: string
          campaign_id: number
          clicks: number | null
          cost: number | null
          currency: string | null
          date: string
          direct_amount: number | null
          direct_items_quantity: number | null
          direct_units_quantity: number | null
          id: number
          impression_share: number | null
          indirect_amount: number | null
          indirect_items_quantity: number | null
          indirect_units_quantity: number | null
          item_id: string
          lost_impression_share_by_ad_rank: number | null
          lost_impression_share_by_budget: number | null
          organic_items_quantity: number | null
          organic_units_amount: number | null
          organic_units_quantity: number | null
          prints: number | null
          sov: number | null
          top_impression_share: number | null
          total_amount: number | null
          units_quantity: number | null
        }
        Insert: {
          acos_benchmark?: number | null
          advertiser_id: string
          advertising_items_quantity?: number | null
          atualizado_em?: string
          campaign_id: number
          clicks?: number | null
          cost?: number | null
          currency?: string | null
          date: string
          direct_amount?: number | null
          direct_items_quantity?: number | null
          direct_units_quantity?: number | null
          id?: never
          impression_share?: number | null
          indirect_amount?: number | null
          indirect_items_quantity?: number | null
          indirect_units_quantity?: number | null
          item_id: string
          lost_impression_share_by_ad_rank?: number | null
          lost_impression_share_by_budget?: number | null
          organic_items_quantity?: number | null
          organic_units_amount?: number | null
          organic_units_quantity?: number | null
          prints?: number | null
          sov?: number | null
          top_impression_share?: number | null
          total_amount?: number | null
          units_quantity?: number | null
        }
        Update: {
          acos_benchmark?: number | null
          advertiser_id?: string
          advertising_items_quantity?: number | null
          atualizado_em?: string
          campaign_id?: number
          clicks?: number | null
          cost?: number | null
          currency?: string | null
          date?: string
          direct_amount?: number | null
          direct_items_quantity?: number | null
          direct_units_quantity?: number | null
          id?: never
          impression_share?: number | null
          indirect_amount?: number | null
          indirect_items_quantity?: number | null
          indirect_units_quantity?: number | null
          item_id?: string
          lost_impression_share_by_ad_rank?: number | null
          lost_impression_share_by_budget?: number | null
          organic_items_quantity?: number | null
          organic_units_amount?: number | null
          organic_units_quantity?: number | null
          prints?: number | null
          sov?: number | null
          top_impression_share?: number | null
          total_amount?: number | null
          units_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_product_ads_item_metricas_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ml_product_ads_item"
            referencedColumns: ["item_id"]
          },
        ]
      }
      ml_sync_log: {
        Row: {
          advertiser_id: string | null
          campaigns_synced: number | null
          creatives_synced: number | null
          error_message: string | null
          finished_at: string | null
          id: number
          job_type: string | null
          line_items_synced: number | null
          metrics_rows: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          advertiser_id?: string | null
          campaigns_synced?: number | null
          creatives_synced?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: number
          job_type?: string | null
          line_items_synced?: number | null
          metrics_rows?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          advertiser_id?: string | null
          campaigns_synced?: number | null
          creatives_synced?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: number
          job_type?: string | null
          line_items_synced?: number | null
          metrics_rows?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ml_sync_queue: {
        Row: {
          advertiser_id: string
          attempts: number
          campaign_id: number
          date_from: string
          date_to: string
          enqueued_at: string
          error_message: string | null
          finished_at: string | null
          id: number
          job_type: string
          priority: number
          started_at: string | null
          status: string
        }
        Insert: {
          advertiser_id: string
          attempts?: number
          campaign_id: number
          date_from: string
          date_to: string
          enqueued_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: number
          job_type: string
          priority?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          advertiser_id?: string
          attempts?: number
          campaign_id?: number
          date_from?: string
          date_to?: string
          enqueued_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: number
          job_type?: string
          priority?: number
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      ml_visao_geral_intraday: {
        Row: {
          captured_at: string
          cliques_ads: number | null
          data: string
          impressoes_ads: number | null
          invest_ads: number | null
          receita_ads: number | null
        }
        Insert: {
          captured_at?: string
          cliques_ads?: number | null
          data: string
          impressoes_ads?: number | null
          invest_ads?: number | null
          receita_ads?: number | null
        }
        Update: {
          captured_at?: string
          cliques_ads?: number | null
          data?: string
          impressoes_ads?: number | null
          invest_ads?: number | null
          receita_ads?: number | null
        }
        Relationships: []
      }
      painel_execucao: {
        Row: {
          canal: string
          concluido_em: string | null
          criado_em: string
          custo_usd: number | null
          erro: string | null
          id: number
          pergunta: string | null
          periodo_ate: string
          periodo_de: string
          snapshot: Json | null
          status: string
        }
        Insert: {
          canal?: string
          concluido_em?: string | null
          criado_em?: string
          custo_usd?: number | null
          erro?: string | null
          id?: never
          pergunta?: string | null
          periodo_ate: string
          periodo_de: string
          snapshot?: Json | null
          status?: string
        }
        Update: {
          canal?: string
          concluido_em?: string | null
          criado_em?: string
          custo_usd?: number | null
          erro?: string | null
          id?: never
          pergunta?: string | null
          periodo_ate?: string
          periodo_de?: string
          snapshot?: Json | null
          status?: string
        }
        Relationships: []
      }
      painel_lock: {
        Row: {
          id: number
          preso_ate: string
        }
        Insert: {
          id?: number
          preso_ate?: string
        }
        Update: {
          id?: number
          preso_ate?: string
        }
        Relationships: []
      }
      painel_pedido: {
        Row: {
          canal: string
          criado_em: string
          execucao_id: number | null
          id: number
          pergunta: string | null
          periodo_ate: string | null
          periodo_de: string | null
          status: string
        }
        Insert: {
          canal?: string
          criado_em?: string
          execucao_id?: number | null
          id?: never
          pergunta?: string | null
          periodo_ate?: string | null
          periodo_de?: string | null
          status?: string
        }
        Update: {
          canal?: string
          criado_em?: string
          execucao_id?: number | null
          id?: never
          pergunta?: string | null
          periodo_ate?: string | null
          periodo_de?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "painel_pedido_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "painel_execucao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "painel_pedido_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "vw_painel_execucao"
            referencedColumns: ["id"]
          },
        ]
      }
      painel_persona: {
        Row: {
          ativo: boolean
          cargo: string
          effort: string | null
          erro_que_previne: string
          formato_entrega: string
          mandato: string
          modelo: string
          ordem: number
          proibicao: string
          views_permitidas: string[]
          web_search: boolean
        }
        Insert: {
          ativo?: boolean
          cargo: string
          effort?: string | null
          erro_que_previne: string
          formato_entrega: string
          mandato: string
          modelo: string
          ordem: number
          proibicao: string
          views_permitidas?: string[]
          web_search?: boolean
        }
        Update: {
          ativo?: boolean
          cargo?: string
          effort?: string | null
          erro_que_previne?: string
          formato_entrega?: string
          mandato?: string
          modelo?: string
          ordem?: number
          proibicao?: string
          views_permitidas?: string[]
          web_search?: boolean
        }
        Relationships: []
      }
      painel_resposta: {
        Row: {
          buscas: Json
          cargo: string
          criado_em: string
          effort: string | null
          execucao_id: number
          id: number
          modelo: string
          ms: number | null
          pensamento: string | null
          queries: Json
          texto: string
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          buscas?: Json
          cargo: string
          criado_em?: string
          effort?: string | null
          execucao_id: number
          id?: never
          modelo: string
          ms?: number | null
          pensamento?: string | null
          queries?: Json
          texto: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          buscas?: Json
          cargo?: string
          criado_em?: string
          effort?: string | null
          execucao_id?: number
          id?: never
          modelo?: string
          ms?: number | null
          pensamento?: string | null
          queries?: Json
          texto?: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "painel_resposta_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "painel_execucao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "painel_resposta_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "vw_painel_execucao"
            referencedColumns: ["id"]
          },
        ]
      }
      painel_tarefa: {
        Row: {
          atualizado_em: string
          cargo: string
          erro: string | null
          execucao_id: number
          id: number
          ordem: number
          status: string
          tentativas: number
        }
        Insert: {
          atualizado_em?: string
          cargo: string
          erro?: string | null
          execucao_id: number
          id?: never
          ordem: number
          status?: string
          tentativas?: number
        }
        Update: {
          atualizado_em?: string
          cargo?: string
          erro?: string | null
          execucao_id?: number
          id?: never
          ordem?: number
          status?: string
          tentativas?: number
        }
        Relationships: [
          {
            foreignKeyName: "painel_tarefa_cargo_fkey"
            columns: ["cargo"]
            isOneToOne: false
            referencedRelation: "painel_persona"
            referencedColumns: ["cargo"]
          },
          {
            foreignKeyName: "painel_tarefa_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "painel_execucao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "painel_tarefa_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "vw_painel_execucao"
            referencedColumns: ["id"]
          },
        ]
      }
      painel_veredito: {
        Row: {
          afirmacao: string
          bateu: string
          cargo_origem: string
          comentario: string | null
          execucao_id: number
          id: number
          resultado: Json | null
          sql_verificacao: string | null
        }
        Insert: {
          afirmacao: string
          bateu?: string
          cargo_origem: string
          comentario?: string | null
          execucao_id: number
          id?: never
          resultado?: Json | null
          sql_verificacao?: string | null
        }
        Update: {
          afirmacao?: string
          bateu?: string
          cargo_origem?: string
          comentario?: string | null
          execucao_id?: number
          id?: never
          resultado?: Json | null
          sql_verificacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "painel_veredito_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "painel_execucao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "painel_veredito_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "vw_painel_execucao"
            referencedColumns: ["id"]
          },
        ]
      }
      rd_automacao_dia: {
        Row: {
          aberturas: number | null
          acao_id: string
          atualizado_em: string
          bounces: number | null
          cliques: number | null
          contatos: number | null
          data: string
          descadastros: number | null
          email: string | null
          entregues: number | null
          fluxo: string | null
        }
        Insert: {
          aberturas?: number | null
          acao_id: string
          atualizado_em?: string
          bounces?: number | null
          cliques?: number | null
          contatos?: number | null
          data: string
          descadastros?: number | null
          email?: string | null
          entregues?: number | null
          fluxo?: string | null
        }
        Update: {
          aberturas?: number | null
          acao_id?: string
          atualizado_em?: string
          bounces?: number | null
          cliques?: number | null
          contatos?: number | null
          data?: string
          descadastros?: number | null
          email?: string | null
          entregues?: number | null
          fluxo?: string | null
        }
        Relationships: []
      }
      rd_conversao_dia: {
        Row: {
          asset_id: number
          atualizado_em: string
          conversoes: number | null
          data: string
          identificador: string | null
          tipo: string | null
          visitas: number | null
        }
        Insert: {
          asset_id: number
          atualizado_em?: string
          conversoes?: number | null
          data: string
          identificador?: string | null
          tipo?: string | null
          visitas?: number | null
        }
        Update: {
          asset_id?: number
          atualizado_em?: string
          conversoes?: number | null
          data?: string
          identificador?: string | null
          tipo?: string | null
          visitas?: number | null
        }
        Relationships: []
      }
      rd_email_campanha: {
        Row: {
          aberturas: number | null
          atualizado_em: string
          bounces: number | null
          campaign_id: number
          cliques: number | null
          contatos: number | null
          data: string | null
          descadastros: number | null
          descartados: number | null
          entregues: number | null
          enviado_em: string | null
          nome: string | null
          spam: number | null
        }
        Insert: {
          aberturas?: number | null
          atualizado_em?: string
          bounces?: number | null
          campaign_id: number
          cliques?: number | null
          contatos?: number | null
          data?: string | null
          descadastros?: number | null
          descartados?: number | null
          entregues?: number | null
          enviado_em?: string | null
          nome?: string | null
          spam?: number | null
        }
        Update: {
          aberturas?: number | null
          atualizado_em?: string
          bounces?: number | null
          campaign_id?: number
          cliques?: number | null
          contatos?: number | null
          data?: string | null
          descadastros?: number | null
          descartados?: number | null
          entregues?: number | null
          enviado_em?: string | null
          nome?: string | null
          spam?: number | null
        }
        Relationships: []
      }
      rd_lead: {
        Row: {
          atualizado_em: string
          conversao: string | null
          criado_em: string
          email_hash: string | null
          estagio: string | null
          lead_id: string
          primeira_conversao_em: string | null
          ultima_conversao_em: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          atualizado_em?: string
          conversao?: string | null
          criado_em?: string
          email_hash?: string | null
          estagio?: string | null
          lead_id: string
          primeira_conversao_em?: string | null
          ultima_conversao_em?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          atualizado_em?: string
          conversao?: string | null
          criado_em?: string
          email_hash?: string | null
          estagio?: string | null
          lead_id?: string
          primeira_conversao_em?: string | null
          ultima_conversao_em?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      rd_oauth: {
        Row: {
          access_token: string | null
          conectado_em: string
          expira_em: string | null
          id: number
          refresh_token: string | null
        }
        Insert: {
          access_token?: string | null
          conectado_em?: string
          expira_em?: string | null
          id?: number
          refresh_token?: string | null
        }
        Update: {
          access_token?: string | null
          conectado_em?: string
          expira_em?: string | null
          id?: number
          refresh_token?: string | null
        }
        Relationships: []
      }
      rd_webhook_token: {
        Row: {
          id: number
          token: string
        }
        Insert: {
          id?: number
          token?: string
        }
        Update: {
          id?: number
          token?: string
        }
        Relationships: []
      }
      realizado_manual: {
        Row: {
          alterado_em: string | null
          alterado_por: string | null
          atualizado_em: string
          canal: string
          data: string
          invest: number | null
          obs: string | null
          receita: number | null
        }
        Insert: {
          alterado_em?: string | null
          alterado_por?: string | null
          atualizado_em?: string
          canal: string
          data: string
          invest?: number | null
          obs?: string | null
          receita?: number | null
        }
        Update: {
          alterado_em?: string | null
          alterado_por?: string | null
          atualizado_em?: string
          canal?: string
          data?: string
          invest?: number | null
          obs?: string | null
          receita?: number | null
        }
        Relationships: []
      }
      rev_flow: {
        Row: {
          corpo: Json | null
          flow_id: string
          req: number | null
        }
        Insert: {
          corpo?: Json | null
          flow_id: string
          req?: number | null
        }
        Update: {
          corpo?: Json | null
          flow_id?: string
          req?: number | null
        }
        Relationships: []
      }
      shopee_backfill_fila: {
        Row: {
          atualizado: string
          bloco: number
          dia: string
          itens: number | null
          pedidos: number | null
          status: string
          tentativas: number
        }
        Insert: {
          atualizado?: string
          bloco?: number
          dia: string
          itens?: number | null
          pedidos?: number | null
          status?: string
          tentativas?: number
        }
        Update: {
          atualizado?: string
          bloco?: number
          dia?: string
          itens?: number | null
          pedidos?: number | null
          status?: string
          tentativas?: number
        }
        Relationships: []
      }
      shopee_credentials: {
        Row: {
          atualizado_em: string
          criado_em: string
          host: string
          host_sandbox: string
          id: number
          partner_id: number | null
          partner_key: string | null
          redirect_url: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          host?: string
          host_sandbox?: string
          id?: number
          partner_id?: number | null
          partner_key?: string | null
          redirect_url?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          host?: string
          host_sandbox?: string
          id?: number
          partner_id?: number | null
          partner_key?: string | null
          redirect_url?: string | null
        }
        Relationships: []
      }
      shopee_escrow_fila: {
        Row: {
          atualizado: string
          dia: string
          pedidos: number | null
          status: string
          tentativas: number
        }
        Insert: {
          atualizado?: string
          dia: string
          pedidos?: number | null
          status?: string
          tentativas?: number
        }
        Update: {
          atualizado?: string
          dia?: string
          pedidos?: number | null
          status?: string
          tentativas?: number
        }
        Relationships: []
      }
      shopee_item_metricas_dia: {
        Row: {
          carregado_em: string
          comentarios: number | null
          data: string
          item_id: string
          likes_acum: number | null
          rating: number | null
          vendas_acum: number | null
          views_acum: number | null
        }
        Insert: {
          carregado_em?: string
          comentarios?: number | null
          data: string
          item_id: string
          likes_acum?: number | null
          rating?: number | null
          vendas_acum?: number | null
          views_acum?: number | null
        }
        Update: {
          carregado_em?: string
          comentarios?: number | null
          data?: string
          item_id?: string
          likes_acum?: number | null
          rating?: number | null
          vendas_acum?: number | null
          views_acum?: number | null
        }
        Relationships: []
      }
      shopee_pedido: {
        Row: {
          actual_shipping_fee: number | null
          buyer_user_id: string | null
          buyer_username: string | null
          cancel_by: string | null
          cancel_reason: string | null
          carregado_em: string
          cod: boolean | null
          create_dia: string | null
          create_time: number | null
          currency: string | null
          days_to_ship: number | null
          invoice_access_key: string | null
          invoice_number: string | null
          invoice_status: string | null
          order_chargeable_weight_gram: number | null
          order_sn: string
          order_status: string | null
          pay_time: number | null
          payment_method: string | null
          region: string | null
          reverse_shipping_fee: number | null
          ship_by_date: number | null
          shipping_carrier: string | null
          total_amount: number | null
          update_time: number | null
        }
        Insert: {
          actual_shipping_fee?: number | null
          buyer_user_id?: string | null
          buyer_username?: string | null
          cancel_by?: string | null
          cancel_reason?: string | null
          carregado_em?: string
          cod?: boolean | null
          create_dia?: string | null
          create_time?: number | null
          currency?: string | null
          days_to_ship?: number | null
          invoice_access_key?: string | null
          invoice_number?: string | null
          invoice_status?: string | null
          order_chargeable_weight_gram?: number | null
          order_sn: string
          order_status?: string | null
          pay_time?: number | null
          payment_method?: string | null
          region?: string | null
          reverse_shipping_fee?: number | null
          ship_by_date?: number | null
          shipping_carrier?: string | null
          total_amount?: number | null
          update_time?: number | null
        }
        Update: {
          actual_shipping_fee?: number | null
          buyer_user_id?: string | null
          buyer_username?: string | null
          cancel_by?: string | null
          cancel_reason?: string | null
          carregado_em?: string
          cod?: boolean | null
          create_dia?: string | null
          create_time?: number | null
          currency?: string | null
          days_to_ship?: number | null
          invoice_access_key?: string | null
          invoice_number?: string | null
          invoice_status?: string | null
          order_chargeable_weight_gram?: number | null
          order_sn?: string
          order_status?: string | null
          pay_time?: number | null
          payment_method?: string | null
          region?: string | null
          reverse_shipping_fee?: number | null
          ship_by_date?: number | null
          shipping_carrier?: string | null
          total_amount?: number | null
          update_time?: number | null
        }
        Relationships: []
      }
      shopee_pedido_item: {
        Row: {
          cancelled_qty: number | null
          carregado_em: string
          create_dia: string | null
          item_id: string | null
          item_name: string | null
          item_sku: string | null
          line_item_id: string
          model_discounted_price: number | null
          model_id: string | null
          model_name: string | null
          model_original_price: number | null
          model_quantity_purchased: number | null
          model_sku: string | null
          order_sn: string
          order_status: string | null
          promotion_id: string | null
          promotion_type: string | null
          returned_qty: number | null
          weight: number | null
        }
        Insert: {
          cancelled_qty?: number | null
          carregado_em?: string
          create_dia?: string | null
          item_id?: string | null
          item_name?: string | null
          item_sku?: string | null
          line_item_id: string
          model_discounted_price?: number | null
          model_id?: string | null
          model_name?: string | null
          model_original_price?: number | null
          model_quantity_purchased?: number | null
          model_sku?: string | null
          order_sn: string
          order_status?: string | null
          promotion_id?: string | null
          promotion_type?: string | null
          returned_qty?: number | null
          weight?: number | null
        }
        Update: {
          cancelled_qty?: number | null
          carregado_em?: string
          create_dia?: string | null
          item_id?: string | null
          item_name?: string | null
          item_sku?: string | null
          line_item_id?: string
          model_discounted_price?: number | null
          model_id?: string | null
          model_name?: string | null
          model_original_price?: number | null
          model_quantity_purchased?: number | null
          model_sku?: string | null
          order_sn?: string
          order_status?: string | null
          promotion_id?: string | null
          promotion_type?: string | null
          returned_qty?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      shopee_sync_log: {
        Row: {
          elapsed_ms: number | null
          erro: string | null
          executado_em: string
          id: number
          itens: number | null
          paginas: number | null
          params: Json | null
          pedidos: number | null
        }
        Insert: {
          elapsed_ms?: number | null
          erro?: string | null
          executado_em?: string
          id?: number
          itens?: number | null
          paginas?: number | null
          params?: Json | null
          pedidos?: number | null
        }
        Update: {
          elapsed_ms?: number | null
          erro?: string | null
          executado_em?: string
          id?: number
          itens?: number | null
          paginas?: number | null
          params?: Json | null
          pedidos?: number | null
        }
        Relationships: []
      }
      shopee_token_cache: {
        Row: {
          access_token: string
          atualizado_em: string
          expires_at: string
          refresh_token: string
          shop_id: number
        }
        Insert: {
          access_token: string
          atualizado_em?: string
          expires_at: string
          refresh_token: string
          shop_id: number
        }
        Update: {
          access_token?: string
          atualizado_em?: string
          expires_at?: string
          refresh_token?: string
          shop_id?: number
        }
        Relationships: []
      }
      shopify_ruptura_alertada: {
        Row: {
          alertado_em: string | null
          sku: string
          title: string | null
          vendas_7d: number | null
        }
        Insert: {
          alertado_em?: string | null
          sku: string
          title?: string | null
          vendas_7d?: number | null
        }
        Update: {
          alertado_em?: string | null
          sku?: string
          title?: string | null
          vendas_7d?: number | null
        }
        Relationships: []
      }
      site_paginas_carga_req: {
        Row: {
          ate: string
          criado_em: string
          de: string
          erro: string | null
          id: number
          linhas: number | null
          processado_em: string | null
          req_id: number
          tipo: string
        }
        Insert: {
          ate: string
          criado_em?: string
          de: string
          erro?: string | null
          id?: number
          linhas?: number | null
          processado_em?: string | null
          req_id: number
          tipo: string
        }
        Update: {
          ate?: string
          criado_em?: string
          de?: string
          erro?: string | null
          id?: number
          linhas?: number | null
          processado_em?: string | null
          req_id?: number
          tipo?: string
        }
        Relationships: []
      }
      stg_shopify_orders_item: {
        Row: {
          _first_visit_loaded_at: string | null
          _loaded_at: string | null
          _row_id: number
          date: string | null
          line_item__discounted_unit_price: number | null
          line_item__gift_card: boolean | null
          line_item__id: string | null
          line_item__name: string | null
          line_item__net_sales: number | null
          line_item__price: number | null
          line_item__product_id: string | null
          line_item__quantity: number | null
          line_item__refunds_price: number | null
          line_item__refunds_quantity: number | null
          line_item__refunds_subtotal: number | null
          line_item__sku: string | null
          line_item__title: string | null
          line_item__total_discount: number | null
          line_item__variant_id: string | null
          line_item__variant_title: string | null
          line_item__vendor: string | null
          order_adjusted_discounts: number | null
          order_app_id: string | null
          order_billing_address_city: string | null
          order_billing_address_country: string | null
          order_billing_matches_shipping: boolean | null
          order_cancel_reason: string | null
          order_cancelled_at: string | null
          order_channel_handle: string | null
          order_closed_at: string | null
          order_confirmation_number: string | null
          order_confirmed: string | null
          order_count: number | null
          order_created_at: string | null
          order_customer_accepts_marketing: boolean | null
          order_customer_first_visit_at: string | null
          order_customer_first_visit_landing_page: string | null
          order_customer_first_visit_source: string | null
          order_customer_first_visit_utm_campaign: string | null
          order_customer_first_visit_utm_content: string | null
          order_customer_first_visit_utm_medium: string | null
          order_customer_first_visit_utm_source: string | null
          order_customer_first_visit_utm_term: string | null
          order_customer_has_multiple_orders: boolean | null
          order_customer_id: string | null
          order_customer_last_visit_landing_page: string | null
          order_customer_last_visit_referral_code: string | null
          order_customer_last_visit_referrer_url: string | null
          order_customer_last_visit_source: string | null
          order_customer_last_visit_utm_campaign: string | null
          order_customer_last_visit_utm_content: string | null
          order_customer_last_visit_utm_medium: string | null
          order_customer_last_visit_utm_source: string | null
          order_customer_last_visit_utm_term: string | null
          order_customer_number_of_orders: number | null
          order_discount_code: string | null
          order_discount_codes: string | null
          order_email: string | null
          order_financial_status: string | null
          order_fulfillment_created_first_date: string | null
          order_fulfillment_created_last_date: string | null
          order_fulfillment_delivered_first_date: string | null
          order_fulfillment_delivered_last_date: string | null
          order_fulfillment_status: string | null
          order_fully_paid: boolean | null
          order_gross_sales: number | null
          order_id: string | null
          order_name: string | null
          order_net_payment: number | null
          order_net_sales: number | null
          order_note: string | null
          order_original_price: number | null
          order_payment_gateways: string | null
          order_po_number: string | null
          order_processed_at: string | null
          order_quantity: number | null
          order_refunds_net: number | null
          order_refunds_quantity: number | null
          order_refunds_subtotal: number | null
          order_registered_source_url: string | null
          order_retail_location_name: string | null
          order_return_status: string | null
          order_returns_amount: number | null
          order_returns_quantity: number | null
          order_sales_channel: string | null
          order_shipping_address_city: string | null
          order_shipping_address_country: string | null
          order_shipping_address_province: string | null
          order_shipping_address_zip: string | null
          order_shipping_line_carrier_identifier: string | null
          order_shipping_line_code: string | null
          order_shipping_line_discounted_amount: number | null
          order_shipping_line_title: string | null
          order_shipping_price: number | null
          order_source_identifier: string | null
          order_subtotal_price: number | null
          order_tags: string | null
          order_test: boolean | null
          order_total_count: number | null
          order_total_discount_cart: number | null
          order_total_discounts: number | null
          order_total_price: number | null
          order_total_shipping_price: number | null
          order_total_shipping_refunded_price: number | null
          order_unpaid: boolean | null
          order_updated_at: string | null
        }
        Insert: {
          _first_visit_loaded_at?: string | null
          _loaded_at?: string | null
          _row_id?: never
          date?: string | null
          line_item__discounted_unit_price?: number | null
          line_item__gift_card?: boolean | null
          line_item__id?: string | null
          line_item__name?: string | null
          line_item__net_sales?: number | null
          line_item__price?: number | null
          line_item__product_id?: string | null
          line_item__quantity?: number | null
          line_item__refunds_price?: number | null
          line_item__refunds_quantity?: number | null
          line_item__refunds_subtotal?: number | null
          line_item__sku?: string | null
          line_item__title?: string | null
          line_item__total_discount?: number | null
          line_item__variant_id?: string | null
          line_item__variant_title?: string | null
          line_item__vendor?: string | null
          order_adjusted_discounts?: number | null
          order_app_id?: string | null
          order_billing_address_city?: string | null
          order_billing_address_country?: string | null
          order_billing_matches_shipping?: boolean | null
          order_cancel_reason?: string | null
          order_cancelled_at?: string | null
          order_channel_handle?: string | null
          order_closed_at?: string | null
          order_confirmation_number?: string | null
          order_confirmed?: string | null
          order_count?: number | null
          order_created_at?: string | null
          order_customer_accepts_marketing?: boolean | null
          order_customer_first_visit_at?: string | null
          order_customer_first_visit_landing_page?: string | null
          order_customer_first_visit_source?: string | null
          order_customer_first_visit_utm_campaign?: string | null
          order_customer_first_visit_utm_content?: string | null
          order_customer_first_visit_utm_medium?: string | null
          order_customer_first_visit_utm_source?: string | null
          order_customer_first_visit_utm_term?: string | null
          order_customer_has_multiple_orders?: boolean | null
          order_customer_id?: string | null
          order_customer_last_visit_landing_page?: string | null
          order_customer_last_visit_referral_code?: string | null
          order_customer_last_visit_referrer_url?: string | null
          order_customer_last_visit_source?: string | null
          order_customer_last_visit_utm_campaign?: string | null
          order_customer_last_visit_utm_content?: string | null
          order_customer_last_visit_utm_medium?: string | null
          order_customer_last_visit_utm_source?: string | null
          order_customer_last_visit_utm_term?: string | null
          order_customer_number_of_orders?: number | null
          order_discount_code?: string | null
          order_discount_codes?: string | null
          order_email?: string | null
          order_financial_status?: string | null
          order_fulfillment_created_first_date?: string | null
          order_fulfillment_created_last_date?: string | null
          order_fulfillment_delivered_first_date?: string | null
          order_fulfillment_delivered_last_date?: string | null
          order_fulfillment_status?: string | null
          order_fully_paid?: boolean | null
          order_gross_sales?: number | null
          order_id?: string | null
          order_name?: string | null
          order_net_payment?: number | null
          order_net_sales?: number | null
          order_note?: string | null
          order_original_price?: number | null
          order_payment_gateways?: string | null
          order_po_number?: string | null
          order_processed_at?: string | null
          order_quantity?: number | null
          order_refunds_net?: number | null
          order_refunds_quantity?: number | null
          order_refunds_subtotal?: number | null
          order_registered_source_url?: string | null
          order_retail_location_name?: string | null
          order_return_status?: string | null
          order_returns_amount?: number | null
          order_returns_quantity?: number | null
          order_sales_channel?: string | null
          order_shipping_address_city?: string | null
          order_shipping_address_country?: string | null
          order_shipping_address_province?: string | null
          order_shipping_address_zip?: string | null
          order_shipping_line_carrier_identifier?: string | null
          order_shipping_line_code?: string | null
          order_shipping_line_discounted_amount?: number | null
          order_shipping_line_title?: string | null
          order_shipping_price?: number | null
          order_source_identifier?: string | null
          order_subtotal_price?: number | null
          order_tags?: string | null
          order_test?: boolean | null
          order_total_count?: number | null
          order_total_discount_cart?: number | null
          order_total_discounts?: number | null
          order_total_price?: number | null
          order_total_shipping_price?: number | null
          order_total_shipping_refunded_price?: number | null
          order_unpaid?: boolean | null
          order_updated_at?: string | null
        }
        Update: {
          _first_visit_loaded_at?: string | null
          _loaded_at?: string | null
          _row_id?: never
          date?: string | null
          line_item__discounted_unit_price?: number | null
          line_item__gift_card?: boolean | null
          line_item__id?: string | null
          line_item__name?: string | null
          line_item__net_sales?: number | null
          line_item__price?: number | null
          line_item__product_id?: string | null
          line_item__quantity?: number | null
          line_item__refunds_price?: number | null
          line_item__refunds_quantity?: number | null
          line_item__refunds_subtotal?: number | null
          line_item__sku?: string | null
          line_item__title?: string | null
          line_item__total_discount?: number | null
          line_item__variant_id?: string | null
          line_item__variant_title?: string | null
          line_item__vendor?: string | null
          order_adjusted_discounts?: number | null
          order_app_id?: string | null
          order_billing_address_city?: string | null
          order_billing_address_country?: string | null
          order_billing_matches_shipping?: boolean | null
          order_cancel_reason?: string | null
          order_cancelled_at?: string | null
          order_channel_handle?: string | null
          order_closed_at?: string | null
          order_confirmation_number?: string | null
          order_confirmed?: string | null
          order_count?: number | null
          order_created_at?: string | null
          order_customer_accepts_marketing?: boolean | null
          order_customer_first_visit_at?: string | null
          order_customer_first_visit_landing_page?: string | null
          order_customer_first_visit_source?: string | null
          order_customer_first_visit_utm_campaign?: string | null
          order_customer_first_visit_utm_content?: string | null
          order_customer_first_visit_utm_medium?: string | null
          order_customer_first_visit_utm_source?: string | null
          order_customer_first_visit_utm_term?: string | null
          order_customer_has_multiple_orders?: boolean | null
          order_customer_id?: string | null
          order_customer_last_visit_landing_page?: string | null
          order_customer_last_visit_referral_code?: string | null
          order_customer_last_visit_referrer_url?: string | null
          order_customer_last_visit_source?: string | null
          order_customer_last_visit_utm_campaign?: string | null
          order_customer_last_visit_utm_content?: string | null
          order_customer_last_visit_utm_medium?: string | null
          order_customer_last_visit_utm_source?: string | null
          order_customer_last_visit_utm_term?: string | null
          order_customer_number_of_orders?: number | null
          order_discount_code?: string | null
          order_discount_codes?: string | null
          order_email?: string | null
          order_financial_status?: string | null
          order_fulfillment_created_first_date?: string | null
          order_fulfillment_created_last_date?: string | null
          order_fulfillment_delivered_first_date?: string | null
          order_fulfillment_delivered_last_date?: string | null
          order_fulfillment_status?: string | null
          order_fully_paid?: boolean | null
          order_gross_sales?: number | null
          order_id?: string | null
          order_name?: string | null
          order_net_payment?: number | null
          order_net_sales?: number | null
          order_note?: string | null
          order_original_price?: number | null
          order_payment_gateways?: string | null
          order_po_number?: string | null
          order_processed_at?: string | null
          order_quantity?: number | null
          order_refunds_net?: number | null
          order_refunds_quantity?: number | null
          order_refunds_subtotal?: number | null
          order_registered_source_url?: string | null
          order_retail_location_name?: string | null
          order_return_status?: string | null
          order_returns_amount?: number | null
          order_returns_quantity?: number | null
          order_sales_channel?: string | null
          order_shipping_address_city?: string | null
          order_shipping_address_country?: string | null
          order_shipping_address_province?: string | null
          order_shipping_address_zip?: string | null
          order_shipping_line_carrier_identifier?: string | null
          order_shipping_line_code?: string | null
          order_shipping_line_discounted_amount?: number | null
          order_shipping_line_title?: string | null
          order_shipping_price?: number | null
          order_source_identifier?: string | null
          order_subtotal_price?: number | null
          order_tags?: string | null
          order_test?: boolean | null
          order_total_count?: number | null
          order_total_discount_cart?: number | null
          order_total_discounts?: number | null
          order_total_price?: number | null
          order_total_shipping_price?: number | null
          order_total_shipping_refunded_price?: number | null
          order_unpaid?: boolean | null
          order_updated_at?: string | null
        }
        Relationships: []
      }
      stg_shopify_products_variant: {
        Row: {
          _loaded_at: string | null
          _row_id: number
          date: string | null
          product_created_at_datetime: string | null
          product_description: string | null
          product_handle: string | null
          product_id: string | null
          product_image_src: string | null
          product_inventory_quantity: number | null
          product_inventory_value: number | null
          product_price: number | null
          product_published_at: string | null
          product_status: string | null
          product_tags: string | null
          product_template_suffix: string | null
          product_title: string | null
          product_type: string | null
          product_updated_at_datetime: string | null
          product_variant_barcode: string | null
          product_variant_compare_at_price: number | null
          product_variant_id: string | null
          product_variant_inventory_item_country_code_of_origin: string | null
          product_variant_inventory_item_created_at: string | null
          product_variant_inventory_item_id: string | null
          product_variant_inventory_item_requires_shipping: string | null
          product_variant_inventory_item_sku: string | null
          product_variant_inventory_item_updated_at: string | null
          product_variant_inventory_policy: string | null
          product_variant_inventory_quantity: number | null
          product_variant_option1: string | null
          product_variant_option2: string | null
          product_variant_option3: string | null
          product_variant_position: string | null
          product_variant_price: number | null
          product_variant_sku: string | null
          product_variant_taxable: boolean | null
          product_variant_title: string | null
          product_variant_weight: number | null
          product_variant_weight_unit: string | null
          product_vendor: string | null
        }
        Insert: {
          _loaded_at?: string | null
          _row_id?: never
          date?: string | null
          product_created_at_datetime?: string | null
          product_description?: string | null
          product_handle?: string | null
          product_id?: string | null
          product_image_src?: string | null
          product_inventory_quantity?: number | null
          product_inventory_value?: number | null
          product_price?: number | null
          product_published_at?: string | null
          product_status?: string | null
          product_tags?: string | null
          product_template_suffix?: string | null
          product_title?: string | null
          product_type?: string | null
          product_updated_at_datetime?: string | null
          product_variant_barcode?: string | null
          product_variant_compare_at_price?: number | null
          product_variant_id?: string | null
          product_variant_inventory_item_country_code_of_origin?: string | null
          product_variant_inventory_item_created_at?: string | null
          product_variant_inventory_item_id?: string | null
          product_variant_inventory_item_requires_shipping?: string | null
          product_variant_inventory_item_sku?: string | null
          product_variant_inventory_item_updated_at?: string | null
          product_variant_inventory_policy?: string | null
          product_variant_inventory_quantity?: number | null
          product_variant_option1?: string | null
          product_variant_option2?: string | null
          product_variant_option3?: string | null
          product_variant_position?: string | null
          product_variant_price?: number | null
          product_variant_sku?: string | null
          product_variant_taxable?: boolean | null
          product_variant_title?: string | null
          product_variant_weight?: number | null
          product_variant_weight_unit?: string | null
          product_vendor?: string | null
        }
        Update: {
          _loaded_at?: string | null
          _row_id?: never
          date?: string | null
          product_created_at_datetime?: string | null
          product_description?: string | null
          product_handle?: string | null
          product_id?: string | null
          product_image_src?: string | null
          product_inventory_quantity?: number | null
          product_inventory_value?: number | null
          product_price?: number | null
          product_published_at?: string | null
          product_status?: string | null
          product_tags?: string | null
          product_template_suffix?: string | null
          product_title?: string | null
          product_type?: string | null
          product_updated_at_datetime?: string | null
          product_variant_barcode?: string | null
          product_variant_compare_at_price?: number | null
          product_variant_id?: string | null
          product_variant_inventory_item_country_code_of_origin?: string | null
          product_variant_inventory_item_created_at?: string | null
          product_variant_inventory_item_id?: string | null
          product_variant_inventory_item_requires_shipping?: string | null
          product_variant_inventory_item_sku?: string | null
          product_variant_inventory_item_updated_at?: string | null
          product_variant_inventory_policy?: string | null
          product_variant_inventory_quantity?: number | null
          product_variant_option1?: string | null
          product_variant_option2?: string | null
          product_variant_option3?: string | null
          product_variant_position?: string | null
          product_variant_price?: number | null
          product_variant_sku?: string | null
          product_variant_taxable?: boolean | null
          product_variant_title?: string | null
          product_variant_weight?: number | null
          product_variant_weight_unit?: string | null
          product_vendor?: string | null
        }
        Relationships: []
      }
      tab_avg_kpis: {
        Row: {
          meta: string | null
          metrica: string | null
          ord: number | null
          sugestao: string | null
          valor: string | null
        }
        Insert: {
          meta?: string | null
          metrica?: string | null
          ord?: number | null
          sugestao?: string | null
          valor?: string | null
        }
        Update: {
          meta?: string | null
          metrica?: string | null
          ord?: number | null
          sugestao?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      tab_cliente_canais: {
        Row: {
          alcance: string | null
          canais: number | null
          cliente_chave: string | null
          cliente_id: number | null
          dias_entre_primeira_ultima: number | null
          faturamento: number | null
          pedidos: number | null
          perfil: string | null
          primeira_compra: string | null
          quais_canais: string | null
          sugestao: string | null
          ticket_medio: number | null
          uf: string | null
          ultima_compra: string | null
        }
        Insert: {
          alcance?: string | null
          canais?: number | null
          cliente_chave?: string | null
          cliente_id?: number | null
          dias_entre_primeira_ultima?: number | null
          faturamento?: number | null
          pedidos?: number | null
          perfil?: string | null
          primeira_compra?: string | null
          quais_canais?: string | null
          sugestao?: string | null
          ticket_medio?: number | null
          uf?: string | null
          ultima_compra?: string | null
        }
        Update: {
          alcance?: string | null
          canais?: number | null
          cliente_chave?: string | null
          cliente_id?: number | null
          dias_entre_primeira_ultima?: number | null
          faturamento?: number | null
          pedidos?: number | null
          perfil?: string | null
          primeira_compra?: string | null
          quais_canais?: string | null
          sugestao?: string | null
          ticket_medio?: number | null
          uf?: string | null
          ultima_compra?: string | null
        }
        Relationships: []
      }
      tab_google_produto_dia: {
        Row: {
          brand: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          conversoes: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          product_item_id: string | null
          product_title: string | null
          receita: number | null
          roas: number | null
          taxa_conversao: number | null
          tipo: string | null
        }
        Insert: {
          brand?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          cliques?: number | null
          conversoes?: number | null
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          data?: string | null
          gasto?: number | null
          impressoes?: number | null
          product_item_id?: string | null
          product_title?: string | null
          receita?: number | null
          roas?: number | null
          taxa_conversao?: number | null
          tipo?: string | null
        }
        Update: {
          brand?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          cliques?: number | null
          conversoes?: number | null
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          data?: string | null
          gasto?: number | null
          impressoes?: number | null
          product_item_id?: string | null
          product_title?: string | null
          receita?: number | null
          roas?: number | null
          taxa_conversao?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      tab_google_termo_dia: {
        Row: {
          ad_group_id: string | null
          ad_group_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          conversoes: number | null
          cpc: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          receita: number | null
          roas: number | null
          search_term: string | null
        }
        Insert: {
          ad_group_id?: string | null
          ad_group_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          cliques?: number | null
          conversoes?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string | null
          gasto?: number | null
          impressoes?: number | null
          receita?: number | null
          roas?: number | null
          search_term?: string | null
        }
        Update: {
          ad_group_id?: string | null
          ad_group_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          cliques?: number | null
          conversoes?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string | null
          gasto?: number | null
          impressoes?: number | null
          receita?: number | null
          roas?: number | null
          search_term?: string | null
        }
        Relationships: []
      }
      tab_item_conversao_dia: {
        Row: {
          conversao_pct: number | null
          data: string | null
          item_id: string | null
          pedidos: number | null
          price: number | null
          receita: number | null
          seller_sku: string | null
          title: string | null
          unidades_vendidas: number | null
          visitas: number | null
        }
        Insert: {
          conversao_pct?: number | null
          data?: string | null
          item_id?: string | null
          pedidos?: number | null
          price?: number | null
          receita?: number | null
          seller_sku?: string | null
          title?: string | null
          unidades_vendidas?: number | null
          visitas?: number | null
        }
        Update: {
          conversao_pct?: number | null
          data?: string | null
          item_id?: string | null
          pedidos?: number | null
          price?: number | null
          receita?: number | null
          seller_sku?: string | null
          title?: string | null
          unidades_vendidas?: number | null
          visitas?: number | null
        }
        Relationships: []
      }
      tab_ml_anuncio_dia: {
        Row: {
          comissao: number | null
          data: string | null
          faturamento: number | null
          item_id: string | null
          pedidos: number | null
          unidades: number | null
          visitas: number | null
        }
        Insert: {
          comissao?: number | null
          data?: string | null
          faturamento?: number | null
          item_id?: string | null
          pedidos?: number | null
          unidades?: number | null
          visitas?: number | null
        }
        Update: {
          comissao?: number | null
          data?: string | null
          faturamento?: number | null
          item_id?: string | null
          pedidos?: number | null
          unidades?: number | null
          visitas?: number | null
        }
        Relationships: []
      }
      tab_ml_kpi_dia: {
        Row: {
          atualizado_em: string | null
          comissao: number | null
          data: string
          faturamento: number | null
          invest_brand: number | null
          invest_display: number | null
          invest_pads: number | null
          pedidos: number | null
          unidades: number | null
        }
        Insert: {
          atualizado_em?: string | null
          comissao?: number | null
          data: string
          faturamento?: number | null
          invest_brand?: number | null
          invest_display?: number | null
          invest_pads?: number | null
          pedidos?: number | null
          unidades?: number | null
        }
        Update: {
          atualizado_em?: string | null
          comissao?: number | null
          data?: string
          faturamento?: number | null
          invest_brand?: number | null
          invest_display?: number | null
          invest_pads?: number | null
          pedidos?: number | null
          unidades?: number | null
        }
        Relationships: []
      }
      tab_site_ads_por_tipo_dia: {
        Row: {
          acos: number | null
          base_receita: string | null
          canal: string | null
          cliques: number | null
          data: string | null
          impressoes: number | null
          investimento: number | null
          pedidos_shopify: number | null
          receita: number | null
          receita_plataforma: number | null
          roas: number | null
          tipo: string | null
          tipo_raw: string | null
        }
        Insert: {
          acos?: number | null
          base_receita?: string | null
          canal?: string | null
          cliques?: number | null
          data?: string | null
          impressoes?: number | null
          investimento?: number | null
          pedidos_shopify?: number | null
          receita?: number | null
          receita_plataforma?: number | null
          roas?: number | null
          tipo?: string | null
          tipo_raw?: string | null
        }
        Update: {
          acos?: number | null
          base_receita?: string | null
          canal?: string | null
          cliques?: number | null
          data?: string | null
          impressoes?: number | null
          investimento?: number | null
          pedidos_shopify?: number | null
          receita?: number | null
          receita_plataforma?: number | null
          roas?: number | null
          tipo?: string | null
          tipo_raw?: string | null
        }
        Relationships: []
      }
      tab_site_geral_dia: {
        Row: {
          acos_ads: number | null
          data: string | null
          desconto: number | null
          devolucoes: number | null
          faturamento_bruto: number | null
          faturamento_liquido: number | null
          frete: number | null
          invest_ads: number | null
          pct_cliente_novo: number | null
          pedidos: number | null
          pedidos_cliente_novo: number | null
          receita_ads: number | null
          roas_ads: number | null
          roas_total: number | null
          share_ads_pct: number | null
          tacos: number | null
          ticket_medio: number | null
          total_pago: number | null
          unidades: number | null
          unidades_devolvidas: number | null
          venda_total: number | null
        }
        Insert: {
          acos_ads?: number | null
          data?: string | null
          desconto?: number | null
          devolucoes?: number | null
          faturamento_bruto?: number | null
          faturamento_liquido?: number | null
          frete?: number | null
          invest_ads?: number | null
          pct_cliente_novo?: number | null
          pedidos?: number | null
          pedidos_cliente_novo?: number | null
          receita_ads?: number | null
          roas_ads?: number | null
          roas_total?: number | null
          share_ads_pct?: number | null
          tacos?: number | null
          ticket_medio?: number | null
          total_pago?: number | null
          unidades?: number | null
          unidades_devolvidas?: number | null
          venda_total?: number | null
        }
        Update: {
          acos_ads?: number | null
          data?: string | null
          desconto?: number | null
          devolucoes?: number | null
          faturamento_bruto?: number | null
          faturamento_liquido?: number | null
          frete?: number | null
          invest_ads?: number | null
          pct_cliente_novo?: number | null
          pedidos?: number | null
          pedidos_cliente_novo?: number | null
          receita_ads?: number | null
          roas_ads?: number | null
          roas_total?: number | null
          share_ads_pct?: number | null
          tacos?: number | null
          ticket_medio?: number | null
          total_pago?: number | null
          unidades?: number | null
          unidades_devolvidas?: number | null
          venda_total?: number | null
        }
        Relationships: []
      }
      tab_site_origem_dia: {
        Row: {
          data: string | null
          faturamento_liquido: number | null
          origem: string | null
          pedidos: number | null
          total_pago: number | null
          unidades: number | null
        }
        Insert: {
          data?: string | null
          faturamento_liquido?: number | null
          origem?: string | null
          pedidos?: number | null
          total_pago?: number | null
          unidades?: number | null
        }
        Update: {
          data?: string | null
          faturamento_liquido?: number | null
          origem?: string | null
          pedidos?: number | null
          total_pago?: number | null
          unidades?: number | null
        }
        Relationships: []
      }
      tab_site_produto_dia: {
        Row: {
          data: string | null
          pedidos: number | null
          produto: string | null
          produto_key: string | null
          receita: number | null
          sku: string | null
          unidades: number | null
        }
        Insert: {
          data?: string | null
          pedidos?: number | null
          produto?: string | null
          produto_key?: string | null
          receita?: number | null
          sku?: string | null
          unidades?: number | null
        }
        Update: {
          data?: string | null
          pedidos?: number | null
          produto?: string | null
          produto_key?: string | null
          receita?: number | null
          sku?: string | null
          unidades?: number | null
        }
        Relationships: []
      }
      tab_vg_kpis: {
        Row: {
          meta: string | null
          metrica: string | null
          ord: number | null
          sugestao: string | null
          valor: string | null
        }
        Insert: {
          meta?: string | null
          metrica?: string | null
          ord?: number | null
          sugestao?: string | null
          valor?: string | null
        }
        Update: {
          meta?: string | null
          metrica?: string | null
          ord?: number | null
          sugestao?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      tiktok_ads_credentials: {
        Row: {
          access_token: string | null
          advertiser_id: string | null
          advertiser_ids: Json | null
          app_id: string | null
          atualizado_em: string | null
          id: number
          obtido_em: string | null
          scope: Json | null
        }
        Insert: {
          access_token?: string | null
          advertiser_id?: string | null
          advertiser_ids?: Json | null
          app_id?: string | null
          atualizado_em?: string | null
          id?: number
          obtido_em?: string | null
          scope?: Json | null
        }
        Update: {
          access_token?: string | null
          advertiser_id?: string | null
          advertiser_ids?: Json | null
          app_id?: string | null
          atualizado_em?: string | null
          id?: number
          obtido_em?: string | null
          scope?: Json | null
        }
        Relationships: []
      }
      tiktok_ads_cria_fila: {
        Row: {
          atualizado: string | null
          campaign_id: string
          data: string
          item_group_id: string
          linhas: number | null
          pagina: number
          status: string
          tentativas: number
        }
        Insert: {
          atualizado?: string | null
          campaign_id: string
          data: string
          item_group_id: string
          linhas?: number | null
          pagina?: number
          status?: string
          tentativas?: number
        }
        Update: {
          atualizado?: string | null
          campaign_id?: string
          data?: string
          item_group_id?: string
          linhas?: number | null
          pagina?: number
          status?: string
          tentativas?: number
        }
        Relationships: []
      }
      tiktok_analytics_fila: {
        Row: {
          atualizado: string | null
          dia: string
          linhas: number | null
          status: string
          tentativas: number | null
          tipo: string
        }
        Insert: {
          atualizado?: string | null
          dia: string
          linhas?: number | null
          status?: string
          tentativas?: number | null
          tipo: string
        }
        Update: {
          atualizado?: string | null
          dia?: string
          linhas?: number | null
          status?: string
          tentativas?: number | null
          tipo?: string
        }
        Relationships: []
      }
      tiktok_auth: {
        Row: {
          access_token: string
          expires_at: number
          refresh_token: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          access_token: string
          expires_at: number
          refresh_token: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          expires_at?: number
          refresh_token?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tiktok_backfill_fila: {
        Row: {
          atualizado: string | null
          dia: string
          itens: number | null
          pedidos: number | null
          status: string
          tentativas: number
        }
        Insert: {
          atualizado?: string | null
          dia: string
          itens?: number | null
          pedidos?: number | null
          status?: string
          tentativas?: number
        }
        Update: {
          atualizado?: string | null
          dia?: string
          itens?: number | null
          pedidos?: number | null
          status?: string
          tentativas?: number
        }
        Relationships: []
      }
      tiktok_pedido: {
        Row: {
          address_detail: string | null
          address_line1: string | null
          address_line2: string | null
          address_line3: string | null
          address_line4: string | null
          bairro: string | null
          buyer_email: string | null
          buyer_phone: string | null
          buyer_user_id: string | null
          cancel_reason: string | null
          cancel_time: number | null
          cancellation_initiator: string | null
          carregado_em: string | null
          cpf: string | null
          cpf_name: string | null
          create_dia: string | null
          create_time: number | null
          currency: string | null
          delivery_type: string | null
          fulfillment_type: string | null
          full_address: string | null
          is_cod: boolean | null
          is_sample_order: boolean | null
          municipio: string | null
          order_id: string
          order_type: string | null
          original_shipping_fee: number | null
          original_total_product_price: number | null
          paid_time: number | null
          payment_method: string | null
          platform_discount: number | null
          postal_code: string | null
          recipient_first_name: string | null
          recipient_last_name: string | null
          recipient_name: string | null
          region_code: string | null
          seller_discount: number | null
          shipping_fee: number | null
          shipping_fee_platform_discount: number | null
          shipping_provider: string | null
          status: string | null
          sub_total: number | null
          total_amount: number | null
          uf: string | null
          update_time: number | null
          warehouse_id: string | null
        }
        Insert: {
          address_detail?: string | null
          address_line1?: string | null
          address_line2?: string | null
          address_line3?: string | null
          address_line4?: string | null
          bairro?: string | null
          buyer_email?: string | null
          buyer_phone?: string | null
          buyer_user_id?: string | null
          cancel_reason?: string | null
          cancel_time?: number | null
          cancellation_initiator?: string | null
          carregado_em?: string | null
          cpf?: string | null
          cpf_name?: string | null
          create_dia?: string | null
          create_time?: number | null
          currency?: string | null
          delivery_type?: string | null
          fulfillment_type?: string | null
          full_address?: string | null
          is_cod?: boolean | null
          is_sample_order?: boolean | null
          municipio?: string | null
          order_id: string
          order_type?: string | null
          original_shipping_fee?: number | null
          original_total_product_price?: number | null
          paid_time?: number | null
          payment_method?: string | null
          platform_discount?: number | null
          postal_code?: string | null
          recipient_first_name?: string | null
          recipient_last_name?: string | null
          recipient_name?: string | null
          region_code?: string | null
          seller_discount?: number | null
          shipping_fee?: number | null
          shipping_fee_platform_discount?: number | null
          shipping_provider?: string | null
          status?: string | null
          sub_total?: number | null
          total_amount?: number | null
          uf?: string | null
          update_time?: number | null
          warehouse_id?: string | null
        }
        Update: {
          address_detail?: string | null
          address_line1?: string | null
          address_line2?: string | null
          address_line3?: string | null
          address_line4?: string | null
          bairro?: string | null
          buyer_email?: string | null
          buyer_phone?: string | null
          buyer_user_id?: string | null
          cancel_reason?: string | null
          cancel_time?: number | null
          cancellation_initiator?: string | null
          carregado_em?: string | null
          cpf?: string | null
          cpf_name?: string | null
          create_dia?: string | null
          create_time?: number | null
          currency?: string | null
          delivery_type?: string | null
          fulfillment_type?: string | null
          full_address?: string | null
          is_cod?: boolean | null
          is_sample_order?: boolean | null
          municipio?: string | null
          order_id?: string
          order_type?: string | null
          original_shipping_fee?: number | null
          original_total_product_price?: number | null
          paid_time?: number | null
          payment_method?: string | null
          platform_discount?: number | null
          postal_code?: string | null
          recipient_first_name?: string | null
          recipient_last_name?: string | null
          recipient_name?: string | null
          region_code?: string | null
          seller_discount?: number | null
          shipping_fee?: number | null
          shipping_fee_platform_discount?: number | null
          shipping_provider?: string | null
          status?: string | null
          sub_total?: number | null
          total_amount?: number | null
          uf?: string | null
          update_time?: number | null
          warehouse_id?: string | null
        }
        Relationships: []
      }
      tiktok_pedido_item: {
        Row: {
          carregado_em: string | null
          create_dia: string | null
          display_status: string | null
          line_item_id: string
          order_id: string
          original_price: number | null
          package_id: string | null
          package_status: string | null
          platform_discount: number | null
          product_id: string | null
          product_name: string | null
          sale_price: number | null
          seller_discount: number | null
          seller_sku: string | null
          sku_id: string | null
          sku_name: string | null
          status: string | null
          tracking_number: string | null
        }
        Insert: {
          carregado_em?: string | null
          create_dia?: string | null
          display_status?: string | null
          line_item_id: string
          order_id: string
          original_price?: number | null
          package_id?: string | null
          package_status?: string | null
          platform_discount?: number | null
          product_id?: string | null
          product_name?: string | null
          sale_price?: number | null
          seller_discount?: number | null
          seller_sku?: string | null
          sku_id?: string | null
          sku_name?: string | null
          status?: string | null
          tracking_number?: string | null
        }
        Update: {
          carregado_em?: string | null
          create_dia?: string | null
          display_status?: string | null
          line_item_id?: string
          order_id?: string
          original_price?: number | null
          package_id?: string | null
          package_status?: string | null
          platform_discount?: number | null
          product_id?: string | null
          product_name?: string | null
          sale_price?: number | null
          seller_discount?: number | null
          seller_sku?: string | null
          sku_id?: string | null
          sku_name?: string | null
          status?: string | null
          tracking_number?: string | null
        }
        Relationships: []
      }
      tiktok_produto_hist: {
        Row: {
          campo: string
          id: number
          mudou_em: string | null
          product_id: string
          valor_antigo: string | null
          valor_novo: string | null
        }
        Insert: {
          campo: string
          id?: number
          mudou_em?: string | null
          product_id: string
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo?: string
          id?: number
          mudou_em?: string | null
          product_id?: string
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      tiktok_sync_log: {
        Row: {
          elapsed_ms: number | null
          erro: string | null
          executado_em: string | null
          id: number
          itens: number | null
          paginas: number | null
          params: Json | null
          pedidos: number | null
        }
        Insert: {
          elapsed_ms?: number | null
          erro?: string | null
          executado_em?: string | null
          id?: number
          itens?: number | null
          paginas?: number | null
          params?: Json | null
          pedidos?: number | null
        }
        Update: {
          elapsed_ms?: number | null
          erro?: string | null
          executado_em?: string | null
          id?: number
          itens?: number | null
          paginas?: number | null
          params?: Json | null
          pedidos?: number | null
        }
        Relationships: []
      }
      uppromote_afiliado: {
        Row: {
          atualizado_em: string
          criado_em: string | null
          cupons: string[]
          id: number
          nome: string | null
          programa: string | null
          programa_id: number | null
          status: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string | null
          cupons?: string[]
          id: number
          nome?: string | null
          programa?: string | null
          programa_id?: number | null
          status?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string | null
          cupons?: string[]
          id?: number
          nome?: string | null
          programa?: string | null
          programa_id?: number | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      _src_avg_kpis: {
        Row: {
          meta: string | null
          metrica: string | null
          ord: number | null
          sugestao: string | null
          valor: string | null
        }
        Relationships: []
      }
      _src_google_produto_dia: {
        Row: {
          brand: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          conversoes: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          product_item_id: string | null
          product_title: string | null
          receita: number | null
          roas: number | null
          taxa_conversao: number | null
          tipo: string | null
        }
        Relationships: []
      }
      _src_google_termo_dia: {
        Row: {
          ad_group_id: string | null
          ad_group_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          conversoes: number | null
          cpc: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          receita: number | null
          roas: number | null
          search_term: string | null
        }
        Relationships: []
      }
      _src_item_conversao_dia: {
        Row: {
          conversao_pct: number | null
          data: string | null
          item_id: string | null
          pedidos: number | null
          price: number | null
          receita: number | null
          seller_sku: string | null
          title: string | null
          unidades_vendidas: number | null
          visitas: number | null
        }
        Relationships: []
      }
      _src_site_ads_por_tipo_dia: {
        Row: {
          acos: number | null
          base_receita: string | null
          canal: string | null
          cliques: number | null
          data: string | null
          impressoes: number | null
          investimento: number | null
          pedidos_shopify: number | null
          receita: number | null
          receita_plataforma: number | null
          roas: number | null
          tipo: string | null
          tipo_raw: string | null
        }
        Relationships: []
      }
      _src_site_produto_dia: {
        Row: {
          data: string | null
          pedidos: number | null
          produto: string | null
          produto_key: string | null
          receita: number | null
          sku: string | null
          unidades: number | null
        }
        Relationships: []
      }
      _src_vw_cliente_canais: {
        Row: {
          alcance: string | null
          canais: number | null
          cliente_chave: string | null
          dias_entre_primeira_ultima: number | null
          faturamento: number | null
          pedidos: number | null
          perfil: string | null
          primeira_compra: string | null
          quais_canais: string | null
          sugestao: string | null
          ticket_medio: number | null
          uf: string | null
          ultima_compra: string | null
        }
        Relationships: []
      }
      mv_afiliado_canal_dia: {
        Row: {
          canal: string | null
          data: string | null
          inv: number | null
          rec: number | null
        }
        Relationships: []
      }
      mv_growth_acao_resumo: {
        Row: {
          acao: string | null
          acionavel: string | null
          canal: string | null
          chance_media: number | null
          clientes: number | null
          gerado_em: string | null
          ticket_medio: number | null
          valor_esperado: number | null
          valor_historico: number | null
        }
        Relationships: []
      }
      mv_growth_cac_canal_mes: {
        Row: {
          canal_entrada: string | null
          gerado_em: string | null
          ltv_medio: number | null
          mes: string | null
          novos: number | null
          receita_acumulada: number | null
        }
        Relationships: []
      }
      mv_growth_cac_cohort: {
        Row: {
          cac: number | null
          canal: string | null
          gerado_em: string | null
          invest_aquisicao: number | null
          mes: string | null
          novos: number | null
        }
        Relationships: []
      }
      mv_growth_cliente_perfil: {
        Row: {
          acao: string | null
          acionavel: string | null
          canais: number | null
          canal_entrada: string | null
          canal_ultimo: string | null
          chance_30: number | null
          chance_60: number | null
          chance_90: number | null
          cliente_chave: string | null
          dias_atraso: number | null
          dias_ultima_compra: number | null
          gerado_em: string | null
          ltv_esperado: number | null
          pedidos: number | null
          primeira_compra: string | null
          produto_principal: string | null
          produto_provavel: string | null
          razao_ritmo: number | null
          ritmo_dias: number | null
          ritmo_proprio: boolean | null
          sku_principal: string | null
          sku_provavel: string | null
          ticket_medio: number | null
          ultima_compra: string | null
          valor_esperado_90: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      mv_growth_cliente_primeira: {
        Row: {
          cliente_id: number | null
          primeira: string | null
        }
        Relationships: []
      }
      mv_growth_cohort_canal_mes: {
        Row: {
          canal_entrada: string | null
          clientes: number | null
          clientes_safra: number | null
          gerado_em: string | null
          mes_offset: number | null
          pedidos: number | null
          receita: number | null
          safra: string | null
        }
        Relationships: []
      }
      mv_growth_cohort_mes: {
        Row: {
          clientes: number | null
          clientes_safra: number | null
          gerado_em: string | null
          mes_offset: number | null
          pedidos: number | null
          receita: number | null
          safra: string | null
        }
        Relationships: []
      }
      mv_growth_ltv_canal: {
        Row: {
          canal: string | null
          clientes: number | null
          gerado_em: string | null
          pedidos: number | null
          receita: number | null
        }
        Relationships: []
      }
      mv_growth_mes: {
        Row: {
          clientes: number | null
          gerado_em: string | null
          mes: string | null
          novos: number | null
          pedidos: number | null
          receita: number | null
          recorrentes: number | null
        }
        Relationships: []
      }
      mv_growth_origem_campanha: {
        Row: {
          campanha_entrada: string | null
          clientes: number | null
          gerado_em: string | null
          ltv_medio: number | null
          origem_entrada: string | null
          pedidos: number | null
          receita: number | null
          recompradores: number | null
        }
        Relationships: []
      }
      mv_growth_origem_canal: {
        Row: {
          canal_entrada: string | null
          clientes: number | null
          gerado_em: string | null
          ltv_medio: number | null
          pct_recompra: number | null
          pedidos: number | null
          primeira_entrada: string | null
          receita: number | null
          recompradores: number | null
          ultima_entrada: string | null
        }
        Relationships: []
      }
      mv_growth_origem_cliente: {
        Row: {
          campanha_entrada: string | null
          canal_entrada: string | null
          cliente_chave: string | null
          data_entrada: string | null
          gerado_em: string | null
          mes_entrada: string | null
          midia_entrada: string | null
          origem_entrada: string | null
          pedidos: number | null
          receita: number | null
          ultima_compra: string | null
        }
        Relationships: []
      }
      mv_growth_produto_ciclo: {
        Row: {
          ciclo_mediano: number | null
          clientes: number | null
          compras: number | null
          gerado_em: string | null
          pct_retorno_30: number | null
          pct_retorno_60: number | null
          pct_retorno_90: number | null
          produto: string | null
          recompras: number | null
          sku: string | null
        }
        Relationships: []
      }
      mv_growth_produto_proximo: {
        Row: {
          forca_pct: number | null
          gerado_em: string | null
          ocorrencias: number | null
          pos: number | null
          produto_seguinte: string | null
          sku_origem: string | null
          sku_seguinte: string | null
        }
        Relationships: []
      }
      mv_growth_recompra_acuracia: {
        Row: {
          clientes: number | null
          faixa: string | null
          gerado_em: string | null
          horizonte_dias: number | null
          previsto_pct: number | null
          realizado_pct: number | null
        }
        Relationships: []
      }
      mv_growth_rfm_segmento: {
        Row: {
          clientes: number | null
          frequencia_media: number | null
          gerado_em: string | null
          receita: number | null
          recencia_media: number | null
          segmento: string | null
          ticket_medio: number | null
        }
        Relationships: []
      }
      mv_pl_canal_dia: {
        Row: {
          ads: number | null
          canal: string | null
          cmv: number | null
          cmv_carregado: boolean | null
          cmv_cobertura_pct: number | null
          cobertura_pct: number | null
          custo_canal: number | null
          custo_canal_ref: number | null
          data: string | null
          det_afiliado: number | null
          det_frete: number | null
          det_taxa: number | null
          imposto: number | null
          imposto_pct: number | null
          margem_contribuicao: number | null
          margem_pct: number | null
          qualidade_taxa: string | null
          receita_bruta: number | null
        }
        Relationships: []
      }
      mv_produto_dia: {
        Row: {
          canal: string | null
          data: string | null
          invest_ads: number | null
          pedidos: number | null
          preco_medio: number | null
          produto: string | null
          receita: number | null
          receita_ads: number | null
          roas: number | null
          share_ads_pct: number | null
          sku: string | null
          tacos_pct: number | null
          ticket: number | null
          unidades: number | null
        }
        Relationships: []
      }
      mv_site_pedido_pagina_dia: {
        Row: {
          data: string | null
          pagina_path: string | null
          pedidos: number | null
          receita: number | null
          unidades: number | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      mv_sn_item_cat: {
        Row: {
          cat: string | null
          cli: string | null
          order_id: string | null
          produto: string | null
          qtd: number | null
          receita: number | null
          ts: string | null
        }
        Relationships: []
      }
      rev_flow_resumo: {
        Row: {
          acoes: Json | null
          flow_id: string | null
          g_gatilho: number | null
          g_perfil: number | null
          gat_id: string | null
          gat_tipo: string | null
          nome: string | null
          pf: Json | null
          status: string | null
        }
        Relationships: []
      }
      vw_aads_campanhas: {
        Row: {
          acos: number | null
          campanha: string | null
          invest: number | null
          roas: number | null
          sugestao: string | null
          tipo: string | null
          unidades: number | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_aads_keywords: {
        Row: {
          acos: number | null
          cliques: number | null
          invest: number | null
          keyword: string | null
          match_type: string | null
          roas: number | null
          sugestao: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_aads_matchtype: {
        Row: {
          acos: number | null
          invest: number | null
          roas: number | null
          sugestao: string | null
          tipo: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_aads_negativar: {
        Row: {
          cliques: number | null
          invest_desperdicado: number | null
          keyword: string | null
          match_type: string | null
        }
        Relationships: []
      }
      vw_aads_produtos: {
        Row: {
          acos_pct: number | null
          asin: string | null
          cliques: number | null
          compras: number | null
          ctr_pct: number | null
          impressoes: number | null
          invest: number | null
          produto: string | null
          roas: number | null
          sku: string | null
          sugestao: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_aads_segmentos: {
        Row: {
          invest: number | null
          roas: number | null
          segmento: string | null
          share_pct: number | null
          sugestao: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_aanun_buybox: {
        Row: {
          anuncio: string | null
          asin: string | null
          buybox_pct: number | null
          faturamento: number | null
          sugestao: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_aanun_melhorar: {
        Row: {
          acos_asin_pct: number | null
          anuncio: string | null
          asin: string | null
          buybox_pct: number | null
          conversao_pct: number | null
          faturamento: number | null
          preco_medio: number | null
          pv_por_sessao: number | null
          sessoes: number | null
          sugestao: string | null
          tacos_asin_pct: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_aanun_top: {
        Row: {
          acos_asin_pct: number | null
          anuncio: string | null
          asin: string | null
          buybox_pct: number | null
          conversao_pct: number | null
          faturamento: number | null
          preco_medio: number | null
          pv_por_sessao: number | null
          sessoes: number | null
          sugestao: string | null
          tacos_asin_pct: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_abb_resumo: {
        Row: {
          asins: number | null
          atualizado: string | null
          com_concorrente: number | null
          em_risco: number | null
          ganha_bb: number | null
          perdendo_concorrente: number | null
          suprimida: number | null
        }
        Relationships: []
      }
      vw_acad_resumo: {
        Row: {
          cadastros: number | null
          health_medio: number | null
          poucas_fotos: number | null
          poucos_bullets: number | null
          sem_aplus: number | null
          sem_aplus_que_vende: number | null
          sem_descricao: number | null
          venda28_sem_aplus: number | null
        }
        Relationships: []
      }
      vw_ads_funil_canal_dia: {
        Row: {
          base_conversao: string | null
          canal: string | null
          cliques: number | null
          conversoes: number | null
          cpc: number | null
          ctr: number | null
          custo_conversao: number | null
          data: string | null
          impressoes: number | null
          invest: number | null
          receita_ads: number | null
          taxa_conversao: number | null
        }
        Relationships: []
      }
      vw_ads_por_tipo_dia: {
        Row: {
          cliques: number | null
          data: string | null
          impressoes: number | null
          investimento: number | null
          receita: number | null
          tipo: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_aest_fora_fba: {
        Row: {
          asin: string | null
          pct_produto_fora_fba: number | null
          produto: string | null
          sugestao: string | null
          unidades_fbm: number | null
          vendas_fbm: number | null
        }
        Relationships: []
      }
      vw_aest_kpi: {
        Row: {
          meta: string | null
          metrica: string | null
          valor: string | null
        }
        Relationships: []
      }
      vw_aest_reposicao: {
        Row: {
          a_caminho: number | null
          alerta: string | null
          asin: string | null
          cobertura_dias: number | null
          disponivel: number | null
          enviar_30d: number | null
          produto: string | null
          sku: string | null
          sugestao: string | null
          vendas_21d: number | null
          vende_dia: number | null
        }
        Insert: {
          a_caminho?: number | null
          alerta?: string | null
          asin?: string | null
          cobertura_dias?: never
          disponivel?: number | null
          enviar_30d?: number | null
          produto?: string | null
          sku?: string | null
          sugestao?: never
          vendas_21d?: number | null
          vende_dia?: never
        }
        Update: {
          a_caminho?: number | null
          alerta?: string | null
          asin?: string | null
          cobertura_dias?: never
          disponivel?: number | null
          enviar_30d?: number | null
          produto?: string | null
          sku?: string | null
          sugestao?: never
          vendas_21d?: number | null
          vende_dia?: never
        }
        Relationships: []
      }
      vw_aest_resumo: {
        Row: {
          alerta: string | null
          ord: number | null
          produtos: number | null
          sugestao: string | null
          total_enviar: number | null
          vendas_21d: number | null
        }
        Relationships: []
      }
      vw_aest_sp_detalhe: {
        Row: {
          a_caminho: number | null
          alerta: string | null
          asin: string | null
          atualizado_amazon: string | null
          danif_armazem: number | null
          danif_cliente: number | null
          defeito: number | null
          em_pesquisa: number | null
          imprestavel: number | null
          produto: string | null
          reservado: number | null
          seller_sku: string | null
          total: number | null
          vencido: number | null
          vendas_28d: number | null
          vendas_7d: number | null
          vendavel: number | null
        }
        Relationships: []
      }
      vw_aest_sp_imprestavel: {
        Row: {
          asin: string | null
          danif_armazem: number | null
          danif_cliente: number | null
          defeito: number | null
          imprestavel: number | null
          produto: string | null
          seller_sku: string | null
          sugestao: string | null
          vencido: number | null
        }
        Insert: {
          asin?: string | null
          danif_armazem?: number | null
          danif_cliente?: number | null
          defeito?: number | null
          imprestavel?: number | null
          produto?: string | null
          seller_sku?: string | null
          sugestao?: never
          vencido?: number | null
        }
        Update: {
          asin?: string | null
          danif_armazem?: number | null
          danif_cliente?: number | null
          defeito?: number | null
          imprestavel?: number | null
          produto?: string | null
          seller_sku?: string | null
          sugestao?: never
          vencido?: number | null
        }
        Relationships: []
      }
      vw_aest_sp_resumo: {
        Row: {
          a_caminho: number | null
          com_imprestavel: number | null
          dado_mais_recente: string | null
          imprestavel: number | null
          reservado: number | null
          rupturados: number | null
          skus: number | null
          total_un: number | null
          vendavel: number | null
        }
        Relationships: []
      }
      vw_amazon_ads_campanha_lista: {
        Row: {
          ad_type: string | null
          budget: number | null
          campaign_id: string | null
          name: string | null
          segmentacao: string | null
          status: string | null
        }
        Insert: {
          ad_type?: string | null
          budget?: number | null
          campaign_id?: string | null
          name?: string | null
          segmentacao?: string | null
          status?: string | null
        }
        Update: {
          ad_type?: string | null
          budget?: number | null
          campaign_id?: string | null
          name?: string | null
          segmentacao?: string | null
          status?: string | null
        }
        Relationships: []
      }
      vw_amazon_ads_keyword_dia: {
        Row: {
          acos: number | null
          acos_calc: number | null
          ad_type: string | null
          campaign_name: string | null
          clicks: number | null
          cost: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          impressions: number | null
          keyword: string | null
          match_type: string | null
          purchases_14d: number | null
          roas: number | null
          roas_calc: number | null
          sales_14d: number | null
          taxa_conversao: number | null
          ticket_medio: number | null
          units_14d: number | null
        }
        Insert: {
          acos?: number | null
          acos_calc?: never
          ad_type?: string | null
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpa?: never
          cpc?: number | null
          cpm?: never
          ctr?: number | null
          data?: string | null
          impressions?: number | null
          keyword?: string | null
          match_type?: string | null
          purchases_14d?: number | null
          roas?: number | null
          roas_calc?: never
          sales_14d?: number | null
          taxa_conversao?: never
          ticket_medio?: never
          units_14d?: number | null
        }
        Update: {
          acos?: number | null
          acos_calc?: never
          ad_type?: string | null
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpa?: never
          cpc?: number | null
          cpm?: never
          ctr?: number | null
          data?: string | null
          impressions?: number | null
          keyword?: string | null
          match_type?: string | null
          purchases_14d?: number | null
          roas?: number | null
          roas_calc?: never
          sales_14d?: number | null
          taxa_conversao?: never
          ticket_medio?: never
          units_14d?: number | null
        }
        Relationships: []
      }
      vw_amazon_ads_por_tipo_dia: {
        Row: {
          acos_amazon: number | null
          acos_calc: number | null
          ad_type: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          conversions_14d: number | null
          cost: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          impressions: number | null
          roas_amazon: number | null
          roas_calc: number | null
          sales_14d: number | null
          taxa_conversao: number | null
          ticket_medio: number | null
          units_14d: number | null
        }
        Relationships: []
      }
      vw_amazon_ads_produto_dia: {
        Row: {
          acos: number | null
          acos_calc: number | null
          ad_type: string | null
          asin: string | null
          campaign_name: string | null
          clicks: number | null
          cost: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          impressions: number | null
          purchases_14d: number | null
          roas: number | null
          roas_calc: number | null
          sales_14d: number | null
          sku: string | null
          taxa_conversao: number | null
          ticket_medio: number | null
          units_14d: number | null
        }
        Insert: {
          acos?: number | null
          acos_calc?: never
          ad_type?: string | null
          asin?: string | null
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpa?: never
          cpc?: number | null
          cpm?: never
          ctr?: number | null
          data?: string | null
          impressions?: number | null
          purchases_14d?: number | null
          roas?: number | null
          roas_calc?: never
          sales_14d?: number | null
          sku?: string | null
          taxa_conversao?: never
          ticket_medio?: never
          units_14d?: number | null
        }
        Update: {
          acos?: number | null
          acos_calc?: never
          ad_type?: string | null
          asin?: string | null
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          cpa?: never
          cpc?: number | null
          cpm?: never
          ctr?: number | null
          data?: string | null
          impressions?: number | null
          purchases_14d?: number | null
          roas?: number | null
          roas_calc?: never
          sales_14d?: number | null
          sku?: string | null
          taxa_conversao?: never
          ticket_medio?: never
          units_14d?: number | null
        }
        Relationships: []
      }
      vw_amazon_ads_search_term_dia: {
        Row: {
          campaign_name: string | null
          clicks: number | null
          cost: number | null
          data: string | null
          impressions: number | null
          keyword_text: string | null
          match_type: string | null
          purchases: number | null
          sales: number | null
          search_term: string | null
        }
        Insert: {
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          data?: string | null
          impressions?: number | null
          keyword_text?: string | null
          match_type?: string | null
          purchases?: number | null
          sales?: number | null
          search_term?: string | null
        }
        Update: {
          campaign_name?: string | null
          clicks?: number | null
          cost?: number | null
          data?: string | null
          impressions?: number | null
          keyword_text?: string | null
          match_type?: string | null
          purchases?: number | null
          sales?: number | null
          search_term?: string | null
        }
        Relationships: []
      }
      vw_amazon_buybox: {
        Row: {
          asin: string | null
          atualizado_em: string | null
          buybox_fba: boolean | null
          buybox_preco: number | null
          concorrente_no_bb: boolean | null
          ganho_buybox: boolean | null
          menor_preco_concorrente: number | null
          meu_preco: number | null
          n_concorrentes: number | null
          n_ofertas: number | null
          produto: string | null
          status: string | null
        }
        Relationships: []
      }
      vw_amazon_buybox_risco: {
        Row: {
          asin: string | null
          buybox_preco: number | null
          ganho_buybox: boolean | null
          menor_preco_concorrente: number | null
          meu_preco: number | null
          n_concorrentes: number | null
          produto: string | null
          sugestao: string | null
          vendas_28d: number | null
          vendas_7d: number | null
        }
        Relationships: []
      }
      vw_amazon_cadastro: {
        Row: {
          asin: string | null
          atualizado_em: string | null
          bsr: number | null
          bsr_categoria: string | null
          categoria: string | null
          comprimento_titulo: number | null
          faltas: string | null
          health: number | null
          marca: string | null
          n_atributos: number | null
          n_bullets: number | null
          n_fotos: number | null
          product_type: string | null
          sugestao: string | null
          tem_aplus: boolean | null
          tem_descricao: boolean | null
          tem_ingredientes: boolean | null
          titulo: string | null
          vendas_28d: number | null
          vendas_7d: number | null
        }
        Relationships: []
      }
      vw_amazon_concorrentes: {
        Row: {
          asin: string | null
          campanha: string | null
          cliques: number | null
          compras: number | null
          cvr_pct: number | null
          gasto: number | null
          link: string | null
          roas: number | null
          sugestao: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_amazon_geral_dia: {
        Row: {
          buybox_pct: number | null
          data: string | null
          em_consolidacao: boolean | null
          pageviews: number | null
          pedidos: number | null
          pedidos_itens: number | null
          preco_medio: number | null
          sessoes: number | null
          taxa_conversao: number | null
          taxa_devolucao: number | null
          ticket_medio: number | null
          unidades: number | null
          unidades_devolvidas: number | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_amazon_produto_dia: {
        Row: {
          buybox_pct: number | null
          child_asin: string | null
          data: string | null
          em_consolidacao: boolean | null
          pageviews: number | null
          parent_asin: string | null
          pedidos_itens: number | null
          sessoes: number | null
          sku: string | null
          taxa_conversao: number | null
          titulo: string | null
          unidades: number | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_amazon_reposicao: {
        Row: {
          alerta: string | null
          asin: string | null
          atualizado_em: string | null
          cobertura_dias: number | null
          cobertura_transito: number | null
          em_fba: boolean | null
          enviar_30d: number | null
          fba_a_caminho: number | null
          fba_disponivel: number | null
          media_diaria: number | null
          sku: string | null
          titulo: string | null
          vendas_21d: number | null
          vendas_7d: number | null
        }
        Insert: {
          alerta?: string | null
          asin?: string | null
          atualizado_em?: string | null
          cobertura_dias?: number | null
          cobertura_transito?: number | null
          em_fba?: boolean | null
          enviar_30d?: number | null
          fba_a_caminho?: number | null
          fba_disponivel?: number | null
          media_diaria?: number | null
          sku?: string | null
          titulo?: string | null
          vendas_21d?: number | null
          vendas_7d?: number | null
        }
        Update: {
          alerta?: string | null
          asin?: string | null
          atualizado_em?: string | null
          cobertura_dias?: number | null
          cobertura_transito?: number | null
          em_fba?: boolean | null
          enviar_30d?: number | null
          fba_a_caminho?: number | null
          fba_disponivel?: number | null
          media_diaria?: number | null
          sku?: string | null
          titulo?: string | null
          vendas_21d?: number | null
          vendas_7d?: number | null
        }
        Relationships: []
      }
      vw_amazon_tendencia_semana: {
        Row: {
          ads_maturando: boolean | null
          conversao_pct: number | null
          devolucao_pct: number | null
          faturamento: number | null
          invest_ads: number | null
          parcial: boolean | null
          pedidos: number | null
          roas_ads: number | null
          roas_total: number | null
          semana: string | null
          semana_ini: string | null
          tacos_pct: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_amazon_venda_intraday: {
        Row: {
          data: string | null
          faixa: string | null
          pedidos: number | null
          unidades: number | null
          venda_total: number | null
        }
        Relationships: []
      }
      vw_analises_dashboard: {
        Row: {
          analise_nome: string | null
          analise_slug: string | null
          canal: string | null
          canal_slug: string | null
          chave: string | null
          criado_em: string | null
          data_ref: string | null
          id: number | null
          ordem: number | null
          pdf_path: string | null
          texto: string | null
          xlsx_path: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analise_resultado_chave_fkey"
            columns: ["chave"]
            isOneToOne: false
            referencedRelation: "analise_def"
            referencedColumns: ["chave"]
          },
        ]
      }
      vw_anun_buybox: {
        Row: {
          acima_pct: number | null
          anuncio: string | null
          buybox: string | null
          preco_atual: number | null
          preco_p_ganhar: number | null
          sugestao: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_anun_melhorar: {
        Row: {
          anuncio: string | null
          buybox: string | null
          conversao_pct: number | null
          faturamento: number | null
          logistica: string | null
          preco_vs_ganhar_pct: number | null
          sugestao: string | null
          unidades: number | null
          visitas: number | null
        }
        Relationships: []
      }
      vw_anun_top: {
        Row: {
          anuncio: string | null
          buybox: string | null
          conversao_pct: number | null
          faturamento: number | null
          logistica: string | null
          preco_vs_ganhar_pct: number | null
          sugestao: string | null
          unidades: number | null
          visitas: number | null
        }
        Relationships: []
      }
      vw_asb_campanha: {
        Row: {
          acos_pct: number | null
          branded_searches: number | null
          campanha: string | null
          cliques: number | null
          ctr_pct: number | null
          formato: string | null
          invest: number | null
          ntb_pct: number | null
          ntb_vendas: number | null
          roas: number | null
          sugestao: string | null
          unidades: number | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_asb_ntb: {
        Row: {
          branded_searches: number | null
          cac_ntb: number | null
          campanha: string | null
          invest: number | null
          ntb_pct: number | null
          ntb_pedidos: number | null
          ntb_unidades: number | null
          ntb_vendas: number | null
          roas_ntb: number | null
          sugestao: string | null
          vendas_total: number | null
        }
        Relationships: []
      }
      vw_asb_search_term: {
        Row: {
          acos_pct: number | null
          cliques: number | null
          ctr_pct: number | null
          invest: number | null
          keyword_alvo: string | null
          match_type: string | null
          roas: number | null
          search_term: string | null
          sugestao: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_asb_segmentos: {
        Row: {
          ctr_pct: number | null
          invest: number | null
          ntb_pct: number | null
          ntb_vendas: number | null
          roas: number | null
          segmento: string | null
          share_pct: number | null
          sugestao: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_asb_termos: {
        Row: {
          acos_pct: number | null
          cliques: number | null
          ctr_pct: number | null
          invest: number | null
          keyword: string | null
          match_type: string | null
          ntb_pct: number | null
          ntb_vendas: number | null
          roas: number | null
          sugestao: string | null
          unidades: number | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_asb_video: {
        Row: {
          campanha: string | null
          cliques: number | null
          completo_pct: number | null
          ctr_pct: number | null
          impressoes: number | null
          invest: number | null
          q25_pct: number | null
          q50_pct: number | null
          q75_pct: number | null
          retencao_pct: number | null
          roas: number | null
          sugestao: string | null
          v5s_views: number | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_ast_asin_concorrente: {
        Row: {
          asin: string | null
          cliques: number | null
          compras: number | null
          invest: number | null
          roas: number | null
          sugestao: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_ast_asin_proprio: {
        Row: {
          asin: string | null
          cliques: number | null
          compras: number | null
          invest: number | null
          produto: string | null
          sugestao: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_ast_diag_resumo: {
        Row: {
          diagnostico: string | null
          invest: number | null
          termos: number | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_ast_graduar: {
        Row: {
          cliques: number | null
          compras: number | null
          invest: number | null
          roas: number | null
          sugestao: string | null
          termo: string | null
          vem_de: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_ast_graduar_top: {
        Row: {
          cliques: number | null
          compras: number | null
          invest: number | null
          roas: number | null
          sugestao: string | null
          termo: string | null
          vem_de: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_ast_kpi: {
        Row: {
          metrica: string | null
          valor_7d: string | null
          valor_7d_anterior: string | null
        }
        Relationships: []
      }
      vw_ast_kw_7d: {
        Row: {
          cliques: number | null
          cpc: number | null
          ctr_pct: number | null
          cvr_pct: number | null
          diagnostico: string | null
          impressoes: number | null
          invest: number | null
          keyword_alvo: string | null
          match_type: string | null
          roas: number | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_ast_kw_7d_top: {
        Row: {
          cliques: number | null
          cpc: number | null
          ctr_pct: number | null
          cvr_pct: number | null
          diagnostico: string | null
          impressoes: number | null
          invest: number | null
          keyword_alvo: string | null
          match_type: string | null
          roas: number | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_ast_negativar_dup: {
        Row: {
          cliques: number | null
          fontes_nao_exact: string | null
          invest_duplicado: number | null
          sugestao: string | null
          termo: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_ast_negativar_dup_top: {
        Row: {
          cliques: number | null
          fontes_nao_exact: string | null
          invest_duplicado: number | null
          sugestao: string | null
          termo: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_ast_negativar_ruim: {
        Row: {
          cliques: number | null
          invest_desperdicado: number | null
          sugestao: string | null
          termo: string | null
          vem_de: string | null
        }
        Relationships: []
      }
      vw_ast_resumo: {
        Row: {
          acao: string | null
          item: string | null
          qtd_termos: number | null
          valor_rs: number | null
        }
        Relationships: []
      }
      vw_ast_termo_7d: {
        Row: {
          cliques: number | null
          ctr_pct: number | null
          cvr_pct: number | null
          diagnostico: string | null
          impressoes: number | null
          invest: number | null
          keyword_alvo: string | null
          match_type: string | null
          roas: number | null
          termo: string | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_avg_ads_tipo: {
        Row: {
          acos: number | null
          invest: number | null
          roas: number | null
          sugestao: string | null
          tipo: string | null
          vendas_atribuidas: number | null
        }
        Relationships: []
      }
      vw_avg_detalhe: {
        Row: {
          acos: number | null
          campanha: string | null
          invest: number | null
          roas: number | null
          sugestao: string | null
          tipo: string | null
          unidades: number | null
          vendas: number | null
        }
        Relationships: []
      }
      vw_avg_kpis: {
        Row: {
          meta: string | null
          metrica: string | null
          ord: number | null
          sugestao: string | null
          valor: string | null
        }
        Insert: {
          meta?: string | null
          metrica?: string | null
          ord?: number | null
          sugestao?: string | null
          valor?: string | null
        }
        Update: {
          meta?: string | null
          metrica?: string | null
          ord?: number | null
          sugestao?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      vw_avg_oportunidades: {
        Row: {
          acao: string | null
          alavanca: string | null
          ord: number | null
          valor_em_jogo: string | null
        }
        Relationships: []
      }
      vw_avg_produtos: {
        Row: {
          asin: string | null
          buybox_pct: number | null
          conversao_pct: number | null
          faturamento: number | null
          produto: string | null
          sessoes: number | null
          sugestao: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_avg_tendencia: {
        Row: {
          conversao_pct: number | null
          faturamento: number | null
          semana: string | null
          sessoes: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_awin_dia: {
        Row: {
          comissao: number | null
          data: string | null
          pedidos: number | null
          pedidos_recusados: number | null
          taxa_awin: number | null
          venda: number | null
          venda_aprovada: number | null
          venda_pendente: number | null
          venda_recusada: number | null
        }
        Relationships: []
      }
      vw_awin_publisher_dia: {
        Row: {
          comissao: number | null
          data: string | null
          pedidos: number | null
          publisher: string | null
          publisher_id: number | null
          taxa_awin: number | null
          venda: number | null
        }
        Relationships: []
      }
      vw_brand_ads_campanha: {
        Row: {
          advertiser_id: string | null
          budget_amount: number | null
          budget_currency: string | null
          campaign_id: number | null
          campaign_type: string | null
          cpc: number | null
          destination_id: number | null
          end_date: string | null
          headline: string | null
          n_items: number | null
          n_keywords: number | null
          status: string | null
        }
        Insert: {
          advertiser_id?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          campaign_id?: number | null
          campaign_type?: string | null
          cpc?: number | null
          destination_id?: number | null
          end_date?: string | null
          headline?: string | null
          n_items?: never
          n_keywords?: never
          status?: string | null
        }
        Update: {
          advertiser_id?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          campaign_id?: number | null
          campaign_type?: string | null
          cpc?: number | null
          destination_id?: number | null
          end_date?: string | null
          headline?: string | null
          n_items?: never
          n_keywords?: never
          status?: string | null
        }
        Relationships: []
      }
      vw_brand_ads_item: {
        Row: {
          campaign_id: number | null
          item_id: string | null
          status: string | null
          thumbnail: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_brand_ads_item_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_brand_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "ml_brand_ads_item_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_brand_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      vw_brand_ads_keyword: {
        Row: {
          acos: number | null
          advertiser_id: string | null
          campaign_id: number | null
          campanha: string | null
          campanha_status: string | null
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          cvr: number | null
          date: string | null
          headline_criativo: string | null
          is_deleted: boolean | null
          keyword_id: number | null
          lance_atual: number | null
          lance_baixo: boolean | null
          lance_recomendado: number | null
          leads: number | null
          match_type: string | null
          pedidos: number | null
          prints: number | null
          receita: number | null
          roas: number | null
          termo: string | null
          won_auctions: number | null
        }
        Relationships: []
      }
      vw_brand_ads_keyword_lista: {
        Row: {
          advertiser_id: string | null
          campaign_id: number | null
          campanha: string | null
          cpc: number | null
          is_negative: boolean | null
          keyword_id: number | null
          match_type: string | null
          term: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_brand_ads_keyword_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_brand_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "ml_brand_ads_keyword_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_brand_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      vw_brand_ads_kpi_dia: {
        Row: {
          acos: number | null
          advertiser_id: string | null
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          cvr: number | null
          date: string | null
          leads: number | null
          pedidos: number | null
          prints: number | null
          receita: number | null
          roas: number | null
        }
        Insert: {
          acos?: number | null
          advertiser_id?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          cvr?: number | null
          date?: string | null
          leads?: number | null
          pedidos?: number | null
          prints?: number | null
          receita?: number | null
          roas?: number | null
        }
        Update: {
          acos?: number | null
          advertiser_id?: string | null
          clicks?: number | null
          cost?: number | null
          cpc?: number | null
          ctr?: number | null
          cvr?: number | null
          date?: string | null
          leads?: number | null
          pedidos?: number | null
          prints?: number | null
          receita?: number | null
          roas?: number | null
        }
        Relationships: []
      }
      vw_brand_momentum: {
        Row: {
          ctr_atual: number | null
          flag: string | null
          impressoes_atual: number | null
          invest_ant: number | null
          invest_atual: number | null
          invest_delta_pct: number | null
          meta_roas: number | null
          pedidos_atual: number | null
          roas_ant: number | null
          roas_atual: number | null
          segmento: string | null
          sugestao: string | null
          termo: string | null
        }
        Relationships: []
      }
      vw_brand_segmentos: {
        Row: {
          ctr: number | null
          cvr: number | null
          invest: number | null
          meta: number | null
          roas: number | null
          segmento: string | null
          share_pct: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_brand_termos: {
        Row: {
          ctr: number | null
          cvr: number | null
          invest: number | null
          roas: number | null
          segmento: string | null
          sugestao: string | null
          termo: string | null
        }
        Relationships: []
      }
      vw_cad_produtos: {
        Row: {
          anuncio: string | null
          atributos_vazios: number | null
          fotos: number | null
          health: number | null
          sugestao: string | null
          tem_garantia: string | null
          tem_video: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_cad_resumo: {
        Row: {
          item: string | null
          qtd: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_cad_top: {
        Row: {
          anuncio: string | null
          atributos_vazios: number | null
          fotos: number | null
          health: number | null
          sugestao: string | null
          tem_garantia: string | null
          tem_video: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_cliente_canais: {
        Row: {
          alcance: string | null
          canais: number | null
          cliente_chave: string | null
          dias_entre_primeira_ultima: number | null
          faturamento: number | null
          pedidos: number | null
          perfil: string | null
          primeira_compra: string | null
          quais_canais: string | null
          sugestao: string | null
          ticket_medio: number | null
          uf: string | null
          ultima_compra: string | null
        }
        Insert: {
          alcance?: string | null
          canais?: number | null
          cliente_chave?: string | null
          dias_entre_primeira_ultima?: number | null
          faturamento?: number | null
          pedidos?: number | null
          perfil?: string | null
          primeira_compra?: string | null
          quais_canais?: string | null
          sugestao?: string | null
          ticket_medio?: number | null
          uf?: string | null
          ultima_compra?: string | null
        }
        Update: {
          alcance?: string | null
          canais?: number | null
          cliente_chave?: string | null
          dias_entre_primeira_ultima?: number | null
          faturamento?: number | null
          pedidos?: number | null
          perfil?: string | null
          primeira_compra?: string | null
          quais_canais?: string | null
          sugestao?: string | null
          ticket_medio?: number | null
          uf?: string | null
          ultima_compra?: string | null
        }
        Relationships: []
      }
      vw_cliente_cobertura: {
        Row: {
          ate: string | null
          canal: string | null
          com_chave: number | null
          com_documento: number | null
          com_email: number | null
          de: string | null
          pct_chave: number | null
          pct_documento: number | null
          pedidos: number | null
          sem_chave: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_cliente_cruzamento: {
        Row: {
          canais: number | null
          clientes: number | null
          faturamento: number | null
          ltv_medio: number | null
          pct_clientes: number | null
          pct_faturamento: number | null
          pedidos: number | null
          quais_canais: string | null
          sugestao: string | null
          ticket_medio: number | null
        }
        Relationships: []
      }
      vw_cliente_frequencia: {
        Row: {
          clientes: number | null
          faixa: string | null
          faturamento: number | null
          ltv_medio: number | null
          ordem: number | null
          pct_clientes: number | null
          pct_faturamento: number | null
          pedidos: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_cliente_kpis: {
        Row: {
          clientes: number | null
          clientes_multicanal: number | null
          faturamento: number | null
          ltv_medio: number | null
          pct_multicanal: number | null
          pct_recompra: number | null
          pedidos: number | null
          recompradores: number | null
          sugestao: string | null
          ticket_medio: number | null
        }
        Relationships: []
      }
      vw_cliente_lista: {
        Row: {
          alcance: string | null
          canais: number | null
          cliente_id: number | null
          dias_entre_primeira_ultima: number | null
          faturamento: number | null
          pedidos: number | null
          perfil: string | null
          primeira_compra: string | null
          quais_canais: string | null
          sugestao: string | null
          ticket_medio: number | null
          uf: string | null
          ultima_compra: string | null
        }
        Insert: {
          alcance?: string | null
          canais?: number | null
          cliente_id?: number | null
          dias_entre_primeira_ultima?: number | null
          faturamento?: number | null
          pedidos?: number | null
          perfil?: string | null
          primeira_compra?: string | null
          quais_canais?: string | null
          sugestao?: string | null
          ticket_medio?: number | null
          uf?: string | null
          ultima_compra?: string | null
        }
        Update: {
          alcance?: string | null
          canais?: number | null
          cliente_id?: number | null
          dias_entre_primeira_ultima?: number | null
          faturamento?: number | null
          pedidos?: number | null
          perfil?: string | null
          primeira_compra?: string | null
          quais_canais?: string | null
          sugestao?: string | null
          ticket_medio?: number | null
          uf?: string | null
          ultima_compra?: string | null
        }
        Relationships: []
      }
      vw_cliente_pedido_itens: {
        Row: {
          anuncio: string | null
          canal: string | null
          categoria: string | null
          cliente_id: number | null
          comissao: number | null
          comissao_pct: number | null
          data: string | null
          linha: string | null
          liquido: number | null
          logistica: string | null
          pedido_id: string | null
          preco_unitario: number | null
          produto: string | null
          quantidade: number | null
          sku: string | null
          sugestao: string | null
          tipo_anuncio: string | null
          valor_total: number | null
        }
        Relationships: []
      }
      vw_cliente_pedidos: {
        Row: {
          canal: string | null
          cidade: string | null
          cliente_id: number | null
          data: string | null
          desconto: number | null
          frete: number | null
          itens: number | null
          pagamento_metodo: string | null
          pedido_grupo_id: string | null
          pedido_id: string | null
          status: string | null
          sugestao: string | null
          uf: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_cliente_produtos: {
        Row: {
          anuncio: string | null
          canal: string | null
          cliente_id: number | null
          comissao: number | null
          faturamento: number | null
          liquido: number | null
          pedidos: number | null
          preco_medio: number | null
          primeira_compra: string | null
          produto: string | null
          sku: string | null
          sugestao: string | null
          ultima_compra: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_cliente_recompra_canal: {
        Row: {
          canal: string | null
          clientes: number | null
          dias_de_relacao: number | null
          faturamento: number | null
          ltv_medio: number | null
          pct_recompra: number | null
          pedidos_por_cliente: number | null
          recompradores: number | null
          sugestao: string | null
          ticket_medio: number | null
        }
        Relationships: []
      }
      vw_cliente_serie_dia: {
        Row: {
          canal: string | null
          clientes: number | null
          data: string | null
          faturamento: number | null
          pedidos: number | null
          pedidos_por_cliente: number | null
          sugestao: string | null
          ticket_medio: number | null
        }
        Relationships: []
      }
      vw_cliente_uf: {
        Row: {
          clientes: number | null
          faturamento: number | null
          ltv_medio: number | null
          multicanal: number | null
          pct_clientes: number | null
          pedidos: number | null
          sugestao: string | null
          uf: string | null
        }
        Relationships: []
      }
      vw_crm_dia: {
        Row: {
          bloco: string | null
          data: string | null
          faturamento_liquido: number | null
          origem: string | null
          pedidos: number | null
          receita: number | null
        }
        Insert: {
          bloco?: never
          data?: string | null
          faturamento_liquido?: number | null
          origem?: string | null
          pedidos?: number | null
          receita?: number | null
        }
        Update: {
          bloco?: never
          data?: string | null
          faturamento_liquido?: number | null
          origem?: string | null
          pedidos?: number | null
          receita?: number | null
        }
        Relationships: []
      }
      vw_disp_criativos: {
        Row: {
          cpc: number | null
          criativo: string | null
          ctr: number | null
          grupo: string | null
          impressoes: number | null
          invest: number | null
          publicos: number | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_disp_criativos_top: {
        Row: {
          cpc: number | null
          criativo: string | null
          ctr: number | null
          grupo: string | null
          impressoes: number | null
          invest: number | null
          publicos: number | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_disp_fadiga: {
        Row: {
          alcance_atual: number | null
          campanha: string | null
          classificacao: string | null
          freq_ant: number | null
          freq_atual: number | null
          grupo: string | null
          impressoes_atual: number | null
          invest_atual: number | null
          line_item: string | null
          roas_ant: number | null
          roas_atual: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_disp_grupos: {
        Row: {
          cpc: number | null
          ctr: number | null
          grupo: string | null
          invest: number | null
          meta_share_pct: number | null
          metrica_decisao: string | null
          ord: number | null
          roas: number | null
          share_pct: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_disp_momentum: {
        Row: {
          campanha: string | null
          cpc_ant: number | null
          cpc_atual: number | null
          ctr_ant: number | null
          ctr_atual: number | null
          flag: string | null
          freq_atual: number | null
          grupo: string | null
          impressoes_atual: number | null
          invest_ant: number | null
          invest_atual: number | null
          invest_delta_pct: number | null
          line_item: string | null
          metrica_decisao: string | null
          metrica_delta_pct: number | null
          roas_ant: number | null
          roas_atual: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_disp_momentum_grupo: {
        Row: {
          ctr_ant: number | null
          ctr_atual: number | null
          grupo: string | null
          invest_ant: number | null
          invest_atual: number | null
          meta_roas: number | null
          meta_share_pct: number | null
          metrica_decisao: string | null
          receita_atual: number | null
          roas_ant: number | null
          roas_atual: number | null
          share_ant_pct: number | null
          share_atual_pct: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_disp_publicos: {
        Row: {
          ctr: number | null
          invest: number | null
          publico: string | null
          roas: number | null
          sugestao: string | null
          temperatura: string | null
        }
        Relationships: []
      }
      vw_disp_temas: {
        Row: {
          ctr: number | null
          invest: number | null
          roas: number | null
          sugestao: string | null
          tema: string | null
        }
        Relationships: []
      }
      vw_est_excedente: {
        Row: {
          cobertura_dias: number | null
          disponivel: number | null
          produto: string | null
          sku: string | null
          sugestao: string | null
          vendas_21d: number | null
        }
        Insert: {
          cobertura_dias?: never
          disponivel?: number | null
          produto?: string | null
          sku?: string | null
          sugestao?: never
          vendas_21d?: number | null
        }
        Update: {
          cobertura_dias?: never
          disponivel?: number | null
          produto?: string | null
          sku?: string | null
          sugestao?: never
          vendas_21d?: number | null
        }
        Relationships: []
      }
      vw_est_fora_full: {
        Row: {
          enviar_30d: number | null
          produto: string | null
          sku: string | null
          sugestao: string | null
          vendas_21d: number | null
          vende_dia: number | null
        }
        Insert: {
          enviar_30d?: number | null
          produto?: string | null
          sku?: string | null
          sugestao?: never
          vendas_21d?: number | null
          vende_dia?: never
        }
        Update: {
          enviar_30d?: number | null
          produto?: string | null
          sku?: string | null
          sugestao?: never
          vendas_21d?: number | null
          vende_dia?: never
        }
        Relationships: []
      }
      vw_est_reposicao: {
        Row: {
          alerta: string | null
          cobertura_dias: number | null
          disponivel: number | null
          em_transito: number | null
          enviar_30d: number | null
          produto: string | null
          sku: string | null
          sugestao: string | null
          vendas_21d: number | null
          vende_dia: number | null
        }
        Insert: {
          alerta?: string | null
          cobertura_dias?: never
          disponivel?: number | null
          em_transito?: number | null
          enviar_30d?: number | null
          produto?: string | null
          sku?: string | null
          sugestao?: never
          vendas_21d?: number | null
          vende_dia?: never
        }
        Update: {
          alerta?: string | null
          cobertura_dias?: never
          disponivel?: number | null
          em_transito?: number | null
          enviar_30d?: number | null
          produto?: string | null
          sku?: string | null
          sugestao?: never
          vendas_21d?: number | null
          vende_dia?: never
        }
        Relationships: []
      }
      vw_est_resumo: {
        Row: {
          alerta: string | null
          ord: number | null
          produtos: number | null
          sugestao: string | null
          total_enviar: number | null
          vendas_21d: number | null
        }
        Relationships: []
      }
      vw_gads_anuncios: {
        Row: {
          ad_strength: string | null
          anuncio: string | null
          campanha: string | null
          ctr_pct: number | null
          invest: number | null
          receita: number | null
          roas: number | null
          sugestao: string | null
          tipo_anuncio: string | null
        }
        Relationships: []
      }
      vw_gads_assets: {
        Row: {
          campanha: string | null
          desempenho: string | null
          grupo: string | null
          posicao: number | null
          sugestao: string | null
          texto: string | null
          tipo_asset: string | null
        }
        Relationships: []
      }
      vw_gads_campanhas: {
        Row: {
          campanha: string | null
          conversoes: number | null
          ctr_pct: number | null
          invest: number | null
          receita: number | null
          roas: number | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_gads_grupos: {
        Row: {
          campanha: string | null
          conversoes: number | null
          ctr_pct: number | null
          grupo: string | null
          invest: number | null
          receita: number | null
          roas: number | null
          sugestao: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_gads_impression_share: {
        Row: {
          campanha: string | null
          impression_share_pct: number | null
          invest: number | null
          perde_orcamento_pct: number | null
          perde_rank_pct: number | null
          roas: number | null
          sugestao: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_gads_keywords: {
        Row: {
          campanha: string | null
          conversoes: number | null
          ctr_pct: number | null
          invest: number | null
          keyword: string | null
          match_type: string | null
          quality_score: number | null
          receita: number | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_gads_keywords_top: {
        Row: {
          campanha: string | null
          conversoes: number | null
          ctr_pct: number | null
          invest: number | null
          keyword: string | null
          match_type: string | null
          quality_score: number | null
          receita: number | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_gads_pmax_assets: {
        Row: {
          campanha: string | null
          desempenho: string | null
          field_type: string | null
          grupo_asset: string | null
          sugestao: string | null
          texto: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_gads_produtos: {
        Row: {
          conversoes: number | null
          ctr_pct: number | null
          invest: number | null
          marca: string | null
          produto: string | null
          receita: number | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_gads_termos_graduar: {
        Row: {
          campanha: string | null
          cliques: number | null
          conversoes: number | null
          invest: number | null
          receita: number | null
          roas: number | null
          sugestao: string | null
          termo: string | null
        }
        Relationships: []
      }
      vw_gads_termos_negativar: {
        Row: {
          campanha: string | null
          cliques: number | null
          invest_desperdicado: number | null
          sugestao: string | null
          termo: string | null
        }
        Relationships: []
      }
      vw_gads_tipos: {
        Row: {
          conversoes: number | null
          ctr_pct: number | null
          invest: number | null
          receita: number | null
          roas: number | null
          share_pct: number | null
          sugestao: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_google_anuncio_asset: {
        Row: {
          ad_group_id: string | null
          ad_group_name: string | null
          ad_id: string | null
          asset_tipo: string | null
          campaign_id: string | null
          campaign_name: string | null
          performance_label: string | null
          pinned_field: string | null
          posicao: number | null
          texto: string | null
        }
        Relationships: []
      }
      vw_google_anuncio_dia: {
        Row: {
          ad_descriptions: string | null
          ad_group_id: string | null
          ad_group_name: string | null
          ad_headlines: string | null
          ad_id: string | null
          ad_name: string | null
          ad_strength: string | null
          ad_type: string | null
          caminho_exibicao: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          conv_view_through: number | null
          conversoes: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          final_urls: string | null
          gasto: number | null
          impressoes: number | null
          interacoes: number | null
          path1: string | null
          path2: string | null
          receita: number | null
          roas: number | null
          taxa_conversao: number | null
          tipo: string | null
          video_views: number | null
        }
        Relationships: []
      }
      vw_google_anuncio_lista: {
        Row: {
          ad_descriptions: string | null
          ad_group_id: string | null
          ad_group_name: string | null
          ad_headlines: string | null
          ad_id: string | null
          ad_name: string | null
          ad_strength: string | null
          ad_type: string | null
          campaign_id: string | null
          campaign_name: string | null
          final_urls: string | null
          path1: string | null
          path2: string | null
          status: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_google_campanha_dia: {
        Row: {
          budget_amount: number | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          conv_view_through: number | null
          conversoes: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          fatia_cliques: number | null
          fatia_exata: number | null
          fatia_impressao: number | null
          fatia_perdida_orcamento: number | null
          fatia_perdida_rank: number | null
          fatia_topo: number | null
          fatia_topo_absoluto: number | null
          gasto: number | null
          impressoes: number | null
          interacoes: number | null
          pedidos_shopify: number | null
          receita: number | null
          receita_shopify: number | null
          roas: number | null
          taxa_conversao: number | null
          tipo: string | null
          video_views: number | null
        }
        Relationships: []
      }
      vw_google_campanha_lista: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          data_fim: string | null
          data_inicio: string | null
          entrega_orcamento: string | null
          estrategia_lance: string | null
          optimization_score: number | null
          orcamento_diario: number | null
          status: string | null
          subtipo: string | null
          target_cpa: number | null
          target_roas: number | null
          tipo: string | null
        }
        Insert: {
          campaign_id?: string | null
          campaign_name?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          entrega_orcamento?: string | null
          estrategia_lance?: string | null
          optimization_score?: number | null
          orcamento_diario?: number | null
          status?: string | null
          subtipo?: string | null
          target_cpa?: number | null
          target_roas?: number | null
          tipo?: string | null
        }
        Update: {
          campaign_id?: string | null
          campaign_name?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          entrega_orcamento?: string | null
          estrategia_lance?: string | null
          optimization_score?: number | null
          orcamento_diario?: number | null
          status?: string | null
          subtipo?: string | null
          target_cpa?: number | null
          target_roas?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      vw_google_grupo_dia: {
        Row: {
          ad_group_id: string | null
          ad_group_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          conversoes: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          interacoes: number | null
          receita: number | null
          roas: number | null
          taxa_conversao: number | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_google_grupo_lista: {
        Row: {
          ad_group_id: string | null
          ad_group_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          status: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_google_impression_share_dia: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          click_share: number | null
          data: string | null
          is_abs_topo: number | null
          is_exata: number | null
          is_perdido_orcamento: number | null
          is_perdido_rank: number | null
          is_search: number | null
          is_topo: number | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_google_intraday: {
        Row: {
          captured_at: string | null
          cliques: number | null
          conversoes: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          interacoes: number | null
          receita: number | null
          roas: number | null
          taxa_conversao: number | null
        }
        Relationships: []
      }
      vw_google_intraday_campanha: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          captured_at: string | null
          cliques: number | null
          conversoes: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          interacoes: number | null
          receita: number | null
          roas: number | null
          taxa_conversao: number | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_google_keyword_dia: {
        Row: {
          ad_group_id: string | null
          ad_group_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          conversoes: number | null
          cpc: number | null
          creative_quality_score: string | null
          ctr: number | null
          data: string | null
          expected_ctr: string | null
          gasto: number | null
          impressoes: number | null
          keyword_text: string | null
          match_type: string | null
          post_click_quality_score: string | null
          quality_score: number | null
          receita: number | null
          roas: number | null
        }
        Relationships: []
      }
      vw_google_keyword_lista: {
        Row: {
          ad_group_id: string | null
          ad_group_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          creative_quality_score: string | null
          expected_ctr: string | null
          keyword_text: string | null
          match_type: string | null
          post_click_quality_score: string | null
          quality_score: number | null
          status: string | null
        }
        Relationships: []
      }
      vw_google_kpi_dia: {
        Row: {
          cliques: number | null
          conversoes: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          pedidos_shopify: number | null
          receita: number | null
          receita_shopify: number | null
          receita_shopify_sem_campanha: number | null
          roas: number | null
        }
        Relationships: []
      }
      vw_google_negativa: {
        Row: {
          ad_group_name: string | null
          campaign_name: string | null
          keyword_text: string | null
          match_type: string | null
          nivel: string | null
          owner_id: string | null
        }
        Relationships: []
      }
      vw_google_pmax_asset: {
        Row: {
          asset_group_id: string | null
          asset_group_name: string | null
          asset_id: string | null
          asset_type: string | null
          campaign_id: string | null
          campaign_name: string | null
          field_type: string | null
          image_url: string | null
          performance_label: string | null
          status: string | null
          texto: string | null
          youtube_video_id: string | null
        }
        Relationships: []
      }
      vw_google_pmax_asset_group: {
        Row: {
          asset_group_id: string | null
          asset_group_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          status: string | null
        }
        Relationships: []
      }
      vw_google_produto_dia: {
        Row: {
          brand: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          conversoes: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          product_item_id: string | null
          product_title: string | null
          receita: number | null
          roas: number | null
          taxa_conversao: number | null
          tipo: string | null
        }
        Insert: {
          brand?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          cliques?: number | null
          conversoes?: number | null
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          data?: string | null
          gasto?: number | null
          impressoes?: number | null
          product_item_id?: string | null
          product_title?: string | null
          receita?: number | null
          roas?: number | null
          taxa_conversao?: number | null
          tipo?: string | null
        }
        Update: {
          brand?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          cliques?: number | null
          conversoes?: number | null
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          data?: string | null
          gasto?: number | null
          impressoes?: number | null
          product_item_id?: string | null
          product_title?: string | null
          receita?: number | null
          roas?: number | null
          taxa_conversao?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      vw_google_termo_dia: {
        Row: {
          ad_group_id: string | null
          ad_group_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          conversoes: number | null
          cpc: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          receita: number | null
          roas: number | null
          search_term: string | null
        }
        Insert: {
          ad_group_id?: string | null
          ad_group_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          cliques?: number | null
          conversoes?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string | null
          gasto?: number | null
          impressoes?: number | null
          receita?: number | null
          roas?: number | null
          search_term?: string | null
        }
        Update: {
          ad_group_id?: string | null
          ad_group_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          cliques?: number | null
          conversoes?: number | null
          cpc?: number | null
          ctr?: number | null
          data?: string | null
          gasto?: number | null
          impressoes?: number | null
          receita?: number | null
          roas?: number | null
          search_term?: string | null
        }
        Relationships: []
      }
      vw_influenciador_360: {
        Row: {
          cache_fixo: number | null
          cache_lancado: number | null
          categoria: string | null
          cidade: string | null
          comissao_dia: number | null
          comissao_pct: number | null
          creator_id: string | null
          cupom: string | null
          custo_dia: number | null
          custo_planilha: number | null
          data: string | null
          data_fim: string | null
          data_inicio: string | null
          estado: string | null
          grupo_cupom: string | null
          modelo_remuneracao: string | null
          nome: string | null
          pedidos_site: number | null
          pedidos_tiktok: number | null
          pedidos_total: number | null
          receita_site: number | null
          receita_tiktok: number | null
          receita_total: number | null
          seguidores_ig: number | null
          seguidores_tt: number | null
          status: string | null
          subsegmento: string | null
          tier: string | null
          tiktok_username: string | null
          unidades_site: number | null
          unidades_tiktok: number | null
          views_tiktok: number | null
        }
        Relationships: []
      }
      vw_influenciador_resumo: {
        Row: {
          cache_fixo: number | null
          cache_total: number | null
          categoria: string | null
          cidade: string | null
          comissao_pct: number | null
          comissao_total: number | null
          creator_id: string | null
          cupom: string | null
          custo_planilha: number | null
          custo_real: number | null
          data_fim: string | null
          data_inicio: string | null
          estado: string | null
          grupo_cupom: string | null
          modelo_remuneracao: string | null
          nome: string | null
          pedidos_site: number | null
          pedidos_tiktok: number | null
          pedidos_total: number | null
          primeira_venda: string | null
          receita_site: number | null
          receita_tiktok: number | null
          receita_total: number | null
          roi: number | null
          seguidores_ig: number | null
          seguidores_tt: number | null
          status: string | null
          subsegmento: string | null
          sugestao: string | null
          ticket: number | null
          tier: string | null
          tiktok_username: string | null
          ultima_venda: string | null
        }
        Relationships: []
      }
      vw_intraday_comparativo: {
        Row: {
          base: string | null
          canal: string | null
          data_ref: string | null
          evento_ref: string | null
          ordem: number | null
          ordem_base: number | null
          ref_ate_mesmo_horario: number | null
          ref_fechamento: number | null
          variacao: number | null
          vendido_hoje: number | null
        }
        Relationships: []
      }
      vw_intraday_comparativo_hora: {
        Row: {
          canal: string | null
          d14_acum: number | null
          d28_acum: number | null
          d7_acum: number | null
          hora: number | null
          hora_fim: number | null
          ontem_acum: number | null
        }
        Relationships: []
      }
      vw_intraday_hoje: {
        Row: {
          atualizado_em: string | null
          canal: string | null
          corte: string | null
          corte_hhmm: string | null
          curva_curta: boolean | null
          data: string | null
          evento_nivel: string | null
          evento_titulo: string | null
          faixa_max: number | null
          faixa_min: number | null
          farol: string | null
          fatia_esperada: number | null
          meta_ate_agora: number | null
          meta_dia: number | null
          mostrar_projecao: boolean | null
          n_dias_curva: number | null
          ordem: number | null
          pedidos: number | null
          projecao: number | null
          projecao_vs_meta: number | null
          ritmo_vs_meta: number | null
          vendido: number | null
        }
        Relationships: []
      }
      vw_intraday_hoje_hora: {
        Row: {
          canal: string | null
          data: string | null
          faixa_max_acum: number | null
          faixa_min_acum: number | null
          hora: number | null
          hora_fim: number | null
          meta_acum: number | null
          projecao_acum: number | null
          vendido_acum: number | null
        }
        Relationships: []
      }
      vw_item_conversao_dia: {
        Row: {
          conversao_pct: number | null
          data: string | null
          item_id: string | null
          pedidos: number | null
          price: number | null
          receita: number | null
          seller_sku: string | null
          title: string | null
          unidades_vendidas: number | null
          visitas: number | null
        }
        Insert: {
          conversao_pct?: number | null
          data?: string | null
          item_id?: string | null
          pedidos?: number | null
          price?: number | null
          receita?: number | null
          seller_sku?: string | null
          title?: string | null
          unidades_vendidas?: number | null
          visitas?: number | null
        }
        Update: {
          conversao_pct?: number | null
          data?: string | null
          item_id?: string | null
          pedidos?: number | null
          price?: number | null
          receita?: number | null
          seller_sku?: string | null
          title?: string | null
          unidades_vendidas?: number | null
          visitas?: number | null
        }
        Relationships: []
      }
      vw_live_canal_dia: {
        Row: {
          adicoes_carrinho: number | null
          canal: string | null
          comentarios: number | null
          conversao_espectador_pct: number | null
          dia: string | null
          espectadores: number | null
          gmv: number | null
          informa_receita: boolean | null
          lives: number | null
          lives_sem_venda: number | null
          minutos_no_ar: number | null
          novos_seguidores: number | null
          pedidos: number | null
          ticket_medio: number | null
          unidades: number | null
          visualizacoes: number | null
        }
        Relationships: []
      }
      vw_live_classificacao: {
        Row: {
          canal: string | null
          dia: string | null
          dia_de_campanha: boolean | null
          dia_semana: string | null
          dia_semana_num: number | null
          dia_util: boolean | null
          faixa_audiencia: string | null
          faixa_duracao: string | null
          faixa_horario: string | null
          id: number | null
          teste: boolean | null
          teve_venda: boolean | null
        }
        Relationships: []
      }
      vw_live_dia: {
        Row: {
          canal: string | null
          clientes: number | null
          comentarios: number | null
          conversao_espectador_pct: number | null
          ctr_produto_pct: number | null
          curtidas: number | null
          dia: string | null
          espectadores: number | null
          gmv: number | null
          interna: boolean | null
          lives: number | null
          minutos_no_ar: number | null
          novos_seguidores: number | null
          pedidos: number | null
          ticket_medio: number | null
          unidades: number | null
          visualizacoes: number | null
        }
        Relationships: []
      }
      vw_live_produto_dia: {
        Row: {
          canal: string | null
          dia: string | null
          dia_util: boolean | null
          lives_no_dia: number | null
          pedidos: number | null
          produto: string | null
          receita: number | null
          sku: string | null
          teve_live: boolean | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_live_publico_dia: {
        Row: {
          canal: string | null
          comentarios: number | null
          compradores: number | null
          curtidas: number | null
          dia: string | null
          espectadores: number | null
          gmv: number | null
          lives: number | null
          mediana_espectadores: number | null
          novos_seguidores: number | null
          pedidos: number | null
          tempo_medio_seg: number | null
          visualizacoes: number | null
        }
        Relationships: []
      }
      vw_live_publico_faixa: {
        Row: {
          canal: string | null
          compradores: number | null
          dia: string | null
          espectadores: number | null
          faixa: string | null
          gmv: number | null
          horas: number | null
          lives: number | null
          pedidos: number | null
        }
        Relationships: []
      }
      vw_live_sessao: {
        Row: {
          apresentador: string | null
          atualizado_em: string | null
          canal: string | null
          clientes: number | null
          clique_para_pedido_pct: number | null
          cliques_produto: number | null
          comentarios: number | null
          compartilhamentos: number | null
          conversao_espectador_pct: number | null
          ctr_produto_pct: number | null
          curtidas: number | null
          dia: string | null
          duracao_min: number | null
          espectadores: number | null
          fim: string | null
          fonte: string | null
          gmv: number | null
          gmv_por_hora: number | null
          gmv_por_mil_views: number | null
          id: number | null
          impressoes_produto: number | null
          inicio: string | null
          interna: boolean | null
          novos_seguidores: number | null
          observacao: string | null
          pedidos: number | null
          produtos_distintos: number | null
          ref_externa: string | null
          tempo_medio_seg: number | null
          ticket_medio: number | null
          titulo: string | null
          unidades: number | null
          visualizacoes: number | null
        }
        Insert: {
          apresentador?: string | null
          atualizado_em?: string | null
          canal?: string | null
          clientes?: number | null
          clique_para_pedido_pct?: never
          cliques_produto?: number | null
          comentarios?: number | null
          compartilhamentos?: number | null
          conversao_espectador_pct?: never
          ctr_produto_pct?: never
          curtidas?: number | null
          dia?: never
          duracao_min?: never
          espectadores?: number | null
          fim?: string | null
          fonte?: string | null
          gmv?: number | null
          gmv_por_hora?: never
          gmv_por_mil_views?: never
          id?: number | null
          impressoes_produto?: number | null
          inicio?: string | null
          interna?: boolean | null
          novos_seguidores?: number | null
          observacao?: string | null
          pedidos?: number | null
          produtos_distintos?: number | null
          ref_externa?: string | null
          tempo_medio_seg?: number | null
          ticket_medio?: never
          titulo?: string | null
          unidades?: number | null
          visualizacoes?: number | null
        }
        Update: {
          apresentador?: string | null
          atualizado_em?: string | null
          canal?: string | null
          clientes?: number | null
          clique_para_pedido_pct?: never
          cliques_produto?: number | null
          comentarios?: number | null
          compartilhamentos?: number | null
          conversao_espectador_pct?: never
          ctr_produto_pct?: never
          curtidas?: number | null
          dia?: never
          duracao_min?: never
          espectadores?: number | null
          fim?: string | null
          fonte?: string | null
          gmv?: number | null
          gmv_por_hora?: never
          gmv_por_mil_views?: never
          id?: number | null
          impressoes_produto?: number | null
          inicio?: string | null
          interna?: boolean | null
          novos_seguidores?: number | null
          observacao?: string | null
          pedidos?: number | null
          produtos_distintos?: number | null
          ref_externa?: string | null
          tempo_medio_seg?: number | null
          ticket_medio?: never
          titulo?: string | null
          unidades?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      vw_live_shopee_produto: {
        Row: {
          atc: number | null
          atc_para_pedido_pct: number | null
          clique_para_pedido_pct: number | null
          cliques: number | null
          data_br: string | null
          dia: string | null
          hora_br: string | null
          item_id: number | null
          itens_confirmados: number | null
          itens_feitos: number | null
          live: string | null
          pedidos_confirmados: number | null
          pedidos_feitos: number | null
          produto: string | null
          sessao_id: number | null
          sku: string | null
          vendas_confirmadas: number | null
          vendas_feitas: number | null
        }
        Relationships: []
      }
      vw_live_shopee_produto_dia: {
        Row: {
          atc: number | null
          cliques: number | null
          dia: string | null
          item_id: string | null
          itens_live: number | null
          lives_com_o_produto: number | null
          pct_da_receita_do_canal: number | null
          pedidos_canal: number | null
          pedidos_live: number | null
          produto: string | null
          receita_canal: number | null
          sku: string | null
          unidades_canal: number | null
          vendas_live: number | null
        }
        Relationships: []
      }
      vw_live_site_cupom: {
        Row: {
          cupom: string | null
          dia_live: string | null
          dia_venda: string | null
          live_id: number | null
          pedidos: number | null
          titulo: string | null
          total_pago: number | null
        }
        Relationships: []
      }
      vw_live_site_dia: {
        Row: {
          cupom: string | null
          dia: string | null
          pedidos: number | null
          ticket_medio: number | null
          total_pago: number | null
        }
        Relationships: []
      }
      vw_live_site_reguas: {
        Row: {
          dia: string | null
          pedidos: number | null
          regua: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_live_ticket_dia: {
        Row: {
          canal: string | null
          dia: string | null
          gmv_live: number | null
          pedidos_canal: number | null
          pedidos_fora: number | null
          pedidos_live: number | null
          premio_pct: number | null
          receita_canal: number | null
          receita_fora: number | null
          regua_e_piso: boolean | null
          ticket_canal: number | null
          ticket_fora: number | null
          ticket_live: number | null
        }
        Relationships: []
      }
      vw_live_tiktok_share: {
        Row: {
          compradores_live_canal: number | null
          dia: string | null
          gmv_de_terceiros: number | null
          gmv_live_canal: number | null
          gmv_nossas_lives: number | null
          nossas_lives: number | null
          share_nossas_pct: number | null
          visitas_live_canal: number | null
        }
        Relationships: []
      }
      vw_live_top: {
        Row: {
          canal: string | null
          data_br: string | null
          dia: string | null
          dia_semana: string | null
          duracao_min: number | null
          espectadores: number | null
          gmv: number | null
          gmv_por_hora: number | null
          hora_br: string | null
          id: number | null
          informa_receita: boolean | null
          pedidos: number | null
          pedidos_por_100_espectadores: number | null
          ticket_medio: number | null
          titulo: string | null
          unidades: number | null
        }
        Insert: {
          canal?: string | null
          data_br?: never
          dia?: never
          dia_semana?: never
          duracao_min?: never
          espectadores?: number | null
          gmv?: never
          gmv_por_hora?: never
          hora_br?: never
          id?: number | null
          informa_receita?: never
          pedidos?: number | null
          pedidos_por_100_espectadores?: never
          ticket_medio?: never
          titulo?: never
          unidades?: number | null
        }
        Update: {
          canal?: string | null
          data_br?: never
          dia?: never
          dia_semana?: never
          duracao_min?: never
          espectadores?: number | null
          gmv?: never
          gmv_por_hora?: never
          hora_br?: never
          id?: number | null
          informa_receita?: never
          pedidos?: number | null
          pedidos_por_100_espectadores?: never
          ticket_medio?: never
          titulo?: never
          unidades?: number | null
        }
        Relationships: []
      }
      vw_meta_ad_diario: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          add_carrinho: number | null
          adset_id: string | null
          adset_name: string | null
          alcance: number | null
          campaign_id: string | null
          campaign_name: string | null
          checkout_iniciado: number | null
          cliques: number | null
          compras: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          lpv: number | null
          objetivo: string | null
          receita: number | null
          roas: number | null
          thruplays: number | null
        }
        Relationships: []
      }
      vw_meta_ad_status: {
        Row: {
          ad_id: string | null
          adset_id: string | null
          campaign_id: string | null
          no_ar: boolean | null
          status_anuncio: string | null
          status_campanha: string | null
          status_conjunto: string | null
          status_efetivo: string | null
        }
        Relationships: []
      }
      vw_meta_anuncio_dia: {
        Row: {
          ad_body: string | null
          ad_id: string | null
          ad_name: string | null
          ad_title: string | null
          add_to_cart: number | null
          adset_id: string | null
          adset_name: string | null
          alcance: number | null
          campaign_id: string | null
          campaign_name: string | null
          checkout: number | null
          cliques: number | null
          compras: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          creative_id: string | null
          ctr: number | null
          data: string | null
          facebook_permalink_url: string | null
          frequencia: number | null
          gasto: number | null
          impressoes: number | null
          instagram_permalink_url: string | null
          lpv: number | null
          objetivo: string | null
          receita: number | null
          roas: number | null
          roas_meta: number | null
          taxa_conversao: number | null
          thruplay: number | null
          thumbnail_url: string | null
          ticket: number | null
          video_100: number | null
          video_25: number | null
          video_50: number | null
          video_75: number | null
        }
        Relationships: []
      }
      vw_meta_anuncio_dia_completo: {
        Row: {
          ad_body: string | null
          ad_id: string | null
          ad_name: string | null
          ad_title: string | null
          add_to_cart: number | null
          adset_id: string | null
          adset_name: string | null
          alcance: number | null
          campaign_id: string | null
          campaign_name: string | null
          checkout: number | null
          cliques: number | null
          compras: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          creative_id: string | null
          ctr: number | null
          data: string | null
          effective_status: string | null
          facebook_permalink_url: string | null
          frequencia: number | null
          gasto: number | null
          impressoes: number | null
          instagram_permalink_url: string | null
          lpv: number | null
          object_type: string | null
          objetivo: string | null
          receita: number | null
          roas: number | null
          roas_meta: number | null
          sem_entrega: boolean | null
          taxa_conversao: number | null
          thruplay: number | null
          thumbnail_url: string | null
          ticket: number | null
          video_100: number | null
          video_25: number | null
          video_50: number | null
          video_75: number | null
        }
        Relationships: []
      }
      vw_meta_campanha_config: {
        Row: {
          bid_strategy: string | null
          buying_type: string | null
          campaign_id: string | null
          campaign_name: string | null
          configured_status: string | null
          created_time: string | null
          effective_status: string | null
          objetivo: string | null
          orcamento_diario: number | null
          orcamento_restante: number | null
          orcamento_vitalicio: number | null
          special_ad_category: string | null
          spend_cap: number | null
          start_time: string | null
          stop_time: string | null
        }
        Insert: {
          bid_strategy?: string | null
          buying_type?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          configured_status?: string | null
          created_time?: string | null
          effective_status?: string | null
          objetivo?: string | null
          orcamento_diario?: never
          orcamento_restante?: never
          orcamento_vitalicio?: never
          special_ad_category?: never
          spend_cap?: never
          start_time?: string | null
          stop_time?: string | null
        }
        Update: {
          bid_strategy?: string | null
          buying_type?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          configured_status?: string | null
          created_time?: string | null
          effective_status?: string | null
          objetivo?: string | null
          orcamento_diario?: never
          orcamento_restante?: never
          orcamento_vitalicio?: never
          special_ad_category?: never
          spend_cap?: never
          start_time?: string | null
          stop_time?: string | null
        }
        Relationships: []
      }
      vw_meta_campanha_diario: {
        Row: {
          add_carrinho: number | null
          campaign_id: string | null
          campaign_name: string | null
          checkout_iniciado: number | null
          cliques: number | null
          compras: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          lpv: number | null
          objetivo: string | null
          receita: number | null
          roas: number | null
          thruplays: number | null
        }
        Relationships: []
      }
      vw_meta_campanhas: {
        Row: {
          campanha: string | null
          cpc: number | null
          ctr_pct: number | null
          grupo: string | null
          invest: number | null
          receita: number | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_meta_criativo_dia: {
        Row: {
          anuncios_com_investimento: number | null
          cliques: number | null
          compras: number | null
          criativos_com_investimento: number | null
          criativos_total: number | null
          data: string | null
          gasto: number | null
          gasto_por_criativo: number | null
          impressoes: number | null
          receita: number | null
        }
        Relationships: []
      }
      vw_meta_criativo_formato: {
        Row: {
          criativos: number | null
          ctr_pct: number | null
          formato: string | null
          invest: number | null
          receita: number | null
          roas: number | null
        }
        Relationships: []
      }
      vw_meta_criativos: {
        Row: {
          campanha: string | null
          compras: number | null
          criativo: string | null
          ctr_pct: number | null
          frequencia: number | null
          grupo: string | null
          hook_pct: number | null
          impressoes: number | null
          invest: number | null
          publico: string | null
          receita: number | null
          roas: number | null
          sugestao: string | null
          titulo: string | null
        }
        Relationships: []
      }
      vw_meta_criativos_top: {
        Row: {
          campanha: string | null
          compras: number | null
          criativo: string | null
          ctr_pct: number | null
          frequencia: number | null
          grupo: string | null
          hook_pct: number | null
          impressoes: number | null
          invest: number | null
          publico: string | null
          receita: number | null
          roas: number | null
          sugestao: string | null
          titulo: string | null
        }
        Relationships: []
      }
      vw_meta_demografia: {
        Row: {
          compras: number | null
          ctr_pct: number | null
          faixa_idade: string | null
          genero: string | null
          invest: number | null
          receita: number | null
          roas: number | null
        }
        Relationships: []
      }
      vw_meta_demografia_dia: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          add_carrinho: number | null
          campaign_id: string | null
          campaign_name: string | null
          checkout_iniciado: number | null
          cliques: number | null
          compras: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          faixa_idade: string | null
          gasto: number | null
          genero: string | null
          impressoes: number | null
          objetivo: string | null
          receita: number | null
          roas: number | null
        }
        Relationships: []
      }
      vw_meta_fadiga: {
        Row: {
          criativo: string | null
          diagnostico: string | null
          freq_7d: number | null
          freq_ant: number | null
          invest_7d: number | null
          publico: string | null
          roas_7d: number | null
          roas_ant: number | null
        }
        Relationships: []
      }
      vw_meta_funil: {
        Row: {
          cpa: number | null
          etapa: string | null
          ord: number | null
          taxa_passagem: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_meta_grupos: {
        Row: {
          cpc: number | null
          ctr_pct: number | null
          grupo: string | null
          invest: number | null
          meta_leitura: string | null
          ord: number | null
          receita: number | null
          roas: number | null
          share_pct: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_meta_hora_dia: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          compras: number | null
          cpa: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          hora: string | null
          hora_num: number | null
          impressoes: number | null
          objetivo: string | null
          receita: number | null
          roas: number | null
        }
        Relationships: []
      }
      vw_meta_horario: {
        Row: {
          ctr_pct: number | null
          hora: string | null
          invest: number | null
          receita: number | null
          roas: number | null
        }
        Relationships: []
      }
      vw_meta_intraday: {
        Row: {
          add_to_cart: number | null
          alcance: number | null
          captured_at: string | null
          checkout: number | null
          cliques: number | null
          compras: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          lpv: number | null
          receita: number | null
          roas: number | null
          ticket: number | null
        }
        Relationships: []
      }
      vw_meta_intraday_anuncio: {
        Row: {
          ad_body: string | null
          ad_id: string | null
          ad_name: string | null
          ad_title: string | null
          add_to_cart: number | null
          adset_id: string | null
          adset_name: string | null
          alcance: number | null
          campaign_id: string | null
          campaign_name: string | null
          captured_at: string | null
          checkout: number | null
          cliques: number | null
          compras: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          creative_id: string | null
          ctr: number | null
          data: string | null
          facebook_permalink_url: string | null
          frequencia: number | null
          gasto: number | null
          impressoes: number | null
          instagram_permalink_url: string | null
          lpv: number | null
          objetivo: string | null
          receita: number | null
          roas: number | null
          roas_meta: number | null
          taxa_conversao: number | null
          thruplay: number | null
          thumbnail_url: string | null
          ticket: number | null
          video_100: number | null
          video_25: number | null
          video_50: number | null
          video_75: number | null
        }
        Relationships: []
      }
      vw_meta_kpi_dia: {
        Row: {
          add_carrinho: number | null
          checkout_iniciado: number | null
          cliques: number | null
          compras: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          gasto: number | null
          impressoes: number | null
          lpv: number | null
          receita: number | null
          roas: number | null
        }
        Relationships: []
      }
      vw_meta_posicionamento: {
        Row: {
          ctr_pct: number | null
          dispositivo: string | null
          invest: number | null
          plataforma: string | null
          posicionamento: string | null
          receita: number | null
          roas: number | null
        }
        Relationships: []
      }
      vw_meta_posicionamento_dia: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          cliques: number | null
          compras: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string | null
          dispositivo: string | null
          gasto: number | null
          impressoes: number | null
          objetivo: string | null
          plataforma: string | null
          posicionamento: string | null
          receita: number | null
          roas: number | null
          thruplays: number | null
        }
        Relationships: []
      }
      vw_meta_publicos: {
        Row: {
          compras: number | null
          ctr_pct: number | null
          frequencia: number | null
          grupo: string | null
          invest: number | null
          publico: string | null
          receita: number | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_meta_resumo_mes: {
        Row: {
          ads_esperado: number | null
          ads_meta: number | null
          ads_proj: number | null
          ads_real: number | null
          afil_esperado: number | null
          afil_esperado_comp: number | null
          afil_meta: number | null
          afil_meta_comp: number | null
          afil_proj: number | null
          afil_real: number | null
          canais_afil_lancados: number | null
          canais_afil_sem_lancamento: number | null
          canais_afil_total: number | null
          excesso_fechamento: number | null
          invest_esperado: number | null
          invest_meta: number | null
          invest_proj: number | null
          invest_real: number | null
          mes: string | null
          pct_meta: number | null
          pct_proj: number | null
          pct_real: number | null
          receita_esperada: number | null
          receita_meta: number | null
          receita_proj: number | null
          receita_real: number | null
          retorno_ads: number | null
          tem_afil_sem_lancamento: boolean | null
        }
        Relationships: []
      }
      vw_meta_vs_real_dia: {
        Row: {
          ads_meta: number | null
          ads_real: number | null
          afiliado_maturando: boolean | null
          atg_ads: number | null
          atg_receita: number | null
          canal: string | null
          dado_provisorio: boolean | null
          data: string | null
          dia_em_curso: boolean | null
          dia_fechado: boolean | null
          dia_futuro: boolean | null
          excesso_ads_dia: number | null
          gap_receita_dia: number | null
          invest_afil_meta: number | null
          invest_afil_real: number | null
          mes: string | null
          peso: number | null
          receita_ads_meta: number | null
          receita_ads_real: number | null
          receita_afil_meta: number | null
          receita_afil_real: number | null
          receita_meta: number | null
          receita_real: number | null
          roas_ads_meta: number | null
          roas_ads_real: number | null
          semana: string | null
          share_ads_real: number | null
        }
        Relationships: []
      }
      vw_meta_vs_real_mensal: {
        Row: {
          ads_meta_acum_d1: number | null
          ads_real_d1: number | null
          afil_inv_d1: number | null
          afil_meta_acum_d1: number | null
          afil_rec_d1: number | null
          afil_sem_lancamento: boolean | null
          canal: string | null
          comissao_afil_meta: number | null
          curva_d1: number | null
          curva_d3: number | null
          desvio_pp: number | null
          excesso_ads: number | null
          excesso_afil: number | null
          excesso_invest: number | null
          farol_receita: string | null
          gap_receita_d1: number | null
          invest_ads_meta: number | null
          invest_afil_meta: number | null
          invest_meta_acum_d1: number | null
          invest_real_d1: number | null
          mes: string | null
          origem_desvio: string | null
          pct_meta: number | null
          pct_real: number | null
          projecao_ads: number | null
          projecao_afil: number | null
          projecao_invest: number | null
          projecao_receita: number | null
          receita_ads_meta: number | null
          receita_afil_meta: number | null
          receita_d3: number | null
          receita_meta_acum_d1: number | null
          receita_real_d1: number | null
          receita_total_meta: number | null
          retorno_ads: number | null
          share_afil_meta: number | null
        }
        Relationships: []
      }
      vw_meta_vs_real_mes: {
        Row: {
          ads_meta_acum_d1: number | null
          ads_real_d1: number | null
          afil_inv_d1: number | null
          afil_rec_d1: number | null
          atg_receita_d3: number | null
          canal: string | null
          curva_d1: number | null
          curva_d3: number | null
          farol_receita: string | null
          invest_ads_meta: number | null
          invest_afil_meta: number | null
          projecao_ads: number | null
          projecao_receita: number | null
          receita_ads_meta: number | null
          receita_afil_meta: number | null
          receita_meta_acum_d1: number | null
          receita_real_d1: number | null
          receita_total_meta: number | null
        }
        Relationships: []
      }
      vw_ml_ads_intraday: {
        Row: {
          captured_at: string | null
          cliques_ads: number | null
          data: string | null
          impressoes_ads: number | null
          invest_ads: number | null
          receita_ads: number | null
          roas_ads: number | null
        }
        Insert: {
          captured_at?: string | null
          cliques_ads?: number | null
          data?: string | null
          impressoes_ads?: number | null
          invest_ads?: number | null
          receita_ads?: number | null
          roas_ads?: never
        }
        Update: {
          captured_at?: string | null
          cliques_ads?: number | null
          data?: string | null
          impressoes_ads?: number | null
          invest_ads?: number | null
          receita_ads?: number | null
          roas_ads?: never
        }
        Relationships: []
      }
      vw_ml_ads_saude: {
        Row: {
          data: string | null
          dia_anterior: number | null
          dia_seguinte: number | null
          fonte: string | null
          situacao: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_ml_afiliado_base: {
        Row: {
          afiliado_nome: string | null
          afiliado_username: string | null
          campanha_id: string | null
          campanha_rotulo: string | null
          campanha_tipo: string | null
          casou_pedido: boolean | null
          categoria: string | null
          comissao_pedido: number | null
          conversao_fim: string | null
          data: string | null
          data_ml: string | null
          fee: number | null
          fee_pct: number | null
          item_id: string | null
          pedido_id: number | null
          quantidade: number | null
          seller_sku: string | null
          tem_custo: boolean | null
          titulo: string | null
          valor_venda: number | null
          verificado: string | null
        }
        Insert: {
          afiliado_nome?: string | null
          afiliado_username?: string | null
          campanha_id?: string | null
          campanha_rotulo?: never
          campanha_tipo?: never
          casou_pedido?: boolean | null
          categoria?: string | null
          comissao_pedido?: number | null
          conversao_fim?: string | null
          data?: string | null
          data_ml?: string | null
          fee?: number | null
          fee_pct?: number | null
          item_id?: string | null
          pedido_id?: number | null
          quantidade?: number | null
          seller_sku?: string | null
          tem_custo?: never
          titulo?: string | null
          valor_venda?: number | null
          verificado?: string | null
        }
        Update: {
          afiliado_nome?: string | null
          afiliado_username?: string | null
          campanha_id?: string | null
          campanha_rotulo?: never
          campanha_tipo?: never
          casou_pedido?: boolean | null
          categoria?: string | null
          comissao_pedido?: number | null
          conversao_fim?: string | null
          data?: string | null
          data_ml?: string | null
          fee?: number | null
          fee_pct?: number | null
          item_id?: string | null
          pedido_id?: number | null
          quantidade?: number | null
          seller_sku?: string | null
          tem_custo?: never
          titulo?: string | null
          valor_venda?: number | null
          verificado?: string | null
        }
        Relationships: []
      }
      vw_ml_afiliado_campanha_dia: {
        Row: {
          afiliados: number | null
          campanha_id: string | null
          campanha_rotulo: string | null
          campanha_tipo: string | null
          custo: number | null
          data: string | null
          fee_max_pct: number | null
          fee_min_pct: number | null
          gmv: number | null
          pedidos: number | null
          taxa_efetiva_pct: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_ml_afiliado_creator_dia: {
        Row: {
          afiliado_nome: string | null
          afiliado_username: string | null
          campanhas: number | null
          custo: number | null
          data: string | null
          gmv: number | null
          pedidos: number | null
          skus: number | null
          taxa_efetiva_pct: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_ml_afiliado_creator_resumo: {
        Row: {
          afiliado_nome: string | null
          afiliado_username: string | null
          afiliados_p50_venda: number | null
          afiliados_p80_venda: number | null
          campanha_predominante: string | null
          custo: number | null
          custo_acum_pct: number | null
          custo_total_geral: number | null
          dias_ativos: number | null
          gmv: number | null
          gmv_acum_pct: number | null
          gmv_total_geral: number | null
          pedidos: number | null
          pedidos_total_geral: number | null
          primeira_venda: string | null
          rank_custo: number | null
          rank_gmv: number | null
          share_custo_pct: number | null
          share_gmv_pct: number | null
          skus: number | null
          taxa_efetiva_pct: number | null
          ticket: number | null
          total_afiliados: number | null
          ultima_venda: string | null
          unidades: number | null
          unidades_total_geral: number | null
        }
        Relationships: []
      }
      vw_ml_afiliado_dia: {
        Row: {
          afiliados_ativos: number | null
          comissao_efetiva_pct: number | null
          completo: boolean | null
          custo_aberta: number | null
          custo_afiliado: number | null
          custo_exclusiva: number | null
          custo_pct_gmv_total: number | null
          data: string | null
          dias_ml_faltando: number | null
          gmv_aberta: number | null
          gmv_afiliado: number | null
          gmv_exclusiva: number | null
          gmv_sem_campanha: number | null
          gmv_total: number | null
          pct_gmv_afiliado: number | null
          pct_gmv_custo_zero: number | null
          pct_pedidos_afiliado: number | null
          pedidos_afiliado: number | null
          pedidos_total: number | null
          taxa_aberta_pct: number | null
          taxa_exclusiva_pct: number | null
          ticket_afiliado: number | null
          ticket_sem_afiliado: number | null
          unidades_afiliado: number | null
        }
        Relationships: []
      }
      vw_ml_afiliado_produto_dia: {
        Row: {
          afiliados: number | null
          categoria: string | null
          comissao_efetiva_pct: number | null
          custo_afiliado: number | null
          data: string | null
          gmv_afiliado: number | null
          gmv_total: number | null
          item_id: string | null
          liquido_afiliado: number | null
          pct_gmv_via_afiliado: number | null
          pct_pedidos_via_afiliado: number | null
          pedidos_afiliado: number | null
          pedidos_total: number | null
          produto: string | null
          seller_sku: string | null
          unidades_afiliado: number | null
        }
        Relationships: []
      }
      vw_ml_afiliado_saude: {
        Row: {
          afiliados: number | null
          canal: string | null
          dias_atraso: number | null
          dias_brt_incompletos: number | null
          dias_erro: number | null
          dias_ok: number | null
          dias_pendentes: number | null
          linhas: number | null
          pct_casou_ml_pedido: number | null
          primeiro_dia: string | null
          primeiro_dia_ok: string | null
          situacao: string | null
          ultimo_dia: string | null
          ultimo_dia_ok: string | null
        }
        Relationships: []
      }
      vw_ml_anuncio_dia: {
        Row: {
          comissao: number | null
          data: string | null
          faturamento: number | null
          item_id: string | null
          pedidos: number | null
          unidades: number | null
          visitas: number | null
        }
        Insert: {
          comissao?: number | null
          data?: string | null
          faturamento?: number | null
          item_id?: string | null
          pedidos?: number | null
          unidades?: number | null
          visitas?: number | null
        }
        Update: {
          comissao?: number | null
          data?: string | null
          faturamento?: number | null
          item_id?: string | null
          pedidos?: number | null
          unidades?: number | null
          visitas?: number | null
        }
        Relationships: []
      }
      vw_ml_anuncio_hist: {
        Row: {
          campo: string | null
          id: number | null
          item_id: string | null
          mudou_em: string | null
          nome: string | null
          permalink: string | null
          sku: string | null
          thumbnail: string | null
          valor_antigo: string | null
          valor_novo: string | null
        }
        Relationships: []
      }
      vw_ml_competicao: {
        Row: {
          anuncio_status: string | null
          atualizado_em: string | null
          baixar_para_ganhar: number | null
          boosts: Json | null
          buybox_status: string | null
          catalog_listing: boolean | null
          catalog_product_id: string | null
          competitors: Json | null
          desconto_pct: number | null
          domain_id: string | null
          em_promocao: boolean | null
          estoque_disponivel: number | null
          free_shipping: boolean | null
          health: number | null
          item_id: string | null
          logistic_type: string | null
          nome: string | null
          oportunidades_boost: number | null
          permalink: string | null
          preco_competicao: number | null
          preco_lista: number | null
          preco_regular: number | null
          preco_venda: number | null
          price_to_win: number | null
          promo_campanha: string | null
          reason: Json | null
          situacao: string | null
          sku: string | null
          thumbnail: string | null
          tipo_promocao: string | null
          vendidos: number | null
        }
        Relationships: []
      }
      vw_ml_concorrente_dia: {
        Row: {
          acompanhado: boolean | null
          alias: string | null
          base_anterior_acum: number | null
          base_estimada: boolean | null
          base_fonte: string | null
          categoria: string | null
          crescimento: number | null
          data_ref: string | null
          dias_cobertos: number | null
          eh_piso: boolean | null
          mes: string | null
          mes_fechado: boolean | null
          nome: string | null
          periodo_agregado: boolean | null
          posicao: number | null
          primeira_do_mes: boolean | null
          receita_acum: number | null
          receita_dia_media: number | null
          receita_periodo: number | null
          tipo: string | null
          unidades_acum: number | null
          unidades_periodo: number | null
          visitas_acum: number | null
        }
        Relationships: []
      }
      vw_ml_concorrente_mes: {
        Row: {
          acompanhado: boolean | null
          alias: string | null
          base_anterior_acum: number | null
          base_estimada: boolean | null
          base_fonte: string | null
          categoria: string | null
          crescimento: number | null
          data_ref: string | null
          eh_piso: boolean | null
          mes: string | null
          mes_fechado: boolean | null
          nome: string | null
          receita_acum: number | null
          tipo: string | null
          unidades_acum: number | null
          visitas_acum: number | null
        }
        Relationships: []
      }
      vw_ml_display_campanha_dia: {
        Row: {
          add_to_cart: number | null
          add_to_cart_tp: number | null
          alcance: number | null
          campaign_id: string | null
          campaign_name: string | null
          checkout: number | null
          checkout_tp: number | null
          cliques: number | null
          data: string | null
          favoritos: number | null
          frequencia: number | null
          goal: string | null
          impressoes: number | null
          investimento: number | null
          ppv: number | null
          ppv_tp: number | null
          q100: number | null
          q25: number | null
          q50: number | null
          q75: number | null
          receita: number | null
          receita_tp: number | null
          status: string | null
          tipo: string | null
          unidades: number | null
          unidades_tp: number | null
          views_ativas: number | null
          views_completas: number | null
        }
        Relationships: []
      }
      vw_ml_display_campanha_lista: {
        Row: {
          advertiser_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          end_date: string | null
          goal: string | null
          site_id: string | null
          start_date: string | null
          status: string | null
          tipo: string | null
        }
        Insert: {
          advertiser_id?: string | null
          campaign_id?: never
          campaign_name?: string | null
          end_date?: string | null
          goal?: string | null
          site_id?: string | null
          start_date?: string | null
          status?: string | null
          tipo?: string | null
        }
        Update: {
          advertiser_id?: string | null
          campaign_id?: never
          campaign_name?: string | null
          end_date?: string | null
          goal?: string | null
          site_id?: string | null
          start_date?: string | null
          status?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      vw_ml_display_criativo_dia: {
        Row: {
          add_to_cart: number | null
          add_to_cart_tp: number | null
          alcance: number | null
          campaign_id: string | null
          campaign_name: string | null
          checkout: number | null
          checkout_tp: number | null
          cliques: number | null
          creative_id: string | null
          creative_name: string | null
          data: string | null
          favoritos: number | null
          frequencia: number | null
          impressoes: number | null
          investimento: number | null
          line_item_id: string | null
          line_item_name: string | null
          ppv: number | null
          ppv_tp: number | null
          q100: number | null
          q25: number | null
          q50: number | null
          q75: number | null
          receita: number | null
          receita_tp: number | null
          status: string | null
          unidades: number | null
          unidades_tp: number | null
          views_ativas: number | null
          views_completas: number | null
        }
        Relationships: []
      }
      vw_ml_display_criativo_lista: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          creative_id: string | null
          creative_name: string | null
          line_item_id: string | null
          line_item_name: string | null
          status: string | null
        }
        Relationships: []
      }
      vw_ml_display_kpi_dia: {
        Row: {
          add_to_cart: number | null
          alcance: number | null
          checkout: number | null
          cliques: number | null
          data: string | null
          impressoes: number | null
          investimento: number | null
          ppv: number | null
          receita: number | null
          receita_tp: number | null
          unidades: number | null
          unidades_tp: number | null
          views_ativas: number | null
          views_completas: number | null
        }
        Relationships: []
      }
      vw_ml_display_line_item_dia: {
        Row: {
          add_to_cart: number | null
          add_to_cart_tp: number | null
          alcance: number | null
          campaign_id: string | null
          campaign_name: string | null
          checkout: number | null
          checkout_tp: number | null
          cliques: number | null
          data: string | null
          favoritos: number | null
          frequencia: number | null
          impressoes: number | null
          investimento: number | null
          line_item_id: string | null
          line_item_name: string | null
          ppv: number | null
          ppv_tp: number | null
          q100: number | null
          q25: number | null
          q50: number | null
          q75: number | null
          receita: number | null
          receita_tp: number | null
          status: string | null
          tipo: string | null
          unidades: number | null
          unidades_tp: number | null
          views_ativas: number | null
          views_completas: number | null
        }
        Relationships: []
      }
      vw_ml_display_line_item_lista: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          campaign_tipo: string | null
          end_date: string | null
          line_item_id: string | null
          line_item_name: string | null
          start_date: string | null
          status: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_ml_estoque_full_vendas: {
        Row: {
          atualizado_em: string | null
          atualizado_vendas: string | null
          disponivel: number | null
          em_transferencia: number | null
          inventory_id: string | null
          item_id: string | null
          seller_sku: string | null
          title: string | null
          total: number | null
          vendas_14d: number | null
          vendas_21d: number | null
          vendas_7d: number | null
          vendas_d1: number | null
          vendas_hoje: number | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_vendas?: string | null
          disponivel?: number | null
          em_transferencia?: number | null
          inventory_id?: string | null
          item_id?: string | null
          seller_sku?: string | null
          title?: string | null
          total?: number | null
          vendas_14d?: number | null
          vendas_21d?: number | null
          vendas_7d?: number | null
          vendas_d1?: number | null
          vendas_hoje?: number | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_vendas?: string | null
          disponivel?: number | null
          em_transferencia?: number | null
          inventory_id?: string | null
          item_id?: string | null
          seller_sku?: string | null
          title?: string | null
          total?: number | null
          vendas_14d?: number | null
          vendas_21d?: number | null
          vendas_7d?: number | null
          vendas_d1?: number | null
          vendas_hoje?: number | null
        }
        Relationships: []
      }
      vw_ml_frete_dia: {
        Row: {
          cancelamento_pct: number | null
          cobertura_comissao_pct: number | null
          comissao: number | null
          comissao_pct: number | null
          data: string | null
          faturamento: number | null
          faturamento_cancelado: number | null
          logistic_type: string | null
          pedidos: number | null
          pedidos_cancelados: number | null
          preco_medio: number | null
          produtos: number | null
          share_pct: number | null
          ticket_medio: number | null
          tipo_frete: string | null
          unid_por_pedido: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_ml_frete_pedido: {
        Row: {
          frete_bruto_legado: number | null
          frete_envio: number | null
          frete_rateado: number | null
          logistic_type: string | null
          pedido_id: number | null
          pedidos_no_envio: number | null
          shipping_id: number | null
        }
        Relationships: []
      }
      vw_ml_frete_produto_dia: {
        Row: {
          cancelamento_pct: number | null
          comissao: number | null
          comissao_pct: number | null
          data: string | null
          faturamento: number | null
          faturamento_cancelado: number | null
          item_id: string | null
          logistic_type: string | null
          pedidos: number | null
          pedidos_cancelados: number | null
          preco_medio: number | null
          seller_sku: string | null
          share_tipo_pct: number | null
          ticket_medio: number | null
          tipo_frete: string | null
          titulo: string | null
          unid_por_pedido: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_ml_full_inventory: {
        Row: {
          inventory_id: string | null
          item_id: string | null
          qty_anuncio: number | null
          seller_sku: string | null
          title: string | null
        }
        Relationships: []
      }
      vw_ml_mercado_dia: {
        Row: {
          categoria: string | null
          data_ref: string | null
          mes: string | null
          tendencia_pct: number | null
          vendas_brutas: number | null
        }
        Relationships: []
      }
      vw_ml_pads_campanha_dia: {
        Row: {
          acos: number | null
          acos_benchmark: number | null
          acos_target: number | null
          advertiser_id: string | null
          advertising_items_quantity: number | null
          campaign_id: number | null
          campaign_name: string | null
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          currency: string | null
          cvr: number | null
          date: string | null
          direct_amount: number | null
          direct_units_quantity: number | null
          impression_share: number | null
          indirect_amount: number | null
          indirect_units_quantity: number | null
          lost_impression_share_by_ad_rank: number | null
          lost_impression_share_by_budget: number | null
          organic_items_quantity: number | null
          organic_units_amount: number | null
          organic_units_quantity: number | null
          prints: number | null
          roas: number | null
          roas_target: number | null
          sov: number | null
          status: string | null
          strategy: string | null
          top_impression_share: number | null
          total_amount: number | null
          units_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_product_ads_campanha_metricas_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ml_product_ads_campanha"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "ml_product_ads_campanha_metricas_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_ml_pads_campanha_lista"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      vw_ml_pads_campanha_lista: {
        Row: {
          acos_target: number | null
          advertiser_id: string | null
          budget: number | null
          campaign_id: number | null
          channel: string | null
          name: string | null
          roas_target: number | null
          status: string | null
          strategy: string | null
        }
        Insert: {
          acos_target?: number | null
          advertiser_id?: string | null
          budget?: number | null
          campaign_id?: number | null
          channel?: string | null
          name?: string | null
          roas_target?: number | null
          status?: string | null
          strategy?: string | null
        }
        Update: {
          acos_target?: number | null
          advertiser_id?: string | null
          budget?: number | null
          campaign_id?: number | null
          channel?: string | null
          name?: string | null
          roas_target?: number | null
          status?: string | null
          strategy?: string | null
        }
        Relationships: []
      }
      vw_ml_pads_item_dia: {
        Row: {
          acos: number | null
          acos_benchmark: number | null
          advertiser_id: string | null
          advertising_items_quantity: number | null
          buy_box_winner: boolean | null
          campaign_id: number | null
          campaign_name: string | null
          catalog_listing: boolean | null
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          currency: string | null
          cvr: number | null
          date: string | null
          direct_amount: number | null
          direct_units_quantity: number | null
          domain_id: string | null
          impression_share: number | null
          indirect_amount: number | null
          indirect_units_quantity: number | null
          item_id: string | null
          logistic_type: string | null
          lost_impression_share_by_ad_rank: number | null
          lost_impression_share_by_budget: number | null
          organic_items_quantity: number | null
          organic_units_amount: number | null
          organic_units_quantity: number | null
          permalink: string | null
          price: number | null
          prints: number | null
          roas: number | null
          sov: number | null
          status: string | null
          thumbnail: string | null
          title: string | null
          top_impression_share: number | null
          total_amount: number | null
          units_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_product_ads_item_metricas_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ml_product_ads_item"
            referencedColumns: ["item_id"]
          },
        ]
      }
      vw_ml_pads_kpi_dia: {
        Row: {
          acos: number | null
          advertiser_id: string | null
          clicks: number | null
          cost: number | null
          cpc: number | null
          ctr: number | null
          date: string | null
          direct_amount: number | null
          indirect_amount: number | null
          prints: number | null
          roas: number | null
          total_amount: number | null
          units_quantity: number | null
        }
        Relationships: []
      }
      vw_ml_ranking_atual: {
        Row: {
          acompanhado: boolean | null
          alias: string | null
          base_anterior_acum: number | null
          base_estimada: boolean | null
          base_fonte: string | null
          categoria: string | null
          crescimento: number | null
          data_ref: string | null
          dias_cobertos: number | null
          eh_piso: boolean | null
          mes: string | null
          mes_fechado: boolean | null
          nome: string | null
          periodo_agregado: boolean | null
          posicao: number | null
          posicao_consolidada: number | null
          primeira_do_mes: boolean | null
          receita_acum: number | null
          receita_dia_media: number | null
          receita_periodo: number | null
          share_pct: number | null
          tipo: string | null
          unidades_acum: number | null
          unidades_periodo: number | null
          visitas_acum: number | null
        }
        Relationships: []
      }
      vw_ml_reposicao_full: {
        Row: {
          alerta: string | null
          atualizado_em: string | null
          cobertura_dias: number | null
          cobertura_transito: number | null
          em_full: boolean | null
          enviar_30d: number | null
          full_disponivel: number | null
          full_em_transferencia: number | null
          media_diaria: number | null
          seller_sku: string | null
          title: string | null
          vendas_21d: number | null
          vendas_7d: number | null
        }
        Insert: {
          alerta?: string | null
          atualizado_em?: string | null
          cobertura_dias?: number | null
          cobertura_transito?: number | null
          em_full?: boolean | null
          enviar_30d?: number | null
          full_disponivel?: number | null
          full_em_transferencia?: number | null
          media_diaria?: number | null
          seller_sku?: string | null
          title?: string | null
          vendas_21d?: number | null
          vendas_7d?: number | null
        }
        Update: {
          alerta?: string | null
          atualizado_em?: string | null
          cobertura_dias?: number | null
          cobertura_transito?: number | null
          em_full?: boolean | null
          enviar_30d?: number | null
          full_disponivel?: number | null
          full_em_transferencia?: number | null
          media_diaria?: number | null
          seller_sku?: string | null
          title?: string | null
          vendas_21d?: number | null
          vendas_7d?: number | null
        }
        Relationships: []
      }
      vw_ml_tacos_dia: {
        Row: {
          afiliado_completo: boolean | null
          afiliado_sobre_ads_pct: number | null
          custo_afiliado: number | null
          custo_midia_total: number | null
          data: string | null
          gmv_afiliado: number | null
          invest_ads: number | null
          invest_brand: number | null
          invest_display: number | null
          invest_pads: number | null
          pct_gmv_afiliado: number | null
          receita: number | null
          tacos_ads_pct: number | null
          tacos_afiliado_pp: number | null
          tacos_real_pct: number | null
        }
        Relationships: []
      }
      vw_ml_tendencia_semana: {
        Row: {
          ads_maturando: boolean | null
          faturamento: number | null
          invest_ads: number | null
          invest_brand: number | null
          invest_display: number | null
          invest_product: number | null
          parcial: boolean | null
          pedidos: number | null
          roas_brand: number | null
          roas_display: number | null
          roas_product: number | null
          roas_total: number | null
          semana: string | null
          semana_ini: string | null
          tacos_pct: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_ml_venda_intraday: {
        Row: {
          data: string | null
          faixa: string | null
          pedidos: number | null
          venda_total: number | null
          venda_total_paga: number | null
        }
        Relationships: []
      }
      vw_pads_campanhas: {
        Row: {
          campanha: string | null
          invest: number | null
          meta_campanha: number | null
          perde_ad_rank_pct: number | null
          roas: number | null
          sugestao: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_pads_itens: {
        Row: {
          buy_box: boolean | null
          cvr: number | null
          invest: number | null
          logistica: string | null
          pct_indireto: number | null
          produto: string | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_pads_itens_top: {
        Row: {
          buy_box: boolean | null
          cvr: number | null
          invest: number | null
          logistica: string | null
          pct_indireto: number | null
          produto: string | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_pads_resumo: {
        Row: {
          metrica: string | null
          sugestao: string | null
          valor: string | null
        }
        Relationships: []
      }
      vw_painel_execucao: {
        Row: {
          canal: string | null
          concluido_em: string | null
          criado_em: string | null
          custo_usd: number | null
          erro: string | null
          id: number | null
          pergunta: string | null
          periodo_ate: string | null
          periodo_de: string | null
          status: string | null
        }
        Insert: {
          canal?: string | null
          concluido_em?: string | null
          criado_em?: string | null
          custo_usd?: number | null
          erro?: string | null
          id?: number | null
          pergunta?: string | null
          periodo_ate?: string | null
          periodo_de?: string | null
          status?: string | null
        }
        Update: {
          canal?: string | null
          concluido_em?: string | null
          criado_em?: string | null
          custo_usd?: number | null
          erro?: string | null
          id?: number | null
          pergunta?: string | null
          periodo_ate?: string | null
          periodo_de?: string | null
          status?: string | null
        }
        Relationships: []
      }
      vw_painel_resposta: {
        Row: {
          cargo: string | null
          criado_em: string | null
          effort: string | null
          execucao_id: number | null
          id: number | null
          ms: number | null
          ordem: number | null
          texto: string | null
        }
        Relationships: [
          {
            foreignKeyName: "painel_resposta_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "painel_execucao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "painel_resposta_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "vw_painel_execucao"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_painel_veredito: {
        Row: {
          afirmacao: string | null
          bateu: string | null
          cargo_origem: string | null
          comentario: string | null
          execucao_id: number | null
          id: number | null
        }
        Insert: {
          afirmacao?: string | null
          bateu?: string | null
          cargo_origem?: string | null
          comentario?: string | null
          execucao_id?: number | null
          id?: number | null
        }
        Update: {
          afirmacao?: string | null
          bateu?: string | null
          cargo_origem?: string | null
          comentario?: string | null
          execucao_id?: number | null
          id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "painel_veredito_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "painel_execucao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "painel_veredito_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "vw_painel_execucao"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_pedido_item_unificado: {
        Row: {
          data_venda: string | null
          item_id: string | null
          pedido_id: number | null
          quantity: number | null
          sale_fee: number | null
          seller_sku: string | null
          title: string | null
          unit_price: number | null
        }
        Relationships: []
      }
      vw_pedido_unificado: {
        Row: {
          data_venda: string | null
          frete_diferenca: number | null
          origem: string | null
          paid_amount: number | null
          pedido_id: number | null
          status: string | null
          total_amount: number | null
          total_sale_fee: number | null
        }
        Relationships: []
      }
      vw_pl_canal_dia: {
        Row: {
          ads: number | null
          canal: string | null
          cmv: number | null
          cmv_carregado: boolean | null
          cmv_cobertura_pct: number | null
          cobertura_pct: number | null
          custo_canal: number | null
          custo_canal_ref: number | null
          data: string | null
          det_afiliado: number | null
          det_frete: number | null
          det_taxa: number | null
          imposto: number | null
          imposto_pct: number | null
          margem_contribuicao: number | null
          margem_pct: number | null
          qualidade_taxa: string | null
          receita_bruta: number | null
        }
        Relationships: []
      }
      vw_pl_canal_mes: {
        Row: {
          ads: number | null
          canal: string | null
          cmv: number | null
          cmv_carregado: boolean | null
          cobertura_pct: number | null
          custo_canal: number | null
          custo_canal_pct: number | null
          custo_canal_ref: number | null
          det_afiliado: number | null
          det_frete: number | null
          det_taxa: number | null
          imposto: number | null
          margem_cenario_ref: number | null
          margem_contribuicao: number | null
          margem_pct: number | null
          mes: string | null
          qualidade_taxa: string | null
          receita_bruta: number | null
          tacos_pct: number | null
        }
        Relationships: []
      }
      vw_rd_campanha_venda: {
        Row: {
          campaign_id: number | null
          data: string | null
          pedidos: number | null
          receita: number | null
        }
        Relationships: []
      }
      vw_rd_lead_dia: {
        Row: {
          data: string | null
          leads: number | null
          leads_compraram: number | null
          origem: string | null
          receita_leads: number | null
        }
        Relationships: []
      }
      vw_rd_pedido: {
        Row: {
          data: string | null
          order_id: string | null
          receita: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      vw_rd_utm_venda_dia: {
        Row: {
          data: string | null
          ligada_campanha: boolean | null
          pedidos: number | null
          receita: number | null
          utm_campaign: string | null
        }
        Relationships: []
      }
      vw_receita_consolidada: {
        Row: {
          acos_pct: number | null
          afiliado_maturado: boolean | null
          afiliado_pct: number | null
          aquisicao_pct: number | null
          canal: string | null
          carregado_em: string | null
          data: string | null
          faturamento: number | null
          invest_ads: number | null
          invest_afiliados: number | null
          invest_aquisicao: number | null
          pedidos: number | null
          receita_ads: number | null
          roas_ads: number | null
          roas_total: number | null
          share_pct: number | null
          tacos_pct: number | null
          tem_afiliado: boolean | null
        }
        Relationships: []
      }
      vw_receita_consolidada_dia: {
        Row: {
          acos_pct: number | null
          afiliado_maturado: boolean | null
          afiliado_pct: number | null
          aquisicao_pct: number | null
          data: string | null
          faturamento: number | null
          invest_ads: number | null
          invest_afiliados: number | null
          invest_aquisicao: number | null
          pedidos: number | null
          receita_ads: number | null
          roas_ads: number | null
          roas_aquisicao: number | null
          roas_total: number | null
          tacos_pct: number | null
        }
        Relationships: []
      }
      vw_reconciliacao_shopify_meta_dia: {
        Row: {
          compras_informadas_meta: number | null
          data: string | null
          diferenca_nao_reconciliada: number | null
          enviados_meta: number | null
          gasto_meta: number | null
          pedidos_meta_utm: number | null
          pedidos_totais: number | null
          receita_informada_meta: number | null
          receita_meta_utm: number | null
          receita_pedidos_totais: number | null
          taxa_reconciliacao: number | null
          valor_enviado_meta: number | null
        }
        Relationships: []
      }
      vw_saude_amazon: {
        Row: {
          canal: string | null
          data: string | null
          dias_aberto: number | null
          pedido: string | null
          problema: string | null
          severidade: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_saude_ml: {
        Row: {
          canal: string | null
          data: string | null
          dias_aberto: number | null
          pedido: string | null
          problema: string | null
          severidade: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_saude_shopify: {
        Row: {
          canal: string | null
          data: string | null
          dias_aberto: number | null
          pedido: string | null
          problema: string | null
          severidade: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_shopee_ads_campanha_dia: {
        Row: {
          acos_direto: number | null
          ad_type: string | null
          bidding_method: string | null
          broad_gmv: number | null
          broad_order: number | null
          broad_roi: number | null
          campaign_budget: number | null
          campaign_id: number | null
          campaign_status: string | null
          campanha: string | null
          clicks: number | null
          cpc: number | null
          ctr: number | null
          data: string | null
          direct_gmv: number | null
          direct_order: number | null
          direct_roi: number | null
          expense: number | null
          impression: number | null
          placement: string | null
          roas_target: number | null
        }
        Relationships: []
      }
      vw_shopee_ads_cobertura_dia: {
        Row: {
          campanhas_com_gasto: number | null
          data: string | null
          gmv_direto_campanhas: number | null
          gmv_direto_total: number | null
          investimento_em_campanhas: number | null
          investimento_nao_atribuido: number | null
          investimento_total: number | null
          pct_atribuido: number | null
        }
        Relationships: []
      }
      vw_shopee_ads_por_tipo_dia: {
        Row: {
          cliques: number | null
          data: string | null
          impressoes: number | null
          investimento: number | null
          receita: number | null
          tipo: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_shopee_afiliado_dia: {
        Row: {
          comissao_efetiva_pct: number | null
          custo_afiliado: number | null
          custo_pct_gmv_total: number | null
          data: string | null
          gmv_afiliado: number | null
          gmv_total: number | null
          liquido_afiliado: number | null
          margem_afiliado_pct: number | null
          margem_sem_afiliado_pct: number | null
          maturado: boolean | null
          pct_gmv_afiliado: number | null
          pct_pedidos_afiliado: number | null
          pedidos_afiliado: number | null
          pedidos_total: number | null
          ticket_afiliado: number | null
          ticket_sem_afiliado: number | null
        }
        Relationships: []
      }
      vw_shopee_afiliado_produto_dia: {
        Row: {
          custo_afiliado: number | null
          data: string | null
          gmv_afiliado: number | null
          gmv_total: number | null
          item_id: string | null
          item_sku: string | null
          pct_pedidos_via_afiliado: number | null
          pedidos_afiliado: number | null
          pedidos_total: number | null
          produto: string | null
          unidades_afiliado: number | null
        }
        Relationships: []
      }
      vw_shopee_estoque: {
        Row: {
          atualizado_em: string | null
          dias_de_cobertura: number | null
          estoque_reservado: number | null
          estoque_total: number | null
          item_id: string | null
          item_sku: string | null
          media_diaria: number | null
          model_id: string | null
          model_sku: string | null
          preco_atual: number | null
          preco_original: number | null
          produto: string | null
          status_anuncio: string | null
          unidades_30d: number | null
          variacao: string | null
        }
        Relationships: []
      }
      vw_shopee_financeiro_dia: {
        Row: {
          afiliado_pct_gmv: number | null
          afiliados: number | null
          comissao: number | null
          data: string | null
          desconto_vendedor: number | null
          frete_real: number | null
          gmv: number | null
          liquido: number | null
          margem_liquida_pct: number | null
          pedidos: number | null
          pedidos_com_afiliado: number | null
          taxa_fbs: number | null
          taxa_servico: number | null
        }
        Relationships: []
      }
      vw_shopee_frete_dia: {
        Row: {
          afiliados: number | null
          cancelados: number | null
          cancelamento_pct: number | null
          cobertura_financeiro_pct: number | null
          comissao: number | null
          data: string | null
          faturamento_cancelado: number | null
          frete_medio: number | null
          frete_real: number | null
          pedidos: number | null
          peso_medio_g: number | null
          preco_medio: number | null
          produtos: number | null
          receita: number | null
          taxa_servico: number | null
          ticket_medio: number | null
          transportadora: string | null
          unid_por_pedido: number | null
          unidades: number | null
        }
        Insert: {
          afiliados?: number | null
          cancelados?: number | null
          cancelamento_pct?: number | null
          cobertura_financeiro_pct?: number | null
          comissao?: number | null
          data?: string | null
          faturamento_cancelado?: number | null
          frete_medio?: number | null
          frete_real?: number | null
          pedidos?: number | null
          peso_medio_g?: number | null
          preco_medio?: number | null
          produtos?: number | null
          receita?: number | null
          taxa_servico?: number | null
          ticket_medio?: number | null
          transportadora?: string | null
          unid_por_pedido?: number | null
          unidades?: number | null
        }
        Update: {
          afiliados?: number | null
          cancelados?: number | null
          cancelamento_pct?: number | null
          cobertura_financeiro_pct?: number | null
          comissao?: number | null
          data?: string | null
          faturamento_cancelado?: number | null
          frete_medio?: number | null
          frete_real?: number | null
          pedidos?: number | null
          peso_medio_g?: number | null
          preco_medio?: number | null
          produtos?: number | null
          receita?: number | null
          taxa_servico?: number | null
          ticket_medio?: number | null
          transportadora?: string | null
          unid_por_pedido?: number | null
          unidades?: number | null
        }
        Relationships: []
      }
      vw_shopee_frete_pedido: {
        Row: {
          comissao: number | null
          comissao_afiliado: number | null
          data: string | null
          faturamento: number | null
          frete_real: number | null
          hora: string | null
          linhas: number | null
          liquido: number | null
          pagamento: string | null
          pedido_id: string | null
          produto_principal: string | null
          situacao: string | null
          skus: string | null
          status: string | null
          transportadora: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_shopee_frete_produto_dia: {
        Row: {
          data: string | null
          faturamento: number | null
          faturamento_cancelado: number | null
          item_id: string | null
          pedidos: number | null
          pedidos_cancelados: number | null
          preco_medio: number | null
          seller_sku: string | null
          titulo: string | null
          transportadora: string | null
          unidades: number | null
        }
        Insert: {
          data?: string | null
          faturamento?: number | null
          faturamento_cancelado?: number | null
          item_id?: string | null
          pedidos?: number | null
          pedidos_cancelados?: number | null
          preco_medio?: number | null
          seller_sku?: string | null
          titulo?: string | null
          transportadora?: string | null
          unidades?: number | null
        }
        Update: {
          data?: string | null
          faturamento?: number | null
          faturamento_cancelado?: number | null
          item_id?: string | null
          pedidos?: number | null
          pedidos_cancelados?: number | null
          preco_medio?: number | null
          seller_sku?: string | null
          titulo?: string | null
          transportadora?: string | null
          unidades?: number | null
        }
        Relationships: []
      }
      vw_shopee_item_dia: {
        Row: {
          conversao_pct: number | null
          data: string | null
          item_id: string | null
          pedidos: number | null
          price: number | null
          receita: number | null
          seller_sku: string | null
          title: string | null
          unidades_vendidas: number | null
          visitas: number | null
        }
        Relationships: []
      }
      vw_shopee_item_visitas_dia: {
        Row: {
          data: string | null
          item_id: string | null
          likes: number | null
          rating: number | null
          visitas: number | null
        }
        Relationships: []
      }
      vw_shopee_visao_geral_dia: {
        Row: {
          acos_ads: number | null
          acos_total: number | null
          cliques_ads: number | null
          conversao_pct: number | null
          data: string | null
          impressoes_ads: number | null
          invest_ads: number | null
          pedidos_total: number | null
          receita_ads: number | null
          roas_ads: number | null
          roas_total: number | null
          share_ads_pct: number | null
          ticket_medio: number | null
          unidades_vendidas: number | null
          venda_total: number | null
          venda_total_paga: number | null
          visitas: number | null
        }
        Relationships: []
      }
      vw_shopify_estoque_kpi: {
        Row: {
          alerta: string | null
          skus: number | null
          total_repor: number | null
          vendas_7d: number | null
        }
        Relationships: []
      }
      vw_shopify_reposicao: {
        Row: {
          alerta: string | null
          atualizado_em: string | null
          cobertura_dias: number | null
          estoque: number | null
          media_diaria: number | null
          placeholder: boolean | null
          repor_30d: number | null
          sku: string | null
          status: string | null
          title: string | null
          vendas_21d: number | null
          vendas_7d: number | null
          vendor: string | null
        }
        Insert: {
          alerta?: string | null
          atualizado_em?: string | null
          cobertura_dias?: number | null
          estoque?: number | null
          media_diaria?: number | null
          placeholder?: boolean | null
          repor_30d?: number | null
          sku?: string | null
          status?: string | null
          title?: string | null
          vendas_21d?: number | null
          vendas_7d?: number | null
          vendor?: string | null
        }
        Update: {
          alerta?: string | null
          atualizado_em?: string | null
          cobertura_dias?: number | null
          estoque?: number | null
          media_diaria?: number | null
          placeholder?: boolean | null
          repor_30d?: number | null
          sku?: string | null
          status?: string | null
          title?: string | null
          vendas_21d?: number | null
          vendas_7d?: number | null
          vendor?: string | null
        }
        Relationships: []
      }
      vw_site_ads_por_tipo_dia: {
        Row: {
          acos: number | null
          base_receita: string | null
          canal: string | null
          cliques: number | null
          data: string | null
          impressoes: number | null
          investimento: number | null
          pedidos_shopify: number | null
          receita: number | null
          receita_plataforma: number | null
          roas: number | null
          tipo: string | null
          tipo_raw: string | null
        }
        Insert: {
          acos?: number | null
          base_receita?: string | null
          canal?: string | null
          cliques?: number | null
          data?: string | null
          impressoes?: number | null
          investimento?: number | null
          pedidos_shopify?: number | null
          receita?: number | null
          receita_plataforma?: number | null
          roas?: number | null
          tipo?: string | null
          tipo_raw?: string | null
        }
        Update: {
          acos?: number | null
          base_receita?: string | null
          canal?: string | null
          cliques?: number | null
          data?: string | null
          impressoes?: number | null
          investimento?: number | null
          pedidos_shopify?: number | null
          receita?: number | null
          receita_plataforma?: number | null
          roas?: number | null
          tipo?: string | null
          tipo_raw?: string | null
        }
        Relationships: []
      }
      vw_site_ads_tipo: {
        Row: {
          canal: string | null
          ctr_pct: number | null
          invest: number | null
          receita: number | null
          roas: number | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_site_classe_dia: {
        Row: {
          classe: string | null
          data: string | null
          faturamento_bruto: number | null
          faturamento_liquido: number | null
          pedidos: number | null
          total_pago: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_site_cupom_dia: {
        Row: {
          base_desconto: number | null
          cupom: string | null
          data: string | null
          desconto: number | null
          desconto_pct: number | null
          desconto_permuta: number | null
          devolucoes: number | null
          faturamento_bruto: number | null
          faturamento_liquido: number | null
          frete: number | null
          pedidos: number | null
          pedidos_cliente_novo: number | null
          pedidos_permuta: number | null
          total_pago: number | null
          unidades: number | null
          unidades_devolvidas: number | null
          unidades_permuta: number | null
        }
        Relationships: []
      }
      vw_site_cupom_prod: {
        Row: {
          cupom: string | null
          faturamento: number | null
          pedidos: number | null
          produto: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_site_cupom_produto_dia: {
        Row: {
          cupom: string | null
          data: string | null
          faturamento_bruto: number | null
          faturamento_liquido: number | null
          pedidos: number | null
          product_id: string | null
          produto: string | null
          sku: string | null
          unidades: number | null
          unidades_reembolsadas: number | null
        }
        Relationships: []
      }
      vw_site_cupons: {
        Row: {
          cupom: string | null
          desconto: number | null
          desconto_pct: number | null
          devolucoes: number | null
          faturamento: number | null
          pct_cliente_novo: number | null
          pedidos: number | null
          pedidos_novos: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_site_geral_dia: {
        Row: {
          acos_ads: number | null
          data: string | null
          desconto: number | null
          devolucoes: number | null
          faturamento_bruto: number | null
          faturamento_liquido: number | null
          frete: number | null
          invest_ads: number | null
          pct_cliente_novo: number | null
          pedidos: number | null
          pedidos_cliente_novo: number | null
          receita_ads: number | null
          roas_ads: number | null
          roas_total: number | null
          share_ads_pct: number | null
          tacos: number | null
          ticket_medio: number | null
          total_pago: number | null
          unidades: number | null
          unidades_devolvidas: number | null
          venda_total: number | null
        }
        Insert: {
          acos_ads?: number | null
          data?: string | null
          desconto?: number | null
          devolucoes?: number | null
          faturamento_bruto?: number | null
          faturamento_liquido?: number | null
          frete?: number | null
          invest_ads?: number | null
          pct_cliente_novo?: number | null
          pedidos?: number | null
          pedidos_cliente_novo?: number | null
          receita_ads?: number | null
          roas_ads?: number | null
          roas_total?: number | null
          share_ads_pct?: number | null
          tacos?: number | null
          ticket_medio?: number | null
          total_pago?: number | null
          unidades?: number | null
          unidades_devolvidas?: number | null
          venda_total?: number | null
        }
        Update: {
          acos_ads?: number | null
          data?: string | null
          desconto?: number | null
          devolucoes?: number | null
          faturamento_bruto?: number | null
          faturamento_liquido?: number | null
          frete?: number | null
          invest_ads?: number | null
          pct_cliente_novo?: number | null
          pedidos?: number | null
          pedidos_cliente_novo?: number | null
          receita_ads?: number | null
          roas_ads?: number | null
          roas_total?: number | null
          share_ads_pct?: number | null
          tacos?: number | null
          ticket_medio?: number | null
          total_pago?: number | null
          unidades?: number | null
          unidades_devolvidas?: number | null
          venda_total?: number | null
        }
        Relationships: []
      }
      vw_site_midia_pedido_item: {
        Row: {
          campaign_name: string | null
          cupom: string | null
          data: string | null
          desconto_item: number | null
          fonte: string | null
          order_id: string | null
          produto: string | null
          sku: string | null
          unidades: number | null
          venda_item: number | null
        }
        Relationships: []
      }
      vw_site_origem: {
        Row: {
          faturamento: number | null
          origem: string | null
          pedidos: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_site_origem_dia: {
        Row: {
          data: string | null
          faturamento_liquido: number | null
          origem: string | null
          pedidos: number | null
          total_pago: number | null
          unidades: number | null
        }
        Insert: {
          data?: string | null
          faturamento_liquido?: number | null
          origem?: string | null
          pedidos?: number | null
          total_pago?: number | null
          unidades?: number | null
        }
        Update: {
          data?: string | null
          faturamento_liquido?: number | null
          origem?: string | null
          pedidos?: number | null
          total_pago?: number | null
          unidades?: number | null
        }
        Relationships: []
      }
      vw_site_pagina: {
        Row: {
          pagina_path: string | null
          produto: string | null
          produto_ordem: number | null
          rotulo: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_site_pagina_canais: {
        Row: {
          canal: string | null
          pedidos: number | null
          primeiro_dia: string | null
          receita: number | null
          sessoes: number | null
          ultimo_dia: string | null
        }
        Relationships: []
      }
      vw_site_pagina_canal_dia: {
        Row: {
          canal: string | null
          data: string | null
          pagina_path: string | null
          pedidos: number | null
          produto: string | null
          produto_ordem: number | null
          receita: number | null
          rotulo: string | null
          sessoes: number | null
          sessoes_checkout: number | null
          tipo: string | null
          unidades: number | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      vw_site_pagina_dia: {
        Row: {
          data: string | null
          pagina_path: string | null
          pedidos: number | null
          produto: string | null
          produto_ordem: number | null
          receita: number | null
          rotulo: string | null
          sessoes: number | null
          sessoes_checkout: number | null
          tipo: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_site_pagina_resumo: {
        Row: {
          conversao_pct: number | null
          pagina_path: string | null
          pedidos: number | null
          primeiro_dia: string | null
          produto: string | null
          produto_ordem: number | null
          receita: number | null
          receita_por_sessao: number | null
          rotulo: string | null
          sessoes: number | null
          sessoes_checkout: number | null
          ticket_medio: number | null
          tipo: string | null
          ultimo_dia: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_site_pedido_classe: {
        Row: {
          bruto: number | null
          classe: string | null
          cupom: string | null
          data: string | null
          liquido: number | null
          order_id: string | null
          pago: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_site_pedido_hora: {
        Row: {
          criado_em: string | null
          order_id: string | null
        }
        Relationships: []
      }
      vw_site_pedido_origem_dia: {
        Row: {
          data: string | null
          pedidos: number | null
          receita: number | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      vw_site_pedido_visita: {
        Row: {
          order_id: string | null
          primeira_fonte: string | null
          primeira_pagina: string | null
          ultima_fonte: string | null
          ultima_pagina: string | null
          ultima_referencia: string | null
        }
        Relationships: []
      }
      vw_site_produto_dia: {
        Row: {
          data: string | null
          pedidos: number | null
          produto: string | null
          produto_key: string | null
          receita: number | null
          sku: string | null
          unidades: number | null
        }
        Insert: {
          data?: string | null
          pedidos?: number | null
          produto?: string | null
          produto_key?: string | null
          receita?: number | null
          sku?: string | null
          unidades?: number | null
        }
        Update: {
          data?: string | null
          pedidos?: number | null
          produto?: string | null
          produto_key?: string | null
          receita?: number | null
          sku?: string | null
          unidades?: number | null
        }
        Relationships: []
      }
      vw_site_produto_estreia: {
        Row: {
          estreia_paginas: string | null
          paginas: number | null
          produto: string | null
          produto_ordem: number | null
          ultimo_dia_paginas: string | null
        }
        Relationships: []
      }
      vw_site_produto_resumo: {
        Row: {
          ate: string | null
          conv_lp: number | null
          conv_pdp: number | null
          de: string | null
          dif_conv_pp: number | null
          estreia_paginas: string | null
          pedidos: number | null
          pedidos_lp: number | null
          pedidos_pdp: number | null
          produto: string | null
          produto_ordem: number | null
          qtd_paginas: number | null
          receita: number | null
          receita_lp: number | null
          receita_pdp: number | null
          sessoes: number | null
          sessoes_lp: number | null
          sessoes_pdp: number | null
          veredito: string | null
        }
        Relationships: []
      }
      vw_site_produtos: {
        Row: {
          faturamento: number | null
          pedidos: number | null
          produto: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_site_resumo: {
        Row: {
          devolucoes: number | null
          faturamento: number | null
          invest_ads: number | null
          pct_cliente_novo: number | null
          pedidos: number | null
          receita_ads: number | null
          roas_total: number | null
          tacos_pct: number | null
          ticket: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_site_tendencia_semana: {
        Row: {
          ads_maturando: boolean | null
          faturamento: number | null
          invest_ads: number | null
          parcial: boolean | null
          pedidos: number | null
          roas_google: number | null
          roas_meta: number | null
          roas_total: number | null
          semana: string | null
          semana_ini: string | null
          tacos_pct: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_site_venda_midia_dia: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          data: string | null
          fonte: string | null
          pedidos: number | null
          receita: number | null
          tipo_raw: string | null
        }
        Relationships: []
      }
      vw_site_venda_midia_pedido: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          data: string | null
          fonte: string | null
          order_id: string | null
          receita: number | null
          tipo_raw: string | null
          utm_campaign: string | null
          utm_content: string | null
        }
        Relationships: []
      }
      vw_tiktok_ads_campanha_dia: {
        Row: {
          campaign_id: string | null
          campanha: string | null
          custo_por_pedido: number | null
          data: string | null
          invest: number | null
          pedidos: number | null
          produtos: number | null
          receita: number | null
          roas: number | null
          sugestao: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_tiktok_ads_criativo_dia: {
        Row: {
          agregado: boolean | null
          campaign_id: string | null
          campanha: string | null
          custo_por_pedido: number | null
          data: string | null
          invest: number | null
          item_id: string | null
          pedidos: number | null
          product_id: string | null
          produto: string | null
          receita: number | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_tiktok_ads_gmv_campanha_dia: {
        Row: {
          campaign_id: string | null
          campanha: string | null
          custo_por_pedido: number | null
          data: string | null
          invest: number | null
          invest_liquido: number | null
          pedidos: number | null
          receita: number | null
          roas: number | null
          roi: number | null
          sugestao: string | null
          tipo: string | null
        }
        Insert: {
          campaign_id?: string | null
          campanha?: never
          custo_por_pedido?: never
          data?: string | null
          invest?: number | null
          invest_liquido?: number | null
          pedidos?: number | null
          receita?: number | null
          roas?: never
          roi?: number | null
          sugestao?: never
          tipo?: string | null
        }
        Update: {
          campaign_id?: string | null
          campanha?: never
          custo_por_pedido?: never
          data?: string | null
          invest?: number | null
          invest_liquido?: number | null
          pedidos?: number | null
          receita?: number | null
          roas?: never
          roi?: number | null
          sugestao?: never
          tipo?: string | null
        }
        Relationships: []
      }
      vw_tiktok_ads_por_tipo_dia: {
        Row: {
          campanhas: number | null
          custo_por_pedido: number | null
          data: string | null
          invest: number | null
          pedidos: number | null
          produtos: number | null
          receita: number | null
          roas: number | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_tiktok_ads_produto_dia: {
        Row: {
          campaign_id: string | null
          campanha: string | null
          custo_por_pedido: number | null
          data: string | null
          invest: number | null
          pedidos: number | null
          product_id: string | null
          produto: string | null
          receita: number | null
          roas: number | null
          seller_sku: string | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_tiktok_afiliado_dia: {
        Row: {
          comissao_efetiva_pct: number | null
          custo_afiliado: number | null
          custo_afiliado_ads: number | null
          custo_parceiro: number | null
          custo_pct_gmv_total: number | null
          custo_total: number | null
          data: string | null
          gmv_afiliado: number | null
          gmv_total: number | null
          margem_afiliado_pct: number | null
          margem_sem_afiliado_pct: number | null
          pct_pedidos_afiliado: number | null
          pedidos_afiliado: number | null
          pedidos_total: number | null
          ticket_afiliado: number | null
          ticket_sem_afiliado: number | null
        }
        Relationships: []
      }
      vw_tiktok_afiliado_produto_dia: {
        Row: {
          comissao_efetiva_pct: number | null
          custo_afiliado: number | null
          data: string | null
          gmv_afiliado: number | null
          gmv_total: number | null
          pct_pedidos_via_afiliado: number | null
          pedidos_afiliado: number | null
          pedidos_total: number | null
          produto: string | null
          seller_sku: string | null
        }
        Relationships: []
      }
      vw_tiktok_cadastro: {
        Row: {
          atributos: number | null
          categoria: string | null
          descricao_len: number | null
          estoque_total: number | null
          faltas: string | null
          fotos: number | null
          gmv_28d: number | null
          health: number | null
          marca: string | null
          preco_max: number | null
          preco_min: number | null
          product_id: string | null
          seller_skus: string | null
          skus: number | null
          skus_sem_estoque: number | null
          status: string | null
          sugestao: string | null
          titulo: string | null
          unidades_28d: number | null
        }
        Relationships: []
      }
      vw_tiktok_conteudo_dia: {
        Row: {
          cancelamentos: number | null
          compradores: number | null
          conversao_pct: number | null
          conversao_pct_api: number | null
          data: string | null
          devolucoes: number | null
          gmv: number | null
          gmv_card: number | null
          gmv_live: number | null
          gmv_video: number | null
          impressoes: number | null
          pageviews: number | null
          pedidos: number | null
          share_card_pct: number | null
          share_live_pct: number | null
          share_video_pct: number | null
          sugestao: string | null
          ticket_medio: number | null
          unidades: number | null
          visitantes: number | null
        }
        Insert: {
          cancelamentos?: number | null
          compradores?: number | null
          conversao_pct?: never
          conversao_pct_api?: number | null
          data?: string | null
          devolucoes?: number | null
          gmv?: number | null
          gmv_card?: number | null
          gmv_live?: number | null
          gmv_video?: number | null
          impressoes?: number | null
          pageviews?: number | null
          pedidos?: number | null
          share_card_pct?: never
          share_live_pct?: never
          share_video_pct?: never
          sugestao?: never
          ticket_medio?: number | null
          unidades?: number | null
          visitantes?: number | null
        }
        Update: {
          cancelamentos?: number | null
          compradores?: number | null
          conversao_pct?: never
          conversao_pct_api?: number | null
          data?: string | null
          devolucoes?: number | null
          gmv?: number | null
          gmv_card?: number | null
          gmv_live?: number | null
          gmv_video?: number | null
          impressoes?: number | null
          pageviews?: number | null
          pedidos?: number | null
          share_card_pct?: never
          share_live_pct?: never
          share_video_pct?: never
          sugestao?: never
          ticket_medio?: number | null
          unidades?: number | null
          visitantes?: number | null
        }
        Relationships: []
      }
      vw_tiktok_criador: {
        Row: {
          criador: string | null
          ctr: number | null
          dias_ativos: number | null
          gmv: number | null
          gpm: number | null
          pedidos: number | null
          sugestao: string | null
          ultimo_dia: string | null
          unidades: number | null
          videos: number | null
          views: number | null
        }
        Relationships: []
      }
      vw_tiktok_devolucao_dia: {
        Row: {
          concluidas: number | null
          data: string | null
          devolucoes: number | null
          motivo_principal: string | null
          pedidos: number | null
          valor_reembolso: number | null
        }
        Relationships: []
      }
      vw_tiktok_estoque: {
        Row: {
          alerta: string | null
          cobertura_dias: number | null
          media_dia: number | null
          preco: number | null
          product_id: string | null
          quantidade: number | null
          seller_sku: string | null
          titulo: string | null
          vendas_28d: number | null
        }
        Relationships: []
      }
      vw_tiktok_frete_dia: {
        Row: {
          afiliados: number | null
          cancelados: number | null
          cancelamento_pct: number | null
          cobertura_financeiro_pct: number | null
          comissao: number | null
          data: string | null
          faturamento_cancelado: number | null
          frete_cobrado: number | null
          frete_custo: number | null
          frete_subsidiado: number | null
          fulfillment: string | null
          pedidos: number | null
          preco_medio: number | null
          produtos: number | null
          receita: number | null
          ticket_medio: number | null
          tipo_entrega: string | null
          transportadora: string | null
          unid_por_pedido: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_tiktok_geral_dia: {
        Row: {
          clientes_unicos: number | null
          data: string | null
          desconto_plataforma: number | null
          desconto_vendedor: number | null
          desconto_vendedor_pct: number | null
          faturamento: number | null
          frete_cobrado: number | null
          pedidos: number | null
          pedidos_cancelados: number | null
          preco_original: number | null
          sub_total: number | null
          sugestao: string | null
          taxa_cancelamento_pct: number | null
          ticket_medio: number | null
          unidades: number | null
          unidades_por_pedido: number | null
        }
        Relationships: []
      }
      vw_tiktok_margem_dia: {
        Row: {
          comissao_afiliados: number | null
          comissao_plataforma: number | null
          data: string | null
          imposto: number | null
          margem_pct: number | null
          pedidos: number | null
          receita_bruta: number | null
          receita_statement_api: number | null
          reembolso: number | null
          settlement: number | null
          sugestao: string | null
          taxa_pct: number | null
          taxas: number | null
        }
        Relationships: []
      }
      vw_tiktok_produto_dia: {
        Row: {
          data: string | null
          desconto_plataforma: number | null
          desconto_vendedor: number | null
          desconto_vendedor_pct: number | null
          existe_amazon: boolean | null
          existe_ml: boolean | null
          existe_shopify: boolean | null
          pedidos: number | null
          preco_medio: number | null
          product_id: string | null
          produto: string | null
          receita: number | null
          seller_sku: string | null
          sku_name: string | null
          sugestao: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_tiktok_produto_mudancas: {
        Row: {
          campo: string | null
          mudou_em: string | null
          product_id: string | null
          titulo: string | null
          valor_antigo: string | null
          valor_novo: string | null
        }
        Relationships: []
      }
      vw_tiktok_video_dia: {
        Row: {
          criador: string | null
          ctr: number | null
          data: string | null
          gmv: number | null
          gpm: number | null
          pedidos: number | null
          produto: string | null
          publicado_em: string | null
          sugestao: string | null
          titulo: string | null
          unidades: number | null
          video_id: string | null
          views: number | null
        }
        Insert: {
          criador?: string | null
          ctr?: never
          data?: string | null
          gmv?: number | null
          gpm?: number | null
          pedidos?: number | null
          produto?: string | null
          publicado_em?: string | null
          sugestao?: never
          titulo?: string | null
          unidades?: number | null
          video_id?: string | null
          views?: number | null
        }
        Update: {
          criador?: string | null
          ctr?: never
          data?: string | null
          gmv?: number | null
          gpm?: number | null
          pedidos?: number | null
          produto?: string | null
          publicado_em?: string | null
          sugestao?: never
          titulo?: string | null
          unidades?: number | null
          video_id?: string | null
          views?: number | null
        }
        Relationships: []
      }
      vw_ttk_ads_campanha: {
        Row: {
          campaign_id: string | null
          campanha: string | null
          custo_por_pedido: number | null
          invest: number | null
          pedidos: number | null
          receita: number | null
          roas: number | null
          sugestao: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_ttk_ads_resumo: {
        Row: {
          custo_por_pedido: number | null
          invest: number | null
          pedidos: number | null
          receita: number | null
          roas: number | null
          share_invest_pct: number | null
          sugestao: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_ttk_cadastro_resumo: {
        Row: {
          atributos_media: number | null
          descricao_curta: number | null
          faixa: string | null
          fotos_media: number | null
          produtos: number | null
          sem_5_atributos: number | null
          sem_5_fotos: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_ttk_cancelamentos: {
        Row: {
          iniciador: string | null
          motivo: string | null
          pedidos: number | null
          share_pct: number | null
          sugestao: string | null
          valor_perdido: number | null
        }
        Relationships: []
      }
      vw_ttk_conteudo_resumo: {
        Row: {
          compradores: number | null
          conversao_pct: number | null
          gmv: number | null
          impressoes: number | null
          origem: string | null
          share_pct: number | null
          sugestao: string | null
          visitantes: number | null
        }
        Relationships: []
      }
      vw_ttk_criadores_top: {
        Row: {
          criador: string | null
          ctr: number | null
          gmv: number | null
          gpm: number | null
          sugestao: string | null
          ultimo_dia: string | null
          unidades: number | null
          videos: number | null
          views: number | null
        }
        Relationships: []
      }
      vw_ttk_estoque_resumo: {
        Row: {
          alerta: string | null
          skus: number | null
          sugestao: string | null
          unidades: number | null
          vendas_28d: number | null
        }
        Relationships: []
      }
      vw_ttk_kpis: {
        Row: {
          meta: string | null
          metrica: string | null
          ord: number | null
          sugestao: string | null
          valor: string | null
        }
        Relationships: []
      }
      vw_ttk_margem_resumo: {
        Row: {
          metrica: string | null
          ord: number | null
          sugestao: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_ttk_produtos: {
        Row: {
          ctr: number | null
          estoque_total: number | null
          gmv: number | null
          health: number | null
          pedidos: number | null
          preco_medio: number | null
          produto: string | null
          produto_id: string | null
          sugestao: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_ttk_tendencia: {
        Row: {
          cancelamento_pct: number | null
          dias: number | null
          faturamento: number | null
          inicio: string | null
          parcial: boolean | null
          pedidos: number | null
          semana: string | null
          sugestao: string | null
          ticket: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_ttk_videos_top: {
        Row: {
          criador: string | null
          ctr: number | null
          gmv: number | null
          gpm: number | null
          produto: string | null
          publicado: string | null
          sugestao: string | null
          titulo: string | null
          unidades: number | null
          video_id: string | null
          views: number | null
        }
        Relationships: []
      }
      vw_unidades_canal_dia: {
        Row: {
          canal: string | null
          data: string | null
          receita_item: number | null
          sku: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_up_afiliado: {
        Row: {
          comissao_pct: number | null
          cupom: string | null
          cupons: number | null
          nome: string | null
          programa: string | null
          programa_id: number | null
          receita_total: number | null
          status: string | null
          tipo: string | null
          uppromote_id: number | null
        }
        Relationships: []
      }
      vw_up_afiliado_mes: {
        Row: {
          desconto: number | null
          mes: string | null
          pedidos: number | null
          pedidos_cliente_novo: number | null
          receita: number | null
          unidades: number | null
          uppromote_id: number | null
        }
        Relationships: []
      }
      vw_vg_detalhe: {
        Row: {
          extra: string | null
          formato: string | null
          invest: number | null
          item: string | null
          meta_roas: number | null
          ord: number | null
          roas: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_vg_formatos: {
        Row: {
          formato: string | null
          invest: number | null
          meta: number | null
          ord: number | null
          roas: number | null
          share_pct: number | null
          sugestao: string | null
        }
        Relationships: []
      }
      vw_vg_kpis: {
        Row: {
          meta: string | null
          metrica: string | null
          ord: number | null
          sugestao: string | null
          valor: string | null
        }
        Relationships: []
      }
      vw_vg_oportunidades: {
        Row: {
          acao: string | null
          alavanca: string | null
          ord: number | null
          valor_em_jogo: string | null
        }
        Relationships: []
      }
      vw_vg_produtos: {
        Row: {
          buybox: string | null
          conversao_pct: number | null
          faturamento: number | null
          pct_total: number | null
          pedidos: number | null
          produto: string | null
          sugestao: string | null
          ticket: number | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_vg_tendencia: {
        Row: {
          faturamento: number | null
          pedidos: number | null
          semana: string | null
          sugestao: string | null
          unidades: number | null
        }
        Relationships: []
      }
      vw_visao_geral_dia: {
        Row: {
          acos_ads: number | null
          acos_total: number | null
          cliques_ads: number | null
          conversao_pct: number | null
          data: string | null
          impressoes_ads: number | null
          invest_ads: number | null
          pedidos_total: number | null
          receita_ads: number | null
          roas_ads: number | null
          roas_total: number | null
          share_ads_pct: number | null
          ticket_medio: number | null
          unidades_vendidas: number | null
          venda_total: number | null
          venda_total_paga: number | null
          visitas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _audit_view_ms: {
        Args: { vlist: string[] }
        Returns: {
          ms: number
          vw: string
        }[]
      }
      _audit_view_ms_f: {
        Args: { vlist: string[] }
        Returns: {
          ms: number
          vw: string
        }[]
      }
      _ml_cria_criativos: { Args: { p_lote: number }; Returns: number }
      _ml_registra: { Args: { p_lote: number; p_req: number }; Returns: number }
      _urlenc: { Args: { t: string }; Returns: string }
      _utm_confere_lote: {
        Args: { p_req: number }
        Returns: {
          falha: number
          ok: number
        }[]
      }
      _utm_dispara_lote: { Args: { p_lote: number }; Returns: number }
      _utm_roda: {
        Args: { p_ciclos?: number }
        Returns: {
          falha: number
          ok: number
          req: number
          restam: number
        }[]
      }
      amazon_ads_claim: { Args: { p_grao: string }; Returns: string }
      amazon_ads_claim_backfill: { Args: { p_grao: string }; Returns: string }
      amazon_ads_recupera_425: { Args: never; Returns: number }
      amazon_atualiza_reposicao: { Args: never; Returns: undefined }
      amazon_backfill_sync_concluidos: { Args: never; Returns: undefined }
      amazon_cliente_claim: { Args: { p_lim?: number }; Returns: Json }
      amazon_cliente_fila_carrega: { Args: never; Returns: number }
      amazon_cliente_fila_conclui: {
        Args: { p_erro: string[]; p_ok: string[] }
        Returns: undefined
      }
      amazon_grava_cep_lote: { Args: { p_dados: Json }; Returns: number }
      amazon_pagamento_norm: { Args: { p: string[] }; Returns: string }
      amazon_sp_claim_asin: { Args: never; Returns: string }
      amazon_st_claim: { Args: never; Returns: string }
      atualiza_avg_kpis: { Args: never; Returns: undefined }
      atualiza_base_cliente: { Args: { p_dias?: number }; Returns: Json }
      atualiza_cliente_canais: { Args: never; Returns: number }
      atualiza_google_produto_dia: {
        Args: { p_dias?: number }
        Returns: undefined
      }
      atualiza_google_termo_dia: {
        Args: { p_dias?: number }
        Returns: undefined
      }
      atualiza_growth_intel: { Args: never; Returns: string }
      atualiza_growth_mv: { Args: never; Returns: string }
      atualiza_grupo1: { Args: never; Returns: undefined }
      atualiza_grupo2: { Args: never; Returns: undefined }
      atualiza_grupo3: { Args: never; Returns: undefined }
      atualiza_identidade_cliente: {
        Args: { p_completo?: boolean }
        Returns: Json
      }
      atualiza_intraday_erro: { Args: { p_dias?: number }; Returns: number }
      atualiza_item_conversao_dia: {
        Args: { p_dias?: number }
        Returns: undefined
      }
      atualiza_materializados: { Args: never; Returns: undefined }
      atualiza_ml_anuncio_dia:
        | { Args: never; Returns: undefined }
        | { Args: { p_dias?: number }; Returns: undefined }
      atualiza_ml_kpi_dia: { Args: { p_dias?: number }; Returns: number }
      atualiza_receita_diaria: { Args: { p_dias?: number }; Returns: number }
      atualiza_shopee_frete_dia: { Args: { p_dias?: number }; Returns: number }
      atualiza_shopee_frete_produto_dia: {
        Args: { p_dias?: number }
        Returns: number
      }
      atualiza_shopee_pedido_venda: {
        Args: { p_dias?: number }
        Returns: number
      }
      atualiza_shopee_venda_dia: { Args: { p_dias?: number }; Returns: number }
      atualiza_shopee_venda_produto_dia: {
        Args: { p_dias?: number }
        Returns: number
      }
      atualiza_site_ads_por_tipo_dia: {
        Args: { p_dias?: number }
        Returns: undefined
      }
      atualiza_site_geral_dia: { Args: { p_dias?: number }; Returns: undefined }
      atualiza_site_origem_dia: {
        Args: { p_dias?: number }
        Returns: undefined
      }
      atualiza_site_produto_dia: {
        Args: { p_dias?: number }
        Returns: undefined
      }
      atualiza_tiktok_venda_dia: { Args: { p_dias?: number }; Returns: number }
      atualiza_tiktok_venda_produto_dia: {
        Args: { p_dias?: number }
        Returns: number
      }
      atualiza_venda_hora: { Args: { p_dias?: number }; Returns: number }
      atualiza_vg_kpis: { Args: never; Returns: undefined }
      awin_dispara_sync: { Args: never; Returns: undefined }
      backfill_ml_kpi_dia: {
        Args: { p_ate: string; p_de: string }
        Returns: number
      }
      congela_venda_dia: { Args: { p_data: string }; Returns: string }
      congela_venda_dia_rt: { Args: { p_data: string }; Returns: string }
      congela_venda_recentes: { Args: { p_dias?: number }; Returns: string }
      cpf_hash: { Args: { p: string }; Returns: string }
      cpf_norm: { Args: { p: string }; Returns: string }
      cria_destrava: { Args: { p_nome: string }; Returns: undefined }
      cria_dispara_worker: { Args: never; Returns: undefined }
      cria_trava: {
        Args: { p_nome: string; p_segundos?: number }
        Returns: boolean
      }
      dias_faltando_breakdown: {
        Args: { p_ate: string; p_de: string; p_tabela: string }
        Returns: {
          dia: string
        }[]
      }
      email_hash: { Args: { p: string }; Returns: string }
      email_norm: { Args: { p: string }; Returns: string }
      growth_novos_recorrentes: {
        Args: { p_ate: string; p_de: string }
        Returns: {
          clientes_novos: number
          clientes_recorrentes: number
          data: string
          pedidos_novos: number
          pedidos_recorrentes: number
          pedidos_sem_cliente: number
          receita_novos: number
          receita_recorrentes: number
        }[]
      }
      growth_prob_recompra: {
        Args: {
          p_canais: number
          p_dias: number
          p_h: number
          p_pedidos: number
          p_ritmo: number
        }
        Returns: number
      }
      guarda_api: { Args: never; Returns: undefined }
      h_botao: { Args: { t: string; url: string }; Returns: string }
      h_card: {
        Args: {
          handle: string
          img: string
          modo?: string
          preco: string
          titulo: string
          variant: string
        }
        Returns: string
      }
      h_cdn: { Args: { f: string }; Returns: string }
      h_cupom: {
        Args: { chamada: string; regra: string; tag: string }
        Returns: string
      }
      h_destaque: { Args: { s: string; t: string }; Returns: string }
      h_fine: { Args: { t: string }; Returns: string }
      h_lista: { Args: { itens: Json }; Returns: string }
      h_pf: { Args: { cards: string; chamada: string }; Returns: string }
      h_rodape: { Args: { motivo: string }; Returns: string }
      h_selos: { Args: { itens: Json }; Returns: string }
      h_texto: { Args: { p: string }; Returns: string }
      h_titulo: { Args: { t: string }; Returns: string }
      h_topo: { Args: { pre: string }; Returns: string }
      intraday_comparativo: {
        Args: { p_data?: string; p_hora?: number; p_ref?: string }
        Returns: {
          base: string
          canal: string
          data_ref: string
          evento_ref: string
          ordem: number
          ordem_base: number
          ref_ate_mesmo_horario: number
          ref_fechamento: number
          variacao: number
          vendido_hoje: number
        }[]
      }
      intraday_fatias: {
        Args: { p_dia: string }
        Returns: {
          canal: string
          curva_curta: boolean
          fatia: number
          hora: number
          n_dias: number
        }[]
      }
      intraday_painel: {
        Args: { p_data?: string; p_hora?: number }
        Returns: {
          atualizado_em: string
          canal: string
          corte: string
          corte_hhmm: string
          curva_curta: boolean
          data: string
          erro_projecao: number
          evento_nivel: string
          evento_titulo: string
          faixa_max: number
          faixa_min: number
          farol: string
          fatia_esperada: number
          fechamento: number
          meta_ate_agora: number
          meta_dia: number
          modo: string
          mostrar_projecao: boolean
          n_dias_curva: number
          ordem: number
          pedidos: number
          projecao: number
          projecao_vs_meta: number
          vendido: number
          x_corte: number
        }[]
      }
      intraday_serie: {
        Args: { p_data?: string; p_hora?: number; p_ref?: string }
        Returns: {
          canal: string
          d14_acum: number
          d14_hora: number
          d28_acum: number
          d28_hora: number
          d7_acum: number
          d7_hora: number
          faixa_max_acum: number
          faixa_min_acum: number
          meta_acum: number
          meta_hora: number
          ontem_acum: number
          ontem_hora: number
          projecao_acum: number
          projecao_hora: number
          ref_acum: number
          ref_hora: number
          tipo: string
          vendido_acum: number
          vendido_hora: number
          x: number
        }[]
      }
      kb: {
        Args: {
          p_method?: string
          p_path: string
          p_payload?: Json
          p_recorte?: number
          p_revision?: string
        }
        Returns: number
      }
      kb_ctx: { Args: never; Returns: Json }
      kb_resp: { Args: { p_id: number }; Returns: Json }
      kbw: {
        Args: {
          p_corte?: number
          p_espera?: number
          p_method?: string
          p_path: string
          p_payload?: Json
        }
        Returns: string
      }
      kfiltro: {
        Args: { p_campo: string; p_metric: string; p_termos: string[] }
        Returns: Json
      }
      kfiltro_itens: {
        Args: { p_excluir: string[]; p_incluir: string[] }
        Returns: Json
      }
      kfiltro_itens2: {
        Args: { p_excluir: string[]; p_incluir: string[] }
        Returns: Json
      }
      kfluxo: {
        Args: {
          p_assunto: string
          p_dias: number
          p_filtro: Json
          p_metric: string
          p_nome: string
          p_nome_email: string
          p_previa: string
          p_template: string
        }
        Returns: number
      }
      kfluxo_n: {
        Args: {
          p_filtro: Json
          p_metric: string
          p_msgs: Json
          p_nome: string
          p_profile_filter: Json
          p_tipo_gatilho: string
        }
        Returns: number
      }
      kfluxo_n2: {
        Args: {
          p_filtro: Json
          p_id_gatilho: string
          p_msgs: Json
          p_nome: string
          p_profile_filter: Json
          p_tipo_gatilho: string
        }
        Returns: number
      }
      kfluxo_n3: {
        Args: {
          p_filtro: Json
          p_id_gatilho: string
          p_msgs: Json
          p_nome: string
          p_profile_filter: Json
          p_reentrada: Json
          p_tipo_gatilho: string
        }
        Returns: number
      }
      kfluxo_n4: {
        Args: {
          p_filtro: Json
          p_id_gatilho: string
          p_msgs: Json
          p_nome: string
          p_profile_filter: Json
          p_reentrada: Json
          p_tipo_gatilho: string
        }
        Returns: number
      }
      kpf_nao_comprou: { Args: { p_metric?: string }; Returns: Json }
      kpf_nao_comprou2: { Args: { p_metrics: string[] }; Returns: Json }
      kpf_nao_comprou3: { Args: { p_metrics: string[] }; Returns: Json }
      m_botao: { Args: { p0: string; p1: string }; Returns: string }
      m_cupom: { Args: { p0: string; p1: string; p2: string }; Returns: string }
      m_destaque: { Args: { p0: string; p1: string }; Returns: string }
      m_evento_carrinho: { Args: never; Returns: string }
      m_evento_visto: { Args: never; Returns: string }
      m_fine: { Args: { p0: string }; Returns: string }
      m_miolo: { Args: { p: string }; Returns: string }
      m_pf_carrinho: {
        Args: { p0: string; p1: string; p2: string; p3: string; p4: string }
        Returns: string
      }
      m_pf_pagina: {
        Args: { p0: string; p1: string; p2: string; p3: string; p4: string }
        Returns: string
      }
      m_prod_preco: { Args: never; Returns: string }
      m_prod_sem: { Args: never; Returns: string }
      m_rastreio: { Args: never; Returns: string }
      m_rodape: { Args: { p0: string }; Returns: string }
      m_selos3: {
        Args: {
          p0: string
          p1: string
          p2: string
          p3: string
          p4: string
          p5: string
        }
        Returns: string
      }
      m_texto: { Args: { p0: string }; Returns: string }
      m_titulo: { Args: { p0: string }; Returns: string }
      m_topo: { Args: { p0: string }; Returns: string }
      meu_papel: { Args: never; Returns: string }
      migra_rt_para_historico: { Args: { p_dias?: number }; Returns: string }
      ml_afiliado_repara_data_venda: {
        Args: { p_ate?: string; p_de?: string }
        Returns: number
      }
      ml_afiliado_semeia_fila: {
        Args: { p_ate: string; p_de: string }
        Returns: number
      }
      ml_atualiza_produto_vendas: { Args: never; Returns: undefined }
      ml_atualiza_vendas_estoque_full: { Args: never; Returns: undefined }
      ml_auditoria_claim: { Args: { p_lim?: number }; Returns: Json }
      ml_call_fn: { Args: { fn: string; qs?: string }; Returns: number }
      ml_claim_frete: {
        Args: { dias?: number; n: number }
        Returns: {
          pedido_id: number
          shipping_id: number
        }[]
      }
      ml_claim_nao_full: { Args: { n: number }; Returns: number[] }
      ml_claim_nao_full_rt: { Args: { n: number }; Returns: number[] }
      ml_claim_queue: {
        Args: { batch_size?: number }
        Returns: {
          advertiser_id: string
          attempts: number
          campaign_id: number
          date_from: string
          date_to: string
          enqueued_at: string
          error_message: string | null
          finished_at: string | null
          id: number
          job_type: string
          priority: number
          started_at: string | null
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ml_sync_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      ml_cliente_claim: { Args: { p_lim?: number }; Returns: Json }
      ml_cliente_fila_carrega: { Args: never; Returns: number }
      ml_cliente_fila_conclui: {
        Args: { p_erro: number[]; p_ok: number[] }
        Returns: undefined
      }
      ml_cliente_pendente: {
        Args: { p_lim?: number }
        Returns: {
          data_venda: string
          pack_id: string
          pedido_id: string
          shipping_cost: number
          status: string
          status_detail: string
          total_amount: number
        }[]
      }
      ml_cliente_pendente_json: { Args: { p_lim?: number }; Returns: Json }
      ml_drain_queue: { Args: never; Returns: undefined }
      ml_historico_claim: { Args: never; Returns: string }
      ml_historico_itens_claim: { Args: never; Returns: string }
      ml_pedidos_hora: {
        Args: { p_dia: string; p_h0: number; p_h1: number }
        Returns: number
      }
      ml_pedidos_janela_api: {
        Args: { p_ate: string; p_de: string }
        Returns: Json
      }
      ml_pedidos_por_dia: {
        Args: { p_ate: string; p_de: string }
        Returns: Json
      }
      ml_refaz_claim: { Args: never; Returns: Json }
      p_core: { Args: never; Returns: string }
      p_cre1k: { Args: never; Returns: string }
      p_evo: { Args: never; Returns: string }
      p_multi: { Args: never; Returns: string }
      p_omega: { Args: never; Returns: string }
      p_primal: { Args: never; Returns: string }
      painel_destrava: { Args: never; Returns: undefined }
      painel_query: {
        Args: { p_sql: string; p_views: string[] }
        Returns: Json
      }
      painel_resgata_presas: { Args: never; Returns: number }
      painel_trava: { Args: never; Returns: boolean }
      pode_apagar: { Args: never; Returns: boolean }
      pode_editar: { Args: never; Returns: boolean }
      pos_processa_cliente: { Args: never; Returns: undefined }
      preenche_hashes_cliente: { Args: never; Returns: undefined }
      prune_google_intraday: { Args: never; Returns: undefined }
      prune_meta_intraday: { Args: never; Returns: undefined }
      prune_ml_visao_geral_intraday: { Args: never; Returns: undefined }
      rd_dispara_sync: { Args: never; Returns: undefined }
      refresh_mv_produto_dia: { Args: never; Returns: string }
      set_meta_ad_effective_status: { Args: { p: Json }; Returns: number }
      shopee_backfill_avanca: {
        Args: { p_dia: string; p_itens: number; p_pedidos: number }
        Returns: string
      }
      shopee_backfill_claim: { Args: never; Returns: Json }
      shopee_escrow_claim: { Args: never; Returns: string }
      shopify_atualiza_reposicao: { Args: never; Returns: undefined }
      shopify_completar_disparar: { Args: never; Returns: number }
      shopify_completar_processar: { Args: never; Returns: number }
      shopify_email_completar: { Args: { p_resp_id: number }; Returns: number }
      shopify_fv_disparar: { Args: { p_after: string }; Returns: number }
      shopify_fv_passo: { Args: never; Returns: string }
      shopify_fv_recente_disparar: {
        Args: { p_after?: string; p_desde?: string }
        Returns: number
      }
      shopify_fv_recente_processar: { Args: never; Returns: number }
      shopify_gql_completar: { Args: { p_resp_id: number }; Returns: number }
      shopify_gql_primeira_visita: {
        Args: { p_resp_id: number }
        Returns: number
      }
      site_canal: {
        Args: { p_medium: string; p_source: string }
        Returns: string
      }
      site_paginas_coletar: {
        Args: never
        Returns: {
          com_erro: number
          linhas_gravadas: number
          processados: number
        }[]
      }
      site_paginas_detalhe: {
        Args: {
          p_ate?: string
          p_canal?: string
          p_de?: string
          p_produto: string
        }
        Returns: {
          ant_conversao_pct: number
          ant_pedidos: number
          ant_receita: number
          ant_sessoes: number
          conversao_pct: number
          pagina_path: string
          pedidos: number
          primeiro_dia: string
          produto: string
          receita: number
          receita_por_sessao: number
          rotulo: string
          sessoes: number
          ticket_medio: number
          tipo: string
          ultimo_dia: string
          unidades: number
          var_conversao_pp: number
          var_receita_pct: number
        }[]
      }
      site_paginas_enfileirar: {
        Args: { p_ate?: string; p_de?: string }
        Returns: number
      }
      site_paginas_resumo: {
        Args: { p_ate?: string; p_canal?: string; p_de?: string }
        Returns: {
          ant_ate: string
          ant_conv_lp: number
          ant_conv_pdp: number
          ant_de: string
          ant_receita_lp: number
          ant_receita_pdp: number
          ant_sessoes_lp: number
          ant_sessoes_pdp: number
          ate: string
          conv_lp: number
          conv_pdp: number
          de: string
          dif_conv_pp: number
          estreia_paginas: string
          pedidos_lp: number
          pedidos_pdp: number
          produto: string
          produto_ordem: number
          qtd_paginas: number
          receita_lp: number
          receita_pdp: number
          sessoes_lp: number
          sessoes_pdp: number
          var_conv_lp_pp: number
          var_conv_pdp_pp: number
          var_receita_lp_pct: number
          var_receita_pdp_pct: number
          veredito: string
        }[]
      }
      snapshot_ml_visao_geral: { Args: never; Returns: undefined }
      tiktok_analytics_claim: {
        Args: never
        Returns: {
          dia: string
          tipo: string
        }[]
      }
      tiktok_backfill_claim: { Args: never; Returns: string }
      uf_norm: { Args: { p: string }; Returns: string }
      uppromote_dispara_sync: { Args: never; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
