import { useState, useCallback, useEffect } from "react";

export function useWidnowWidth(): number {
  const [headerWidth, setHeaderWidth] = useState(window.innerWidth);

  const notifyRowSizes = useCallback(() => {
    setHeaderWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    notifyRowSizes();
    window.addEventListener("resize", notifyRowSizes);
    return () => window.removeEventListener("resize", notifyRowSizes);
  }, [notifyRowSizes]);

  return headerWidth;
}