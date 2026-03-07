// Simple caching utility using localStorage
// Generate a cache key from stable file metadata.
export function getCacheKey(file) {
  return `${file.name}_${file.size}_${file.lastModified || 0}`;
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
