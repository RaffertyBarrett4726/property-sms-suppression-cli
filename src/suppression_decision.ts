import { z } from "zod";

export const maintenanceRequest = z.object({
  requestId: z.string().min(1),
  tenantPhone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  tenantName: z.string().min(1),
  summary: z.string().min(1).max(240),
  documentReady: z.boolean(),
  inspectionDate: z.string().date(),
  suppressedNumbers: z.array(z.string()).default([]),
});

export type MaintenanceRequest = z.infer<typeof maintenanceRequest>;

export type SmsDecision =
  | { action: "send"; reason: "allowed"; text: string }
  | { action: "suppress"; reason: "opted_out" | "document_pending"; text: string };

export function decideSms(input: MaintenanceRequest): SmsDecision {
  if (input.suppressedNumbers.includes(input.tenantPhone)) {
    return { action: "suppress", reason: "opted_out", text: "" };
  }
  if (!input.documentReady) {
    return { action: "suppress", reason: "document_pending", text: "" };
  }
  return {
    action: "send",
    reason: "allowed",
    text: `Hi ${input.tenantName}, maintenance request ${input.requestId} is logged: ${input.summary}. Inspection: ${input.inspectionDate}.`,
  };
}
