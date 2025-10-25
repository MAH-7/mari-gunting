import { supabase } from '@mari-gunting/shared/config/supabase';

/**
 * Heartbeat Service - Simplified Version
 * 
 * Sends periodic "heartbeat" pings to server while app is in foreground.
 * When app is minimized, heartbeat stops but barber stays online.
 * Push notifications will wake barber when jobs come in.
 * 
 * For force quit detection: If no heartbeat for 3 min → Auto-offline
 */

class HeartbeatService {
  private intervalId: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private isRunning: boolean = false;
  
  // Send heartbeat every 60 seconds
  private readonly HEARTBEAT_INTERVAL = 60 * 1000; // 60 seconds
  
  /**
   * Start sending heartbeats for a user
   */
  async startHeartbeat(userId: string): Promise<void> {
    if (this.isRunning && this.userId === userId) {
      console.log('💓 Heartbeat already running for user:', userId);
      return;
    }
    
    // Stop any existing heartbeat
    await this.stopHeartbeat();
    
    this.userId = userId;
    this.isRunning = true;
    
    console.log('💓 Starting heartbeat service for user:', userId);
    
    // Send initial heartbeat immediately
    await this.sendHeartbeat();
    
    // Set up interval for periodic heartbeats (while in foreground)
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.sendHeartbeat();
      }
    }, this.HEARTBEAT_INTERVAL);
  }
  
  /**
   * Stop sending heartbeats
   */
  async stopHeartbeat(): Promise<void> {
    if (this.intervalId) {
      console.log('🛑 Stopping heartbeat service');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    this.userId = null;
  }
  
  /**
   * Send a single heartbeat ping to server
   */
  private async sendHeartbeat(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          last_heartbeat: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.userId);
      
      if (error) {
        console.error('❌ Heartbeat failed:', error);
      } else {
        console.log('💓 Heartbeat sent at:', new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('❌ Heartbeat exception:', error);
    }
  }
  
  /**
   * Check if heartbeat is currently running
   */
  isHeartbeatRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const heartbeatService = new HeartbeatService();
