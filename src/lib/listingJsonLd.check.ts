// ponytail: run with `npx tsx src/lib/listingJsonLd.check.ts` — no test runner in this repo yet.
import assert from "node:assert";
import { buildListingJsonLd } from "@/lib/listingJsonLd";

const mk = (city: unknown) => ({
  title: "Villa Bonita",
  ratingsCount: 0,
  averageRating: 0,
  listingItem: [{ __component: "dynamic-blocks.venue", location: { address: "Upelio g. 26", city, latitude: 1, longitude: 2 } }],
}) as never;

const addr = (city: unknown) => (buildListingJsonLd(mk(city), "u")[0] as any).address;

// Strapi relation object -> plain string
assert.strictEqual(addr({ id: 515, name: "Vilnius", locale: "lt" }).addressLocality, "Vilnius");
// plain string still works
assert.strictEqual(addr("Kaunas").addressLocality, "Kaunas");
// missing city -> key omitted, no null/object leaks
assert.ok(!("addressLocality" in addr(null)));
// nothing in the output is a non-schema object
assert.ok(!JSON.stringify(addr({ id: 515, name: "Vilnius" })).includes("documentId"));
console.log("ok");
