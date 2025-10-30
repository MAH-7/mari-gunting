/**
 * Role Utility Functions
 * Provides backward-compatible role checking for both old 'role' field and new 'roles' array
 */

import { UserRole } from '../types';

/**
 * Check if user has a specific role
 * Works with both old 'role' field and new 'roles' array
 * 
 * @example
 * hasRole(user, 'barber') // true if user has barber role
 * hasRole(user, 'customer') // true if user has customer role
 */
export function hasRole(
  user: { role?: UserRole; roles?: UserRole[] } | null | undefined,
  roleToCheck: UserRole
): boolean {
  if (!user) return false;

  // Check new 'roles' array first (preferred)
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.includes(roleToCheck);
  }

  // Fallback to old 'role' field (backward compatibility)
  if (user.role) {
    return user.role === roleToCheck;
  }

  return false;
}

/**
 * Get all roles for a user
 * Returns array of roles, ensuring backward compatibility
 */
export function getUserRoles(
  user: { role?: UserRole; roles?: UserRole[] } | null | undefined
): UserRole[] {
  if (!user) return [];

  // Use new 'roles' array if available
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles;
  }

  // Fallback to old 'role' field
  if (user.role) {
    return [user.role];
  }

  return [];
}

/**
 * Check if user has multiple roles (e.g., both customer and barber)
 */
export function hasMultipleRoles(
  user: { role?: UserRole; roles?: UserRole[] } | null | undefined
): boolean {
  const roles = getUserRoles(user);
  return roles.length > 1;
}

/**
 * Add a role to user's roles array
 * Returns updated roles array
 */
export function addRole(
  currentRoles: UserRole[] | undefined,
  roleToAdd: UserRole
): UserRole[] {
  const roles = currentRoles || [];
  
  // Don't add if already exists
  if (roles.includes(roleToAdd)) {
    return roles;
  }

  return [...roles, roleToAdd];
}

/**
 * Remove a role from user's roles array
 * Returns updated roles array
 */
export function removeRole(
  currentRoles: UserRole[] | undefined,
  roleToRemove: UserRole
): UserRole[] {
  const roles = currentRoles || [];
  return roles.filter(role => role !== roleToRemove);
}

/**
 * Get primary role (first role in array, or fallback to 'role' field)
 * Useful for UI display where we need to show one primary role
 */
export function getPrimaryRole(
  user: { role?: UserRole; roles?: UserRole[] } | null | undefined
): UserRole | null {
  if (!user) return null;

  // Use first role from 'roles' array
  if (user.roles && user.roles.length > 0) {
    return user.roles[0];
  }

  // Fallback to old 'role' field
  if (user.role) {
    return user.role;
  }

  return null;
}
