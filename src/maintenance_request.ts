import { infrai } from "./infrai.ts";
import { decideSms, maintenanceRequest } from "./suppression_decision.ts";

const parsed = maintenanceRequest.parse({
  requestId: "MR-1042",
  tenantPhone: process.env.TENANT_PHONE ?? "+14155550142",
  tenantName: "Ari",
  summary: "Kitchen faucet leaks",
  documentReady: true,
  inspectionDate: "2026-11-04",
  suppressedNumbers: [],
});

const decision = decideSms(parsed);
console.log(JSON.stringify({ requestId: parsed.requestId, decision }, null, 2));

if (decision.action === "send" && process.env.SEND_SMS === "1") {
  if (!process.env.TENANT_PHONE) throw new Error("TENANT_PHONE is required for a live send");
  const payload = { messages: [{ to: parsed.tenantPhone, body: decision.text }] };
  const result = await infrai.sms.batch.send(payload);
  console.log(JSON.stringify({ sent: true, result }, null, 2));
}
