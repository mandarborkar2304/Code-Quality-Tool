/**
 * API utilities for handling requests, retries, and rate limiting
 */

import { apiCache, createCacheKey } from './apiCache';

// Queue for managing API requests
class RequestQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private isProcessing = false;
  private concurrentLimit = 2; // Maximum concurrent requests
  private activeRequests = 0;
  private rateLimitDelay = 1000; // Delay between requests in ms

  /**
   * Add a request to the queue
   * @param requestFn Function that performs the actual request
   * @returns Promise that resolves with the request result
   */
  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Create a wrapper function that will execute the request
      const executeRequest = async () => {
        try {
          this.activeRequests++;
          const result = await requestFn();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        } finally {
          this.activeRequests--;
          this.processNext();
        }
      };

      // Add the wrapper to the queue
      this.queue.push(executeRequest);
      
      // Start processing if not already doing so
      if (!this.isProcessing) {
        this.processNext();
      }
    });
  }

  /**
   * Process the next item in the queue
   */
  private async processNext(): Promise<void> {
    // If we're at the concurrent limit or the queue is empty, don't process more
    if (this.activeRequests >= this.concurrentLimit || this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const nextRequest = this.queue.shift();
    
    if (nextRequest) {
      try {
        // Add a small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        await nextRequest();
      } catch (error) {
        console.error('Error processing queued request:', error);
      }
    }

    // Continue processing the queue
    this.processNext();
  }

  /**
   * Set the concurrent request limit
   * @param limit Maximum number of concurrent requests
   */
  setConcurrentLimit(limit: number): void {
    this.concurrentLimit = limit;
  }

  /**
   * Set the delay between requests
   * @param delay Delay in milliseconds
   */
  setRateLimitDelay(delay: number): void {
    this.rateLimitDelay = delay;
  }
}

// Create a singleton request queue
const requestQueue = new RequestQueue();

/**
 * Fetch with retry, caching, and queue management
 * @param url URL to fetch
 * @param options Fetch options
 * @param cacheKey Key for caching the response
 * @param retries Number of retries on failure
 * @param retryDelay Initial delay between retries in ms (doubles with each retry)
 * @returns Promise with the response data
 */
export async function fetchWithRetry<T>(
  url: string, 
  options: RequestInit = {}, 
  cacheKey?: string,
  retries = 3, 
  retryDelay = 1000
): Promise<T> {
  // Check cache first if a cache key is provided
  if (cacheKey) {
    const cachedData = apiCache.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  // Add the request to the queue
  return requestQueue.add(async () => {
    let lastError: Error | null = null;
    let attempt = 0;
    
    while (attempt <= retries) {
      try {
        const response = await fetch(url, options);
        
        // Handle rate limiting (429 status)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay * Math.pow(2, attempt);
          
          console.warn(`Rate limited. Waiting ${waitTime}ms before retry.`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempt++;
          continue;
        }
        
        // Handle other error responses
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        // Parse the response
        const data = await response.json();
        
        // Cache the successful response if a cache key was provided
        if (cacheKey) {
          apiCache.set(cacheKey, data);
        }
        
        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If we've used all our retries, throw the error
        if (attempt >= retries) {
          throw lastError;
        }
        
        // Wait before retrying, with exponential backoff
        const waitTime = retryDelay * Math.pow(2, attempt);
        console.warn(`Request failed, retrying in ${waitTime}ms...`, lastError);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        attempt++;
      }
    }
    
    // This should never be reached due to the throw in the catch block
    throw lastError || new Error('Unknown error occurred');
  });
}

/**
 * Debounce a function call
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}