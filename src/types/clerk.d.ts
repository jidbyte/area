export {};

declare global {
  interface UserPublicMetadata {
    /** Set manually (Clerk Dashboard) for the first admin; grantable via the
     * platform admin UI thereafter. Presence of "admin" is the only check. */
    platformRole?: "admin";
  }
}
