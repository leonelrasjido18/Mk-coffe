export const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5005/api' 
  : `${window.location.origin}/api`;
