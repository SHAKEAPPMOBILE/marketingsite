# Shake Marketing Site - Scroll Animation Implementation

## Overview
A Creandum-style scroll animation system has been implemented for the Shake marketing site. This creates sticky section stacking with fade/scale effects as layers scroll over each other.

## Implementation Details

### Files Added/Modified

#### 1. `scroll-animator.js` (NEW)
A standalone JavaScript class that:
- Detects and collects all elements with class `scroll-layer`
- Tracks scroll position with throttled requestAnimationFrame
- Calculates animation progress as each layer is covered by the next
- Updates CSS custom properties (`--layer-scale`, `--layer-opacity`)
- Respects `prefers-reduced-motion` media query
- Automatically disables on screens < 768px width
- Recalculates layout on window resize

**Key Methods:**
- `shouldEnable()`: Checks screen size and motion preferences
- `collectLayers()`: Finds all scroll-layer elements
- `update()`: Calculates and applies animations each frame
- `setLayerValues()`: Sets CSS custom properties
- `interpolate()`: Linear easing function

#### 2. `index.html` (MODIFIED)

**CSS Changes:**
- Added CSS custom properties to `:root`: `--layer-scale: 1`, `--layer-opacity: 1`
- Added `.scroll-layer` base styles:
  - `position: sticky` with `top: 0`
  - `min-height: 100vh`
  - `transform: scale(var(--layer-scale, 1))`
  - `opacity: var(--layer-opacity, 1)`
  - `transform-origin: top center`
  - `will-change: transform, opacity` (performance)
  - `border-radius: 20px 20px 0 0` (card stacking effect)
  - `overflow: hidden` (content clipping during scale)

- Mobile & accessibility overrides:
  - `@media (prefers-reduced-motion: reduce)`: Disables animation, removes border-radius
  - `@media (max-width: 767px)`: Disables animation, uses relative positioning

**HTML Structure Changes:**
- Wrapped hero section (`div.wrapper.hero-section`) with `<section class="scroll-layer">`
- Wrapped gradient/features section (`div.gradient-section`) with `<section class="scroll-layer">`
- Added `<script src="scroll-animator.js"></script>` before closing `</body>`

### Animation Behavior

**Layer Stacking:**
1. Each `scroll-layer` becomes sticky at `top: 0`
2. As you scroll, the next layer slides UP over the current one
3. The covered layer scales down (1 → 0.96) and fades (1 → 0.6)
4. Animation completes when the next layer fully covers it

**Progress Calculation:**
```
Layer N animation starts when: scrollY = Layer(N+1).offsetTop
Layer N animation ends when: scrollY = Layer(N+1).offsetTop + Layer(N).height
Progress = (scrollY - startPoint) / (endPoint - startPoint)
```

**CSS Properties:**
```css
.scroll-layer {
  transform: scale(var(--layer-scale));  /* 1 → 0.96 */
  opacity: var(--layer-opacity);         /* 1 → 0.6 */
}
```

### Performance Optimizations

1. **Throttled Scroll Events**: Uses `requestAnimationFrame` to limit updates to screen refresh rate
2. **Transform-only Animations**: Uses `transform: scale()` and `opacity` (GPU accelerated)
3. **will-change: transform, opacity**: Hints to browser for optimization
4. **Passive Event Listeners**: `{ passive: true }` on scroll listener
5. **No layout thrashing**: Calculates all values before applying

### Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation on:
  - Mobile devices (< 768px) - shows normal scroll
  - Users with `prefers-reduced-motion: reduce` - shows normal scroll, no animation
  - Older browsers without CSS custom properties - shows normal scroll

### Mobile Responsiveness

The animation automatically disables on:
- Screens smaller than 768px
- When user has enabled `prefers-reduced-motion` system setting

On these cases, pages display with normal scroll behavior, preserving full functionality.

### Testing Checklist

- ✅ Scroll animation CSS applied correctly
- ✅ Scroll animator JavaScript loaded
- ✅ Two scroll-layer sections present
- ✅ CSS custom properties support
- ✅ Syntax validated
- ✅ No console errors
- ✅ Page loads on localhost:9000
- ✅ All existing functionality preserved:
  - Navigation links work
  - CTA buttons functional
  - Download links accessible
  - Phone carousel animations unchanged
  - Avatar badges display correctly

### Customization

To adjust animation parameters, edit `scroll-animator.js`:

```javascript
new ScrollAnimator({
  minScreenWidth: 768,        // Mobile breakpoint
  scaleRange: { start: 1, end: 0.96 },     // Scale animation
  opacityRange: { start: 1, end: 0.6 }     // Opacity animation
});
```

Or modify CSS in `index.html`:
```css
:root {
  --layer-scale: 1;      /* Start scale */
  --layer-opacity: 1;    /* Start opacity */
}
```

### Known Considerations

1. **Nested Sections**: HTML has semantic `<section class="hero">` nested inside `<section class="scroll-layer">` - this is valid and improves semantics
2. **Sticky Positioning**: Modern browsers handle sticky positioning well; for older browsers it falls back to relative positioning
3. **Z-index**: Sticky layers naturally stack due to their positioning context
4. **Touch Devices**: Works perfectly with touch/scroll gestures

## Files Structure

```
marketingsite/
├── index.html                 # Main page (modified)
├── scroll-animator.js         # NEW: Animation system
├── test-scroll.html          # NEW: Simple test page
└── assets/
    ├── icons/
    ├── ...images...
    └── ...mockups...
```

## How It Works: Step by Step

1. **Page Load**: `scroll-animator.js` initializes automatically
2. **Layer Collection**: Finds all `<section class="scroll-layer">` elements
3. **Layout Measurement**: Records `offsetTop` and height of each layer
4. **Scroll Listening**: Attaches throttled scroll listener
5. **Animation**: On each scroll frame:
   - Calculates scrollY position
   - For each layer, determines if it's being covered
   - Calculates progress (0-1) based on scroll position
   - Updates CSS variables:
     - `--layer-scale`: Interpolates from 1 to 0.96
     - `--layer-opacity`: Interpolates from 1 to 0.6
6. **Visual Effect**: Browser applies transforms, creating the fade/scale effect

## Troubleshooting

**Animation not working?**
- Check window width >= 768px
- Verify `prefers-reduced-motion` is not enabled in system settings
- Open DevTools: `document.querySelectorAll('.scroll-layer')` should show 2 elements
- Check console for any JavaScript errors

**Performance issues?**
- Verify `will-change` is applied (in DevTools, inspect element)
- Check that only `transform` and `opacity` are being animated
- Consider reducing viewport size to increase frame rate

**Buttons/links not working?**
- Click behavior preserved through sticky positioning
- All event handlers maintained
- Links should open in new tabs normally

## Future Enhancements

Potential improvements:
1. Add easing functions (ease-out, cubic-bezier)
2. Customizable layer animation ranges
3. Per-layer animation timing
4. Stagger effect for multiple layers
5. Parallax scroll variant
6. Support for additional layer animations (blur, rotate, etc)
