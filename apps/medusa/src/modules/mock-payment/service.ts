import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";

/**
 * Dev-only payment provider that simulates a gateway (Stripe/Razorpay come
 * later, see plan §5 and §8 Phase 5). Pass `data: { simulate: "decline" }`
 * on the payment session to exercise the checkout's failure/retry path.
 */
class MockPaymentProviderService extends AbstractPaymentProvider {
  static identifier = "mock";

  // Declared explicitly (public) so this class satisfies the `Constructor<T>`
  // shape ModuleProvider registration expects — the base class's constructor
  // is `protected`. See the AbstractPaymentProvider constructor's own JSDoc
  // example, which does the same.
  constructor(container: Record<string, unknown>, options: Record<string, unknown>) {
    super(container, options);
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    return {
      id: `mock_${Date.now()}`,
      status: "pending",
      data: { ...input.data, simulate: input.data?.simulate ?? "approve" },
    };
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    if (input.data?.simulate === "decline") {
      throw new Error("The card was declined (simulated decline via mock provider).");
    }
    return { data: input.data, status: "authorized" };
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: { ...input.data, status: "captured" } };
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: { ...input.data, status: "canceled" } };
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return { data: { ...input.data, status: "refunded" } };
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data };
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data };
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    return { status: (input.data?.status as GetPaymentStatusOutput["status"]) ?? "pending" };
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: { ...input.data, ...(input.context ?? {}) } };
  }

  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    return { action: "not_supported" };
  }
}

export default MockPaymentProviderService;
