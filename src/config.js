export const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : `${window.location.origin}/api`;
