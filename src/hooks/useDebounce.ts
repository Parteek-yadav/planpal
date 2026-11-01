import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Returns a debounced version of a reactive value that only updates after
 * the specified delay in milliseconds has elapsed without new changes.
 *
 * @param value - Source value to debounce.
 * @param delayMs - Debounce window in milliseconds (default: 300ms).
 * @returns Debounced value.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Creates a debounced callback function that delays invoking callback until
 * after delayMs have elapsed since the last time the debounced function was invoked.
 *
 * @param callback - Function to debounce.
 * @param delayMs - Debounce delay in milliseconds.
 * @returns Memoized debounced callback function.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number = 300,
): (...args: Args) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Args) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs],
  );
}
