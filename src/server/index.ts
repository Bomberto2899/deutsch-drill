import { createReadStream, existsSync, mkdirSync, statSync, watch } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize } from 'node:path';
import type { ConfigError } from '../shared/config.ts';
import { loadGlobalConfig, saveGlobalConfig } from './global-config.ts';
import {
  findModule, loadModule, loadModuleState, MODULES, saveModuleSettings, saveModuleState,
} from './modules/registry.ts';
import { CONFIG_DIR, DIST_DIR } from './paths.ts';

const PORT = Number(process.env.PORT ?? 47321);
const HOST = '127.0.0.1';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null');
}

function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const urlPath = decodeURIComponent(new URL(req.url!, 'http://x').pathname);
  let file = normalize(join(DIST_DIR, urlPath));
  if (!file.startsWith(DIST_DIR)) return json(res, 403, { error: 'forbidden' });
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST_DIR, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    return res.end('Frontend not built. Run `npm run build`.');
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

// ---- live reload: watch the config dir and tell connected windows to refetch ----
const clients = new Set<ServerResponse>();
let reloadTimer: NodeJS.Timeout | undefined;
function broadcastReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const c of clients) c.write('data: reload\n\n');
  }, 150);
}

async function handleApi(req: IncomingMessage, res: ServerResponse, path: string) {
  const method = req.method ?? 'GET';

  if (path === '/api/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    res.write('data: hello\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (path === '/api/config') {
    if (method === 'PUT') return json(res, 200, { config: saveGlobalConfig(await readBody(req)) });
    const errors: ConfigError[] = [];
    const config = loadGlobalConfig(errors);
    return json(res, 200, { config, errors, modules: MODULES.map((m) => m.id), configDir: CONFIG_DIR });
  }

  const m = path.match(/^\/api\/modules\/([\w-]+)(\/settings|\/state)?$/);
  const mod = m && findModule(m[1]);
  if (!mod) return json(res, 404, { error: 'not found' });

  if (!m![2] && method === 'GET') return json(res, 200, loadModule(mod));
  if (m![2] === '/settings' && method === 'PUT') {
    return json(res, 200, { settings: saveModuleSettings(mod, await readBody(req)) });
  }
  if (m![2] === '/state') {
    if (method === 'PUT') {
      const backup = new URL(req.url!, 'http://x').searchParams.has('backup');
      return json(res, 200, { ok: true, backup: saveModuleState(mod, await readBody(req), backup) });
    }
    return json(res, 200, { state: loadModuleState(mod) });
  }
  return json(res, 405, { error: 'method not allowed' });
}

mkdirSync(CONFIG_DIR, { recursive: true });
// Seed everything on startup so the files exist before the user looks for them.
loadGlobalConfig([]);
for (const m of MODULES) loadModule(m);
watch(CONFIG_DIR, { recursive: true }, broadcastReload);

const server = createServer(async (req, res) => {
  const path = new URL(req.url!, 'http://x').pathname;
  try {
    if (path.startsWith('/api/')) await handleApi(req, res, path);
    else serveStatic(req, res);
  } catch (e) {
    json(res, 400, { error: (e as Error).message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`deutsch-drill: http://${HOST}:${PORT}  (config: ${CONFIG_DIR})`);
});
