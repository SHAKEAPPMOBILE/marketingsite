/**
 * ScrollAnimator - Creandum-style scroll animation system
 * Creates sticky section stacking with fade/scale effects as layers scroll over each other
 */

class ScrollAnimator {
  constructor(options = {}) {
    this.options = {
      minScreenWidth: 768, // mobile breakpoint
      scaleRange: { start: 1, end: 0.96 }, // scale from 1 to 0.96
      opacityRange: { start: 1, end: 0.6 }, // fade from 1 to 0.6
      ...options
    };
    
    this.layers = [];
    this.isEnabled = this.shouldEnable();
    this.scrollY = 0;
    
    if (!this.isEnabled) return;
    
    this.init();
  }
  
  /**
   * Determine if scroll animation should be enabled
   * Checks: screen size and prefers-reduced-motion
   */
  shouldEnable() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    
    // Check screen width (disable on mobile)
    if (window.innerWidth < this.options.minScreenWidth) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Initialize the scroll animator
   */
  init() {
    this.collectLayers();
    this.setupScrollListener();
    this.handleResize();
    this.update(); // Initial frame
  }
  
  /**
   * Collect all sections with class 'scroll-layer'
   */
  collectLayers() {
    const elements = document.querySelectorAll('.scroll-layer');
    
    this.layers = Array.from(elements).map((el, index) => {
      return {
        element: el,
        index: index,
        offsetTop: 0,
        height: 0,
        updateLayout: () => {
          this.updateLayout();
        }
      };
    });
    
    this.updateLayout();
  }
  
  /**
   * Update layout measurements for all layers
   */
  updateLayout() {
    this.layers.forEach((layer) => {
      layer.offsetTop = layer.element.offsetTop;
      layer.height = layer.element.offsetHeight;
    });
  }
  
  /**
   * Setup scroll event listener with throttling
   */
  setupScrollListener() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY;
      
      if (!ticking) {
        requestAnimationFrame(() => {
          this.update();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
  
  /**
   * Handle window resize - recalculate and potentially toggle animation
   */
  handleResize() {
    window.addEventListener('resize', () => {
      // Check if we should still be enabled
      const wasEnabled = this.isEnabled;
      this.isEnabled = this.shouldEnable();
      
      if (!wasEnabled && this.isEnabled) {
        // Re-enable animation on resize to larger screen
        this.collectLayers();
        this.update();
      } else if (wasEnabled && !this.isEnabled) {
        // Disable animation on resize to smaller screen
        this.resetAllLayers();
      } else if (this.isEnabled) {
        // Recalculate layout on resize
        this.collectLayers();
        this.update();
      }
    });
  }
  
  /**
   * Update all layer animations
   */
  update() {
    if (!this.isEnabled) return;
    
    this.layers.forEach((layer, layerIndex) => {
      // Calculate scroll progress for this layer
      // A layer starts being covered when the next layer scrolls into view
      // The animation progresses as the next layer covers this one
      
      // Get the next layer (the one covering this layer)
      const nextLayer = this.layers[layerIndex + 1];
      
      if (!nextLayer) {
        // Last layer - no animation/always visible
        this.setLayerValues(layer, 1, 1);
        return;
      }
      
      const nextLayerOffsetTop = nextLayer.offsetTop;
      const currentLayerHeight = layer.height;
      
      // Animation range:
      // - Start: when next layer top edge reaches viewport top (scrollY = nextLayerOffsetTop)
      // - End: when next layer has fully covered this layer (scrollY = nextLayerOffsetTop + currentLayerHeight)
      const animationStart = nextLayerOffsetTop;
      const animationEnd = nextLayerOffsetTop + currentLayerHeight;
      
      // Calculate progress (0 to 1)
      let progress = 0;
      
      if (this.scrollY >= animationStart && this.scrollY < animationEnd) {
        // We're in the middle of the animation
        progress = (this.scrollY - animationStart) / (animationEnd - animationStart);
      } else if (this.scrollY >= animationEnd) {
        // Animation is complete
        progress = 1;
      }
      // else: progress stays 0 (animation hasn't started)
      
      // Clamp progress to 0-1 to be safe
      progress = Math.max(0, Math.min(1, progress));
      
      // Calculate scale and opacity from progress
      const scale = this.interpolate(
        this.options.scaleRange.start,
        this.options.scaleRange.end,
        progress
      );
      
      const opacity = this.interpolate(
        this.options.opacityRange.start,
        this.options.opacityRange.end,
        progress
      );
      
      this.setLayerValues(layer, scale, opacity);
    });
  }
  
  /**
   * Set CSS custom properties on a layer
   */
  setLayerValues(layer, scale, opacity) {
    layer.element.style.setProperty('--layer-scale', scale);
    layer.element.style.setProperty('--layer-opacity', opacity);
  }
  
  /**
   * Reset all layers to initial state
   */
  resetAllLayers() {
    this.layers.forEach((layer) => {
      this.setLayerValues(layer, 1, 1);
    });
  }
  
  /**
   * Linear interpolation between two values
   */
  interpolate(start, end, progress) {
    return start + (end - start) * progress;
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ScrollAnimator();
  });
} else {
  new ScrollAnimator();
}
