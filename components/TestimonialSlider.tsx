"use client";
import { useState, useEffect } from "react";

export default function TestimonialSlider() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      text: "These products transformed my skincare routine. Simple, effective, and beautiful.",
      author: "— Emma L.",
    },
    {
      text: "The perfect balance of luxury and simplicity. My skin has never felt better.",
      author: "— Sarah J.",
    },
    {
      text: "Essence understands that beauty doesn't need to be complicated to be effective.",
      author: "— Maya T.",
    },
  ];

  useEffect(() => {
    const interval = setInterval(
      () => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length),
      5000
    );
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section className="testimonials">
      <h2 className="section-title reveal">What Our Customers Say</h2>
      <div className="testimonial-slider">
        {testimonials.map((t, index) => (
          <div key={index} className={`testimonial ${index === currentTestimonial ? "active" : ""}`}>
            <p>"{t.text}"</p>
            <span className="author">{t.author}</span>
          </div>
        ))}
        <div className="dots">
          {testimonials.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentTestimonial ? "active" : ""}`}
              onClick={() => setCurrentTestimonial(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
