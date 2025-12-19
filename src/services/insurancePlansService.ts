import api from "./api";

export interface InsurancePlan {
  id: string;
  name: string;
  slug?: string;
  description: string;
  premium_amount: number;
  premium_frequency: "daily" | "weekly" | "monthly" | "annual";
  coverage_amount: number;
  coverage_details: {
    benefits?: string[];
    limitations?: string[];
    terms?: string;
  };
  portions: {
    insurance_share: { value: number };
  };
  grace_period_days: number;
  is_active: boolean;
  subscriberCount?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all insurance plans
 */
export const getPlans = async (
  activeOnly = false
): Promise<InsurancePlan[]> => {
  const response = await api.get("/plans", {
    params: { active_only: activeOnly },
  });
  return response.data.plans;
};

/**
 * Fetch single insurance plan by ID
 */
export const getPlanById = async (id: string): Promise<InsurancePlan> => {
  const response = await api.get(`/plans/${id}`);
  return response.data.plan;
};

/**
 * Find plan by slug
 */
export const getPlanBySlug = async (
  slug: string
): Promise<InsurancePlan | null> => {
  const plans = await getPlans(true);
  return plans.find((p) => p.slug === slug) || null;
};

export default {
  getPlans,
  getPlanById,
  getPlanBySlug,
};

