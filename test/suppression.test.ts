import test from "node:test";
import assert from "node:assert/strict";
import { decideSms, maintenanceRequest } from "../src/suppression_decision.ts";

const request = maintenanceRequest.parse({
  requestId: "MR-7",
  tenantPhone: "+14155550142",
  tenantName: "Sam",
  summary: "No heat",
  documentReady: true,
  inspectionDate: "2026-11-04",
  suppressedNumbers: ["+14155550142"],
});

test("opted-out tenants never enter the send branch", () => {
  assert.deepEqual(decideSms(request), { action: "suppress", reason: "opted_out", text: "" });
});
