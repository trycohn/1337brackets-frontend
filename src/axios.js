// src/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api', // Используем переменную окружения
});

// Добавим отладочный лог для проверки baseURL
console.log('🔍 axios baseURL:', api.defaults.baseURL);

export default api;