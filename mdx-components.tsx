import type { MDXComponents } from 'mdx/types'
import Facets from '@/components/Facets'

/**
 * Global MDX component map. Anything named here is available in every .mdx
 * file without an import — so chapters can drop `<Facets princess="belle" />`
 * straight into the prose.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Facets,
    ...components,
  }
}
