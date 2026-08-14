---
name: WGO Talent Platform
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fd'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1ec'
  on-surface: '#1a1b22'
  on-surface-variant: '#444653'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1effa'
  outline: '#747684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3456c1'
  primary: '#00216e'
  on-primary: '#ffffff'
  primary-container: '#0033a0'
  on-primary-container: '#8ea6ff'
  inverse-primary: '#b6c4ff'
  secondary: '#954a00'
  on-secondary: '#ffffff'
  secondary-container: '#fd8100'
  on-secondary-container: '#5d2c00'
  tertiary: '#002c40'
  on-tertiary: '#ffffff'
  tertiary-container: '#00435f'
  on-tertiary-container: '#31b4f2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001550'
  on-primary-fixed-variant: '#133ca8'
  secondary-fixed: '#ffdcc6'
  secondary-fixed-dim: '#ffb785'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#723700'
  tertiary-fixed: '#c6e7ff'
  tertiary-fixed-dim: '#81cfff'
  on-tertiary-fixed: '#001e2d'
  on-tertiary-fixed-variant: '#004c6b'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1ec'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  code-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin: 24px
  max-width: 1440px
---

## Brand & Style

The design system is engineered for a high-performance HR B2B environment, balancing corporate authority with modern agility. The brand personality is dependable, efficient, and forward-thinking, aiming to evoke a sense of professional mastery and clarity for HR administrators and recruiters.

The design style follows a **Corporate / Modern** aesthetic with subtle influences from **Minimalism**. It prioritizes functional density and information hierarchy, ensuring that complex data sets remain legible. Visual interest is generated through precise execution of light-touch depth and a strategic use of the vibrant secondary palette to highlight calls to action and critical status updates.

## Colors

The palette is anchored by a deep professional blue, establishing trust and stability. 

- **Primary (#0033A0):** Used for core navigation, primary buttons, and structural brand elements.
- **Secondary (#FF8200):** Reserved for high-priority actions, notifications, and interactive accents to draw immediate attention.
- **Tertiary (#00A3E0):** Utilized for secondary data visualizations, information callouts, and interactive hover states.
- **Neutral (#76767F):** Applied to secondary text, borders, and icon states to maintain a calm visual environment.
- **Backgrounds:** A clean white base for main content areas, with a very light gray (#F8F9FA) used for sidebars and background grounding to differentiate functional zones.

## Typography

This design system utilizes **Inter** exclusively to achieve a systematic, utilitarian, and highly readable interface. The type scale is tight and structured, favoring clarity over expressive flourishes.

- **Headlines:** Use semi-bold weights with slight negative letter-spacing to create a compact, modern feel suitable for dashboard headers.
- **Body Text:** Standardized at 14px for density in data-heavy views, and 16px for prose or descriptive content.
- **Labels:** Used for table headers and small metadata, often paired with a medium weight to ensure legibility at small sizes.

## Layout & Spacing

The layout philosophy relies on a **Fluid Grid** for internal dashboard modules, constrained by a **Fixed Grid** maximum width of 1440px for global containers to ensure optimal line lengths on ultra-wide monitors.

- **Grid Model:** 12-column desktop grid with 20px gutters. 
- **Mobile Adaptivity:** On mobile devices, the layout collapses to a single column with 16px side margins. 
- **Rhythm:** An 8px linear scale is used for all component-level spacing (padding, margins, gaps) to ensure a consistent vertical and horizontal cadence.

## Elevation & Depth

Visual hierarchy is established through a combination of **Tonal Layers** and **Ambient Shadows**.

1. **Surface Levels:** The base background is light gray, with primary content "cards" sitting on white surfaces.
2. **Shadows:** Shadows are extra-diffused and low-opacity, using a slight tint of the Primary Blue (e.g., hex #0033A0 at 4-8% opacity) to prevent a "dirty" gray look.
3. **Interactions:** Hover states on interactive cards should slightly increase the shadow spread and lift the element by 1-2px, creating a tactile response.
4. **Borders:** Low-contrast outlines (1px solid #E2E8F0) are used for internal component divisions (like list items or table rows) where a full shadow would be too heavy.

## Shapes

The shape language is consistently **Rounded**, providing a soft, approachable counter-balance to the formal typography.

- **Components:** Standard buttons, input fields, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Dashboard widgets and main content sections use `rounded-lg` (1rem / 16px).
- **Status Indicators:** Chips and tags use `rounded-xl` (1.5rem / 24px) or a full pill-shape to distinguish them from interactive buttons.

## Components

- **Buttons:** Primary buttons use the Primary Blue with white text. CTA/Action buttons use the Secondary Orange. Ghost buttons use Primary Blue text with no fill.
- **Input Fields:** 8px rounded corners, 1px border (#D1D5DB). On focus, the border transitions to Primary Blue with a subtle 2px glow.
- **Cards:** White background, 16px corner radius, and a subtle "Soft" level shadow. Cards should include a header area with a 1px bottom border.
- **Chips/Badges:** Use a light tint of the Tertiary Blue or Secondary Orange background with high-contrast text for status indicators (e.g., "Active", "Pending").
- **Icons:** Use Lucide-style outline icons with a 2px stroke weight. Icons should be sized at 20px for standard UI actions and 24px for navigation.
- **Lists & Tables:** Tables feature a 1px border-bottom for rows, no vertical lines. Hover states on rows should use a subtle background tint (#F8F9FA).
- **Additional Components:** The system includes **Search Bars** with integrated filters and **Progress Bars** (using Tertiary Blue) for tracking recruitment stages or profile completion.