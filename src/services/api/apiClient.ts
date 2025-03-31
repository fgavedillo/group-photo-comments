
/**
 * Base configuration for API requests
 */
export interface ApiRequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: string;
    code?: string;
    context?: any;
  };
}

/**
 * Base function to make API requests with timeout and error handling
 */
export async function callApi<T = any>({
  url,
  method = 'GET',
  data = null,
  config = {}
}: {
  url: string;
  method?: string;
  data?: any;
  config?: ApiRequestConfig;
}): Promise<ApiResponse<T>> {
  const requestId = crypto.randomUUID();
  console.log(`[ID:${requestId}] Starting API request to ${url}`);
  
  // Set default timeout
  const timeoutDuration = config.timeout || 60000; // Default 60s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
  
  // Measure performance
  const startTime = performance.now();
  
  try {
    // Get headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...config.headers
    });
    
    console.log(`[ID:${requestId}] Sending ${method} request with ${timeoutDuration/1000}s timeout`);
    if (data) {
      console.log(`[ID:${requestId}] Payload:`, JSON.stringify(data));
    }
    
    // Make the request
    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: method !== 'GET' ? JSON.stringify(data) : undefined,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });
    
    // Clear timeout as we got a response
    clearTimeout(timeoutId);
    
    // Log performance metrics
    const elapsedTime = performance.now() - startTime;
    console.log(`[ID:${requestId}] Response received in ${elapsedTime.toFixed(2)}ms, Status: ${response.status}`);
    
    // Handle response errors
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetails = '';
      
      try {
        const errorJson = await response.json();
        console.error(`[ID:${requestId}] Error details:`, errorJson);
        
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
        
        if (errorJson.error?.details) {
          errorDetails = errorJson.error.details;
        }
      } catch (parseError) {
        console.error(`[ID:${requestId}] Could not parse error response as JSON`);
        try {
          errorDetails = await response.text();
        } catch (textError) {
          errorDetails = 'Could not get error details';
        }
      }
      
      return {
        success: false,
        error: {
          message: errorMessage,
          details: errorDetails,
          code: `HTTP_${response.status}`,
          context: {
            requestId,
            url,
            status: response.status,
            statusText: response.statusText,
            elapsedTime: `${elapsedTime.toFixed(2)}ms`
          }
        }
      };
    }
    
    // Parse successful response
    const responseData = await response.json();
    
    return {
      success: true,
      data: {
        ...responseData,
        requestId,
        elapsedTime: `${elapsedTime.toFixed(2)}ms`
      }
    };
  } catch (error: any) {
    // Clear timeout in case of error
    clearTimeout(timeoutId);
    
    // Handle different types of errors
    let errorMessage = error.message || 'Unknown network error';
    let errorCode = 'NETWORK_ERROR';
    
    if (error.name === 'AbortError') {
      errorMessage = `Request timed out after ${timeoutDuration/1000}s`;
      errorCode = 'TIMEOUT_ERROR';
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      errorMessage = 'Connection error. Check your internet connection and server availability.';
    } else if (error.message?.includes('CORS')) {
      errorMessage = 'CORS policy error. The request was blocked by the browser.';
      errorCode = 'CORS_ERROR';
    }
    
    console.error(`[ID:${requestId}] Request error: ${errorMessage}`);
    
    return {
      success: false,
      error: {
        message: errorMessage,
        details: String(error),
        code: errorCode,
        context: {
          requestId,
          url,
          errorName: error.name,
          errorStack: error.stack
        }
      }
    };
  }
}
