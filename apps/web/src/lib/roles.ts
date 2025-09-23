// apps/web/src/lib/roles.ts
// Centralized role/feature checks used by menus and route guards

export type MinimalUser = { role?: string } | null | undefined;
export type MinimalProfile = {
  role?: string;
  is_tutor?: boolean;
  tutor?: { status?: string } | null;
  features?: { tutor?: boolean; tutor_dashboard?: boolean } | null;
} | null | undefined;

export function canSeeTutorMenus(input: { user?: MinimalUser; profile?: MinimalProfile }): boolean {
  const { user, profile } = input || {};
  return Boolean(
    (user as any)?.role === "tutor" ||
    (profile as any)?.role === "tutor" ||
    (profile as any)?.is_tutor === true ||
    (profile as any)?.tutor?.status === "approved" ||
    (profile as any)?.features?.tutor === true ||
    (profile as any)?.features?.tutor_dashboard === true
  );
}

export function isAdmin(input: { user?: MinimalUser; profile?: MinimalProfile }): boolean {
  const { user, profile } = input || {};
  return Boolean((user as any)?.role === "admin" || (profile as any)?.role === "admin");
}
