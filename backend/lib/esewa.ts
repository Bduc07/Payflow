import crypto from "node:crypto";

export function signEsewaMessage(
  message: string,
  secretKey: string
): string {
  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");
}

export function buildEsewaSignature(params: {
  total_amount: number | string;
  transaction_uuid: string;
  product_code: string;
}): string {
  const message = `total_amount=${params.total_amount},transaction_uuid=${params.transaction_uuid},product_code=${params.product_code}`;
  return signEsewaMessage(message, process.env.ESEWA_SECRET_KEY!);
}
