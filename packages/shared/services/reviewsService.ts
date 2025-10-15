import { supabase } from '../config/supabase';
import type { Review as DBReview } from '../types/database';

// Frontend Review type (transformed for UI)
export interface PartnerReview {
  id: string;
  customerName: string;
  customerAvatar: string;
  customerAvatarUrl: string | null;
  rating: number;
  comment: string | null;
  service: string;
  date: string;
  response: {
    text: string;
    date: string;
  } | null;
}

// Review statistics
export interface ReviewStats {
  total: number;
  avgRating: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  responseRate: number;
}

/**
 * Fetch reviews for a specific barber/partner (handles both barber and barbershop)
 * @param userId - The user_id from auth.users / profiles table
 * @param accountType - 'freelance' or 'barbershop'
 */
export const getPartnerReviews = async (
  userId: string,
  accountType: 'freelance' | 'barbershop' = 'freelance'
): Promise<PartnerReview[]> => {
  try {
    // First, get the barber_id or barbershop_id from user_id
    let partnerId: string | null = null;

    if (accountType === 'freelance') {
      // Get barber_id from barbers table
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (barberError) {
        throw new Error('Barber not found for this user');
      }

      partnerId = barberData?.id;
    } else {
      // Get barbershop_id from barbershops table
      const { data: shopData, error: shopError } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', userId)
        .single();

      if (shopError) {
        throw new Error('Barbershop not found for this user');
      }

      partnerId = shopData?.id;
    }

    if (!partnerId) {
      return [];
    }

    // Now fetch reviews using the partner ID
    // Use LEFT JOIN (not !inner) to avoid RLS blocking the join
    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        response,
        response_at,
        created_at,
        booking_id,
        barber_id,
        barbershop_id,
        bookings (
          id,
          services,
          customer_id,
          profiles (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    // Filter by account type
    if (accountType === 'freelance') {
      query = query.eq('barber_id', partnerId);
    } else {
      query = query.eq('barbershop_id', partnerId);
    }

    const { data: reviews, error } = await query;

    if (error) {
      throw error;
    }

    if (!reviews || reviews.length === 0) {
      return [];
    }

    // Transform database reviews to frontend format
    const transformedReviews: PartnerReview[] = reviews.map((review: any) => {
      const booking = review.bookings;
      const customer = booking?.profiles;
      const services = booking?.services || [];
      const serviceName = services.length > 0 ? services[0].name : 'General Service';

      // Generate customer initials for avatar
      const fullName = customer?.full_name || 'Unknown Customer';
      const initials = fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

      return {
        id: review.id,
        customerName: fullName,
        customerAvatar: initials,
        customerAvatarUrl: customer?.avatar_url || null,
        rating: review.rating,
        comment: review.comment,
        service: serviceName,
        date: review.created_at,
        response: review.response
          ? {
              text: review.response,
              date: review.response_at || review.created_at,
            }
          : null,
      };
    });

    return transformedReviews;
  } catch (error) {
    console.error('❌ Failed to fetch partner reviews:', error);
    throw error;
  }
};

/**
 * Calculate review statistics
 */
export const getReviewStats = (reviews: PartnerReview[]): ReviewStats => {
  const total = reviews.length;

  if (total === 0) {
    return {
      total: 0,
      avgRating: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      responseRate: 0,
    };
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

  const distribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  const withResponse = reviews.filter((r) => r.response !== null).length;
  const responseRate = (withResponse / total) * 100;

  return {
    total,
    avgRating,
    distribution,
    responseRate,
  };
};

/**
 * Post a response to a review
 */
export const postReviewResponse = async (
  reviewId: string,
  responseText: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({
        response: responseText,
        response_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to post review response:', error);
    throw error;
  }
};

/**
 * Filter reviews by rating
 */
export const filterReviewsByRating = (
  reviews: PartnerReview[],
  rating: number | 'all'
): PartnerReview[] => {
  if (rating === 'all') return reviews;
  return reviews.filter((r) => r.rating === rating);
};
