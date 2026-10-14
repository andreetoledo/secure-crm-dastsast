import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Seguridad en Dependencias y Cadena de Suministro (SCA / CVEs Secciones 1, 2, 3, 4)', async (t) => {
  const rootPkgPath = path.resolve('package.json');
  const apiPkgPath = path.resolve('apps/api/package.json');
  const webPkgPath = path.resolve('apps/web/package.json');
  const workspacePath = path.resolve('pnpm-workspace.yaml');
  const npmrcPath = path.resolve('.npmrc');

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  const apiPkg = JSON.parse(fs.readFileSync(apiPkgPath, 'utf-8'));
  const webPkg = JSON.parse(fs.readFileSync(webPkgPath, 'utf-8'));
  const workspace = fs.readFileSync(workspacePath, 'utf-8');
  const npmrc = fs.existsSync(npmrcPath) ? fs.readFileSync(npmrcPath, 'utf-8') : '';

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

  await t.test('Mitiga GHSA-g5qg-72qw-gw5v en Next.js actualizado a >= 14.2.24', () => {
    const nextVer = webPkg.dependencies?.next || '';
    assert.strictEqual(
      nextVer === '14.2.15',
      false,
      'SCA: Next.js 14.2.15 es vulnerable a SSRF y bypass de autorizacion'
    );
    assert.ok(
      nextVer.includes('14.2.24') || rootPkg.pnpm?.overrides?.next,
      'Next.js debe ser >= 14.2.24'
    );
  });

  await t.test('Mitiga GHSA-jqcg-44mw-7w3h en proxy-addr (IP Spoofing) actualizado a >= 2.0.8', () => {
    const proxyOverride = rootPkg.pnpm?.overrides?.['proxy-addr'] || '';
    assert.ok(
      proxyOverride.includes('2.0.8') || proxyOverride.includes('>=2.0.8'),
      'proxy-addr debe estar forzado a >= 2.0.8 para mitigar IP Spoofing (CVSS 9.1)'
    );
  });

  await t.test('Mitiga las 10 CVEs de OWASP Dependency-Check mediante pnpm.overrides en root', () => {
    const overrides = rootPkg.pnpm?.overrides || {};
    const required = [
      'proxy-addr',
      'shell-quote',
      'lodash',
      'postcss',
      'braces',
      'source-map-js',
      'next',
      'qs',
      'jsonwebtoken',
      'postcss-selector-parser'
    ];
    for (const dep of required) {
      assert.ok(overrides[dep], `pnpm.overrides debe contener ${dep} para neutralizar su CVE reportado`);
    }
  });

  await t.test('Mitiga reglas Semgrep de Cadena de Suministro PNPM (trustPolicy, blockExotic, minimumReleaseAge)', () => {
    assert.ok(
      workspace.includes('trustPolicy: no-downgrade') || npmrc.includes('trust-policy=no-downgrade'),
      'Debe existir trustPolicy: no-downgrade para evitar degradaciones maliciosas'
    );
    assert.ok(
      workspace.includes('blockExoticSubdeps: true') || npmrc.includes('block-exotic-subdependencies=true'),
      'Debe bloquearse subdependencias exoticas no verificadas'
    );
    assert.ok(
      workspace.includes('minimumReleaseAge: 10080') || npmrc.includes('minimum-release-age=10080'),
      'Debe configurarse edad minima de liberacion de 7 dias (10080 min)'
    );
  });
});
