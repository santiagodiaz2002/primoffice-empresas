// Local-only browser harness. No credentials, external leads or Analytics calls.
// node tests/qa-server.mjs ../setupoficina-corporate-leads
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

if (!process.argv[2]) throw new Error('Pass the verified corporate backend directory');
const { onRequest } = await import(pathToFileURL(resolve(process.argv[2], 'functions/api/corporate-leads.js')));
const root = resolve('site');
const { corporateOdoo } = await import(pathToFileURL(resolve(process.argv[2], 'tests/helpers/corporate-odoo.mjs')));
const odoo = corporateOdoo();
const records = odoo.records;
const requests = [];
let loseNextResponse = false;
globalThis.fetch = odoo.fetch;
const safetyScript = `
  window.__qa = { clicks: [], popups: [], shifts: [], lcp: [] };
  const realFetch = window.fetch.bind(window);
  window.fetch = (url, options) => {
    if (url === 'https://setupoficina.com.ar/api/corporate-leads') return realFetch('/__qa/lead', options);
    if (new URL(url, location.href).origin !== location.origin) throw new Error('External fetch forbidden');
    return realFetch(url, options);
  };
  window.open = (...args) => { window.__qa.popups.push(args); return null; };
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link && /^(https:|mailto:)/.test(link.href)) { event.preventDefault(); window.__qa.clicks.push(link.href); }
  }, true);
  new PerformanceObserver(list => window.__qa.shifts.push(...list.getEntries().filter(e => !e.hadRecentInput).map(e => e.value))).observe({type:'layout-shift', buffered:true});
  new PerformanceObserver(list => window.__qa.lcp.push(...list.getEntries().map(e => e.startTime))).observe({type:'largest-contentful-paint', buffered:true});
`;
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:8787');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; form-action 'none'; object-src 'none'");
  try {
    if (url.pathname === '/__qa/gtag.js' || url.pathname === '/__qa/safety.js') {
      res.setHeader('Content-Type', 'text/javascript');
      return res.end(url.pathname.endsWith('safety.js') ? safetyScript : '// Analytics network disabled in QA');
    }
    if (url.pathname === '/__qa/state') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ records, requests }));
    }
    if (url.pathname === '/__qa/fail-next' && req.method === 'POST') { odoo.failCreate = true; return res.end('ok'); }
    if (url.pathname === '/__qa/lose-next-response' && req.method === 'POST') { loseNextResponse = true; return res.end('ok'); }
    if (url.pathname === '/__qa/lead' && req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString();
      requests.push(JSON.parse(body));
      await new Promise(r => setTimeout(r, 350));
      const response = await onRequest({
        request: new Request('https://setupoficina.com.ar/api/corporate-leads', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:8787' }, body }),
        env: { ODOO_ENABLED: 'true', ODOO_URL: 'https://odoo.example.test', ODOO_DB: 'test-db', ODOO_USERNAME: 'test-user', ODOO_API_KEY: 'test-only-key' }
      });
      if (loseNextResponse && response.ok) { loseNextResponse = false; req.socket.destroy(); return; }
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json');
      return res.end(await response.text());
    }
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep)) { res.statusCode = 403; return res.end(); }
    let content = await readFile(path);
    if (extname(path) === '.html') content = content.toString().replace('<head>', '<head><script src="/__qa/safety.js"></script>').replace('https://www.googletagmanager.com/gtag/js?id=G-1D05MSV4EB', '/__qa/gtag.js?id=G-1D05MSV4EB');
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' })[extname(path)] || 'application/octet-stream');
    res.end(content);
  } catch (error) { res.statusCode = error.code === 'ENOENT' ? 404 : 500; res.end('Local QA resource unavailable'); }
});
server.listen(8787, '127.0.0.1', () => console.log('QA http://127.0.0.1:8787 (Analytics + external leads disabled)'));
