import { callProc } from "../callProc";

export async function LogAiCall(
  storeId: number,
  feature: string,
  provider: string,
  model: string,
  inputHash: string | null,
  requestJson: object,
  responseJson: object,
  tokensIn: number | null = null,
  tokensOut: number | null = null,
  estimatedCost: number | null = null,
  status: string = "stubbed"
) {
  return callProc("LogAiCall", [
    storeId,
    feature,
    provider,
    model,
    inputHash,
    JSON.stringify(requestJson),
    JSON.stringify(responseJson),
    tokensIn,
    tokensOut,
    estimatedCost,
    status,
  ]);
}
