import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically attach login token to every request.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// BOOK APIs
export const getBooks = () => API.get('/books');

export const createBook = (book) => API.post('/books', book);

export const updateBook = (id, book) =>
  API.put(`/books/${id}`, book);

export const deleteBook = (id) =>
  API.delete(`/books/${id}`);

export default API;
