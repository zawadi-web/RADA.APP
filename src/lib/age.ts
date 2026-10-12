/**
 * Age calculation utilities.
 *
 * WHY: Never store a derived `age: Int` column in the database.
 * A static age field becomes stale on every birthday unless a cron
 * job updates it — creating silent data drift. Instead we store
 * only `birthDate: DateTime` and compute age dynamically here.
 *
 * For discovery filtering we convert age range → date range and
 * let the database do the comparison natively:
 *   birthDate >= subYears(today, maxAge + 1)
 *   birthDate <= subYears(today, minAge)
 */

/**
 * Calculate current age from a birth date.
 * Returns the age in whole completed years.
 */
export function calculateAge(birthDate: Date | string): number {
  const bDate = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - bDate.getFullYear();
  const monthDiff = today.getMonth() - bDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Returns true if the given birth date corresponds to an 18+ user.
 * Called server-side during onboarding — never trust this check on the frontend alone.
 */
export function isAgeVerified(birthDate: Date): boolean {
  return calculateAge(birthDate) >= 18;
}

/**
 * Convert an age range to a birth date range for SQL filtering.
 * Usage in Prisma:
 *   where: { birthDate: { gte: minBirthDate, lte: maxBirthDate } }
 */
export function ageToBirthDateRange(minAge: number, maxAge: number): {
  minBirthDate: Date;
  maxBirthDate: Date;
} {
  const today = new Date();

  // Oldest possible person matching minAge: born exactly minAge years ago today
  const maxBirthDate = new Date(today);
  maxBirthDate.setFullYear(today.getFullYear() - minAge);

  // Youngest possible person matching maxAge: born just after their (maxAge+1)th birthday
  const minBirthDate = new Date(today);
  minBirthDate.setFullYear(today.getFullYear() - maxAge - 1);
  minBirthDate.setDate(minBirthDate.getDate() + 1);

  return { minBirthDate, maxBirthDate };
}

/**
 * Returns a human-readable age string.
 * e.g. formatAge(new Date("1997-05-12")) → "27"
 */
export function formatAge(birthDate: Date): string {
  return calculateAge(birthDate).toString();
}

/**
 * Parse a string birthdate safely.
 * Returns null if invalid.
 */
export function parseBirthDate(value: string): Date | null {
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}
