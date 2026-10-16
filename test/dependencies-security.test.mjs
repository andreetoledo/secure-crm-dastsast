import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// Hallazgos #13-#17. Cada prueba ejecuta el PoC del advisory contra la libreria que
// realmente esta instalada (la que resolvio el lockfile), no contra el package.json.
const requireFromApi = createRequire(path.resolve('apps/api/package.json'));
const requireFromWeb = createRequire(path.resolve('apps/web/package.json'));
const requireFromExpress = createRequire(requireFromApi.resolve('express'));

const lodash = requireFromApi('lodash');
const qs = requireFromExpress('qs');
const proxyaddr = requireFromExpress('proxy-addr');
const express = requireFromApi('express');
const { default: request } = await import('supertest');

function atLeast(version, minimum) {
  const a = version.split('.').map(Number);
  const b = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}

test('#16 lodash: inyeccion de codigo via claves de _.template imports (GHSA-r5fr-rjxr-66jc)', () => {
  delete globalThis.__pwnedTemplate;
  try {
    lodash.template('hola', { imports: { 'x = globalThis.__pwnedTemplate = true': undefined } });
  } catch {
    // La version corregida rechaza la clave maliciosa con una excepcion.
  }
  assert.strictEqual(globalThis.__pwnedTemplate, undefined, 'El payload se ejecuto: lodash sigue vulnerable');
});

test('#16 lodash: prototype pollution con _.defaultsDeep (CVE-2019-10744)', () => {
  const payload = JSON.parse('{"constructor":{"prototype":{"polluted":"si"}}}');
  try {
    lodash.defaultsDeep({}, payload);
  } finally {
    assert.strictEqual({}.polluted, undefined, 'Object.prototype fue contaminado');
    delete Object.prototype.polluted;
  }
});

test('#17 qs: DoS con isBuffer controlado por el atacante (GHSA-4mjr-xmp4-gh2g)', () => {
  const parsed = qs.parse('a[constructor][isBuffer]=x', { plainObjects: true });
  assert.doesNotThrow(() => qs.stringify(parsed), 'qs.stringify lanzo TypeError: el servidor se caeria');
});

test('#17 qs: bypass de arrayLimit con a[]=1,2,3,4 (GHSA-x5fp-wj9c-mxmx)', () => {
  assert.throws(
    () => qs.parse('a[]=1,2,3,4', { comma: true, arrayLimit: 3, throwOnLimitExceeded: true }),
    'qs acepto un arreglo mas grande que arrayLimit'
  );
});

test('#13 proxy-addr: un cliente no puede falsificar su IP con X-Forwarded-For (GHSA-jqcg-44mw-7w3h)', async () => {
  // Configuracion del advisory: subred IPv4-mapeada con prefijo corto.
  const app = express();
  app.set('trust proxy', '::ffff:10.0.0.0/8');
  app.get('/ip', (req, res) => res.json({ ip: req.ip }));

  const res = await request(app).get('/ip').set('X-Forwarded-For', '6.6.6.6');
  assert.notStrictEqual(res.body.ip, '6.6.6.6', 'La IP falsificada fue aceptada como la del cliente');
  assert.strictEqual(proxyaddr.compile('::ffff:10.0.0.0/8')('127.0.0.1', 0), false);
});

test('#14 next: la version instalada y la del lockfile son >= 15.5.24', () => {
  const { version } = requireFromWeb('next/package.json');
  assert.ok(atLeast(version, '15.5.24'), `next ${version} sigue vulnerable`);
});

test('#13-#17: ninguna version vulnerable queda en pnpm-lock.yaml', () => {
  const lock = fs.readFileSync('pnpm-lock.yaml', 'utf-8');
  const minimums = {
    'proxy-addr': '2.0.8',
    next: '15.5.24',
    jsonwebtoken: '9.0.0',
    lodash: '4.18.0',
    qs: '6.16.0',
  };
  for (const [pkg, minimum] of Object.entries(minimums)) {
    const versions = [...lock.matchAll(new RegExp(`^  ${pkg}@(\\d+\\.\\d+\\.\\d+)`, 'gm'))].map((m) => m[1]);
    assert.ok(versions.length > 0, `${pkg} no aparece en el lockfile`);
    for (const v of versions) {
      assert.ok(atLeast(v, minimum), `pnpm-lock.yaml resuelve ${pkg}@${v} (< ${minimum})`);
    }
  }
});

test('#4-#6: politicas de cadena de suministro de pnpm', () => {
  const workspace = fs.readFileSync('pnpm-workspace.yaml', 'utf-8');
  assert.match(workspace, /trustPolicy: no-downgrade/);
  assert.match(workspace, /blockExoticSubdeps: true/);
  assert.match(workspace, /minimumReleaseAge: 10080/);
});
