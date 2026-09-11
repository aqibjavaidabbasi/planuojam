// Run: node scripts/test-listing-revalidation.cjs (all external calls mocked).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const output = {};
const tags = [];
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/app/api/revalidate/route.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, {
  exports: output, console, process: { env: {} }, global: {},
  fetch: async () => ({ json: async () => ({ data: { nav: { categories: [] }, eventTypes: [] } }) }),
  require: (name) => {
    if (name === 'next/cache') return { revalidateTag: (tag) => tags.push(tag), revalidatePath: () => {} };
    if (name === 'next/server') return { NextResponse: { json: (body) => body } };
    assert.equal(name, '../../../config/i18n');
    return { SUPPORTED_LOCALES: ['en', 'lt'] };
  },
});

(async () => {
  for (const locale of ['en', 'lt', 'en']) {
    const result = await output.POST(new Request('http://localhost/api/revalidate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'listing', entry: { slug: 'test-listing', locale } }),
    }));
    assert.equal(result.revalidated, true);
  }
  assert.deepEqual(tags, ['listings', 'listings', 'listings']);
  console.log('Rapid listing saves and translation updates all invalidate the listing cache.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
