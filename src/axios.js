// src/axios.js
import axios from 'axios';

const api = axios.create({
    baseURL: '', // Используем относительный путь, Vercel перенаправит
});

console.log('🔍 axios baseURL:', api.defaults.baseURL);

api.interceptors.request.use(request => {
    console.log('🔍 Sending request to:', request.url);
    return request;
});

export default api;