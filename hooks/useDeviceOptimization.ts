import { useDeviceContext } from 'twrnc';
import { Dimensions, Platform } from 'react-native';
import { useMemo } from 'react';

interface DeviceOptimization {
  isIPad: boolean;
  shouldUseOptimizedRendering: boolean;
  maxConcurrentComponents: number;
  chunkSize: number;
  enableVirtualization: boolean;
}

export const useDeviceOptimization = (): DeviceOptimization => {
  const { width, height } = Dimensions.get('window');
  
  return useMemo(() => {
    const isIPad = Platform.OS === 'ios' && (width >= 768 || height >= 768);
    const isLargeScreen = width >= 768;
    
    return {
      isIPad,
      shouldUseOptimizedRendering: isIPad || isLargeScreen,
      maxConcurrentComponents: isIPad ? 8 : 12, // Render fewer components on iPad
      chunkSize: isIPad ? 20 : 30, // Smaller chunks for iPad
      enableVirtualization: isIPad && (width >= 1024), // Only on large iPads
    };
  }, [width, height]);
};

// Hook for memory-aware component rendering
export const useMemoryAwareRendering = () => {
  const optimization = useDeviceOptimization();
  
  return {
    ...optimization,
    shouldLazyLoad: optimization.isIPad,
    shouldMemoize: optimization.shouldUseOptimizedRendering,
    renderingStrategy: optimization.isIPad ? 'conservative' : 'aggressive',
  };
};

export default useDeviceOptimization;