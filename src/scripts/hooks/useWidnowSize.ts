import { useState, useCallback, useEffect } from "react";

export function useWidnowSize() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  const notifyRowSizes = useCallback(() => {
    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);
  }, []);

  useEffect(() => {
    notifyRowSizes();
    window.addEventListener("resize", notifyRowSizes);
    return () => window.removeEventListener("resize", notifyRowSizes);
  }, [notifyRowSizes]);

  return { windowWidth, windowHeight };
}