/**
 * Chat Service
 * Handles real-time messaging between customers and barbers
 */

import { supabase } from '../config/supabase';
import { uploadChatImage } from './storage';
import { RealtimeChannel } from '@supabase/supabase-js';

// =====================================================
// TYPES
// =====================================================

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendMessageParams {
  bookingId: string;
  senderId: string;
  receiverId: string;
  message?: string;
  imageUri?: string;
}

export interface ChatParticipants {
  customerId: string;
  barberId: string;
}

// =====================================================
// SEND MESSAGE
// =====================================================

/**
 * Send a text or image message
 */
export const sendMessage = async (params: SendMessageParams): Promise<{
  success: boolean;
  data?: Message;
  error?: string;
}> => {
  try {
    const { bookingId, senderId, receiverId, message, imageUri } = params;

    // Validate: Must have either message or image
    if (!message && !imageUri) {
      return {
        success: false,
        error: 'Message must contain text or image',
      };
    }

    let imageUrl: string | null = null;

    // Upload image if provided
    if (imageUri) {
      console.log('📤 Uploading chat image...');
      const uploadResult = await uploadChatImage(senderId, bookingId, imageUri);
      
      if (!uploadResult.success || !uploadResult.url) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload image',
        };
      }
      
      imageUrl = uploadResult.url;
      console.log('✅ Image uploaded:', imageUrl);
    }

    // Insert message into database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        receiver_id: receiverId,
        message: message || null,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Send message error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send message',
      };
    }

    console.log('✅ Message sent:', data.id);
    return {
      success: true,
      data: data as Message,
    };
  } catch (error: any) {
    console.error('❌ Send message exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to send message',
    };
  }
};

// =====================================================
// GET MESSAGES
// =====================================================

/**
 * Get all messages for a booking
 */
export const getMessages = async (bookingId: string): Promise<{
  success: boolean;
  data?: Message[];
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Get messages error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch messages',
      };
    }

    return {
      success: true,
      data: data as Message[],
    };
  } catch (error: any) {
    console.error('❌ Get messages exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch messages',
    };
  }
};

// =====================================================
// MARK AS READ
// =====================================================

/**
 * Mark a single message as read
 */
export const markMessageAsRead = async (messageId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .is('read_at', null); // Only update if not already read

    if (error) {
      console.error('❌ Mark as read error:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark message as read',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ Mark as read exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark message as read',
    };
  }
};

/**
 * Mark all messages in a booking as read
 */
export const markAllMessagesAsRead = async (
  bookingId: string,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Use RPC function for better performance
    const { error } = await supabase.rpc('mark_booking_messages_read', {
      p_booking_id: bookingId,
      p_user_id: userId,
    });

    if (error) {
      console.error('❌ Mark all as read error:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark messages as read',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ Mark all as read exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark messages as read',
    };
  }
};

// =====================================================
// UNREAD COUNT
// =====================================================

/**
 * Get unread message count for a user
 */
export const getUnreadCount = async (userId: string): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.rpc('get_unread_message_count', {
      p_user_id: userId,
    });

    if (error) {
      console.error('❌ Get unread count error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get unread count',
      };
    }

    return {
      success: true,
      count: data as number,
    };
  } catch (error: any) {
    console.error('❌ Get unread count exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to get unread count',
    };
  }
};

/**
 * Get unread count for a specific booking
 */
export const getBookingUnreadCount = async (
  bookingId: string,
  userId: string
): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('booking_id', bookingId)
      .eq('receiver_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('❌ Get booking unread count error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get unread count',
      };
    }

    return {
      success: true,
      count: count || 0,
    };
  } catch (error: any) {
    console.error('❌ Get booking unread count exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to get unread count',
    };
  }
};

// =====================================================
// REAL-TIME SUBSCRIPTION
// =====================================================

/**
 * Subscribe to new messages for a booking
 * Returns unsubscribe function
 */
export const subscribeToMessages = (
  bookingId: string,
  onMessage: (message: Message) => void,
  onUpdate?: (message: Message) => void,
  onError?: (error: any) => void
): (() => void) => {
  console.log('🔔 Subscribing to messages for booking:', bookingId);

  const channel: RealtimeChannel = supabase
    .channel(`chat-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${bookingId}`,
      },
      (payload) => {
        console.log('📨 New message received:', payload);
        onMessage(payload.new as Message);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${bookingId}`,
      },
      (payload) => {
        console.log('🔄 Message updated (read status):', payload);
        if (onUpdate) {
          onUpdate(payload.new as Message);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to chat:', bookingId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Chat subscription error');
        onError?.(new Error('Failed to subscribe to chat'));
      }
    });

  // Return unsubscribe function
  return () => {
    console.log('🔌 Unsubscribing from chat:', bookingId);
    supabase.removeChannel(channel);
  };
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get chat participants (customer & barber) from booking
 */
export const getChatParticipants = async (bookingId: string): Promise<{
  success: boolean;
  data?: ChatParticipants;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('customer_id, barber_id')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('❌ Get participants error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get chat participants',
      };
    }

    return {
      success: true,
      data: {
        customerId: data.customer_id,
        barberId: data.barber_id,
      },
    };
  } catch (error: any) {
    console.error('❌ Get participants exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to get chat participants',
    };
  }
};

/**
 * Check if user can access chat for this booking
 */
export const canAccessChat = async (
  bookingId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('customer_id, barber_id, status')
      .eq('id', bookingId)
      .single();

    if (error || !data) {
      return false;
    }

    // User must be customer or barber
    const isParticipant = data.customer_id === userId || data.barber_id === userId;
    
    // Booking must be in active state
    const activeStatuses = ['accepted', 'on_the_way', 'arrived', 'in_progress'];
    const isActive = activeStatuses.includes(data.status);

    return isParticipant && isActive;
  } catch (error) {
    console.error('❌ Check access error:', error);
    return false;
  }
};

/**
 * Delete a message (only within 5 minutes of sending)
 */
export const deleteMessage = async (messageId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('❌ Delete message error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete message',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ Delete message exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete message',
    };
  }
};
