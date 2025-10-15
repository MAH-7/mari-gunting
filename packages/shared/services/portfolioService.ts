/**
 * Portfolio Service
 * Handles portfolio image uploads, retrieval, and deletion for barbers and barbershops
 */

import { supabase } from '../config/supabase';
import { File } from 'expo-file-system';

export const portfolioService = {
  /**
   * Get portfolio images for a barber
   */
  async getBarberPortfolio(barberId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('barbers')
      .select('portfolio_images')
      .eq('id', barberId)
      .single();

    if (error) {
      console.error('Error fetching barber portfolio:', error);
      throw error;
    }

    return data?.portfolio_images || [];
  },

  /**
   * Get portfolio images for a barbershop
   */
  async getBarbershopPortfolio(barbershopId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('barbershops')
      .select('cover_images')
      .eq('id', barbershopId)
      .single();

    if (error) {
      console.error('Error fetching barbershop portfolio:', error);
      throw error;
    }

    return data?.cover_images || [];
  },

  /**
   * Get portfolio for current user (auto-detect if barber or barbershop)
   */
  async getMyPortfolio(userId: string): Promise<string[]> {
    // Check if user is a barber
    const { data: barber } = await supabase
      .from('barbers')
      .select('id, portfolio_images')
      .eq('user_id', userId)
      .maybeSingle();

    if (barber) {
      return barber.portfolio_images || [];
    }

    // Check if user is a barbershop owner
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('id, cover_images')
      .eq('owner_id', userId)
      .maybeSingle();

    if (barbershop) {
      return barbershop.cover_images || [];
    }

    return [];
  },

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(
    userId: string,
    imageUri: string,
    type: 'barber' | 'barbershop'
  ): Promise<string> {
    try {
      // Create File instance and read as ArrayBuffer
      const file = new File(imageUri);
      const arrayBuffer = await file.bytes();

      // Generate unique filename
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const bucket = type === 'barber' ? 'barber-portfolios' : 'barbershop-media';

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error('Error uploading to storage:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw error;
    }
  },

  /**
   * Add image to barber portfolio
   */
  async addBarberImage(barberId: string, imageUrl: string): Promise<void> {
    // First get current images
    const currentImages = await this.getBarberPortfolio(barberId);
    const updatedImages = [...currentImages, imageUrl];

    const { error } = await supabase
      .from('barbers')
      .update({ portfolio_images: updatedImages })
      .eq('id', barberId);

    if (error) {
      console.error('Error adding barber image:', error);
      throw error;
    }
  },

  /**
   * Add image to barbershop portfolio
   */
  async addBarbershopImage(barbershopId: string, imageUrl: string): Promise<void> {
    // First get current images
    const currentImages = await this.getBarbershopPortfolio(barbershopId);
    const updatedImages = [...currentImages, imageUrl];

    const { error } = await supabase
      .from('barbershops')
      .update({ cover_images: updatedImages })
      .eq('id', barbershopId);

    if (error) {
      console.error('Error adding barbershop image:', error);
      throw error;
    }
  },

  /**
   * Add image for current user (auto-detect type)
   */
  async addMyImage(userId: string, imageUri: string): Promise<string> {
    // Check if user is a barber
    const { data: barber } = await supabase
      .from('barbers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (barber) {
      const imageUrl = await this.uploadImage(userId, imageUri, 'barber');
      await this.addBarberImage(barber.id, imageUrl);
      return imageUrl;
    }

    // Check if user is a barbershop owner
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (barbershop) {
      const imageUrl = await this.uploadImage(userId, imageUri, 'barbershop');
      await this.addBarbershopImage(barbershop.id, imageUrl);
      return imageUrl;
    }

    throw new Error('User is neither a barber nor a barbershop owner');
  },

  /**
   * Delete image from barber portfolio
   */
  async deleteBarberImage(barberId: string, imageUrl: string): Promise<void> {
    // Get current images
    const currentImages = await this.getBarberPortfolio(barberId);
    const updatedImages = currentImages.filter(url => url !== imageUrl);

    // Update database
    const { error } = await supabase
      .from('barbers')
      .update({ portfolio_images: updatedImages })
      .eq('id', barberId);

    if (error) {
      console.error('Error deleting barber image from database:', error);
      throw error;
    }

    // Try to delete from storage (optional - may fail if already deleted)
    try {
      const path = this.extractPathFromUrl(imageUrl, 'barber-portfolios');
      if (path) {
        await supabase.storage.from('barber-portfolios').remove([path]);
      }
    } catch (error) {
      console.warn('Could not delete from storage:', error);
    }
  },

  /**
   * Delete image from barbershop portfolio
   */
  async deleteBarbershopImage(barbershopId: string, imageUrl: string): Promise<void> {
    // Get current images
    const currentImages = await this.getBarbershopPortfolio(barbershopId);
    const updatedImages = currentImages.filter(url => url !== imageUrl);

    // Update database
    const { error } = await supabase
      .from('barbershops')
      .update({ cover_images: updatedImages })
      .eq('id', barbershopId);

    if (error) {
      console.error('Error deleting barbershop image from database:', error);
      throw error;
    }

    // Try to delete from storage
    try {
      const path = this.extractPathFromUrl(imageUrl, 'barbershop-media');
      if (path) {
        await supabase.storage.from('barbershop-media').remove([path]);
      }
    } catch (error) {
      console.warn('Could not delete from storage:', error);
    }
  },

  /**
   * Delete image for current user (auto-detect type)
   */
  async deleteMyImage(userId: string, imageUrl: string): Promise<void> {
    // Check if user is a barber
    const { data: barber } = await supabase
      .from('barbers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (barber) {
      await this.deleteBarberImage(barber.id, imageUrl);
      return;
    }

    // Check if user is a barbershop owner
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (barbershop) {
      await this.deleteBarbershopImage(barbershop.id, imageUrl);
      return;
    }

    throw new Error('User is neither a barber nor a barbershop owner');
  },

  /**
   * Set cover photo by reordering images (first image = cover)
   */
  async setMyCoverPhoto(userId: string, imageUrl: string): Promise<void> {
    // Check if user is a barber
    const { data: barber } = await supabase
      .from('barbers')
      .select('id, portfolio_images')
      .eq('user_id', userId)
      .maybeSingle();

    if (barber) {
      const currentImages = barber.portfolio_images || [];
      // Remove the selected image from its current position
      const otherImages = currentImages.filter((url: string) => url !== imageUrl);
      // Put it at the front (making it the cover)
      const reorderedImages = [imageUrl, ...otherImages];

      const { error } = await supabase
        .from('barbers')
        .update({ portfolio_images: reorderedImages })
        .eq('id', barber.id);

      if (error) {
        console.error('Error setting cover photo:', error);
        throw error;
      }
      return;
    }

    // Check if user is a barbershop owner
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('id, cover_images')
      .eq('owner_id', userId)
      .maybeSingle();

    if (barbershop) {
      const currentImages = barbershop.cover_images || [];
      const otherImages = currentImages.filter((url: string) => url !== imageUrl);
      const reorderedImages = [imageUrl, ...otherImages];

      const { error } = await supabase
        .from('barbershops')
        .update({ cover_images: reorderedImages })
        .eq('id', barbershop.id);

      if (error) {
        console.error('Error setting cover photo:', error);
        throw error;
      }
      return;
    }

    throw new Error('User is neither a barber nor a barbershop owner');
  },

  /**
   * Helper: Extract storage path from public URL
   */
  extractPathFromUrl(url: string, bucket: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`));
      return pathMatch ? pathMatch[1] : null;
    } catch {
      return null;
    }
  },
};
