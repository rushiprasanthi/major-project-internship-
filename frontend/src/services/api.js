import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  // RELIABILITY FIX: 15-second timeout prevents infinite loading spinners during mobile network drops
  timeout: 15000, 
});

// A singleton promise to prevent concurrent identical requests for the CSRF token
let csrfTokenPromise = null;

// Intercept outgoing requests to append CSRF token for mutating methods
api.interceptors.request.use(
  async (config) => {
    const method = config.method?.toLowerCase();
    
    // Only require CSRF negotiation for unsafe HTTP methods
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      if (!config.headers['X-CSRF-Token'] && !api.defaults.headers.common['X-CSRF-Token']) {
        if (!csrfTokenPromise) {
          // Fire request directly through axios to avoid cyclic interceptor triggers
          csrfTokenPromise = axios.get(`${config.baseURL || api.defaults.baseURL}/csrf-token`, {
            withCredentials: true,
            timeout: 5000 // Shorter timeout specifically for CSRF negotiation
          }).then(res => {
            const token = res.data.data.csrfToken;
            api.defaults.headers.common['X-CSRF-Token'] = token;
            return token;
          }).catch(err => {
            console.error('Failed to negotiate CSRF token', err);
            csrfTokenPromise = null;
            return null;
          });
        }
        
        const token = await csrfTokenPromise;
        if (token) {
          config.headers['X-CSRF-Token'] = token;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept incoming responses for global auth event handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    if (error.response?.status === 403) {
      // Differentiate between generic forbidden and CSRF failure if needed, 
      // but dispatching forbidden maintains strong layout protection.
      window.dispatchEvent(new Event('auth:forbidden'));
    }

    return Promise.reject(error);
  }
);

export default api;