import crypto from "crypto";
import { LogAiCall } from "../db/procedures/ai.proc";

export interface ReceiptExtractionRequest {
  image_url?: string;
  image_base64?: string;
  supplier_hint?: string;
  receipt_date_hint?: string;
}

export interface ReceiptExtractionDraft {
  supplier_name: string | null;
  receipt_date: string | null;
  subtotal: number | null;
  total: number | null;
  items: {
    raw_name: string;
    matched_product_id: number | null;
    matched_name: string | null;
    quantity: number | null;
    unit_cost: number | null;
    line_total: number | null;
    confidence: number;
    status: "needs_review";
  }[];
  warnings: string[];
  mutates_inventory: false;
}

function hashInput(input: ReceiptExtractionRequest) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

export async function extractReceiptDraft(
  storeId: number,
  payload: ReceiptExtractionRequest
) {
  const draft: ReceiptExtractionDraft = {
    supplier_name: payload.supplier_hint || null,
    receipt_date: payload.receipt_date_hint || null,
    subtotal: null,
    total: null,
    items: [],
    warnings: [
      "Receipt extraction is not connected to an AI provider yet.",
      "This response is a draft placeholder and does not change stock.",
    ],
    mutates_inventory: false,
  };

  const logResult = await LogAiCall(
    storeId,
    "receipt.extract",
    "stub",
    "stub-receipt-extractor-v1",
    hashInput(payload),
    {
      has_image_url: Boolean(payload.image_url),
      has_image_base64: Boolean(payload.image_base64),
      supplier_hint: payload.supplier_hint || null,
      receipt_date_hint: payload.receipt_date_hint || null,
    },
    draft,
    null,
    null,
    0,
    "stubbed"
  );

  return {
    ai_call_id: logResult?.[0]?.id ?? null,
    draft,
  };
}
