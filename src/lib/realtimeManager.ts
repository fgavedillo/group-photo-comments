
/**
 * Centralized manager for Supabase Realtime subscriptions
 * This helps prevent duplicate subscriptions and memory leaks
 */
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Make the payload type more flexible to handle different payload types
type SubscriptionCallback = (payload: any) => void;
type TableEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscriptionOptions {
  event: TableEvent;
  schema?: string;
  table: string;
  filter?: string;
}

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: Map<string, Set<SubscriptionCallback>> = new Map();
  
  /**
   * Subscribe to real-time changes on a table
   * 
   * @param channelName Unique identifier for this channel
   * @param options Options for the subscription
   * @param callback Function to call when changes occur
   * @returns Cleanup function to remove the subscription
   */
  public subscribe(
    channelName: string,
    options: SubscriptionOptions,
    callback: SubscriptionCallback
  ): () => void {
    const schema = options.schema || 'public';
    const { event, table, filter } = options;
    
    // Create a unique key for this subscription
    const subscriptionKey = `${channelName}:${schema}:${table}:${event}:${filter || ''}`;
    
    // Store the callback
    if (!this.callbacks.has(subscriptionKey)) {
      this.callbacks.set(subscriptionKey, new Set());
    }
    this.callbacks.get(subscriptionKey)?.add(callback);
    
    // If this channel doesn't exist yet, create it
    if (!this.channels.has(channelName)) {
      console.log(`Creating new realtime channel: ${channelName}`);
      const channel = supabase.channel(channelName);
      
      // Use the correct type for the 'postgres_changes' event
      channel.on(
        'postgres_changes' as any, // Type assertion to fix TypeScript error
        {
          event,
          schema,
          table,
          filter
        },
        (payload) => {
          // Call all callbacks registered for this subscription
          const callbacks = this.callbacks.get(subscriptionKey);
          if (callbacks) {
            callbacks.forEach(cb => cb(payload));
          }
        }
      ).subscribe((status) => {
        console.log(`Realtime channel ${channelName} status: ${status}`);
      });
      
      this.channels.set(channelName, channel);
    }
    
    // Return a cleanup function
    return () => {
      // Remove this callback
      const callbacks = this.callbacks.get(subscriptionKey);
      if (callbacks) {
        callbacks.delete(callback);
        
        // If there are no more callbacks for this subscription, remove the channel
        if (callbacks.size === 0) {
          this.callbacks.delete(subscriptionKey);
          
          // If there are no more subscriptions using this channel, remove it
          const hasRelatedSubscriptions = Array.from(this.callbacks.keys()).some(
            key => key.startsWith(`${channelName}:`)
          );
          
          if (!hasRelatedSubscriptions) {
            console.log(`Removing realtime channel: ${channelName}`);
            const channel = this.channels.get(channelName);
            if (channel) {
              supabase.removeChannel(channel);
              this.channels.delete(channelName);
            }
          }
        }
      }
    };
  }
}

// Export a singleton instance
export const realtimeManager = new RealtimeManager();
