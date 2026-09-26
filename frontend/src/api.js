const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export function getStoredAuthToken() {
  return localStorage.getItem('stocksense_token') || '';
}

export function getStoredUser() {
  const rawUser = localStorage.getItem('stocksense_user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function setStoredAuth(token, user) {
  if (token) {
    localStorage.setItem('stocksense_token', token);
  }

  if (user) {
    localStorage.setItem('stocksense_user', JSON.stringify(user));
  }
}

export function clearStoredAuth() {
  localStorage.removeItem('stocksense_token');
  localStorage.removeItem('stocksense_user');
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}