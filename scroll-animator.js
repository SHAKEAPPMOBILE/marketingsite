/**
 * ScrollAnimator - Creandum-style scroll animation system
 * Creates sticky section stacking with fade/scale effects as layers scroll over each other
 */

class ScrollAnimator {
  constructor(options = {}) {
    this.options = {
      minScreenWidth: 768, // mobile breakpoint
      scaleRange: { start: 1, end: 0.94 }, // scale from 1 to 0.94
      opacityRange: { start: 1, end: 0.45 }, // fade from 1 to 0.45
      ...options
    };
    
    this.layers = [];
    this.visibleLayers = new Set();
    this.observer = null;
    this.rafId = 0;
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
    this.setupObserver();
    this.setupScrollListener();
    this.handleResize();
    this.requestTick();
  }
  
  /**
   * Collect all sections with class 'scroll-layer'
   */
  collectLayers() {
    const elements = document.querySelectorAll('.scroll-layer');
    
    this.layers = Array.from(elements).map((el, index) => {
      el.dataset.layerIndex = String(index);
      el.style.zIndex = String(index + 1);

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

  setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.visibleLayers.clear();

    if (!('IntersectionObserver' in window)) {
      this.layers.forEach((layer) => this.visibleLayers.add(layer.index));
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const idx = Number(entry.target.dataset.layerIndex);
        if (entry.isIntersecting) {
          this.visibleLayers.add(idx);
        } else {
          this.visibleLayers.delete(idx);
        }
      });
      this.requestTick();
    }, {
      root: null,
      rootMargin: '150% 0px 150% 0px',
      threshold: 0
    });

    this.layers.forEach((layer) => this.observer.observe(layer.element));
  }
  
  /**
   * Setup scroll event listener with throttling
   */
  setupScrollListener() {
    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY;
      this.requestTick();
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
        this.setupObserver();
        this.requestTick();
      } else if (wasEnabled && !this.isEnabled) {
        // Disable animation on resize to smaller screen
        this.resetAllLayers();
      } else if (this.isEnabled) {
        // Recalculate layout on resize
        this.collectLayers();
        this.requestTick();
      }
    });
  }

  requestTick() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.update();
    });
  }
  
  /**
   * Update all layer animations
   */
  update() {
    if (!this.isEnabled) return;
    const viewportHeight = Math.max(window.innerHeight, 1);
    const heroButton = document.getElementById('shakeToggle');
    const heroButtonRow = heroButton ? heroButton.closest('.cta-row') : null;
    const heroButtonViewport = document.querySelector('.hero-cta-viewport');
    
    this.layers.forEach((layer, layerIndex) => {
      const nextLayer = this.layers[layerIndex + 1];
      
      if (!nextLayer) {
        this.setLayerValues(layer, 1, 1);
        return;
      }

      if (
        this.visibleLayers.size &&
        !this.visibleLayers.has(layerIndex) &&
        !this.visibleLayers.has(layerIndex + 1)
      ) {
        return;
      }
      
      const nextLayerTop = nextLayer.element.getBoundingClientRect().top;

      // Progress:
      // next layer at viewport bottom (top=vh) -> 0
      // next layer at viewport top (top=0) -> 1
      let progress = (viewportHeight - nextLayerTop) / viewportHeight;
      progress = Math.max(0, Math.min(1, progress));
      progress = this.easeOutCubic(progress);
      
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

      if (layerIndex === 0 && heroButton && heroButtonViewport) {
        const safeOpacity = opacity <= 0 ? 1 : 1 / opacity;
        heroButton.style.opacity = '1';
        heroButton.style.filter = 'none';
        heroButtonViewport.style.opacity = '1';
        heroButtonViewport.style.transform = 'translateX(-50%)';
        if (heroButtonRow) {
          heroButtonRow.style.opacity = '1';
          heroButtonRow.style.transform = 'none';
        }
        heroButton.style.transform = 'scale(' + Math.max(1, safeOpacity).toFixed(3) + ')';
      }
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

  easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
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
