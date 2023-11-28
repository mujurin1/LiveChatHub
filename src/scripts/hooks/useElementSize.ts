import { useCallback, useEffect, useMemo, useState } from "react";

export function useResizeObserve<T extends Element>() {
  const [element, setElement] = useState<T | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setRef = useCallback(setElement, []);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const resizeObserver = useMemo(() => new ResizeObserver(entries => {
    const entity = entries[0];
    if (entity == null) return;

    const target = entity.target;
    setWidth(target.clientWidth);
    setHeight(target.clientHeight);
  }), []);

  useEffect(() => {
    if (element == null) return;
    const observedElement = element;

    resizeObserver.observe(observedElement);

    return () => resizeObserver.unobserve(observedElement);
  }, [resizeObserver, element]);

  return {
    width,
    height,

    setRef,
  };
}
