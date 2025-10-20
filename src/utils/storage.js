// ✅ Safe Local Storage Helpers
export function saveState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("⚠️ saveState failed:", err);
  }
}

export function loadState(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("⚠️ loadState failed:", err);
    return null;
  }
}

export function clearState(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn("⚠️ clearState failed:", err);
  }
}
