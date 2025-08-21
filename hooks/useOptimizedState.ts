import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from '@/utils/debounce';

// Optimized state hook with batching and debouncing
export function useOptimizedState<T>(
  initialValue: T,
  options?: {
    debounceMs?: number;
    batchUpdates?: boolean;
  }
) {
  const [state, setState] = useState<T>(initialValue);
  const pendingUpdates = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Batch multiple state updates
  const batchedSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    if (options?.batchUpdates) {
      pendingUpdates.current.push(
        typeof newValue === 'function' 
          ? (newValue as (prev: T) => T)(state)
          : newValue
      );
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        // Apply all pending updates at once
        const finalValue = pendingUpdates.current[pendingUpdates.current.length - 1];
        setState(finalValue);
        pendingUpdates.current = [];
      }, 0);
    } else {
      setState(newValue);
    }
  }, [state, options?.batchUpdates]);

  // Debounced state setter
  const debouncedSetState = useCallback(
    debounce((newValue: T) => {
      batchedSetState(newValue);
    }, options?.debounceMs || 0),
    [batchedSetState, options?.debounceMs]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return [
    state,
    options?.debounceMs ? debouncedSetState : batchedSetState
  ] as const;
}

// Hook for expensive computations
export function useComputedValue<T, D extends readonly unknown[]>(
  computeFn: () => T,
  dependencies: D
): T {
  const cachedValue = useRef<T>();
  const cachedDeps = useRef<D>();

  // Deep comparison of dependencies
  const depsChanged = !cachedDeps.current || 
    dependencies.some((dep, i) => dep !== cachedDeps.current![i]);

  if (depsChanged) {
    cachedValue.current = computeFn();
    cachedDeps.current = dependencies;
  }

  return cachedValue.current!;
}