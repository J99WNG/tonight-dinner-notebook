import type { NextConfig } from 'next';

const githubPagesPrefix = process.env.GITHUB_ACTIONS
  ? '/tonight-dinner-notebook'
  : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: githubPagesPrefix,
  assetPrefix: githubPagesPrefix,
};

export default nextConfig;
