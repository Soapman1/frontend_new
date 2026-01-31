import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://car-status-backend.onrender.com';

// ✅ Важно: разрешаем передачу cookies
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Отправляем и принимаем cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Логин больше не сохраняет токен в localStorage - он в cookie
export const login = async (login, password, rememberMe = false) => {
  const res = await api.post('/login', { login, password, rememberMe });
  return res.data;
};

export const logout = async () => {
  await api.post('/logout');
};

export const checkAuth = async () => {
  const res = await api.get('/me');
  return res.data;
};

// Остальные функции без изменений, но используем api вместо axios
export const getCars = async () => {
  const res = await api.get('/api/operator/cars');
  return res.data;
};

export const addCar = async (car) => {
  const res = await api.post('/api/operator/cars', car);
  return res.data;
};

export const updateCar = async (id, data) => {
  const res = await api.put(`/api/operator/cars/${id}`, data);
  return res.data;
};

export const deleteCar = async (id) => {
  const res = await api.delete(`/api/operator/cars/${id}`);
  return res.data;
};

export const updateCarStatus = async (id, status) => {
  const res = await api.put(`/api/operator/cars/${id}/status`, { status });
  return res.data;
};