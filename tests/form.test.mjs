import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = fs.readFileSync(new URL('../site/assets/js/main.js', import.meta.url), 'utf8');
const data = { nombre: ' Contacto QA ', empresa: '[PRUEBA] PrimOffice Empresas', email: 'qa@example.com', phone: '+54 9 11 1234-5678', tipo: 'Proyecto especial', cantidad: '80', fecha: '2099-12-10', detalle: 'Texto con á, & y salto\nde línea' };
const success = () => Promise.resolve({ ok: true, json: async () => ({ ok: true, id: 123 }) });
function setup(code, fetch = success, valid = true, storage = new Map(), search = '') {
  const listeners = {};
  let reported = false;
  const calls = [];
  const events = [];
  const element = () => ({ hidden: false, textContent: '', handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; }, focus() { this.focused = true; } });
  const formStatus = element();
  const formNote = element();
  const submitButton = element();
  const grid = element();
  const formSuccess = { ...element(), hidden: true };
  const wa = element();
  const email = element();
  const phone = { ...element(), value: data.phone, setCustomValidity(value) { this.error = value; } };
  const projectSelect = { options: ['Kits de bienvenida', 'Regalos corporativos', 'Regalos de fin de año', 'Proyecto especial'].map(value => ({ value })) };
  const solutions = projectSelect.options.map(({ value }) => ({ ...element(), getAttribute: () => value }));
  const form = {
    addEventListener: (name, fn) => { listeners[name] = fn; },
    checkValidity: () => valid && !phone.error, reportValidity: () => { reported = true; },
    querySelector: s => s === '.form-grid' ? grid : submitButton,
    elements: { namedItem: () => phone }, setAttribute() {}
  };
  const document = {
    referrer: 'https://search.example/',
    querySelector: (selector) => ({ '[data-contact-form]': form, '[data-form-status]': formStatus, '[data-form-note]': formNote, '[data-form-success]': formSuccess, '[data-success-wa]': wa, '[data-project-select]': projectSelect })[selector],
    querySelectorAll: s => ({ '[data-wa-link]': [wa], '[data-email-link]': [email], '[data-project-type]': solutions })[s] || []
  };
  const window = {
    crypto: webcrypto,
    PRIMOFFICE_SITE_CONFIG: { whatsappNumber: '5491139149688', corporateEmail: 'info@primoffice.com.ar' }, open: (...args) => calls.push(args),
    gtag: (...args) => events.push(args), location: { search, href: `https://empresas.primoffice.com.ar/${search}` },
    sessionStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) }
  };
  vm.runInNewContext(code, { document, window, URLSearchParams, fetch, FormData: class { constructor() { return new Map(Object.entries(data)); } } });
  return { submit: () => listeners.submit({ preventDefault() {} }), calls, events, formStatus, formNote, formSuccess, submitButton, grid, wa, email, listeners, solutions, projectSelect, reported: () => reported };
}

test('espera confirmación de persistencia; un lead y WhatsApp posterior explícito', async () => {
  let request;
  let resolve;
  const pending = new Promise(r => { resolve = r; });
  const current = setup(source, (...args) => { request = args; return pending; });
  const completion = current.submit();
  assert.equal(current.calls.length, 0);
  assert.equal(current.events.length, 0, 'click submit no convierte');
  assert.equal(current.submitButton.disabled, true);
  assert.equal(current.formSuccess.hidden, true);
  assert.equal(request[0], 'https://setupoficina.com.ar/api/corporate-leads');
  assert.equal(request[1].method, 'POST');
  const { submission_id, ...sent } = JSON.parse(request[1].body);
  assert.match(submission_id, /^[0-9a-f-]{36}$/);
  assert.deepEqual(sent, { ...data, landing_url: 'https://empresas.primoffice.com.ar/', referrer: 'https://search.example/' });
  resolve(await success());
  await completion;
  assert.equal(current.formSuccess.hidden, false);
  assert.equal(current.formSuccess.focused, true);
  assert.equal(current.submitButton.hidden, true);
  assert.equal(current.grid.hidden, true);
  assert.equal(current.calls.length, 0);
  assert.deepEqual(current.events.map(e => e[1]), ['generate_lead']);
  current.wa.handlers.click({ preventDefault() {} });
  assert.deepEqual(current.events.map(e => e[1]), ['generate_lead', 'whatsapp_click']);
  assert.equal(current.calls.length, 1, 'solo el clic explícito abre WhatsApp');
  assert.match(decodeURIComponent(current.calls[0][0]), /Email: qa@example.com/);
  assert.match(decodeURIComponent(current.calls[0][0]), /WhatsApp: \+54 9 11 1234-5678/);
  assert.doesNotMatch(decodeURIComponent(current.wa.href), /qa@example.com|1234-5678|Contacto QA/);
  assert.doesNotMatch(JSON.stringify(current.events), /qa@example.com|1234-5678|Contacto QA/);
});

test('fallo de red, HTTP o confirmación inválida: sin éxito ni conversión; permite reintentar', async () => {
  for (const fetch of [() => Promise.reject(new Error('offline')), () => Promise.resolve({ ok: false }), () => Promise.resolve({ ok: true, json: async () => ({ ok: false, id: 123 }) }), () => Promise.resolve({ ok: true, json: async () => ({ ok: true }) })]) {
    let attempt = 0;
    const current = setup(source, () => attempt++ ? success() : fetch());
    await current.submit();
    await Promise.resolve();
    assert.equal(current.calls.length, 0);
    assert.match(current.formStatus.textContent, /No pudimos confirmar/);
    assert.equal(current.formSuccess.hidden, true);
    assert.equal(current.submitButton.disabled, false);
    assert.deepEqual(current.events.map(e => e[1]), ['form_error']);
    assert.equal(current.events[0][2].error_type, 'backend');
    await current.submit();
    assert.deepEqual(current.events.map(e => e[1]), ['form_error', 'generate_lead']);
  }
});

test('formulario inválido no llama al CRM ni abre WhatsApp', async () => {
  const current = setup(source, () => assert.fail('No debe llamar al CRM'), false);
  await current.submit();
  assert.equal(current.calls.length, 0);
  assert.ok(current.reported());
  assert.deepEqual(current.events.map(e => e[1]), ['form_error']);
  assert.equal(current.events[0][2].error_type, 'validation');
});

test('envíos repetidos durante el registro no duplican llamadas CRM', async () => {
  let calls = 0;
  let resolve;
  const current = setup(source, () => { calls++; return new Promise(r => { resolve = r; }); });
  const completion = current.submit();
  await current.submit();
  assert.equal(calls, 1);
  assert.equal(current.calls.length, 0);
  resolve(await success());
  await completion;
  await current.submit();
  assert.equal(calls, 1);
  assert.deepEqual(current.events.map(e => e[1]), ['generate_lead']);
});

test('HTML: requeridos separados, SEO y una sola instalación GA', () => {
  const html = fs.readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');
  for (const [name, type] of [['email', 'email'], ['phone', 'tel'], ['cantidad', 'number']]) {
    assert.match(html, new RegExp(`<input[^>]*name="${name}"[^>]*required=""[^>]*type="${type}"`));
  }
  assert.doesNotMatch(html, /name="contacto"/);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.match(html, /<h1>Regalos corporativos personalizados para empresas<\/h1>/);
  assert.match(html, /<title>Regalos Corporativos Personalizados para Empresas \| PrimOffice<\/title>/);
  assert.equal((html.match(/googletagmanager.com\/gtag\/js\?id=G-1D05MSV4EB/g) || []).length, 1);
  assert.equal((html.match(/gtag\('config', 'G-1D05MSV4EB'\)/g) || []).length, 1);
  assert.equal((html.match(/gtag\('config', 'G-SP2KF73DSS'\)/g) || []).length, 1);
  assert.equal((html.match(/googletagmanager.com\/gtag\/js\?/g) || []).length, 1);
  assert.doesNotMatch(html, /\bnoindex\b/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/empresas\.primoffice\.com\.ar\/">/);
});

test('preselecciones existentes coinciden con opciones y no generan eventos', () => {
  const current = setup(source);
  for (const link of current.solutions) {
    link.handlers.click();
    assert.equal(current.projectSelect.value, link.getAttribute());
  }
  assert.equal(current.events.length, 0);
});

test('form_start una vez; contactos secundarios sin PII ni generate_lead', () => {
  const current = setup(source);
  current.listeners.input(); current.listeners.change(); current.listeners.input();
  current.email.handlers.click(); current.wa.handlers.click();
  assert.deepEqual(current.events.map(e => e[1]), ['form_start', 'email_click', 'whatsapp_click']);
  for (const event of current.events) assert.equal(JSON.stringify(event[2]), '{}');
});

test('atribución captura todos los parámetros y conserva originales en recarga/anchors', async () => {
  const storage = new Map();
  const keys = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const search = '?' + keys.map(k => `${k}=${k}-original`).join('&');
  setup(source, success, true, storage, search);
  let payload;
  const reload = setup(source, (_, options) => { payload = JSON.parse(options.body); return success(); }, true, storage, '?gclid=changed&utm_source=#contacto');
  assert.equal(reload.events.length, 0, 'recargar no convierte');
  await reload.submit();
  for (const key of keys) assert.equal(payload[key], `${key}-original`);
  assert.equal(payload.landing_url, 'https://empresas.primoffice.com.ar/' + search);
  assert.equal(payload.referrer, 'https://search.example/');
});

test('storage bloqueado no impide guardar la consulta con atribución en memoria', async () => {
  const storage = { get() { throw new Error('blocked'); }, set() { throw new Error('blocked'); } };
  let payload;
  const current = setup(source, (_, options) => { payload = JSON.parse(options.body); return success(); }, true, storage, '?gclid=original');
  await current.submit();
  assert.equal(payload.gclid, 'original');
  assert.equal(current.formSuccess.hidden, false);
});

test('submission persiste tras fallo y recarga; solo se cierra al confirmar éxito', async () => {
  const storage = new Map(), ids = [];
  const failed = setup(source, async (_, options) => {
    ids.push(JSON.parse(options.body).submission_id);
    throw new Error('response lost');
  }, true, storage);
  assert.equal(storage.has('primoffice.corporate.submission'), false);
  await failed.submit();
  assert.equal(storage.get('primoffice.corporate.submission'), ids[0]);
  const retry = setup(source, async (_, options) => {
    ids.push(JSON.parse(options.body).submission_id);
    return success();
  }, true, storage);
  assert.equal(retry.events.length, 0, 'refresh no convierte ni envía');
  await retry.submit(); await retry.submit();
  assert.deepEqual(ids, [ids[0], ids[0]]);
  assert.equal(storage.has('primoffice.corporate.submission'), false);
  assert.deepEqual(retry.events.map(e => e[1]), ['generate_lead']);
  const next = setup(source, async (_, options) => {
    ids.push(JSON.parse(options.body).submission_id);
    return success();
  }, true, storage);
  assert.equal(next.events.length, 0);
  await next.submit();
  assert.notEqual(ids[2], ids[0], 'un envío nuevo después del éxito tiene otro ID');
});

test('sin sessionStorage, retry conserva el ID en memoria; inválido no genera submission', async () => {
  const storage = { get() { throw new Error('blocked'); }, set() { throw new Error('blocked'); }, delete() { throw new Error('blocked'); } };
  const ids = [];
  const current = setup(source, async (_, options) => {
    ids.push(JSON.parse(options.body).submission_id);
    if (ids.length === 1) throw new Error('lost');
    return success();
  }, true, storage);
  await current.submit(); await current.submit();
  assert.equal(ids.length, 2); assert.equal(ids[0], ids[1]);
  assert.deepEqual(current.events.map(e => e[1]), ['form_error', 'generate_lead']);
  const empty = new Map();
  await setup(source, success, false, empty).submit();
  assert.equal(empty.has('primoffice.corporate.submission'), false);
});

test('integración: respuesta 201 perdida, retry con backend real crea un lead y una conversión', { skip: !process.env.CORPORATE_BACKEND_DIR }, async t => {
  const backend = pathToFileURL(resolve(process.env.CORPORATE_BACKEND_DIR) + '/');
  const { onRequest } = await import(new URL('functions/api/corporate-leads.js', backend));
  const { corporateOdoo } = await import(new URL('tests/helpers/corporate-odoo.mjs', backend));
  const { parseCorporateRecord } = await import(new URL('functions/_lib/corporate/corporate-record.mjs', backend));
  const odoo = corporateOdoo();
  t.mock.method(globalThis, 'fetch', odoo.fetch);
  const payloads = [], ids = [];
  const storage = new Map();
  const current = setup(source, async (url, options) => {
    payloads.push(JSON.parse(options.body));
    const response = await onRequest({ request: new Request(url, options), env: {
      ODOO_ENABLED: 'true', ODOO_URL: 'https://odoo.example.test', ODOO_DB: 'test-db', ODOO_USERNAME: 'test-user', ODOO_API_KEY: 'test-only-key'
    } });
    assert.equal(response.status, 201);
    ids.push((await response.clone().json()).id);
    if (payloads.length === 1) throw new Error('201 lost after commit');
    return response;
  }, true, storage, '?gclid=G&gbraid=B&wbraid=W&utm_source=s&utm_medium=m&utm_campaign=c&utm_term=t&utm_content=o');
  current.listeners.input(); current.listeners.change();
  const first = current.submit(); await current.submit(); await first;
  assert.equal(payloads.length, 1, 'doble submit simultáneo: una llamada');
  assert.equal(odoo.records.length, 1, 'backend ya creó el lead');
  assert.deepEqual(current.events.map(e => e[1]), ['form_start', 'form_error']);
  await current.submit(); await current.submit();
  assert.equal(payloads.length, 2);
  assert.equal(payloads[0].submission_id, payloads[1].submission_id);
  assert.deepEqual(ids, [1, 1]);
  assert.equal(odoo.records.length, 1);
  assert.equal(odoo.calls.filter(c => c.model === 'crm.lead' && c.method === 'create').length, 1);
  const metadata = parseCorporateRecord(odoo.records[0].description);
  assert.equal(metadata.lead_id, 1);
  assert.equal(metadata.created_at, '2026-09-18T13:25:42.000Z');
  for (const [key, val] of Object.entries(payloads[0])) assert.equal(metadata[key], val.trim());
  for (const key of ['estimated_value', 'quoted_value', 'won_value']) assert.equal(metadata[key], null);
  current.wa.handlers.click({ preventDefault() {} });
  current.email.handlers.click();
  assert.deepEqual(current.events.map(e => e[1]), ['form_start', 'form_error', 'generate_lead', 'whatsapp_click', 'email_click']);
  assert.equal(setup(source, success, true, storage).events.length, 0, 'refresh después del éxito no convierte');
});
