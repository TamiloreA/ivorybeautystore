"use client";
import { useEffect, useRef } from "react";

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("active"), delay);
          }
        });
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [delay]);

  return (
    <div ref={elementRef} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
