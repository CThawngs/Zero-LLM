import { createServer } from 'node:http';
import { parse } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import next from 'next';

const dir = process.cwd();
const hasBuiltManifest = existsSync(path.join(dir, '.next', 'routes-manifest.json'));
const isProdEnv = process.env.NODE_ENV === 'production';
const dev = isProdEnv ? !hasBuiltManifest : true;
const hostname = '0.0.0.0';
const port = 3000;

const app = next({ dev, hostname, port, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '/', true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  }).listen(port, hostname, () => {
    console.log(`> Zero LLM Server ready on http://${hostname}:${port} (mode: ${dev ? 'development' : 'production'})`);
  });
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err);
  process.exit(1);
});
