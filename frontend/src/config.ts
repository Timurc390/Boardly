const envApi = process.env.REACT_APP_API_URL;
// Use window origin when available; avoid hardcoding localhost for hosted demos.
const originFallback = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
const apiHost = (envApi || originFallback).replace(/\/$/, '');

export const API_BASE_URL = `${apiHost}/api`;
