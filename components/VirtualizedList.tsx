import React, { useMemo, useCallback } from 'react';
import { FlatList, FlatListProps, Platform } from 'react-native';

interface VirtualizedListProps<T> extends Omit<FlatListProps<T>, 'getItemLayout'> {
  itemHeight?: number;
  optimizeForIPad?: boolean;
}

// Optimized virtualized list for large datasets
export function VirtualizedList<T>({
  data,
  renderItem,
  itemHeight,
  optimizeForIPad = true,
  ...props
}: VirtualizedListProps<T>) {
  const isIPad = Platform.OS === 'ios' && Platform.isPad;
  const chunkSize = isIPad ? 20 : 10;
  
  // Optimize initial/max render batch sizes for iPad
  const optimizedProps = useMemo(() => {
    if (optimizeForIPad && isIPad) {
      return {
        initialNumToRender: 10, // Render fewer items initially on iPad
        maxToRenderPerBatch: chunkSize,
        windowSize: 10, // Smaller window for iPad
        removeClippedSubviews: true, // Critical for iPad performance
        updateCellsBatchingPeriod: 100, // Batch updates
      };
    }
    
    return {
      initialNumToRender: 15,
      maxToRenderPerBatch: 30,
      windowSize: 21,
      removeClippedSubviews: Platform.OS === 'android',
      updateCellsBatchingPeriod: 50,
    };
  }, [optimizeForIPad, isIPad, chunkSize]);

  // Optimize item layout calculation if height is fixed
  const getItemLayout = useCallback(
    (data: ArrayLike<T> | null | undefined, index: number) => ({
      length: itemHeight || 50,
      offset: (itemHeight || 50) * index,
      index,
    }),
    [itemHeight]
  );

  // Key extractor with stable references
  const keyExtractor = useCallback(
    (item: T, index: number) => {
      if (typeof item === 'object' && item !== null) {
        return (item as any).id?.toString() || index.toString();
      }
      return index.toString();
    },
    []
  );

  return (
    <FlatList
      {...props}
      {...optimizedProps}
      data={data}
      renderItem={renderItem}
      keyExtractor={props.keyExtractor || keyExtractor}
      getItemLayout={itemHeight ? getItemLayout : undefined}
      // Performance flags
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
      onEndReachedThreshold={0.5}
      // Reduce re-renders
      extraData={props.extraData}
    />
  );
}

export default VirtualizedList;