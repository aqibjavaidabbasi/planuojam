// Run: node scripts/test-promotion-window.cjs (payment, CMS, and email calls are mocked).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
let now;
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return Date.parse(now); }
}
const writes = [];
const requests = [];
function load(file, imports) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText, {
    exports, Date: Clock, URL, AbortController, setTimeout, clearTimeout,
    process: { env: {} }, console: { log() {}, warn() {}, error: console.error },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (options?.method === 'POST') writes.push({ url, data: JSON.parse(options.body).data });
      return { ok: true, status: 200, json: async () => ({ data: options?.method === 'POST' ? { id: 1 } : [] }) };
    },
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return exports;
}
const route = load('app/api/stripe-webhook/route.ts', {
  'next/server': { NextResponse: { json: (body) => body } },
  stripe: class { webhooks = { constructEvent: (body) => JSON.parse(body) }; },
  crypto: require('node:crypto'),
  '@/utils/emailSubjects': {},
  '@/config/i18n': { DEFAULT_LOCALE: 'lt' },
});
const card = load('components/promotions/PromotionCard.tsx', {
  react: require('react'), 'react/jsx-runtime': require('react/jsx-runtime'),
  'next-intl': { useLocale: () => 'lt', useTranslations: () => (key) => key },
}).default;

(async () => {
  const api = load('services/api.ts', { qs: require('qs') });
  for (const fetchListings of [api.fetchAPI, api.fetchAPIWithMeta]) {
    await fetchListings('listings/promoted', '', undefined, ['listings']);
    assert.equal(requests.at(-1).options.cache, 'no-store');
    assert.equal(requests.at(-1).options.next, undefined);
    await fetchListings('listings', '', undefined, ['listings']);
    assert.equal(requests.at(-1).options.next.revalidate, 3600);
  }
  const events = load('services/eventTypes.ts', { './api': { API_URL: 'http://localhost' } });
  await events.fetchEventTypeAggregateByEnSlug('test-event', 'lt');
  assert.equal(requests.at(-1).options.cache, 'no-store');
  for (const start of ['2026-09-11T13:00:00Z', '2026-03-28T14:00:00Z', '2026-10-24T13:00:00Z']) {
    for (const days of [1, 3]) {
      now = start;
      writes.length = 0;
      await route.POST(new Request('http://localhost/api/stripe-webhook', {
        method: 'POST', headers: { 'stripe-signature': 'test-only' },
        body: JSON.stringify({ type: 'payment_intent.succeeded', data: { object: {
          id: 'test-payment', amount_received: 100, currency: 'eur',
          metadata: { purpose: 'promotion', app_user_id: '1', listing_document_id: 'test-listing', promotion_stars: '1', promotion_days: String(days) },
        } } }),
      }));
      const promotion = writes.find(({ url }) => url.endsWith('/api/promotions'))?.data;
      const invoice = writes.find(({ url }) => url.endsWith('/api/invoices'))?.data;
      assert.ok(promotion, 'Payment must create a promotion');
      assert.ok(invoice, 'Payment must create an invoice');
      assert.equal(Date.parse(promotion.startsAt), Date.parse(start));
      assert.equal(Date.parse(promotion.expiresAt) - Date.parse(start), days * 86400000);
      assert.equal(invoice.periodStart, promotion.startsAt);
      assert.equal(invoice.periodEnd, promotion.expiresAt);
      const html = renderToStaticMarkup(card({ promotion }));
      assert.match(html, /status.ongoing/);
      assert.match(html, /16:00/);
      now = promotion.expiresAt;
      assert.match(renderToStaticMarkup(card({ promotion })), /status.completed/);
    }
  }
  console.log('Paid promotions/invoices use matching 24/72-hour windows; cards show times and expiry; promoted queries bypass caches.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
