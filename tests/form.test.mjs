import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

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
    PRIMOFFICE_SITE_CONFIG: { whatsappNumber: '5491139149688', corporateEmail: 'info@primoffice.com.ar' }, open: (...args) => calls.push(args),
    gtag: (...args) => events.push(args), location: { search, href: `https://empresas.primoffice.com.ar/${search}` },
    sessionStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) }
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
  assert.deepEqual(JSON.parse(request[1].body), { ...data, landing_url: 'https://empresas.primoffice.com.ar/', referrer: 'https://search.example/' });
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
