import React, { useEffect, useRef, useState } from 'react';

interface VantaBackgroundProps {
  effect?: 'DOTS' | 'WAVES' | 'NET' | 'BIRDS';
  className?: string;
  options?: Record<string, any>;
}

declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

const VantaBackground: React.FC<VantaBackgroundProps> = ({ 
  effect = 'DOTS', 
  className = '', 
  options = {} 
}) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    let effect: any = null;

    const initVanta = () => {
      if (!vantaRef.current || !window.VANTA || !window.THREE) {
        return;
      }

      // Check if we're in dark mode
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                        window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Default options for different effects
      const defaultOptions = {
        DOTS: {
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 0.8,
          size: isDarkMode ? 4.2 : 3.9,
          spacing: isDarkMode ? 26.00 : 24.00,
          showLines: false,
          color: isDarkMode ? 0x3b82f6 : 0x6366f1,
          backgroundColor: isDarkMode ? 0x0f0f23 : 0x1e1e2e,
        },
        WAVES: {
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 0.8,
          color: isDarkMode ? 0x1a1a3a : 0x2d3748,
          shininess: 30.00,
          waveHeight: 15.00,
          waveSpeed: 1.00,
          zoom: 0.75,
        },
        NET: {
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 0.8,
          color: isDarkMode ? 0x3b82f6 : 0x6366f1,
          backgroundColor: isDarkMode ? 0x0f0f23 : 0x1e1e2e,
          points: 8.00,
          maxDistance: 20.00,
          spacing: 15.00,
        },
        BIRDS: {
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 0.8,
          backgroundColor: isDarkMode ? 0x0f0f23 : 0x1e1e2e,
          birdSize: 1.2,
          wingSpan: 20.00,
          speedLimit: 5.00,
          separation: 20.00,
          alignment: 20.00,
          cohesion: 20.00,
        }
      };

      const effectOptions = {
        el: vantaRef.current,
        THREE: window.THREE,
        ...defaultOptions[effect],
        ...options
      };

      if (window.VANTA[effect]) {
        effect = window.VANTA[effect](effectOptions);
        setVantaEffect(effect);
      }
    };

    // Initialize when libraries are loaded
    const checkAndInit = () => {
      if (window.VANTA && window.THREE) {
        initVanta();
      } else {
        // Retry after a short delay
        setTimeout(checkAndInit, 100);
      }
    };

    checkAndInit();

    // Handle theme changes
    const handleThemeChange = () => {
      if (effect) {
        effect.destroy();
      }
      setTimeout(initVanta, 100);
    };

    // Observer for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addListener(handleThemeChange);

    return () => {
      if (effect) {
        effect.destroy();
      }
      observer.disconnect();
      mediaQuery.removeListener(handleThemeChange);
      setVantaEffect(null);
    };
  }, [effect, options]);

  return (
    <div 
      ref={vantaRef}
      className={`fixed inset-0 z-[-1] pointer-events-none ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #0f0f23 100%)'
      }}
    />
  );
};

export default VantaBackground;