import { supabase } from '@mari-gunting/shared/config/supabase';

/**
 * Heartbeat Service - Production Grade
 * 
 * PRODUCTION SETTINGS (Grab/Foodpanda standard):
 * - Foreground: Heartbeat sent with every location update (10-30s)
 * - Background: Heartbeat sent with background location updates (10-15s)
 * - Force close: Connection drops → Auto-offline after 90s
 * 
 * Note: Heartbeat is bundled with location updates for efficiency.
 * No separate heartbeat intervals needed - location tracking handles it.
 */

class HeartbeatService {
  private intervalId: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private isRunning: boolean = false;
  
  // PRODUCTION: Send heartbeat every 30 seconds (for barbershop partners who don't track location)
  // Freelance barbers get heartbeat from location updates (10-30s)
  private readonly HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
  
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
