import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const source = fs.readFileSync(new URL('../site/assets/js/main.js', import.meta.url), 'utf8');
const original = execFileSync('git', ['show', '1c30442f1aedd9b5989282aa3534f45d2ad60f89:site/assets/js/main.js'], { encoding: 'utf8' });
const data = { nombre: ' Contacto QA ', empresa: '[PRUEBA] PrimOffice Empresas', contacto: 'qa@example.com', tipo: 'Proyecto especial', cantidad: '80', fecha: '2099-12-10', detalle: 'Texto con á, & y salto\nde línea' };
function setup(code, fetch, valid = true) {
  let submit;
  let reported = false;
  const calls = [];
  const formStatus = { textContent: '' };
  const formNote = { textContent: '' };
  const form = { addEventListener: (_, fn) => { submit = fn; }, checkValidity: () => valid, reportValidity: () => { reported = true; } };
  const document = {
    querySelector: (selector) => ({ '[data-contact-form]': form, '[data-form-status]': formStatus, '[data-form-note]': formNote })[selector],
    querySelectorAll: () => []
  };
  const window = { PRIMOFFICE_SITE_CONFIG: { whatsappNumber: '5491139149688', corporateEmail: 'info@primoffice.com.ar' }, open: (...args) => calls.push(args) };
  vm.runInNewContext(code, { document, window, navigator: {}, fetch, FormData: class { constructor() { return new Map(Object.entries(data)); } } });
  return { submit: () => submit({ preventDefault() {} }), calls, formStatus, formNote, reported: () => reported };
}

test('WhatsApp conserva URL, mensaje y flags exactos del commit aprobado, sin esperar fetch', async () => {
  const baseline = setup(original);
  await baseline.submit();
  let request;
  let resolve;
  const pending = new Promise(r => { resolve = r; });
  const current = setup(source, (...args) => { request = args; return pending; });
  const completion = current.submit();
  assert.equal(current.calls.length, 1, 'WhatsApp debe abrirse antes de que se resuelva fetch');
  assert.equal(JSON.stringify(current.calls), JSON.stringify(baseline.calls));
  assert.equal(request[0], 'https://setupoficina.com.ar/api/corporate-leads');
  assert.equal(request[1].method, 'POST');
  assert.equal(request[1].keepalive, true);
  assert.deepEqual(JSON.parse(request[1].body), data);
  resolve({ ok: true });
  await completion;
  assert.match(current.formNote.textContent, /registramos los datos/);
});

test('fallos de red y HTTP nunca bloquean WhatsApp; informa registro fallido', async () => {
  for (const fetch of [() => Promise.reject(new Error('offline')), () => Promise.resolve({ ok: false })]) {
    const current = setup(source, fetch);
    await current.submit();
    await Promise.resolve();
    assert.equal(current.calls.length, 1);
    assert.match(current.formStatus.textContent, /No pudimos registrar/);
    assert.match(current.formStatus.textContent, /continuar por WhatsApp/);
  }
});

test('formulario inválido no llama al CRM ni abre WhatsApp', async () => {
  const current = setup(source, () => assert.fail('No debe llamar al CRM'), false);
  await current.submit();
  assert.equal(current.calls.length, 0);
  assert.ok(current.reported());
});

test('envíos repetidos durante el registro no duplican llamadas CRM', async () => {
  let calls = 0;
  let resolve;
  const current = setup(source, () => { calls++; return new Promise(r => { resolve = r; }); });
  await current.submit();
  await current.submit();
  assert.equal(calls, 1);
  assert.equal(current.calls.length, 2);
  resolve({ ok: true });
});

test('HTML mantiene noindex y solo cambia la nota del formulario', () => {
  const oldHtml = execFileSync('git', ['show', '1c30442f1aedd9b5989282aa3534f45d2ad60f89:site/index.html'], { encoding: 'utf8' });
  const html = fs.readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');
  const stripNote = (text) => text.replace(/\r\n/g, '\n').replace(/(<p class="form-note"[^>]*>)[\s\S]*?(<\/p>)/, '$1$2');
  assert.equal(stripNote(html), stripNote(oldHtml));
  assert.match(html, /noindex,nofollow/);
});
