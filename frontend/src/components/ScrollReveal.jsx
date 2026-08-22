import React, { useState, useEffect, useRef } from 'react';

export default function ScrollReveal({
  children,
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'zoom'
  delay = 0,
  duration = 600,
  threshold = 0.02, // Low threshold so elements trigger easily
  distance = '30px',
  blur = false,
  once = false,
  className = '',
  style = {}
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });
  const domRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // If mobile or no IntersectionObserver, force visible to prevent blank screens on phones
    if (isMobile || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const node = domRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: threshold,
        rootMargin: '40px 0px 40px 0px',
      }
    );

    observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
    };
  }, [threshold, once, isMobile]);

  const getHiddenTransform = () => {
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}, 0) scale(0.98)`;
      case 'down':
        return `translate3d(0, -${distance}, 0) scale(0.98)`;
      case 'left':
        return `translate3d(${distance}, 0, 0) scale(0.98)`;
      case 'right':
        return `translate3d(-${distance}, 0, 0) scale(0.98)`;
      case 'zoom':
        return 'translate3d(0, 0, 0) scale(0.92)';
      default:
        return `translate3d(0, ${distance}, 0) scale(0.98)`;
    }
  };

  const hiddenStyle = {
    opacity: isMobile ? 1 : 0,
    transform: isMobile ? 'none' : getHiddenTransform(),
    filter: blur && !isMobile ? 'blur(4px)' : 'none',
  };

  const visibleStyle = {
    opacity: 1,
    transform: 'translate3d(0, 0, 0) scale(1)',
    filter: 'blur(0px)',
  };

  const transitionStyle = {
    transition: isMobile
      ? 'opacity 0.3s ease, transform 0.3s ease'
      : `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: 'opacity, transform',
  };

  return (
    <div
      ref={domRef}
      className={`scroll-reveal-container ${className}`}
      style={{
        ...transitionStyle,
        ...(isVisible || isMobile ? visibleStyle : hiddenStyle),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
