// src/utils/cache.js
export const getCachedData = (key, maxAge = 3600000) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  const now = new Date().getTime();
  if (now - timestamp > maxAge) {
    localStorage.removeItem(key);
    return null;
  }
  return data;
};

export const setCachedData = (key, data) => {
  const cache = {
    data,
    timestamp: new Date().getTime(),
  };
  localStorage.setItem(key, JSON.stringify(cache));
};

export const clearCachedData = (key) => {
  localStorage.removeItem(key);
};