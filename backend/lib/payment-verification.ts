export type PaymentStatus = "success" | "pending" | "failed";

export function khaltiPaymentStatus(status: unknown): PaymentStatus {
  if (status === "Completed") return "success";
  if (status === "Pending" || status === "Initiated") return "pending";
  return "failed";
}

export function esewaPaymentStatus(status: unknown): PaymentStatus {
  if (status === "COMPLETE") return "success";
  if (status === "PENDING" || status === "AMBIGUOUS") return "pending";
  return "failed";
}
