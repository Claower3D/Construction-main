import React, { useState, useEffect, useRef } from 'react';

export default function ScrollReveal({
  children,
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'zoom'
  delay = 0, // delay in ms
  duration = 750, // duration in ms
  threshold = 0.12, // 12% in view triggers reveal
  distance = '40px',
  blur = true,
  className = '',
  style = {}
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const node = domRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Toggle visibility smoothly both on enter and exit
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
    };
  }, [threshold]);

  const getHiddenTransform = () => {
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}, 0) scale(0.97)`;
      case 'down':
        return `translate3d(0, -${distance}, 0) scale(0.97)`;
      case 'left':
        return `translate3d(${distance}, 0, 0) scale(0.97)`;
      case 'right':
        return `translate3d(-${distance}, 0, 0) scale(0.97)`;
      case 'zoom':
        return 'translate3d(0, 0, 0) scale(0.90)';
      default:
        return `translate3d(0, ${distance}, 0) scale(0.97)`;
    }
  };

  const hiddenStyle = {
    opacity: 0,
    transform: getHiddenTransform(),
    filter: blur ? 'blur(6px)' : 'none',
  };

  const visibleStyle = {
    opacity: 1,
    transform: 'translate3d(0, 0, 0) scale(1)',
    filter: 'blur(0px)',
  };

  const transitionStyle = {
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: 'opacity, transform, filter',
  };

  return (
    <div
      ref={domRef}
      className={`scroll-reveal-container ${className}`}
      style={{
        ...transitionStyle,
        ...(isVisible ? visibleStyle : hiddenStyle),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
