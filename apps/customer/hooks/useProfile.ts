import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { profileService } from '@/services/profileService';
import { statsService, UserStats } from '@/services/statsService';

export const useProfile = () => {
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    completed: 0,
    cancelled: 0,
    avgRating: '0.0',
  });

  // Load stats on mount or when user changes
  useEffect(() => {
    if (currentUser?.id) {
      loadStats();
    }
  }, [currentUser?.id]);

  const loadStats = async () => {
    if (!currentUser) return;
    
    setIsLoadingStats(true);
    setError(null);
    
    try {
      const data = await statsService.getUserStats(currentUser.id);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await profileService.refreshProfile(currentUser.id);
      
      // Map database fields to UI fields for consistency
      const updatedUser = {
        ...data,
        name: data.full_name || data.name,
        avatar: data.avatar || data.avatar_url,
        avatar_url: data.avatar_url || data.avatar,
      };
      
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      setError('Failed to refresh profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await profileService.updateProfile(currentUser.id, updates);
      
      // Map database fields to UI fields for consistency
      const updatedUser = {
        ...currentUser,
        ...data,
        name: data.full_name || data.name || currentUser.name,
        avatar: data.avatar || data.avatar_url || currentUser.avatar,
        avatar_url: data.avatar_url || data.avatar || currentUser.avatar_url,
      };
      
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async (imageUri: string) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await profileService.updateAvatar(currentUser.id, imageUri);
      
      // Map database fields to UI fields for consistency
      const updatedUser = {
        ...currentUser,
        ...data,
        name: data.full_name || data.name || currentUser.name,
        avatar: data.avatar || data.avatar_url,
        avatar_url: data.avatar_url || data.avatar,
      };
      
      console.log('[useProfile] Avatar updated successfully:', {
        oldAvatar: currentUser.avatar,
        newAvatar: updatedUser.avatar,
      });
      
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Failed to update avatar:', err);
      setError('Failed to update avatar');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    profile: currentUser,
    stats,
    isLoading,
    isLoadingStats,
    error,
    refreshProfile,
    updateProfile,
    updateAvatar,
    loadStats,
    clearError,
  };
};
