import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const token = import.meta.env.VITE_API_TOKEN || 'dev-local-token';

export const apiClient = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

export async function getJson(path, params = {}) {
  const { data } = await apiClient.get(path, { params });
  return data;
}

export async function postJson(path, body = {}) {
  const { data } = await apiClient.post(path, body);
  return data;
}

export async function putJson(path, body = {}) {
  const { data } = await apiClient.put(path, body);
  return data;
}

export async function deleteJson(path) {
  const { data } = await apiClient.delete(path);
  return data;
}

export function getApiErrorMessage(error, fallback = 'Request failed') {
  const fieldErrors = error?.response?.data?.field_errors;
  if (Array.isArray(fieldErrors) && fieldErrors.length) {
    const first = fieldErrors[0];
    const field = first?.field ? `${first.field}: ` : '';
    const reason = first?.reason || '';
    if (field || reason) return `${field}${reason}`.trim();
  }
  return error?.response?.data?.message || error?.message || fallback;
}
