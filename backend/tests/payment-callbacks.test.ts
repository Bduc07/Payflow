import assert from "node:assert/strict";
import { once } from "node:events";
import { test, type TestContext } from "node:test";
import express from "express";
import { createPaymentsRouter } from "../routes/payments";

const browserFetch = globalThis.fetch;
const frontend = process.env.FRONTEND_URL ?? "http://localhost:5173";
const externalRef = "test-payment-reference";
const merchant = { slug: "sample-shop" };

const khaltiCallback = `/khalti/callback?pidx=${externalRef}&status=Completed`;
const esewaData = Buffer.from(JSON.stringify({
  transaction_uuid: externalRef,
  total_amount: "25",
  product_code: "EPAYTEST",
  status: "COMPLETE",
})).toString("base64");
const esewaCallback = `/esewa/callback?data=${encodeURIComponent(esewaData)}`;

async function requestCallback(
  t: TestContext,
  path: string,
  transactions: NonNullable<Parameters<typeof createPaymentsRouter>[0]>,
) {
  const app = express();
  app.use("/api/payments", createPaymentsRouter(transactions));
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const response = await browserFetch(
    `http://127.0.0.1:${address.port}/api/payments${path}`,
    { redirect: "manual", signal: AbortSignal.timeout(5000) },
  );
  await response.text();
  assert.equal(response.status, 302);
  return response.headers.get("location");
}

function mockTransactions(t: TestContext, transaction: { merchant: typeof merchant } | null = { merchant }) {
  const find = t.mock.fn(async (_query: unknown) => transaction);
  const update = t.mock.fn(async (_query: unknown) => transaction);
  return { find, update };
}

const scenarios = [
  { gateway: "Khalti", path: khaltiCallback, providerStatus: "Completed", expected: "success" },
  { gateway: "Khalti", path: khaltiCallback, providerStatus: "Pending", expected: "pending" },
  { gateway: "Khalti", path: khaltiCallback, providerStatus: "Expired", expected: "failed" },
  { gateway: "eSewa", path: esewaCallback, providerStatus: "COMPLETE", expected: "success" },
  { gateway: "eSewa", path: esewaCallback, providerStatus: "AMBIGUOUS", expected: "pending" },
  { gateway: "eSewa", path: esewaCallback, providerStatus: "NOT_FOUND", expected: "failed" },
];

for (const { gateway, path, providerStatus, expected } of scenarios) {
  test(`${gateway} callback uses provider status ${providerStatus}`, async (t) => {
    const { find, update } = mockTransactions(t);
    const lookup = t.mock.method(globalThis, "fetch", async (
      _input: Parameters<typeof fetch>[0], _options?: RequestInit,
    ) => Response.json({ status: providerStatus }));

    assert.equal(await requestCallback(t, path, { findUnique: find, update }), `${frontend}/pay/${merchant.slug}?payment=${expected}`);

    assert.equal(lookup.mock.callCount(), 1);
    const [input, options] = lookup.mock.calls[0].arguments;
    if (gateway === "Khalti") {
      assert.equal(input, "https://dev.khalti.com/api/v2/epayment/lookup/");
      assert.equal(options?.method, "POST");
      assert.equal(new Headers(options?.headers).get("Authorization"), `Key ${process.env.KHALTI_SECRET_KEY}`);
      assert.deepEqual(JSON.parse(String(options?.body)), { pidx: externalRef });
    } else {
      const url = new URL(String(input));
      assert.equal(url.origin + url.pathname, "https://rc.esewa.com.np/api/epay/transaction/status/");
      assert.equal(url.searchParams.get("transaction_uuid"), externalRef);
      assert.equal(url.searchParams.get("total_amount"), "25");
      assert.equal(url.searchParams.get("product_code"), "EPAYTEST");
    }
    assert.deepEqual(find.mock.calls.map((call) => call.arguments), [[
      { where: { externalRef }, include: { merchant: true } },
    ]]);
    assert.deepEqual(update.mock.calls.map((call) => call.arguments), [[
      { where: { externalRef }, data: { status: expected } },
    ]]);
  });
}

test("callbacks without a payment reference skip lookup and persistence", async (t) => {
  const lookup = t.mock.method(globalThis, "fetch", async () => Response.json({}));
  const { find, update } = mockTransactions(t);

  for (const path of ["/khalti/callback", "/esewa/callback"]) {
    assert.equal(await requestCallback(t, path, { findUnique: find, update }), `${frontend}/?payment=error`);
  }
  assert.equal(lookup.mock.callCount(), 0);
  assert.equal(find.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
});

test("a successful provider lookup cannot update a missing transaction", async (t) => {
  const { find, update } = mockTransactions(t, null);
  t.mock.method(globalThis, "fetch", async () => Response.json({ status: "Completed" }));

  assert.equal(await requestCallback(t, khaltiCallback, { findUnique: find, update }), `${frontend}/?payment=error`);
  assert.equal(update.mock.callCount(), 0);
});

test("Khalti HTTP errors leave transaction status unchanged", async (t) => {
  const { find, update } = mockTransactions(t);
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async () => Response.json({ detail: "Unavailable" }, { status: 503 }));

  assert.equal(await requestCallback(t, khaltiCallback, { findUnique: find, update }), `${frontend}/?payment=error`);
  assert.equal(find.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
});

test("eSewa lookup exceptions leave transaction status unchanged", async (t) => {
  const { find, update } = mockTransactions(t);
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Gateway unavailable");
  });

  assert.equal(await requestCallback(t, esewaCallback, { findUnique: find, update }), `${frontend}/?payment=error`);
  assert.equal(find.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
});
