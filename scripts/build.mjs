import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build, createServer } from 'vite';

// Generate the same React tree as static HTML for crawlers and the first paint.
// The output remains deployable to any static host; no Node server is needed.
const root = fileURLToPath(new URL('../', import.meta.url));
await build({ root });
const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const { render } = await server.ssrLoadModule('/src/entry-server.jsx');
  const output = new URL('../dist/index.html', import.meta.url);
  const template = await readFile(output, 'utf8');
  if (!template.includes('<div id="root"></div>')) {
    throw new Error('The React root placeholder is missing from index.html.');
  }
  await writeFile(output, template.replace('<div id="root"></div>', () => `<div id="root">${render()}</div>`));
  console.log('Pre-rendered Joyin Media into dist/index.html.');
} finally {
  await server.close();
}
