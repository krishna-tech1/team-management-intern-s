---
name: Functional Amber Enterprise
colors:
  surface: '#fff8f4'
  surface-dim: '#e6d8c9'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e4'
  surface-container: '#fbebdc'
  surface-container-high: '#f5e6d7'
  surface-container-highest: '#efe0d1'
  on-surface: '#211a11'
  on-surface-variant: '#524533'
  inverse-surface: '#372f25'
  inverse-on-surface: '#fdeedf'
  outline: '#857461'
  outline-variant: '#d7c3ad'
  surface-tint: '#825500'
  primary: '#825500'
  on-primary: '#ffffff'
  primary-container: '#f4a300'
  on-primary-container: '#613e00'
  inverse-primary: '#ffb951'
  secondary: '#7b5824'
  on-secondary: '#ffffff'
  secondary-container: '#ffcf90'
  on-secondary-container: '#795723'
  tertiary: '#00658a'
  on-tertiary: '#ffffff'
  tertiary-container: '#29c0ff'
  on-tertiary-container: '#004b68'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb3'
  primary-fixed-dim: '#ffb951'
  on-primary-fixed: '#291800'
  on-primary-fixed-variant: '#633f00'
  secondary-fixed: '#ffddb3'
  secondary-fixed-dim: '#edbf80'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#60400d'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7cd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#fff8f4'
  on-background: '#211a11'
  surface-variant: '#efe0d1'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-md-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

This design system is engineered for the high-stakes environment of GST and MCA operations. The brand personality is **utilitarian, precise, and authoritative**, moving away from cluttered legacy systems toward a streamlined **Modern Corporate** aesthetic.

The strategy employs a high-contrast, "Action-Oriented" philosophy. By restricting the primary orange hue strictly to interactive elements, we reduce cognitive load and direct the user's focus toward workflows. The overall style is influenced by top-tier SaaS platforms like Monday.com and Jira, prioritizing information density without sacrificing clarity. The emotional response should be one of reliability and systematic efficiency.

## Colors

The palette is anchored by a vibrant orange (#F4A300) used exclusively for **intentful actions**. This ensures that in a complex dashboard of data, the "next step" is always visually self-evident.

- **Foundations:** Surfaces use a crisp white (#FFFFFF) against a subtle light-gray page background (#F5F5F5) to create distinct visual containment for data modules.
- **Typography:** Deep charcoal (#1E1E1E) is used for maximum legibility in financial reporting, supported by medium grays for metadata.
- **Functional Semantics:** Status colors (Success, Warning, Error) follow global financial software standards to ensure instant recognition of compliance states.
- **Specific Interaction:** Data tables utilize a warm tint (#FFF7ED) for headers to subtly distinguish them from the body without introducing heavy dark bars.

## Typography

This design system utilizes **Hanken Grotesk** as the primary typeface. Its sharp, contemporary geometry provides the "SaaS-native" look required for modern enterprise tools while maintaining excellent legibility at small sizes common in data grids.

For technical data, such as GSTINs, PAN numbers, and transaction IDs, we utilize **JetBrains Mono**. The monospaced nature of this font ensures that alphanumeric strings are easily scannable and reduces errors during manual verification.

- **Hierarchy:** Use bold weights for headers to create clear section breaks.
- **Scaling:** On mobile, large display sizes are reduced to prevent excessive wrapping in dense forms.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid grid**. Sidebars and navigation are fixed-width to ensure tool consistency, while data tables and dashboards occupy the remaining fluid space to maximize data visibility.

- **Grid:** A 12-column system is used for dashboard layouts.
- **Rhythm:** A 4px baseline grid ensures vertical alignment across disparate data points.
- **Desktop:** 24px margins provide "breathing room" around high-density cards.
- **Mobile:** Margins compress to 16px, and multi-column forms reflow to a single vertical stack.

## Elevation & Depth

To maintain a "Clean & Trustworthy" feel, the system avoids heavy shadows. Instead, it uses **Tonal Layering** and **Subtle Outlines**.

- **Level 0 (Background):** #F5F5F5.
- **Level 1 (Cards/Sidebar):** #FFFFFF with a 1px solid border (#E5E7EB).
- **Level 2 (Dropdowns/Modals):** #FFFFFF with a soft, diffused shadow (`0px 4px 12px rgba(0, 0, 0, 0.05)`) to indicate temporary interaction layers.
- **Interaction:** Hover states on interactive cards should not lift the element, but rather darken the border color or apply the Primary Tint (#FFF3E0) background.

## Shapes

The design system uses a **Soft (0.25rem)** roundedness approach. This strikes a balance between the rigid "sharp" edges of traditional financial software and the overly "bubbly" feel of consumer apps. 

- **Standard Elements:** 4px radius for buttons and input fields.
- **Containers:** 8px radius for large data cards and modals.
- **Data Points:** 2px radius for small tags or chips.

## Components

### Buttons
- **Primary:** Background #F4A300, Text #FFFFFF. No border.
- **Secondary/Ghost:** Border #E5E7EB, Text #1E1E1E. Background #FFFFFF.
- **Hover State:** Primary transitions to #E69500; Secondary transitions to #FAFAFA.

### Data Tables (Critical for GST/MCA)
- **Header:** Background #FFF7ED, Text #6B7280 (Semi-bold), Border-bottom #E5E7EB.
- **Row:** Background #FFFFFF, Border-bottom #F0F0F0.
- **Row Hover:** Background #FFF3E0.

### Input Fields
- **Default:** Border #E5E7EB, Placeholder #9CA3AF.
- **Focus:** Border #F4A300 with a 2px outer glow of #FFF3E0.

### Chips & Status Tags
- Use a "Light Tint" background of the status color with high-contrast text (e.g., Success tag: #DCFCE7 background with #166534 text). Use 2px rounded corners.

### Cards
- White background, 1px #E5E7EB border. No shadow unless the card is "active" or "selected," in which case use a subtle 4px blur.