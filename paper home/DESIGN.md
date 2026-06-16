---
name: Technical Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf4'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d4e4fd'
  on-surface: '#0c1c2f'
  on-surface-variant: '#424654'
  inverse-surface: '#223145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737786'
  outline-variant: '#c2c6d7'
  surface-tint: '#0056d0'
  primary: '#0055ce'
  on-primary: '#ffffff'
  primary-container: '#2f6fed'
  on-primary-container: '#ffffff'
  inverse-primary: '#b1c5ff'
  secondary: '#525f75'
  on-secondary: '#ffffff'
  secondary-container: '#d2e0fa'
  on-secondary-container: '#566379'
  tertiary: '#a73725'
  on-tertiary: '#ffffff'
  tertiary-container: '#c84f3a'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001847'
  on-primary-fixed-variant: '#0040a0'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0e1c2f'
  on-secondary-fixed-variant: '#3a475c'
  tertiary-fixed: '#ffdad3'
  tertiary-fixed-dim: '#ffb4a6'
  on-tertiary-fixed: '#3f0300'
  on-tertiary-fixed-variant: '#872010'
  background: '#f8f9ff'
  on-background: '#0c1c2f'
  surface-variant: '#d4e4fd'
  surface-base: '#FFFFFF'
  surface-subtle: '#F8FAFC'
  safety-accent: '#C84F3A'
  deep-space: '#122033'
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
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

This design system establishes a visual language for high-end robotics research, balancing the rigor of academic publishing with the accessibility of modern open-source communities. The aesthetic is **Modern Corporate**, leaning into technical precision and functional clarity.

The interface prioritizes information density and readability, utilizing generous whitespace to prevent cognitive overload during complex data analysis. Visual interest is generated through high-contrast accents inspired by industrial robotics hardware—safety indicators and electrical components—ensuring the "research" feels active and experimental rather than static and dusty.

## Colors

The palette is anchored by a foundational **Deep Space** blue, providing an authoritative and stable base for headers and primary navigation. The **Primary Blue** is reserved for interactive elements and highlights, mirroring the glow of high-tech sensors.

The **Safety Accent** (C84F3A) serves as a functional color, used sparingly for critical data points, active recording states, or hardware warnings, creating a direct visual link to physical robotics equipment. Neutrals are kept cool-toned to maintain a clean, laboratory-like atmosphere.

## Typography

The system utilizes **Inter** for all UI and prose, chosen for its exceptional legibility at small sizes and its neutral, systematic appearance. For headlines, a tighter letter-spacing and heavier weight convey confidence.

**JetBrains Mono** is integrated as a secondary functional font. It is used exclusively for technical data, variable outputs, citations, and terminal-style blocks. This clear distinction between "Instructional/Prose" (Inter) and "Data/Technical" (JetBrains Mono) allows researchers to scan documents quickly for specific quantitative information.

## Layout & Spacing

The design system employs a **Fixed Grid** model for desktop to ensure long-form research papers and galleries remain readable and don't stretch excessively on wide monitors.

- **Desktop (1280px+):** 12-column grid with 24px gutters. Content is centered with wide 48px+ margins.
- **Tablet (768px - 1024px):** 8-column grid with 20px gutters and 32px margins.
- **Mobile (below 768px):** 4-column fluid grid with 16px gutters and 16px margins.

Vertical rhythm follows a strict 8px baseline. Use larger 64px-80px gaps between major sections to emphasize the "Gallery" feel, allowing each research project its own visual breathing room.

## Elevation & Depth

To maintain a "clean room" aesthetic, this design system avoids heavy shadows. Instead, it utilizes **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Base):** Solid white (#FFFFFF).
- **Level 1 (Cards/Sidebar):** Very light gray background (#F8FAFC) with a subtle 1px border (#E2E8F0).
- **Interactive States:** On hover, cards may lift using a very soft, diffused ambient shadow (0px 4px 20px rgba(18, 32, 51, 0.05)) to indicate clickability without breaking the flat, academic aesthetic.
- **Overlays/Modals:** Use a heavy backdrop blur (12px) with a semi-transparent Deep Space blue overlay to keep the focus on the hardware data being inspected.

## Shapes

The shape language is **Soft (0.25rem)**. This slight rounding takes the edge off the "brutal" technical nature of the data, making the platform feel approachable. 

Buttons and input fields should strictly adhere to the `rounded-sm` (4px) rule. Large gallery thumbnails or video containers can use `rounded-lg` (8px) to soften their impact on the layout. High-utility items like "tags" or "chips" may use a fully rounded/pill shape to distinguish them from functional UI buttons.

## Components

### Buttons
- **Primary:** Deep Space blue background, white text, 4px radius.
- **Secondary:** Transparent with a 1px border of Primary Blue.
- **Tertiary:** Text-only with the Safety Accent color for high-visibility actions like "Download Raw Data".

### Cards (Gallery Items)
Cards are the primary vehicle for research display. Use a 1px border with no shadow in its resting state. The header of the card should use `label-caps` for the category (e.g., "TACTILE SENSING") and `headline-sm` for the project title.

### Technical Data Tables
Use JetBrains Mono for all cell content. Headers should have a subtle blue-gray background (#F1F5F9). Use thin dividers rather than zebra striping to maintain the minimal aesthetic.

### Input Fields
Strictly rectangular with 4px rounding. Use a 1px slate-gray border that transforms to Primary Blue on focus. Labels must always be visible above the field in `label-caps`.

### Chips / Tags
Small, pill-shaped elements used for software dependencies (e.g., "PyTorch", "ROS2"). Use a light blue-gray background with Deep Space text to keep them legible but secondary.