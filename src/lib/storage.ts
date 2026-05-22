/** Safe localStorage read — returns empty array on any error. */
export function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

/** Safe localStorage write — silently ignores quota errors. */
export function persistToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}
