import axios from 'axios';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000,
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/'))
      window.dispatchEvent(new Event('session-expired'));
    return Promise.reject(error);
  },
);
export function errorMessage(error) {
  const details = error.response?.data?.error;
  return (
    details?.fields?.map((field) => `${field.field}: ${field.message}`).join(' ') ||
    details?.message ||
    (error.code === 'ECONNABORTED'
      ? 'The request timed out. Please try again.'
      : 'Unable to connect. Check your connection and try again.')
  );
}
