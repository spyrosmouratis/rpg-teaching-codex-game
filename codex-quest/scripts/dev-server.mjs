import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 5173);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\0')) throw new Error('Invalid path');
    const filepath = resolve(projectRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (filepath !== projectRoot && !filepath.startsWith(projectRoot + sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const fileStat = await stat(filepath);
    if (!fileStat.isFile()) throw new Error('Not a file');
    const data = await readFile(filepath);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(filepath)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Codex Quest is running at http://localhost:${port}`);
});
