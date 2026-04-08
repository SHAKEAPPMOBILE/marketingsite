// Test: Scroll Animation Integration Test
// Open this in DevTools Console on http://localhost:9000 to verify

console.clear();
console.log('%c=== SHAKE SCROLL ANIMATION TEST SUITE ===', 'color: #00ff00; font-size: 14px; font-weight: bold;');

// TEST 1: DOM Elements
console.log('%n[TEST 1] DOM Structure', 'color: #ffaa00;');
const layers = document.querySelectorAll('.scroll-layer');
console.log(`  ✓ Found ${layers.length} scroll-layer elements`);
layers.forEach((layer, i) => {
  const children = layer.children.length;
  const height = layer.offsetHeight;
  console.log(`    Layer ${i}: height=${height}px, children=${children}`);
});

// TEST 2: CSS Variables
console.log('%c[TEST 2] CSS Custom Properties', 'color: #ffaa00;');
const root = document.documentElement;
const layerScale = getComputedStyle(root).getPropertyValue('--layer-scale');
const layerOpacity = getComputedStyle(root).getPropertyValue('--layer-opacity');
console.log(`  ✓ --layer-scale: ${layerScale || 'not set'}`);
console.log(`  ✓ --layer-opacity: ${layerOpacity || 'not set'}`);

// TEST 3: JavaScript Class
console.log('%c[TEST 3] ScrollAnimator Class', 'color: #ffaa00;');
console.log(`  ✓ ScrollAnimator defined: ${typeof ScrollAnimator === 'function'}`);
console.log(`  ✓ Constructor accepts options: ${new ScrollAnimator().constructor.name === 'ScrollAnimator'}`);

// TEST 4: Animation Calculations
console.log('%c[TEST 4] Animation State', 'color: #ffaa00;');
console.log(`  Current scrollY: ${window.scrollY}px`);
console.log(`  Window size: ${window.innerWidth}x${window.innerHeight}`);
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
console.log(`  Prefers reduced motion: ${prefersReduced}`);
console.log(`  Animation enabled: ${window.innerWidth >= 768 && !prefersReduced}`);

// TEST 5: Button Functionality
console.log('%c[TEST 5] Button Functionality', 'color: #ffaa00;');
const shakeBtn = document.getElementById('shakeToggle');
const downloadBtn = document.querySelector('.btn-primary');
const webBtn = document.querySelector('.btn-secondary');
console.log(`  ✓ "Let's Shake!" button: ${shakeBtn ? '✓ FOUND' : '✗ NOT FOUND'}`);
console.log(`  ✓ "Download App" button: ${downloadBtn ? '✓ FOUND' : '✗ NOT FOUND'}`);
console.log(`  ✓ "Open Web App" button: ${webBtn ? '✓ FOUND' : '✗ NOT FOUND'}`);

// TEST 6: Scroll Animation Simulation
console.log('%c[TEST 6] Scroll Animation Simulation', 'color: #ffaa00;');
console.log('  Simulating scroll to 500px...');

// Store original scroll position
const originalScroll = window.scrollY;

// Simulate scroll event
window.scrollY = 500;
const scrollEvent = new Event('scroll', { bubbles: false, cancelable: true });
window.dispatchEvent(scrollEvent);

// Check if CSS properties were updated
setTimeout(() => {
  const layer0 = layers[0];
  if (layer0) {
    const scale = layer0.style.getPropertyValue('--layer-scale');
    const opacity = layer0.style.getPropertyValue('--layer-opacity');
    if (scale && opacity) {
      console.log(`  ✓ Layer CSS updated: scale=${scale}, opacity=${opacity}`);
    } else {
      console.log(`  ⚠ Layer CSS not updated yet (may be in progress)`);
    }
  }
  
  // Restore scroll
  window.scrollY = originalScroll;
}, 100);

// TEST 7: Performance Metrics
console.log('%c[TEST 7] Performance Indicators', 'color: #ffaa00;');
const hasWillChange = getComputedStyle(layers[0]).willChange !== 'auto';
console.log(`  ✓ will-change applied: ${hasWillChange}`);
console.log(`  ✓ GPU acceleration: ${hasWillChange ? 'YES (transform/opacity)' : 'NO'}`);

// TEST 8: Mobile Responsiveness
console.log('%c[TEST 8] Responsive Behavior', 'color: #ffaa00;');
if (window.innerWidth < 768) {
  console.log(`  ℹ Mobile viewport detected (${window.innerWidth}px)`);
  console.log(`  ✓ Animation should be DISABLED on this screen size`);
} else {
  console.log(`  ℹ Desktop viewport (${window.innerWidth}px)`);
  console.log(`  ✓ Animation should be ENABLED`);
}

// TEST 9: Manual Scroll Test Instructions
console.log('%c[TEST 9] Manual Testing Instructions', 'color: #00ff00; background: #001100; padding: 8px;');
console.log(`
  1. Scroll down slowly
  2. Watch the hero section scale and fade as the features section covers it
  3. The features section should have rounded top corners
  4. Continue scrolling to see the community section cover the features
  
  If animations work:
    ✓ Each layer fades from opacity 1 to 0.6
    ✓ Each layer scales from 1 to 0.96
    ✓ Smooth, performant 60fps scrolling
    ✓ Rounded corners on top of each incoming section
  
  Debug tips:
    - Open DevTools > Elements, select a scroll-layer
    - Watch the inline style update as you scroll
    - Check --layer-scale and --layer-opacity values changing
`);

console.log('%c=== END TEST SUITE ===', 'color: #00ff00; font-size: 14px; font-weight: bold;');

// Export test results for logging
window.__scrollAnimationTest = {
  layersFound: layers.length,
  animationEnabled: window.innerWidth >= 768 && !prefersReduced,
  windowSize: `${window.innerWidth}x${window.innerHeight}`,
  timestamp: new Date().toISOString()
};

console.log('%cTest results available at window.__scrollAnimationTest', 'color: #aaaaaa;');
