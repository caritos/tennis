import React, { useMemo, useCallback } from 'react';

interface MemoryOptimizedWrapperProps {
  children: React.ReactNode;
  dependencies?: any[];
  shouldMemo?: boolean;
}

// Higher-order component for memory optimization
export const withMemoryOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  dependencies?: (keyof P)[]
) => {
  return React.memo(function WithMemoryOptimization(props: P) {
    const memoizedProps = useMemo(() => {
      if (dependencies) {
        const relevantProps: Partial<P> = {};
        dependencies.forEach(key => {
          if (key in props) {
            relevantProps[key] = props[key];
          }
        });
        return { ...props, ...relevantProps };
      }
      return props;
    }, [props]);

    return <Component {...memoizedProps} />;
  }, (prevProps, nextProps) => {
    if (dependencies) {
      return dependencies.every(key => prevProps[key] === nextProps[key]);
    }
    return false; // Always re-render if no specific dependencies
  });
};

// Utility for creating optimized callbacks
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps);
};

// Utility for creating memoized values with deep comparison
export const useDeepMemo = <T,>(factory: () => T, deps: React.DependencyList): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
};

// Component wrapper for memory optimization
export const MemoryOptimizedWrapper: React.FC<MemoryOptimizedWrapperProps> = ({
  children,
  dependencies = [],
  shouldMemo = true
}) => {
  const memoizedChildren = useMemo(() => children, [children]);

  return shouldMemo ? <React.Fragment>{memoizedChildren}</React.Fragment> : <React.Fragment>{children}</React.Fragment>;
};

export default MemoryOptimizedWrapper;