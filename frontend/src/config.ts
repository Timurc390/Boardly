const apiHost = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export const API_BASE_URL = `${apiHost}/api`;
