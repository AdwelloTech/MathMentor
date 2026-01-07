/**
 * Comprehensive Cache Management
 * Eliminates all forms of frontend caching
 */

export class CacheManager {
  /**
   * Clear all browser storage (except session tokens)
   */
  static clearAllStorage(): void {
    console.log('🧹 Clearing browser storage (preserving session)...');

    try {
      localStorage.clear();
      console.log('✅ localStorage cleared');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }

    // PRESERVE sessionStorage - contains session tokens
    console.log('⏭️  sessionStorage preserved (contains session tokens)');

    // Clear any cookies (except essential ones)
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name] = cookie.trim().split('=');
        if (name && !name.includes('essential') && !name.includes('necessary')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      }
      console.log('✅ Non-essential cookies cleared');
    } catch (error) {
      console.warn('Failed to clear cookies:', error);
    }
  }

  /**
   * Clear all cache storage
   */
  static async clearCacheStorage(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log(`✅ ${cacheNames.length} cache storages cleared`);
      } catch (error) {
        console.warn('Failed to clear cache storage:', error);
      }
    }
  }

  /**
   * Unregister all service workers
   */
  static async unregisterServiceWorkers(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        console.log(`✅ ${registrations.length} service workers unregistered`);
      } catch (error) {
        console.warn('Failed to unregister service workers:', error);
      }
    }
  }

  /**
   * Clear browser history cache (force reload)
   */
  static forcePageReload(): void {
    // Clear current page cache
    window.location.reload();
  }

  /**
   * Comprehensive cache clearing
   */
  static async clearEverything(): Promise<void> {
    console.log('🚀 STARTING COMPREHENSIVE CACHE CLEARING...');

    // Clear all storage
    this.clearAllStorage();

    // Clear cache storage
    await this.clearCacheStorage();

    // Unregister service workers
    await this.unregisterServiceWorkers();

    console.log('🎯 ALL CACHES CLEARED - FRESH START!');
  }

  /**
   * Check if any caching is active
   */
  static async checkCacheStatus(): Promise<void> {
    console.log('🔍 CACHE STATUS CHECK:');

    const localStorageCount = localStorage.length;
    const sessionStorageCount = sessionStorage.length;

    console.log(`localStorage items: ${localStorageCount} (should be 0)`);
    console.log(`sessionStorage items: ${sessionStorageCount} (session tokens allowed)`);

    // Check for session tokens specifically
    const sessionTokens = sessionStorage.getItem('mathmentor_session_tokens');
    console.log(`Session tokens present: ${!!sessionTokens}`);

    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        console.log(`Cache storages: ${cacheNames.length} (should be 0)`);
      } catch (error) {
        console.log('Cache storage check failed');
      }
    }

    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`Service workers: ${registrations.length} (should be 0)`);
      } catch (error) {
        console.log('Service worker check failed');
      }
    }
  }
}
