import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

const githubPagesBase =
  process.env.GITHUB_PAGES === 'true' ? '/tonight-dinner-notebook-pages/' : '/';

export default defineConfig({
  // The temporary Pages repository serves from /<repository>/; local and
  // Sites development continue to use the domain root.
  base: githubPagesBase,
  css: { postcss: { plugins: [tailwindcss()] } },
  server: { watch: { useFsEvents: false, usePolling: true } },
  plugins: [vinext(), sites()],
});
