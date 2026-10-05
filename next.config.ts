import type { NextConfig } from 'next';

const githubPagesPrefix = process.env.GITHUB_ACTIONS
  ? '/tonight-dinner-notebook'
  : '';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: githubPagesPrefix,
};

export default nextConfig;
