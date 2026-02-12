/**
 * M-Pesa Ratiba (Standing Order) API client
 */

import api from "./api";

export interface RatibaOrder {
  id: string;
  status: string;
  amount: number;
  start_date: string;
  end_date: string;
  standing_order_name: string;
}

export interface RatibaStatusResponse {
  hasActive: boolean;
  order: RatibaOrder | null;
}

export interface SetupRatibaResponse {
  success: boolean;
  order: RatibaOrder;
}

export async function setupRatiba(
  subscriptionId: string,
  phoneNumber: string,
): Promise<SetupRatibaResponse> {
  const { data } = await api.post<SetupRatibaResponse>("/ratiba/setup", {
    subscriptionId,
    phoneNumber,
  });
  return data;
}

export async function getRatibaStatus(
  subscriptionId: string,
): Promise<RatibaStatusResponse> {
  const { data } = await api.get<RatibaStatusResponse>(
    `/ratiba/status/${subscriptionId}`,
  );
  return data;
}

export async function cancelRatiba(
  orderId: string,
): Promise<{ success: boolean; order: { id: string; status: string } }> {
  const { data } = await api.post(`/ratiba/cancel/${orderId}`);
  return data;
}
