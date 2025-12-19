import api from "./api";
import axios from "axios";

// Normalize API URL to ensure it's properly formatted (same logic as api.ts)
const normalizeApiUrl = (url: string | undefined): string => {
  if (!url) {
    return import.meta.env.DEV ? "/api" : "http://localhost:3001/api";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }

  if (url.includes(".") && !url.startsWith("/")) {
    return `https://${url}`;
  }

  return url.startsWith("/") ? url : `/${url}`;
};

// Create a separate axios instance for public endpoints (no auth token)
const publicApi = axios.create({
  baseURL: normalizeApiUrl(import.meta.env.VITE_API_URL),
  headers: {
    "Content-Type": "application/json",
  },
});

export interface SubscriberSearchResponse {
  subscriber: {
    id: string;
    full_name: string;
    account_number: string;
    subscriber_type: "member" | "agent" | "super_agent";
  };
  subscription: {
    id: string;
    status: string;
    start_date: string;
    next_due_date: string | null;
    daily_balance_remaining: number;
    annual_balance_remaining: number;
    days_paid_current_period: number;
    balance_breakdown?: {
      overdue_amount: number;
      current_period_amount: number;
      overdue_days: number;
      next_unpaid_date: string | null;
      available_credit: number;
      net_balance_due: number;
      period_start: string;
      period_end: string;
    };
  } | null;
  plan: {
    id: string;
    name: string;
    premium_amount: number;
    premium_frequency: string;
    coverage_amount: number;
  } | null;
  phoneNumber: string | undefined;
  email: string | undefined;
  suggestedAmount: number;
}

/**
 * Check payment status for polling
 */
export const checkPaymentStatus = async (
  paymentId: string
): Promise<{ success: boolean; status: string; payment: any }> => {
  const response = await api.get(`/payments/status/${paymentId}`);
  return response.data;
};

/**
 * Search subscriber by ID number or phone number (public endpoint, no auth required)
 */
export const searchSubscriberByIdNumber = async (
  idNumber?: string,
  phone?: string
): Promise<SubscriberSearchResponse> => {
  let url = "/payments/public/search/";
  if (phone) {
    url += "0"; // Placeholder for idNumber param when using phone
    url += `?phone=${encodeURIComponent(phone)}`;
  } else if (idNumber) {
    url += idNumber;
  } else {
    throw new Error("Either ID number or phone number is required");
  }
  const response = await publicApi.get(url);
  return response.data;
};

/**
 * Initiate public payment (no auth required, but validates ID number)
 */
export const initiatePublicPayment = async (data: {
  subscriptionId: string;
  amount: number;
  phoneNumber: string;
  idNumber: string;
}): Promise<{
  success: boolean;
  message: string;
  conversationId?: string;
  paymentId?: string;
  provider?: string;
}> => {
  const response = await publicApi.post("/payments/public/initiate", data);
  return response.data;
};

/**
 * Check payment status (public version - no auth required)
 */
export const checkPublicPaymentStatus = async (
  paymentId: string
): Promise<{ success: boolean; status: string; payment: any }> => {
  const response = await publicApi.get(`/payments/public/status/${paymentId}`);
  return response.data;
};

export default {
  checkPaymentStatus,
  searchSubscriberByIdNumber,
  initiatePublicPayment,
  checkPublicPaymentStatus,
};

