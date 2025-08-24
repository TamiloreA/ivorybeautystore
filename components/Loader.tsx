"use client";
import { useState, useEffect } from "react";

const Loader = ({ onComplete }: { onComplete?: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="loader">
      <div className="loader-text">IVORY BEAUTY</div>
    </div>
  );
};

export default Loader;
