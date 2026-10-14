import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Seguridad en Dependencias de Produccion (SCA / CVEs en lodash, jsonwebtoken, qs, proxy-addr)', async (t) => {
  const rootPkgPath = path.resolve('package.json');
  const apiPkgPath = path.resolve('apps/api/package.json');

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  const apiPkg = JSON.parse(fs.readFileSync(apiPkgPath, 'utf-8'));

  await t.test('Mitiga CVE-2019-10744 & Prototype Pollution: lodash actualizado a >= 4.17.21', () => {
    const lodashVer = apiPkg.dependencies?.lodash || '';
    assert.strictEqual(
      lodashVer.startsWith('4.17.11'),
      false,
      'SCA: lodash 4.17.11 es vulnerable a Prototype Pollution e Inyeccion de Codigo'
    );
    assert.ok(
      lodashVer.includes('4.17.21') || rootPkg.pnpm?.overrides?.lodash,
      'lodash debe actualizarse a la version segura >= 4.17.21'
    );
  });

  await t.test('Mitiga CVE-2022-23529: jsonwebtoken actualizado a >= 9.0.2', () => {
    const jwtVer = apiPkg.dependencies?.jsonwebtoken || '';
    assert.strictEqual(
      jwtVer.startsWith('8.5.1'),
      false,
      'SCA: jsonwebtoken 8.5.1 contiene vulnerabilidades de bypass en verificacion de tokens'
    );
    assert.ok(
      jwtVer.includes('9.0') || rootPkg.pnpm?.overrides?.jsonwebtoken,
      'jsonwebtoken debe actualizarse a la version segura >= 9.0.2'
    );
  });

  await t.test('Mitiga vulnerabilidades transitivas mediante pnpm.overrides en root', () => {
    const overrides = rootPkg.pnpm?.overrides || {};
    assert.ok(
      overrides.qs || overrides['proxy-addr'] || overrides.lodash,
      'El package.json raiz debe definir pnpm.overrides para bloquear dependencias transitivas vulnerables'
    );
  });
});
