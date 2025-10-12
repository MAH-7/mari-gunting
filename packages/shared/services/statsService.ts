import { supabase } from '../config/supabase';

export interface UserStats {
  total: number;
  completed: number;
  cancelled: number;
  avgRating: string;
}

export const statsService = {
  /**
   * Get user booking statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Fetch all bookings for the user
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('status, rating')
        .eq('customer_id', userId);
      
      if (error) throw error;

      // If no bookings, return zeros
      if (!bookings || bookings.length === 0) {
        return {
          total: 0,
          completed: 0,
          cancelled: 0,
          avgRating: '0.0',
        };
      }

      // Calculate stats
      const total = bookings.length;
      const completed = bookings.filter(b => b.status === 'completed').length;
      const cancelled = bookings.filter(b => b.status === 'cancelled').length;
      
      // Calculate average rating from completed bookings with ratings
      const ratingsArray = bookings
        .filter(b => b.status === 'completed' && b.rating !== null)
        .map(b => b.rating);
      
      const avgRating = ratingsArray.length > 0
        ? (ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length).toFixed(1)
        : '0.0';

      return {
        total,
        completed,
        cancelled,
        avgRating,
      };
    } catch (error) {
      console.error('[statsService] getUserStats error:', error);
      // Return zeros on error instead of throwing
      return {
        total: 0,
        completed: 0,
        cancelled: 0,
        avgRating: '0.0',
      };
    }
  },

  /**
   * Get detailed booking breakdown by status
   */
  async getBookingBreakdown(userId: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('status')
        .eq('customer_id', userId);
      
      if (error) throw error;

      const breakdown = {
        pending: 0,
        confirmed: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
      };

      if (data) {
        data.forEach((booking: { status: string }) => {
          if (breakdown.hasOwnProperty(booking.status)) {
            breakdown[booking.status as keyof typeof breakdown] += 1;
          }
        });
      }

      return breakdown;
    } catch (error) {
      console.error('[statsService] getBookingBreakdown error:', error);
      throw error;
    }
  },

  /**
   * Get user's recent bookings
   */
  async getRecentBookings(userId: string, limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barbers(id, name, avatar),
          barbershop:barbershops(id, name)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[statsService] getRecentBookings error:', error);
      throw error;
    }
  },
};
