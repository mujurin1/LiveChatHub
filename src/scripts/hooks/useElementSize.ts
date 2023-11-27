import { useEffect, useMemo, useState } from "react";

export function useResizeObserve<T extends Element>(element: T | null) {
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
  }, [element, resizeObserver]);

  return {
    width,
    height,
  };
}
