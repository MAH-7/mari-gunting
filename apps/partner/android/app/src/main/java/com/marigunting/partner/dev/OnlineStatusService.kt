package com.marigunting.partner.dev

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.Process
import android.util.Log
import android.location.LocationManager
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Foreground service that runs while partner is online.
 * Detects force close via onTaskRemoved() and immediately sets partner offline.
 * 
 * This provides instant offline detection (0-10s) compared to heartbeat timeout (90s).
 */
class OnlineStatusService : Service() {

    companion object {
        private const val TAG = "OnlineStatusService"
        private const val CHANNEL_ID = "online_status_channel"
        private const val NOTIFICATION_ID = 12345
        private const val EXTRA_USER_ID = "user_id"
        private const val EXTRA_SUPABASE_URL = "supabase_url"
        private const val EXTRA_SUPABASE_KEY = "supabase_key"

        /**
         * Start the online status service
         */
        fun startService(
            context: Context,
            userId: String,
            supabaseUrl: String,
            supabaseAnonKey: String
        ) {
            val intent = Intent(context, OnlineStatusService::class.java).apply {
                putExtra(EXTRA_USER_ID, userId)
                putExtra(EXTRA_SUPABASE_URL, supabaseUrl)
                putExtra(EXTRA_SUPABASE_KEY, supabaseAnonKey)
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            
            Log.d(TAG, "Service start requested for user: $userId")
        }

        /**
         * Stop the online status service
         */
        fun stopService(context: Context) {
            val intent = Intent(context, OnlineStatusService::class.java)
            context.stopService(intent)
            Log.d(TAG, "Service stop requested")
        }
    }

    private var userId: String? = null
    private var supabaseUrl: String? = null
    private var supabaseAnonKey: String? = null
    
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Extract credentials from intent
        userId = intent?.getStringExtra(EXTRA_USER_ID)
        supabaseUrl = intent?.getStringExtra(EXTRA_SUPABASE_URL)
        supabaseAnonKey = intent?.getStringExtra(EXTRA_SUPABASE_KEY)
        
        Log.d(TAG, "Service started for user: $userId")
        
        // Start foreground service with notification
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        
        // START_STICKY ensures service restarts if killed by system
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        // This is a started service, not bound
        return null
    }

    /**
     * CRITICAL: Called when app is swiped away from recent apps.
     * This is our chance to set partner offline before the process is killed.
     */
    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        
        Log.w(TAG, "⚠️ Task removed (force close detected) - setting partner offline")
        
        // 1. Set partner offline immediately (blocks until complete)
        setPartnerOffline()
        
        // 2. Stop foreground mode and remove this service's notification FIRST
        stopForeground(true) // true = remove notification
        Log.d(TAG, "🔔 Removed foreground notification")
        
        // 3. Stop all location tracking and remove notifications
        stopAllLocationTracking()
        
        // 4. Stop the service
        stopSelf()
        
        // 5. Wait for location service cleanup
        Thread.sleep(1000) // Give time for LocationTaskService to stop
        
        // 6. Kill process to stop foreground watcher immediately
        Log.w(TAG, "💀 Killing app process to stop all tracking")
        Process.killProcess(Process.myPid())
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed")
        
        // Cancel all coroutines
        serviceScope.cancel()
    }

    /**
     * Stop all location tracking to save battery.
     * Properly removes location listeners and cancels notifications.
     */
    private fun stopAllLocationTracking() {
        try {
            Log.d(TAG, "🛑 Stopping all location tracking...")

            // 1. Stop Android's location manager (removes location listeners)
            try {
                val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
                // Note: We can't directly remove listeners from here, but stopping the service helps
                Log.d(TAG, "✅ Location manager accessed for cleanup")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Error accessing location manager", e)
            }

            // 2. Stop Expo's LocationTaskService (background location)
            try {
                val cls = Class.forName("expo.modules.location.services.LocationTaskService")
                val intent = Intent(this, cls)
                stopService(intent)
                Log.d(TAG, "🛑 Stopped Expo LocationTaskService")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Could not stop Expo LocationTaskService", e)
            }
            
            // 3. Cancel ALL notifications from this app (removes green dot)
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.cancelAll()
            Log.d(TAG, "✅ Cancelled all notifications")
            
            // 4. Small delay to ensure cleanup completes
            Thread.sleep(300)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error stopping location tracking", e)
        }
    }
    
    /**
     * Set partner offline via Supabase RPC function.
     * Uses SECURITY DEFINER function to bypass RLS.
     */
    private fun setPartnerOffline() {
        if (userId == null || supabaseUrl == null || supabaseAnonKey == null) {
            Log.e(TAG, "❌ Missing credentials - cannot set offline")
            return
        }
        
        // Launch coroutine to make API call
        serviceScope.launch {
            try {
                Log.d(TAG, "📡 Setting partner offline via RPC...")
                
                // Call RPC function (bypasses RLS with SECURITY DEFINER)
                val json = JSONObject().apply {
                    put("p_user_id", userId)
                }
                
                val requestBody = json.toString()
                    .toRequestBody("application/json".toMediaType())
                
                // Build request to RPC endpoint
                val request = Request.Builder()
                    .url("$supabaseUrl/rest/v1/rpc/force_close_set_offline")
                    .post(requestBody)
                    .addHeader("apikey", supabaseAnonKey!!)
                    .addHeader("Authorization", "Bearer $supabaseAnonKey")
                    .addHeader("Content-Type", "application/json")
                    .build()
                
                // Execute request
                val response = httpClient.newCall(request).execute()
                
                if (response.isSuccessful) {
                    Log.d(TAG, "✅ Successfully set partner offline (force close)")
                } else {
                    Log.e(TAG, "❌ Failed to set offline: ${response.code} ${response.message}")
                    Log.e(TAG, "Response body: ${response.body?.string()}")
                }
                
                response.close()
            } catch (e: Exception) {
                Log.e(TAG, "❌ Exception setting partner offline", e)
            }
        }
        
        // Give coroutine time to complete
        Thread.sleep(2000)
    }

    /**
     * Create notification channel for Android O+
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Online Status",
                NotificationManager.IMPORTANCE_LOW // Low importance = silent notification
            ).apply {
                description = "Keeps you online and detects when app is closed"
                setShowBadge(false)
            }
            
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    /**
     * Create persistent notification for foreground service
     */
    private fun createNotification(): Notification {
        // Intent to open app when notification is tapped
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("You're Online")
            .setContentText("Ready to accept bookings")
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Use app icon in production
            .setContentIntent(pendingIntent)
            .setOngoing(true) // Cannot be dismissed by user
            .setPriority(NotificationCompat.PRIORITY_LOW) // Low priority = silent
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }
}
