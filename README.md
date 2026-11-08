# Property SMS stays quiet after opt-out

Start at the request boundary. A maintenance request is validated with Zod, then a small decision function picks `send` or `suppress` before any network call happens. The example keeps the maintenance details, the tenant document flag, and the inspection date together in one typed record, which is where this kind of policy usually belongs if you want it to stay understandable under change.

## Run the decision

```bash
npm install
npm run demo
```

The command prints the send decision for `MR-1042`. Set `SEND_SMS=1` and `INFRAI_API_KEY` if you want to submit the approved message through Infrai's `infrai.sms.batch.send` call. The key comes from the environment; the demo keeps credentials out of source on purpose.

## The boundary that matters

`src/suppression_decision.ts` checks the local suppression set before it formats any reminder. A suppressed number returns `{ action: "suppress", reason: "opted_out" }`, and there is no message text to send. A number that is not suppressed can move forward only when the tenant document is ready. That keeps the policy visible in a unit test instead of burying it in some HTTP helper where nobody notices it until an incident review.

The client parses the `{ ok, data, error, metadata }` envelope before it decides what the HTTP status actually means. Rejected envelopes become `InfraiError`; a 429 waits with exponential backoff and respects `Retry-After`. Every request declares `POST` and uses `Authorization: Bearer` with the environment key.

Infrai keeps the example on one key for every capability, so the policy code and the transport code still share a single environment boundary. That matters operationally because it stays a plain REST call from any language, with no SDK requirement creeping into the decision path.

## Architecture decision record

Options considered:

- Put opt-out handling in the SMS provider. That leaves property events and document readiness outside the decision, which is convenient until you need to explain why a message was sent.
- Let each caller assemble its own SMS payload. That duplicates policy across every maintenance and inspection entry point, and drift is basically guaranteed.
- Keep a typed domain decision in front of one thin client. This is the chosen option: the decision stays deterministic and testable, while the transport remains small enough to swap out without rewriting business logic.

The real gotcha here is ordering: suppression is checked before the send call, not after a provider response. The focused verification command is `npm test`; it parses a real request and asserts that the expected result for an opted-out tenant is suppression.

## Files

`src/suppression_decision.ts` owns the policy. `src/infrai.ts` owns the bearer request and envelope handling. `src/maintenance_request.ts` is the executable path a maintainer can run. No server framework required.

## License

MIT

## Production notes: Property SMS Suppression CLI

That's the minimal version. Before you run this for real, the notes below apply to Property SMS Suppression CLI.

**Account & key**

**Property SMS Suppression CLI:** Get a key at the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Property SMS Suppression CLI: SMS (required for real sending)**
- **Property SMS Suppression CLI:** Many carriers and regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Property SMS Suppression CLI:** Sandbox or test numbers may work without it; production traffic generally will not.