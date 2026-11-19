import assert from "node:assert/strict";
import { test } from "node:test";
import { esewaPaymentStatus, khaltiPaymentStatus } from "../lib/payment-verification";

test("Khalti lookup statuses map to Payflow statuses", () => {
  assert.equal(khaltiPaymentStatus("Completed"), "success");
  for (const status of ["Pending", "Initiated"]) {
    assert.equal(khaltiPaymentStatus(status), "pending");
  }
  for (const status of ["Expired", "User canceled", "Refunded", "COMPLETE", undefined]) {
    assert.equal(khaltiPaymentStatus(status), "failed");
  }
});

test("eSewa lookup statuses map to Payflow statuses", () => {
  assert.equal(esewaPaymentStatus("COMPLETE"), "success");
  for (const status of ["PENDING", "AMBIGUOUS"]) {
    assert.equal(esewaPaymentStatus(status), "pending");
  }
  for (const status of ["NOT_FOUND", "CANCELED", "FULL_REFUND", "Completed", undefined]) {
    assert.equal(esewaPaymentStatus(status), "failed");
  }
});
