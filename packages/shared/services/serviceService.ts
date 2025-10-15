/**
 * Service Management Service
 * Handles CRUD operations for services offered by barbers and barbershops
 */

import { supabase } from '../config/supabase';

export interface Service {
  id: string;
  barber_id: string | null;
  barbershop_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  category?: string;
  price: number;
  duration_minutes: number;
  is_active?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export const serviceService = {
  /**
   * Get services for a barber
   */
  async getBarberServices(barberId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('barber_id', barberId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching barber services:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get services for a barbershop
   */
  async getBarbershopServices(barbershopId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching barbershop services:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get services for current user (auto-detect if barber or barbershop)
   */
  async getMyServices(userId: string): Promise<Service[]> {
    // First, check if user is a barber
    const { data: barber } = await supabase
      .from('barbers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (barber) {
      return this.getBarberServices(barber.id);
    }

    // If not a barber, check if user is a barbershop owner
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (barbershop) {
      return this.getBarbershopServices(barbershop.id);
    }

    // No barber or barbershop found
    return [];
  },

  /**
   * Create a service for a barber
   */
  async createBarberService(
    barberId: string,
    serviceData: CreateServiceInput
  ): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert({
        barber_id: barberId,
        barbershop_id: null,
        name: serviceData.name,
        description: serviceData.description || null,
        category: serviceData.category || null,
        price: serviceData.price,
        duration_minutes: serviceData.duration_minutes,
        is_active: serviceData.is_active !== undefined ? serviceData.is_active : true,
        is_popular: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating barber service:', error);
      throw error;
    }

    return data;
  },

  /**
   * Create a service for a barbershop
   */
  async createBarbershopService(
    barbershopId: string,
    serviceData: CreateServiceInput
  ): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert({
        barber_id: null,
        barbershop_id: barbershopId,
        name: serviceData.name,
        description: serviceData.description || null,
        category: serviceData.category || null,
        price: serviceData.price,
        duration_minutes: serviceData.duration_minutes,
        is_active: serviceData.is_active !== undefined ? serviceData.is_active : true,
        is_popular: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating barbershop service:', error);
      throw error;
    }

    return data;
  },

  /**
   * Create a service for current user (auto-detect if barber or barbershop)
   */
  async createMyService(
    userId: string,
    serviceData: CreateServiceInput
  ): Promise<Service> {
    // First, check if user is a barber
    const { data: barber } = await supabase
      .from('barbers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (barber) {
      return this.createBarberService(barber.id, serviceData);
    }

    // If not a barber, check if user is a barbershop owner
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (barbershop) {
      return this.createBarbershopService(barbershop.id, serviceData);
    }

    throw new Error('User is neither a barber nor a barbershop owner');
  },

  /**
   * Update a service
   */
  async updateService(
    serviceId: string,
    updates: UpdateServiceInput
  ): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete a service
   */
  async deleteService(serviceId: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },

  /**
   * Toggle service active status
   */
  async toggleServiceActive(serviceId: string, isActive: boolean): Promise<Service> {
    return this.updateService(serviceId, { is_active: isActive });
  },

  /**
   * Toggle service popular status
   */
  async toggleServicePopular(serviceId: string, isPopular: boolean): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .update({ is_popular: isPopular })
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling service popular:', error);
      throw error;
    }

    return data;
  },

  /**
   * Get a single service by ID
   */
  async getServiceById(serviceId: string): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching service:', error);
      throw error;
    }

    return data;
  },
};
