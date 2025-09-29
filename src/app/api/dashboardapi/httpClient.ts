import axios from 'axios';

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
httpClient.interceptors.request.use(
  (config) => {
    // Get token from storage
    const token = localStorage.getItem('kc-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // With HttpOnly cookies, we just need to call our refresh endpoint
        // The refresh endpoint will handle the refresh token automatically via cookies
        const response = await axios.post('/api/auth/refresh', {}, { 
          withCredentials: true // Important: include cookies
        });
        
        const { token } = response.data;

        // Update token in storage
        localStorage.setItem('kc-token', token);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return httpClient(originalRequest);
      } catch (refreshError) {
        // Handle failed refresh - redirect to login
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);