import { createHash } from "node:crypto";
import type { EventProfile } from "@/domain";

/**
 * Standard In-Memory Least-Recently-Used (LRU) Cache.
 * Evicts oldest unaccessed entries when maximum capacity is exceeded.
 */
export class LruCache<K, V> {
  private readonly map = new Map<K, V>();
  public readonly maxSize: number;

  constructor(maxSize: number = 100) {
    if (maxSize <= 0) {
      throw new RangeError("LRU Cache maxSize must be a positive integer");
    }
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) {
      return undefined;
    }
    const val = this.map.get(key)!;
    // Refresh access order (move to most recently used)
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  set(key: K, value: V): this {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict least recently used item (first key in map iterator)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
    return this;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }
}

/**
 * Normalizes an event profile into a canonical format so variations in field order,
 * casing, or whitespace map to identical cache keys.
 */
export function normalizeProfileForCache(
  profile: EventProfile | Record<string, unknown>,
): Record<string, unknown> {
  const p = profile as Record<string, unknown>;

  const constraintsObj = (p.constraints as Record<string, unknown>) || {};
  const dietary = Array.isArray(constraintsObj.dietary)
    ? [...constraintsObj.dietary].map(String).sort()
    : [];
  const accessibility = Array.isArray(constraintsObj.accessibility)
    ? [...constraintsObj.accessibility].map(String).sort()
    : [];
  const kidFriendly = Boolean(constraintsObj.kidFriendly);

  const budgetVal =
    typeof p.budget === "number" ? p.budget : (p.totalBudget as number) || 0;
  const roundedBudget = Math.round(budgetVal * 100) / 100;

  return {
    eventType: String(p.eventType || "")
      .trim()
      .toLowerCase(),
    title: String(p.title || "")
      .trim()
      .toLowerCase(),
    date: String(p.date || p.eventDate || "").trim(),
    guestCount: Number(p.guestCount) || 0,
    budget: roundedBudget,
    location: String(p.location || "")
      .trim()
      .toLowerCase(),
    theme: String(p.theme || "")
      .trim()
      .toLowerCase(),
    dietary,
    accessibility,
    kidFriendly,
  };
}

/**
 * Computes a SHA-256 cryptographic hash of the normalized event profile.
 *
 * @param profile - Event profile or input record
 * @returns 64-character hex hash string
 */
export function hashNormalizedProfile(
  profile: EventProfile | Record<string, unknown>,
): string {
  const normalized = normalizeProfileForCache(profile);
  const jsonString = JSON.stringify(normalized);
  return createHash("sha256").update(jsonString).digest("hex");
}
