import { useEffect, useRef, useState } from "react";

interface ElementSize {
  width: number;
  height: number;
}

export const useElementSize = (): [React.RefObject<HTMLDivElement | null>, ElementSize] => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  return [elementRef, size];
};
