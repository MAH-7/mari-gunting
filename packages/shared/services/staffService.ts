/**
 * Staff Management Service
 * Handles CRUD operations for barbershop staff members
 */

import { supabase } from '../config/supabase';

export interface Staff {
  id: string;
  barbershop_id: string;
  name: string;
  role: string;
  specializations: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffInput {
  name: string;
  role: string;
  specializations: string[];
}

export interface UpdateStaffInput {
  name?: string;
  role?: string;
  specializations?: string[];
  is_active?: boolean;
}

export const staffService = {
  /**
   * Get all staff members for a barbershop
   */
  async getStaffByBarbershopId(barbershopId: string): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('barbershop_staff')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get active staff members for a barbershop (for customer selection)
   */
  async getActiveStaffByBarbershopId(barbershopId: string): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('barbershop_staff')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active staff:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get staff by user ID (barbershop owner)
   */
  async getStaffByOwnerId(userId: string): Promise<Staff[]> {
    // First get barbershop ID
    const { data: barbershop, error: shopError } = await supabase
      .from('barbershops')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (shopError || !barbershop) {
      console.error('Error fetching barbershop:', shopError);
      return [];
    }

    return this.getStaffByBarbershopId(barbershop.id);
  },

  /**
   * Create a new staff member
   */
  async createStaff(
    barbershopId: string,
    staffData: CreateStaffInput
  ): Promise<Staff> {
    const { data, error } = await supabase
      .from('barbershop_staff')
      .insert({
        barbershop_id: barbershopId,
        name: staffData.name,
        role: staffData.role,
        specializations: staffData.specializations,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating staff:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update a staff member
   */
  async updateStaff(
    staffId: string,
    updates: UpdateStaffInput
  ): Promise<Staff> {
    const { data, error } = await supabase
      .from('barbershop_staff')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete a staff member
   */
  async deleteStaff(staffId: string): Promise<void> {
    const { error } = await supabase
      .from('barbershop_staff')
      .delete()
      .eq('id', staffId);

    if (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  },

  /**
   * Toggle staff active status
   */
  async toggleStaffActive(staffId: string, isActive: boolean): Promise<Staff> {
    return this.updateStaff(staffId, { is_active: isActive });
  },

  /**
   * Get staff count for a barbershop
   */
  async getStaffCount(barbershopId: string): Promise<number> {
    const { count, error } = await supabase
      .from('barbershop_staff')
      .select('*', { count: 'exact', head: true })
      .eq('barbershop_id', barbershopId);

    if (error) {
      console.error('Error counting staff:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * Get active staff count for a barbershop
   */
  async getActiveStaffCount(barbershopId: string): Promise<number> {
    const { count, error } = await supabase
      .from('barbershop_staff')
      .select('*', { count: 'exact', head: true })
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true);

    if (error) {
      console.error('Error counting active staff:', error);
      return 0;
    }

    return count || 0;
  },
};
