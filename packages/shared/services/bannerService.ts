/**
 * Banner Service
 * 
 * Manages promotional banners displayed on home screen.
 * Banners are loaded from Supabase and can be updated without app updates.
 * 
 * @production-ready
 */

import { supabase } from '../config/supabase';

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  click_action?: 'barbers' | 'barbershops' | 'rewards' | 'external' | null;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

class BannerService {
  /**
   * Fetch active banners ordered by order_index
   * @returns Array of active banners
   */
  async getActiveBanners(): Promise<Banner[]> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('❌ Error fetching banners:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No active banners found');
        return [];
      }

      console.log(`✅ Fetched ${data.length} active banners`);
      return data;
    } catch (error) {
      console.error('❌ Exception fetching banners:', error);
      return [];
    }
  }

  /**
   * Get banner click action route
   * @param banner Banner to get action for
   * @returns Route path or null
   */
  getBannerRoute(banner: Banner): string | null {
    if (!banner.click_action) {
      return banner.link_url || null;
    }

    const routes: Record<string, string> = {
      barbers: '/barbers',
      barbershops: '/barbershops',
      rewards: '/(tabs)/rewards',
    };

    return routes[banner.click_action] || null;
  }

  /**
   * Track banner click (for future analytics)
   * @param bannerId Banner ID
   */
  async trackBannerClick(bannerId: string): Promise<void> {
    try {
      // TODO: Implement analytics tracking
      console.log(`📊 Banner clicked: ${bannerId}`);
      
      // Future: Log to analytics table
      // await supabase.from('banner_analytics').insert({
      //   banner_id: bannerId,
      //   event: 'click',
      //   timestamp: new Date().toISOString()
      // });
    } catch (error) {
      console.error('❌ Error tracking banner click:', error);
    }
  }
}

export const bannerService = new BannerService();
