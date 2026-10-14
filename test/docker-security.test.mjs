import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Seguridad en Contenedores Docker (CWE-250 / SonarQube docker:S6471)', async (t) => {
  const apiDockerPath = path.resolve('apps/api/Dockerfile');
  const webDockerPath = path.resolve('apps/web/Dockerfile');

  const apiDockerContent = fs.readFileSync(apiDockerPath, 'utf-8');
  const webDockerContent = fs.readFileSync(webDockerPath, 'utf-8');

  await t.test('Mitiga S6471 en API: apps/api/Dockerfile declara usuario no privilegiado', () => {
    const hasNonRootUser = /USER\s+(?!root)\w+/i.test(apiDockerContent);
    assert.strictEqual(
      hasNonRootUser,
      true,
      'CWE-250 / S6471: apps/api/Dockerfile debe contener directiva USER no-root (ej: USER node)'
    );
  });

  await t.test('Mitiga S6471 en Web: apps/web/Dockerfile declara usuario no privilegiado', () => {
    const hasNonRootUser = /USER\s+(?!root)\w+/i.test(webDockerContent);
    assert.strictEqual(
      hasNonRootUser,
      true,
      'CWE-250 / S6471: apps/web/Dockerfile debe contener directiva USER no-root (ej: USER node)'
    );
  });

  await t.test('Verifica que USER este posicionado antes de la instruccion CMD', () => {
    const apiUserIndex = apiDockerContent.indexOf('USER');
    const apiCmdIndex = apiDockerContent.indexOf('CMD');
    assert.ok(apiUserIndex > 0 && apiUserIndex < apiCmdIndex, 'USER debe aplicarse antes de CMD en apps/api/Dockerfile');

    const webUserIndex = webDockerContent.indexOf('USER');
    const webCmdIndex = webDockerContent.indexOf('CMD');
    assert.ok(webUserIndex > 0 && webUserIndex < webCmdIndex, 'USER debe aplicarse antes de CMD en apps/web/Dockerfile');
  });
});
