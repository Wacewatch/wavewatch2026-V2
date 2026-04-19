import axios from 'axios';
const API = axios.create({ baseURL: process.env.REACT_APP_BACKEND_URL, withCredentials: true });
export default API;
export const TMDB_IMG = 'https://image.tmdb.org/t/p';
