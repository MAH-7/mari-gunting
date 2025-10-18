/**
 * Review Service - Supabase Integration
 */

import { supabase } from '../config/supabase';
import { ApiResponse } from '../types';

export interface SubmitReviewParams {
  bookingId: string;
  customerId: string;
  rating: number;
  comment?: string;
  images?: string[];
}

export interface ReviewResult {
  review_id: string;
  success: boolean;
  message: string;
}

export const reviewService = {
  /**
   * Submit a review for a completed booking
   */
  async submitReview(params: SubmitReviewParams): Promise<ApiResponse<ReviewResult>> {
    try {
      const { data, error } = await supabase.rpc('submit_review', {
        p_booking_id: params.bookingId,
        p_customer_id: params.customerId,
        p_rating: params.rating,
        p_comment: params.comment || null,
        p_images: params.images || null,
      });

      if (error) {
        console.error('❌ Submit review error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // RPC returns array with single row
      const result = Array.isArray(data) ? data[0] : data;

      if (!result.success) {
        return {
          success: false,
          error: result.message,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('❌ Submit review exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit review',
      };
    }
  },
};
