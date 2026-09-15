const DEFAULT_API_URL = 'https://printflow-backend-wen3.onrender.com';

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
);

export const ADMIN_API_URL = `${API_URL}/admin`;
