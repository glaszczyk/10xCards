import type { DataProvider } from "./interface";
import { MockProvider } from "./mock-provider";
import { SupabaseProvider } from "./supabase-provider";

export type DataProviderType = "supabase" | "mock";

/**
 * Factory for creating data providers
 * Allows switching between different data sources based on configuration
 */
export class DataProviderFactory {
  private static instance: DataProvider | null = null;
  private static providerType: DataProviderType | null = null;

  /**
   * Get the current data provider instance
   * Creates a new instance if none exists or if the provider type has changed
   */
  static getProvider(): DataProvider {
    const currentType = this.getProviderType();

    // Create new instance if type changed or no instance exists
    if (this.providerType !== currentType || !this.instance) {
      this.providerType = currentType;
      this.instance = this.createProvider(currentType);
    }

    return this.instance;
  }

  /**
   * Create a new provider instance of the specified type
   */
  private static createProvider(type: DataProviderType): DataProvider {
    switch (type) {
      case "supabase":
        return new SupabaseProvider();
      case "mock":
        return new MockProvider();
      default:
        console.warn(`Unknown provider type: ${type}, falling back to mock`);
        return new MockProvider();
    }
  }

  /**
   * Determine which provider to use based on environment configuration
   */
  private static getProviderType(): DataProviderType {
    // Check environment variable first
    const envProvider = import.meta.env.DATA_PROVIDER as DataProviderType;
    if (envProvider && ["supabase", "mock"].includes(envProvider)) {
      return envProvider;
    }

    // Check if Supabase is configured
    const hasSupabaseConfig =
      import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_ANON_KEY;

    if (hasSupabaseConfig) {
      // Use Supabase by default if configured
      return "supabase";
    }

    // Fall back to mock if no Supabase configuration
    console.warn("No Supabase configuration found, using mock provider");
    return "mock";
  }

  /**
   * Force recreation of the provider instance
   * Useful for testing or when configuration changes
   */
  static resetProvider(): void {
    this.instance = null;
    this.providerType = null;
  }

  /**
   * Get the current provider type
   */
  static getCurrentProviderType(): DataProviderType | null {
    return this.providerType;
  }

  /**
   * Check if the current provider is healthy
   */
  static async isHealthy(): Promise<boolean> {
    try {
      const provider = this.getProvider();
      return await provider.isHealthy();
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }
}
