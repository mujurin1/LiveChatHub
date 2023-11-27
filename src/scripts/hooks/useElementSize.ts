import { useEffect, useMemo, useRef, useState } from "react";

export function useResizeObserve<T extends Element>() {
  const ref = useRef<T>(null);
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
    const element = ref.current;
    if (element == null) return;
    const observedElement = element;

    resizeObserver.observe(observedElement);

    return () => resizeObserver.unobserve(observedElement);
  }, [resizeObserver]);

  return {
    ref,
    width,
    height,
  };
}
