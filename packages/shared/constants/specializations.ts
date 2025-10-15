/**
 * Barber Specializations
 * Centralized list used across onboarding and profile editing
 */

export const BARBER_SPECIALIZATIONS = [
  'Haircut',
  'Fade',
  'Beard Trim',
  'Shaving',
  'Hair Coloring',
  'Perm',
  'Straightening',
  'Kids Haircut',
  'Traditional',
  'Modern',
] as const;

export type BarberSpecialization = typeof BARBER_SPECIALIZATIONS[number];
