package com.marigunting.partner.dev

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

/**
 * React Native module for controlling OnlineStatusService.
 * Provides methods to start/stop the service from JavaScript.
 */
class OnlineStatusModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "OnlineStatusModule"
    }

    override fun getName(): String {
        return "OnlineStatusModule"
    }

    /**
     * Start the online status service
     * @param userId - Current user ID
     * @param supabaseUrl - Supabase project URL
     * @param supabaseAnonKey - Supabase anon key
     * @param promise - Promise to resolve when service starts
     */
    @ReactMethod
    fun startService(
        userId: String,
        supabaseUrl: String,
        supabaseAnonKey: String,
        promise: Promise
    ) {
        try {
            val context = reactApplicationContext
            
            if (userId.isEmpty() || supabaseUrl.isEmpty() || supabaseAnonKey.isEmpty()) {
                promise.reject("INVALID_PARAMS", "Missing required parameters")
                return
            }
            
            Log.d(TAG, "Starting online status service for user: $userId")
            
            OnlineStatusService.startService(
                context = context,
                userId = userId,
                supabaseUrl = supabaseUrl,
                supabaseAnonKey = supabaseAnonKey
            )
            
            promise.resolve(true)
            Log.d(TAG, "✅ Service started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to start service", e)
            promise.reject("START_FAILED", e.message, e)
        }
    }

    /**
     * Stop the online status service
     * @param promise - Promise to resolve when service stops
     */
    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            Log.d(TAG, "Stopping online status service")
            OnlineStatusService.stopService(context)
            
            promise.resolve(true)
            Log.d(TAG, "✅ Service stopped successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to stop service", e)
            promise.reject("STOP_FAILED", e.message, e)
        }
    }
}
