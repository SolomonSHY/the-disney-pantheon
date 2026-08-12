import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow .mdx files to be treated as pages and modules.
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
}

const withMDX = createMDX({
  // Add markdown/MDX plugins here if desired (remark-gfm, etc.).
  options: {},
})

export default withMDX(nextConfig)
