import React, { useState, useEffect } from 'react';

export default function OnboardingTour({ steps, tourKey }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    // Check if the user has already seen the tour for this specific context
    const hasSeenTour = localStorage.getItem(`tour_completed_${tourKey}`);
    if (!hasSeenTour && steps && steps.length > 0) {
      setIsVisible(true);
      setCurrentStep(0); // Reset step when tourKey changes
    }
  }, [tourKey, steps]);

  useEffect(() => {
    if (!isVisible || !steps[currentStep]) return;

    const updatePosition = () => {
      const targetSelector = steps[currentStep].target;
      const element = document.querySelector(targetSelector);
      if (element) {
        // Scroll element into view smoothly if not visible
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Give a little time for scroll to finish
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
        }, 300);
      } else {
        // If element not found, just center the modal
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(`tour_completed_${tourKey}`, 'true');
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible || !steps[currentStep]) return null;

  const step = steps[currentStep];

  // Calculate tooltip position based on targetRect
  let tooltipStyle = {
    position: 'fixed',
    zIndex: 100001,
    background: '#1e293b',
    border: '1px solid #3b82f6',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(59, 130, 246, 0.5)',
    borderRadius: '12px',
    padding: '1.5rem',
    width: '320px',
    color: '#fff',
    transition: 'all 0.3s ease-out'
  };

  if (targetRect) {
    // Basic positioning (trying to place it below the target, or fallback to center)
    const placement = step.placement || 'bottom';
    const margin = 15;
    
    if (placement === 'bottom') {
      tooltipStyle.top = `${targetRect.top + targetRect.height + margin}px`;
      tooltipStyle.left = `${targetRect.left + (targetRect.width / 2) - 160}px`;
    } else if (placement === 'top') {
      tooltipStyle.top = `${targetRect.top - margin - 200}px`; // Approx height 200px
      tooltipStyle.left = `${targetRect.left + (targetRect.width / 2) - 160}px`;
    } else if (placement === 'right') {
      tooltipStyle.top = `${targetRect.top + (targetRect.height / 2) - 100}px`;
      tooltipStyle.left = `${targetRect.left + targetRect.width + margin}px`;
    } else if (placement === 'left') {
      tooltipStyle.top = `${targetRect.top + (targetRect.height / 2) - 100}px`;
      tooltipStyle.left = `${targetRect.left - margin - 320}px`;
    }

    // Keep within bounds
    const maxTop = window.innerHeight - 250;
    const maxLeft = window.innerWidth - 340;
    
    // Parse currently assigned values safely
    const currentTop = parseFloat(tooltipStyle.top) || 0;
    const currentLeft = parseFloat(tooltipStyle.left) || 0;
    
    tooltipStyle.top = `${Math.max(10, Math.min(currentTop, maxTop))}px`;
    tooltipStyle.left = `${Math.max(10, Math.min(currentLeft, maxLeft))}px`;

  } else {
    // Center if no target
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(10, 15, 24, 0.7)',
        zIndex: 100000,
        transition: 'opacity 0.3s',
        pointerEvents: 'auto' // block clicks
      }}></div>

      {/* Target Highlight (Optional Spotlight effect) */}
      {targetRect && (
        <div style={{
          position: 'fixed',
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          borderRadius: '8px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5), 0 0 15px 2px #3b82f6',
          zIndex: 100000, // Same level as overlay, but uses box-shadow to punch a hole
          pointerEvents: 'none',
          transition: 'all 0.3s ease-out'
        }}></div>
      )}

      {/* Tooltip Modal */}
      <div style={tooltipStyle} className="onboarding-tooltip" onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#60a5fa' }}>{step.title}</h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#334155', padding: '2px 8px', borderRadius: '12px' }}>
            {currentStep + 1} / {steps.length}
          </span>
        </div>
        
        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', lineHeight: '1.5', color: '#cbd5e1' }}>
          {step.content}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={handleSkip}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem' }}
          >
            Пропустить
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                style={{ background: '#334155', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Назад
              </button>
            )}
            <button 
              onClick={handleNext}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
            >
              {currentStep === steps.length - 1 ? 'Готово ✓' : 'Далее →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
