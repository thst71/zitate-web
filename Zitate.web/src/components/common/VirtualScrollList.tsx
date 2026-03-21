import { useState, useEffect, useRef, useMemo } from 'react';
import './VirtualScrollList.css';

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  getItemKey
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const itemCount = items.length;
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(itemCount - 1, start + visibleItemCount + overscan);
    const startWithOverscan = Math.max(0, start - overscan);
    
    return {
      startIndex: startWithOverscan,
      endIndex: end,
      offsetY: startWithOverscan * itemHeight
    };
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Reset scroll when items change significantly
  useEffect(() => {
    if (scrollElementRef.current && scrollTop > totalHeight) {
      scrollElementRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [totalHeight, scrollTop]);

  return (
    <div 
      ref={scrollElementRef}
      className={`virtual-scroll-container ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div 
        className="virtual-scroll-spacer"
        style={{ height: totalHeight }}
      >
        <div 
          className="virtual-scroll-content"
          style={{ 
            transform: `translateY(${offsetY}px)`,
            height: (endIndex - startIndex + 1) * itemHeight
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;
            
            return (
              <div
                key={key}
                className="virtual-scroll-item"
                style={{ 
                  height: itemHeight,
                  transform: `translateY(${index * itemHeight}px)`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook for calculating item height dynamically
// eslint-disable-next-line react-refresh/only-export-components
export const useVirtualScrollItemHeight = () => {
  const [itemHeight, setItemHeight] = useState(100);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (measureRef.current) {
      const height = measureRef.current.offsetHeight;
      if (height > 0) {
        setItemHeight(height);
      }
    }
  }, []);

  return { itemHeight, measureRef };
};
