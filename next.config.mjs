import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow .mdx files to be treated as pages and modules.
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
}

const withMDX = createMDX({
  // remark-gfm enables Markdown footnotes ([^1]), among other GFM niceties.
  options: {
    remarkPlugins: [remarkGfm],
  },
})

export default withMDX(nextConfig)
