// src/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
});

// Логируем baseURL для отладки
console.log('🔍 axios baseURL:', api.defaults.baseURL);

// Логируем каждый запрос
api.interceptors.request.use(request => {
  console.log('🔍 Sending request to:', request.url);
  return request;
});

export default api;