"use client";
import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    };
    const handleMouseDown = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(0.8)";
    };
    const handleMouseUp = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
    };
    const handleMouseEnter = () => {
      cursor.style.width = "50px";
      cursor.style.height = "50px";
      cursor.style.backgroundColor = "rgba(255, 182, 193, 0.2)";
    };
    const handleMouseLeave = () => {
      cursor.style.width = "20px";
      cursor.style.height = "20px";
      cursor.style.backgroundColor = "rgba(255, 182, 193, 0.5)";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    const interactive = document.querySelectorAll(
      "a, button, .btn, .product, .team-member"
    );
    interactive.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      interactive.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  return <div ref={cursorRef} className="cursor"></div>;
}
