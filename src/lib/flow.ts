export const FLOW: Record<string, string[]> = {
  PLACED: ["CONFIRMED", "REJECTED", "CANCELLED"], CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"], READY_FOR_PICKUP: ["DELIVERED", "CANCELLED"], OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"] };
export const MSG: Record<string, string> = { CONFIRMED: "has been confirmed", PREPARING: "is being prepared", READY_FOR_PICKUP: "is ready for pickup", OUT_FOR_DELIVERY: "is out for delivery", DELIVERED: "has been delivered", CANCELLED: "has been cancelled", REJECTED: "could not be accepted" };
export const LABEL: Record<string, string> = { PLACED: "Placed", CONFIRMED: "Confirmed", PREPARING: "Preparing", READY_FOR_PICKUP: "Ready for pickup", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled", REJECTED: "Rejected" };
