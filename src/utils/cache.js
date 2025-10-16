// Simple caching utility using localStorage
// Generate a unique cache key based on file name and size
export function getCacheKey(file) {
  return `${file.name}_${file.size}`;
}
// Retrieve cached result by key
export function getCachedResult(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
// Store result in cache with key
export function setCachedResult(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
