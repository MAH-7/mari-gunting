import { supabase } from '@mari-gunting/shared/config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Connection Monitor - Production Grade (Grab/Foodpanda standard)
 * 
 * Uses Supabase Realtime (WebSocket) to detect instant disconnects
 * - Maintains persistent connection to server
 * - Server knows immediately when connection drops
 * - No need to wait for heartbeat timeout
 * - Faster offline detection than heartbeat alone
 */

class ConnectionMonitor {
  private channel: RealtimeChannel | null = null;
  private userId: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // 2 seconds
  
  /**
   * Start monitoring connection for a user
   */
  async startMonitoring(userId: string): Promise<void> {
    if (this.isConnected && this.userId === userId) {
      console.log('🔌 Connection monitor already active for user:', userId);
      return;
    }
    
    await this.stopMonitoring();
    
    this.userId = userId;
    console.log('🔌 Starting connection monitor for user:', userId);
    
    // Subscribe to a presence channel - this maintains WebSocket connection
    // Note: Supabase auto-generates presence key for connection identity
    // User identity is stored in track() payload below
    this.channel = supabase.channel(`barber:${userId}:presence`);
    
    // Track presence (online/offline state)
    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState();
        console.log('👥 Presence sync:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('✅ User joined presence:', key);
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset on successful connection
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('❌ User left presence:', key);
        this.isConnected = false;
        
        // Attempt to reconnect
        this.attemptReconnect();
      })
      .subscribe(async (status) => {
        console.log('🔌 Realtime connection status:', status);
        
        if (status === 'SUBSCRIBED') {
          // Track presence (marks us as online in the channel)
          // Use instance variable to ensure userId is always in scope
          await this.channel!.track({
            user_id: this.userId,  // ✅ Instance variable (best practice)
            online_at: new Date().toISOString(),
          });
          
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('✅ Connection monitor active - WebSocket connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.isConnected = false;
          console.error('❌ WebSocket connection lost');
          
          // Attempt to reconnect
          this.attemptReconnect();
        }
      });
  }
  
  /**
   * Stop monitoring connection
   */
  async stopMonitoring(): Promise<void> {
    if (this.channel) {
      console.log('🛑 Stopping connection monitor');
      
      // Untrack presence before unsubscribing
      if (this.userId) {
        await this.channel.untrack();
      }
      
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
    
    this.isConnected = false;
    this.userId = null;
    this.reconnectAttempts = 0;
  }
  
  /**
   * Attempt to reconnect if connection is lost
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached. Giving up.');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      if (this.userId) {
        await this.stopMonitoring();
        await this.startMonitoring(this.userId);
      }
    }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
  }
  
  /**
   * Check if currently connected
   */
  isCurrentlyConnected(): boolean {
    return this.isConnected;
  }
  
  /**
   * Get connection health status
   */
  getConnectionHealth(): {
    connected: boolean;
    reconnectAttempts: number;
    userId: string | null;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId,
    };
  }
}

// Export singleton instance
export const connectionMonitor = new ConnectionMonitor();
