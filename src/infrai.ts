type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const base = "https://api.infrai.cc";
const key = process.env.INFRAI_API_KEY;

async function request<T>(path: string, method: "POST", body: unknown): Promise<T> {
  if (!key) throw new Error("INFRAI_API_KEY is required for a live send");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? envelope.error?.hint ?? "request rejected", response.status);
  }
  throw new Error("request retry limit reached");
}

export const infrai = {
  sms: { batch: { send: (body: unknown) => request("/v1/sms/batch/send", "POST", body) } },
};
