/**
 * Address Service - Customer Address Management
 * Handles customer addresses with Supabase RPC calls
 */

import { supabase } from '../config/supabase';
import { ApiResponse } from '../types';

export type AddressType = 'home' | 'work' | 'apartment' | 'office' | 'other';

export interface CustomerAddress {
  id: string;
  user_id: string;
  customer_id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  // Enhanced Grab-style fields
  building_name?: string;
  floor?: string;
  unit_number?: string;
  delivery_instructions?: string;
  contact_number?: string;
  address_type: AddressType;
  landmark?: string;
  gps_accuracy?: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AddAddressParams {
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  // Enhanced Grab-style fields
  buildingName?: string;
  floor?: string;
  unitNumber?: string;
  deliveryInstructions?: string;
  contactNumber?: string;
  addressType?: AddressType;
  landmark?: string;
  gpsAccuracy?: number;
}

export const addressService = {
  /**
   * Get all customer addresses
   */
  async getCustomerAddresses(userId: string): Promise<ApiResponse<CustomerAddress[]>> {
    try {
      const { data, error } = await supabase.rpc('get_customer_addresses', {
        p_user_id: userId,
      });

      if (error) {
        console.error('❌ Get addresses error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log(`✅ Fetched ${data?.length || 0} addresses`);

      return {
        success: true,
        data: data || [],
      };
    } catch (error: any) {
      console.error('❌ Get addresses exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch addresses',
      };
    }
  },

  /**
   * Add new customer address
   */
  async addCustomerAddress(params: AddAddressParams): Promise<ApiResponse<CustomerAddress>> {
    try {
      const { data, error} = await supabase.rpc('add_customer_address', {
        p_user_id: params.userId,  // Changed from p_customer_id to match function signature
        p_label: params.label,
        p_address_line1: params.addressLine1,
        p_address_line2: params.addressLine2 || null,
        p_city: params.city,
        p_state: params.state,
        p_postal_code: params.postalCode || null,
        p_latitude: params.latitude || null,
        p_longitude: params.longitude || null,
        p_is_default: params.isDefault || false,
        // Enhanced Grab-style fields
        p_building_name: params.buildingName || null,
        p_floor: params.floor || null,
        p_unit_number: params.unitNumber || null,
        p_delivery_instructions: params.deliveryInstructions || null,
        p_contact_number: params.contactNumber || null,
        p_address_type: params.addressType || 'other',
        p_landmark: params.landmark || null,
        p_gps_accuracy: params.gpsAccuracy || null,
      });

      if (error) {
        console.error('❌ Add address error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      const result = Array.isArray(data) ? data[0] : data;

      console.log('✅ Address added successfully');

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('❌ Add address exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to add address',
      };
    }
  },

  /**
   * Update existing address
   */
  async updateAddress(
    addressId: string,
    updates: Partial<AddAddressParams>
  ): Promise<ApiResponse<CustomerAddress>> {
    try {
      // Use RPC function - note: lat/lng are accepted but ignored (generated columns)
      const { data, error } = await supabase.rpc('update_customer_address', {
        p_address_id: addressId,
        // Only send non-null values to avoid overwriting with nulls
        ...(updates.label && { p_label: updates.label }),
        ...(updates.addressLine1 && { p_address_line1: updates.addressLine1 }),
        ...(updates.addressLine2 !== undefined && { p_address_line2: updates.addressLine2 }),
        ...(updates.city && { p_city: updates.city }),
        ...(updates.state && { p_state: updates.state }),
        ...(updates.postalCode !== undefined && { p_postal_code: updates.postalCode }),
        // ⚠️ lat/lng are passed but ignored - they're generated from location geography column
        ...(updates.latitude !== undefined && { p_latitude: updates.latitude }),
        ...(updates.longitude !== undefined && { p_longitude: updates.longitude }),
        ...(updates.isDefault !== undefined && { p_is_default: updates.isDefault }),
        // Enhanced Grab-style fields
        ...(updates.buildingName !== undefined && { p_building_name: updates.buildingName }),
        ...(updates.floor !== undefined && { p_floor: updates.floor }),
        ...(updates.unitNumber !== undefined && { p_unit_number: updates.unitNumber }),
        ...(updates.deliveryInstructions !== undefined && { p_delivery_instructions: updates.deliveryInstructions }),
        ...(updates.contactNumber !== undefined && { p_contact_number: updates.contactNumber }),
        ...(updates.addressType !== undefined && { p_address_type: updates.addressType }),
        ...(updates.landmark !== undefined && { p_landmark: updates.landmark }),
      });

      if (error) {
        console.error('❌ Update address error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Address updated successfully');

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('❌ Update address exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to update address',
      };
    }
  },

  /**
   * Delete address
   */
  async deleteAddress(addressId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      // Use RPC function to bypass RLS issues
      const { error } = await supabase.rpc('delete_customer_address_direct', {
        p_address_id: addressId,
        p_customer_id: userId,
      });

      if (error) {
        console.error('❌ Delete address error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Address deleted successfully');

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Delete address exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete address',
      };
    }
  },

  /**
   * Set default address
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<ApiResponse<void>> {
    try {
      // Use RPC function to bypass RLS issues
      const { error } = await supabase.rpc('set_default_customer_address', {
        p_address_id: addressId,
        p_customer_id: userId,
      });

      if (error) {
        console.error('❌ Set default address error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Default address updated');

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Set default address exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to set default address',
      };
    }
  },

  /**
   * Get default address
   */
  async getDefaultAddress(userId: string): Promise<ApiResponse<CustomerAddress | null>> {
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', userId)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('❌ Get default address error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || null,
      };
    } catch (error: any) {
      console.error('❌ Get default address exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch default address',
      };
    }
  },

  /**
   * Get address by type (home, work, etc.)
   */
  async getAddressByType(
    userId: string,
    type: AddressType
  ): Promise<ApiResponse<CustomerAddress | null>> {
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', userId)
        .eq('address_type', type)
        .single();

      if (error && error.code !== 'PGRST116') {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || null,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch address',
      };
    }
  },

  /**
   * Get recent addresses
   */
  async getRecentAddresses(
    userId: string,
    limit: number = 5
  ): Promise<ApiResponse<CustomerAddress[]>> {
    try {
      const { data, error } = await supabase.rpc('get_recent_addresses', {
        p_customer_id: userId,
        p_limit: limit,
      });

      if (error) {
        console.error('❌ Get recent addresses error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch recent addresses',
      };
    }
  },

  /**
   * Mark address as used (updates last_used_at)
   */
  async markAddressAsUsed(addressId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc('mark_address_as_used', {
        p_address_id: addressId,
      });

      if (error) {
        console.error('❌ Mark address as used error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark address as used',
      };
    }
  },

  /**
   * Search addresses by query
   */
  async searchAddresses(
    userId: string,
    query: string
  ): Promise<ApiResponse<CustomerAddress[]>> {
    try {
      const {data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', userId)
        .or(
          `label.ilike.%${query}%,` +
          `address_line1.ilike.%${query}%,` +
          `address_line2.ilike.%${query}%,` +
          `city.ilike.%${query}%,` +
          `building_name.ilike.%${query}%,` +
          `landmark.ilike.%${query}%`
        )
        .order('last_used_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('❌ Search addresses error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search addresses',
      };
    }
  },
};
