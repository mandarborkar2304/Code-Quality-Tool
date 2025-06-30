// Enhanced scrolling utilities for better UX

export interface ScrollOptions {
  behavior?: 'smooth' | 'auto';
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
}

export class ScrollUtils {
  /**
   * Smooth scroll to element with enhanced options
   */
  static scrollToElement(
    element: HTMLElement, 
    options: ScrollOptions = { behavior: 'smooth', block: 'center' }
  ): void {
    element.scrollIntoView(options);
  }

  /**
   * Scroll to top of container
   */
  static scrollToTop(
    container: HTMLElement, 
    smooth: boolean = true
  ): void {
    container.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  /**
   * Scroll to bottom of container
   */
  static scrollToBottom(
    container: HTMLElement, 
    smooth: boolean = true
  ): void {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  /**
   * Scroll horizontally to position
   */
  static scrollToHorizontal(
    container: HTMLElement,
    left: number,
    smooth: boolean = true
  ): void {
    container.scrollTo({
      left,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  /**
   * Check if element is in viewport
   */
  static isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Get current scroll position as percentage
   */
  static getScrollPercentage(container: HTMLElement): {
    vertical: number;
    horizontal: number;
  } {
    const verticalPercentage = (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;
    const horizontalPercentage = (container.scrollLeft / (container.scrollWidth - container.clientWidth)) * 100;
    
    return {
      vertical: Math.min(100, Math.max(0, verticalPercentage || 0)),
      horizontal: Math.min(100, Math.max(0, horizontalPercentage || 0))
    };
  }

  /**
   * Set scroll position by percentage
   */
  static setScrollByPercentage(
    container: HTMLElement,
    vertical?: number,
    horizontal?: number,
    smooth: boolean = true
  ): void {
    const scrollTop = vertical !== undefined 
      ? (vertical / 100) * (container.scrollHeight - container.clientHeight)
      : container.scrollTop;
      
    const scrollLeft = horizontal !== undefined
      ? (horizontal / 100) * (container.scrollWidth - container.clientWidth)
      : container.scrollLeft;

    container.scrollTo({
      top: scrollTop,
      left: scrollLeft,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  /**
   * Smooth scroll with momentum (for better UX)
   */
  static smoothScrollWithMomentum(
    container: HTMLElement,
    deltaX: number = 0,
    deltaY: number = 0,
    duration: number = 300
  ): void {
    const startTime = performance.now();
    const startScrollTop = container.scrollTop;
    const startScrollLeft = container.scrollLeft;

    const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      container.scrollTop = startScrollTop + (deltaY * easedProgress);
      container.scrollLeft = startScrollLeft + (deltaX * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }

  /**
   * Enhanced scrollbar styling
   */
  static applyCustomScrollbarStyles(element: HTMLElement): void {
    element.classList.add('custom-scrollbar');
  }

  /**
   * Auto-hide scrollbar with fade effect
   */
  static setupAutoHideScrollbar(element: HTMLElement): () => void {
    let hideTimeout: NodeJS.Timeout;
    
    const showScrollbar = () => {
      element.style.setProperty('--scrollbar-opacity', '1');
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        element.style.setProperty('--scrollbar-opacity', '0.3');
      }, 1500);
    };

    const handleScroll = () => showScrollbar();
    const handleMouseEnter = () => showScrollbar();
    const handleMouseLeave = () => {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        element.style.setProperty('--scrollbar-opacity', '0.3');
      }, 500);
    };

    // Add CSS custom property
    element.style.setProperty('--scrollbar-opacity', '0.3');
    element.style.transition = 'scrollbar-color 0.3s ease';

    element.addEventListener('scroll', handleScroll);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup function
    return () => {
      element.removeEventListener('scroll', handleScroll);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(hideTimeout);
    };
  }

  /**
   * Sync scroll between multiple elements
   */
  static syncScroll(
    sourceElement: HTMLElement,
    targetElements: HTMLElement[],
    options: { horizontal?: boolean; vertical?: boolean } = { vertical: true }
  ): () => void {
    const handleScroll = () => {
      const sourceTop = sourceElement.scrollTop;
      const sourceLeft = sourceElement.scrollLeft;

      targetElements.forEach(target => {
        if (options.vertical) {
          target.scrollTop = sourceTop;
        }
        if (options.horizontal) {
          target.scrollLeft = sourceLeft;
        }
      });
    };

    sourceElement.addEventListener('scroll', handleScroll);

    return () => {
      sourceElement.removeEventListener('scroll', handleScroll);
    };
  }

  /**
   * Virtual scrolling helper for large lists
   */
  static createVirtualScrollHandler(
    container: HTMLElement,
    itemHeight: number,
    totalItems: number,
    renderItem: (index: number, top: number) => HTMLElement
  ): {
    update: () => void;
    cleanup: () => void;
  } {
    const viewport = container;
    const content = document.createElement('div');
    content.style.height = `${totalItems * itemHeight}px`;
    content.style.position = 'relative';
    
    viewport.appendChild(content);

    const visibleItems = new Map<number, HTMLElement>();

    const update = () => {
      const scrollTop = viewport.scrollTop;
      const viewportHeight = viewport.clientHeight;
      
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        totalItems - 1,
        Math.ceil((scrollTop + viewportHeight) / itemHeight)
      );

      // Remove items that are no longer visible
      visibleItems.forEach((element, index) => {
        if (index < startIndex || index > endIndex) {
          element.remove();
          visibleItems.delete(index);
        }
      });

      // Add new visible items
      for (let i = startIndex; i <= endIndex; i++) {
        if (!visibleItems.has(i)) {
          const item = renderItem(i, i * itemHeight);
          item.style.position = 'absolute';
          item.style.top = `${i * itemHeight}px`;
          item.style.width = '100%';
          content.appendChild(item);
          visibleItems.set(i, item);
        }
      }
    };

    const handleScroll = () => {
      requestAnimationFrame(update);
    };

    viewport.addEventListener('scroll', handleScroll);
    update(); // Initial render

    return {
      update,
      cleanup: () => {
        viewport.removeEventListener('scroll', handleScroll);
        content.remove();
        visibleItems.clear();
      }
    };
  }
}

// Export individual functions for convenience
export const {
  scrollToElement,
  scrollToTop,
  scrollToBottom,
  scrollToHorizontal,
  isElementInViewport,
  getScrollPercentage,
  setScrollByPercentage,
  smoothScrollWithMomentum,
  applyCustomScrollbarStyles,
  setupAutoHideScrollbar,
  syncScroll,
  createVirtualScrollHandler
} = ScrollUtils;