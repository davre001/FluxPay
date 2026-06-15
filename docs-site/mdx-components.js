import { useMDXComponents as themeComponents } from 'nextra-theme-docs'

// Merge the docs theme's MDX components (Callout, Cards, etc. resolve from here).
export function useMDXComponents(components) {
  return {
    ...themeComponents(),
    ...components
  }
}
