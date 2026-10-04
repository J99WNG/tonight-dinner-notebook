import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

const githubPagesBase = process.env.GITHUB_ACTIONS
  ? '/tonight-dinner-notebook/'
  : '/';

export default defineConfig({
  // GitHub Pages serves project sites from /<repository>/; local and Sites
  // development continue to use the domain root.
  base: githubPagesBase,
  css: { postcss: { plugins: [tailwindcss()] } },
  server: { watch: { useFsEvents: false, usePolling: true } },
  plugins: [vinext(), sites()],
});
