// Run: node scripts/test-www-redirect.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { unstable_getResponseFromNextConfig } = require('next/experimental/testing/server');
const output = {};
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../next.config.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
).outputText, {
  exports: output,
  require: (name) => {
    assert.equal(name, 'next-intl/plugin');
    return () => (config) => config;
  },
});

(async () => {
  for (const suffix of ['/', '/en/listing/test?ref=search', '/sitemap_index.xml']) {
    const response = await unstable_getResponseFromNextConfig({
      url: `https://www.planuojam.lt${suffix}`, nextConfig: output.default,
    });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), `https://planuojam.lt${suffix}`);
  }
  for (const host of ['planuojam.lt', 'localhost', 'strapi.planuojam.lt', 'wwwXplanuojamXlt']) {
    const response = await unstable_getResponseFromNextConfig({
      url: `https://${host}/en/listing/test`, nextConfig: output.default,
    });
    assert.equal(response.headers.get('location'), null);
  }
  console.log('WWW redirects permanently, preserves paths/query strings, and leaves other hosts alone.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
