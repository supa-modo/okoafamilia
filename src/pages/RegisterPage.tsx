import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbUser,
  TbUsers,
  TbLock,
  TbArrowRight,
  TbArrowLeft,
  TbCheck,
  TbAlertCircle,
  TbLoader2,
  TbTrash,
  TbUserPlus,
  TbMapPin,
  TbId,
  TbPhone,
  TbMail,
  TbUserHeart,
  TbCash,
  TbRefresh,
} from "react-icons/tb";
import DateInput from "../components/ui/DateInput";
import SearchableDropdown from "../components/ui/SearchableDropdown";
import ToggleSwitch from "../components/ui/ToggleSwitch";
import { ToastContainer } from "../components/ui/Toast";
import MpesaIcon from "../components/ui/MpesaIcon";
import Layout from "../components/Layout";
import kenyaCounties from "../data/kenyaCounties.json";
import { usePhoneInput } from "../hooks/usePhoneInput";
import { useToast } from "../hooks/useToast";
import {
  normalizePhoneNumber,
  normalizeAgentCode,
  getAgeValidationError,
} from "../utils/validation";
import {
  saveFormData,
  loadFormData,
  clearFormData,
  sanitizeFormData,
} from "../utils/formPersistence";
import { register } from "../services/authService";
import { getPlans, InsurancePlan } from "../services/insurancePlansService";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { checkPaymentStatus } from "../services/paymentService";
import SEO from "../components/SEO";

// Environment variables for Okoa Familia
// Agent code MUST be set via environment variable - no fallback in production
const OKOA_AGENT_CODE = import.meta.env.VITE_OKOA_FAMILIA_AGENT;
const OKOA_PLAN_SLUG =
  import.meta.env.VITE_OKOA_FAMILIA_PLAN_SLUG || "daily-premium-70";

// Validate required environment variables
if (!OKOA_AGENT_CODE) {
  console.error(
    "VITE_OKOA_FAMILIA_AGENT environment variable is required but not set!"
  );
}

interface FormData {
  full_name: string;
  id_number: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  county: string;
  sub_county: string;
  nok_name: string;
  nok_phone: string;
  nok_relationship: string;
  password: string;
  confirm_password: string;
}

interface Dependant {
  id: string;
  name: string;
  relationship: string;
  date_of_birth: string;
  id_number?: string;
  included: boolean;
}

const initialFormData: FormData = {
  full_name: "",
  id_number: "",
  phone: "",
  email: "",
  gender: "",
  date_of_birth: "",
  county: "",
  sub_county: "",
  nok_name: "",
  nok_phone: "",
  nok_relationship: "",
  password: "",
  confirm_password: "",
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toasts, showToast, dismissToast } = useToast();
  const { setAuth } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [dependants, setDependants] = useState<Dependant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<InsurancePlan | null>(null);

  // Step 4 Payment Activation state
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(70);
  const [paymentPhone, setPaymentPhone] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "waiting" | "success" | "error" | "timeout"
  >("idle");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [mpesaReceiptNumber, setMpesaReceiptNumber] = useState<string | null>(
    null
  );
  const [timerInterval, setTimerInterval] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Phone input hooks
  const phoneInput = usePhoneInput({
    initialValue: formData.phone,
    onValueChange: (value) =>
      setFormData((prev) => ({ ...prev, phone: value })),
  });

  const nokPhoneInput = usePhoneInput({
    initialValue: formData.nok_phone,
    onValueChange: (value) =>
      setFormData((prev) => ({ ...prev, nok_phone: value })),
  });

  // Step 4 payment phone input
  const paymentPhoneInput = usePhoneInput({
    initialValue: paymentPhone,
    onValueChange: (value) => setPaymentPhone(value),
  });

  // Load saved form data and fetch plan on mount
  useEffect(() => {
    const savedData = loadFormData("REGISTER");
    if (savedData) {
      if (savedData.formData) {
        setFormData(savedData.formData);
        phoneInput.setValue(savedData.formData.phone || "");
        nokPhoneInput.setValue(savedData.formData.nok_phone || "");
      }
      if (savedData.dependants) {
        setDependants(savedData.dependants);
      }
      if (savedData.currentStep && savedData.currentStep < 4) {
        setCurrentStep(savedData.currentStep);
      }
    }

    // Fetch plan by slug
    fetchPlan();
  }, []);

  // Initialize payment amount when plan is loaded
  useEffect(() => {
    if (plan && paymentAmount === 70 && currentStep === 4) {
      // Set default payment amount based on plan premium
      setPaymentAmount(Math.max(70, Math.round(plan.premium_amount / 100)));
    }
  }, [plan, currentStep]);

  // Save form data on changes
  useEffect(() => {
    const sanitized = sanitizeFormData(formData);
    saveFormData("REGISTER", {
      formData: sanitized,
      dependants,
      currentStep,
    });
  }, [formData, dependants, currentStep]);

  const fetchPlan = async () => {
    try {
      const plans = await getPlans(true);
      const targetPlan = plans.find((p) => p.slug === OKOA_PLAN_SLUG);
      if (targetPlan) {
        setPlan(targetPlan);
      } else {
        showToast({
          type: "error",
          message: "Insurance plan not found. Please contact support.",
        });
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
      showToast({
        type: "error",
        message: "Failed to load insurance plan",
      });
    }
  };

  // Verify agent code is configured on mount
  useEffect(() => {
    if (!OKOA_AGENT_CODE) {
      console.error(
        "VITE_OKOA_FAMILIA_AGENT is not set in environment variables"
      );
      showToast({
        type: "error",
        message: "System configuration error. Please contact support.",
      });
    }
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addDependant = () => {
    if (dependants.length >= 7) {
      showToast({
        type: "error",
        message: "Maximum 7 dependants allowed",
      });
      return;
    }

    const newDependant: Dependant = {
      id: `dep_${Date.now()}`,
      name: "",
      relationship: "",
      date_of_birth: "",
      id_number: "",
      included: true,
    };
    setDependants([...dependants, newDependant]);
  };

  const updateDependant = (id: string, field: keyof Dependant, value: any) => {
    setDependants((prev) =>
      prev.map((dep) => (dep.id === id ? { ...dep, [field]: value } : dep))
    );
  };

  const removeDependant = (id: string) => {
    setDependants((prev) => prev.filter((dep) => dep.id !== id));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }
    if (!formData.id_number.trim()) {
      newErrors.id_number = "ID number is required";
    }
    if (!phoneInput.normalizedValue || phoneInput.normalizedValue.length < 12) {
      newErrors.phone = "Valid phone number is required";
    }
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required";
    } else {
      const ageError = getAgeValidationError(formData.date_of_birth);
      if (ageError) {
        newErrors.date_of_birth = ageError;
      }
    }
    if (!formData.county) {
      newErrors.county = "County is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nok_name.trim()) {
      newErrors.nok_name = "Next of kin name is required";
    }
    if (
      !nokPhoneInput.normalizedValue ||
      nokPhoneInput.normalizedValue.length < 12
    ) {
      newErrors.nok_phone = "Valid phone number is required";
    }
    if (!formData.nok_relationship) {
      newErrors.nok_relationship = "Relationship is required";
    }

    // Validate dependants
    dependants.forEach((dep, index) => {
      if (dep.included) {
        if (!dep.name.trim()) {
          newErrors[`dep_${index}_name`] = "Name is required";
        }
        if (!dep.relationship) {
          newErrors[`dep_${index}_relationship`] = "Relationship is required";
        }
        if (!dep.date_of_birth) {
          newErrors[`dep_${index}_dob`] = "Date of birth is required";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let valid = false;

    switch (currentStep) {
      case 1:
        valid = validateStep1();
        break;
      case 2:
        valid = validateStep2();
        break;
      default:
        valid = true;
    }

    if (valid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    if (!plan) {
      showToast({
        type: "error",
        message: "Insurance plan not loaded. Please refresh and try again.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const includedDependants = dependants
        .filter((d) => d.included)
        .map((d) => ({
          full_names: d.name,
          relationship: d.relationship,
          date_of_birth: d.date_of_birth,
          id_number: d.id_number || undefined,
        }));

      // Ensure agent code is always from environment variable
      if (!OKOA_AGENT_CODE) {
        showToast({
          type: "error",
          message: "Agent code not configured. Please contact support.",
        });
        setIsSubmitting(false);
        return;
      }

      const agentCode = normalizeAgentCode(OKOA_AGENT_CODE);
      if (!agentCode) {
        showToast({
          type: "error",
          message: "Invalid agent code configuration. Please contact support.",
        });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        role: "member" as const,
        full_name: formData.full_name.trim(),
        id_number: formData.id_number.trim(),
        phone: normalizePhoneNumber(phoneInput.normalizedValue),
        email: formData.email?.trim() || undefined,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        county: formData.county,
        sub_county: formData.sub_county?.trim() || undefined,
        password: formData.password,
        next_of_kin: {
          name: formData.nok_name.trim(),
          phone: normalizePhoneNumber(nokPhoneInput.normalizedValue),
          relationship: formData.nok_relationship,
        },
        dependants:
          includedDependants.length > 0 ? includedDependants : undefined,
        agent_code: agentCode,
        plan_id: plan.id,
        initiate_payment: true,
        payment_phone: normalizePhoneNumber(phoneInput.normalizedValue),
      };

      const response = await register(payload);

      if (response.user && response.accessToken) {
        setAuth(response.user, response.accessToken, response.refreshToken);

        // Store subscription ID and premium amount for Step 4
        const subId =
          response.subscription?.id || response.roleData?.subscription?.id;
        if (subId) {
          setSubscriptionId(subId);
        }
        if (plan) {
          setPaymentAmount(Math.max(70, Math.round(plan.premium_amount / 100)));
        }
        const phoneValue =
          phoneInput.displayValue ||
          normalizePhoneNumber(phoneInput.normalizedValue);
        setPaymentPhone(phoneValue);
        paymentPhoneInput.setValue(phoneValue);
        setPaymentStatus("idle");

        // Move to Step 4 for payment activation if subscription ID is available
        if (subId) {
          setCurrentStep(4);
          window.scrollTo({ top: 0, behavior: "smooth" });
          clearFormData("REGISTER");
        } else {
          // Fallback: navigate to payment page if subscription ID not available
          showToast({
            type: "success",
            message:
              "Registration successful! Please complete your first payment.",
          });
          navigate("/pay");
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      showToast({
        type: "error",
        message: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate phone number format for payment
  const isValidPhoneNumber = (phone: string): boolean => {
    const normalized = normalizePhoneNumber(phone);
    return /^\+254[0-9]{9}$/.test(normalized);
  };

  // Start countdown timer for payment
  const startCountdownTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerInterval(null);
          setPaymentStatus("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(interval);
  };

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle STK Push payment initiation
  const handleSTKPush = async () => {
    if (!subscriptionId) {
      setPaymentError(
        "Subscription ID not found. Please try registering again."
      );
      return;
    }

    if (paymentAmount < 70) {
      setPaymentError("Payment amount must be at least KShs 70");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(
      paymentPhoneInput.normalizedValue || paymentPhoneInput.displayValue
    );
    if (!normalizedPhone.trim()) {
      setPaymentError("Phone number is required for STK Push");
      return;
    }

    if (!isValidPhoneNumber(normalizedPhone)) {
      setPaymentError("Please enter a valid Kenyan phone number");
      return;
    }

    setPaymentError(null);
    setPaymentStatus("processing");

    try {
      const response = await api.post("/payments/initiate", {
        subscriptionId: subscriptionId,
        amount: paymentAmount,
        phoneNumber: normalizedPhone,
      });

      const transactionId =
        response.data.transactionId || response.data.paymentId;
      if (transactionId) {
        setPaymentStatus("waiting");
        setTimeRemaining(60);
        startCountdownTimer();
        pollPaymentStatus(transactionId);
      } else {
        setPaymentStatus("error");
        setPaymentError("Payment initialization failed. Please try again.");
      }
    } catch (error: any) {
      setPaymentStatus("error");
      setPaymentError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Payment failed. Please try again."
      );
    }
  };

  // Poll payment status
  const pollPaymentStatus = async (paymentId: string) => {
    const maxAttempts = 6; // 60 seconds at 10 second intervals
    let attempts = 0;
    let isPolling = true;

    const poll = async () => {
      if (!isPolling || attempts >= maxAttempts) {
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
        return;
      }

      attempts++;
      try {
        const result = await checkPaymentStatus(paymentId);

        if (result.success && result.status === "completed") {
          isPolling = false;
          setPaymentStatus("success");
          setMpesaReceiptNumber(result.payment?.mpesa_transaction_id || null);
          if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
          }
        } else if (result.status === "failed") {
          isPolling = false;
          setPaymentStatus("error");
          setPaymentError("Payment failed. Please try again.");
          if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
          }
        } else if (attempts < maxAttempts && isPolling) {
          setTimeout(poll, 10000);
        } else if (isPolling) {
          isPolling = false;
          setPaymentStatus("timeout");
          if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (attempts < maxAttempts && isPolling) {
          setTimeout(poll, 10000);
        } else if (isPolling) {
          isPolling = false;
          setPaymentStatus("timeout");
          if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
          }
        }
      }
    };

    poll();
  };

  const handleTryAgain = () => {
    setPaymentStatus("idle");
    setPaymentError(null);
    setMpesaReceiptNumber(null);
    setTimeRemaining(60);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const steps = [
    { num: 1, title: "Personal Info", icon: TbUser },
    { num: 2, title: "Family & NOK", icon: TbUsers },
    { num: 3, title: "Security", icon: TbLock },
    { num: 4, title: "Activate", icon: TbCash },
  ];

  return (
    <Layout
      navbarVariant="simple"
      navbarMaxWidth="narrow"
      footerVariant="simple"
      background="bg-gradient-to-br from-primary-50 via-white to-secondary-50"
      contentClassName="pb-12 px-4 sm:px-6 lg:px-8"
    >
      <SEO
        title="Register for Okoa Familia - Join Affordable Family Health Insurance"
        description="Register for Okoa Familia and protect your family with affordable health insurance at just KShs. 70 per day. Complete registration in 4 simple steps. Cover up to 7 family members with comprehensive medical coverage."
        keywords="okoa familia registration, register okoa familia, okoa familia sign up, okoa familia join, okoa familia insurance registration, okoa familia kenya registration, how to register okoa familia, okoa familia application"
        canonicalUrl="/register"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Okoa Familia Registration",
            description:
              "Register for Okoa Familia affordable family health insurance. Complete your registration in 4 simple steps and protect up to 7 family members at just KShs. 70 per day.",
            url: "https://okoafamilia.innovasure.co.ke/register",
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://okoafamilia.innovasure.co.ke/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Register",
                item: "https://okoafamilia.innovasure.co.ke/register",
              },
            ],
          },
        ]}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.num} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep >= step.num
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {currentStep > step.num ? (
                    <TbCheck className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-24 lg:w-32 h-1 mx-2 rounded ${
                      currentStep > step.num ? "bg-primary-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span
                key={step.num}
                className={`text-xs sm:text-sm font-medium ${
                  currentStep >= step.num ? "text-primary-600" : "text-gray-400"
                }`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Plan Info Banner */}
        {plan && (
          <div className="mb-6 p-4 bg-linear-to-r from-primary-100 to-secondary-100 rounded-xl border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Plan</p>
                <p className="font-bold text-primary-700 font-lexend">
                  {plan.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Daily Premium</p>
                <p className="text-2xl font-bold text-primary-600 font-lexend">
                  KES {plan.premium_amount / 100}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 lg:p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 font-lexend mb-6 flex items-center gap-2">
                  <TbUser className="w-6 h-6 text-primary-600" />
                  Personal Information
                </h2>

                <div className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <TbUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) =>
                          handleInputChange("full_name", e.target.value)
                        }
                        placeholder="Enter your full name"
                        className={`input-field pl-12 ${
                          errors.full_name ? "input-error" : ""
                        }`}
                      />
                    </div>
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <TbAlertCircle className="w-4 h-4" />
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* ID Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      National ID Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <TbId className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.id_number}
                        onChange={(e) =>
                          handleInputChange("id_number", e.target.value)
                        }
                        placeholder="Enter your ID number"
                        className={`input-field pl-12 ${
                          errors.id_number ? "input-error" : ""
                        }`}
                      />
                    </div>
                    {errors.id_number && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <TbAlertCircle className="w-4 h-4" />
                        {errors.id_number}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <TbPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={phoneInput.displayValue}
                        onChange={phoneInput.handleChange}
                        onFocus={phoneInput.handleFocus}
                        placeholder="+254 7XX XXX XXX"
                        className={`input-field pl-12 ${
                          errors.phone ? "input-error" : ""
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <TbAlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email Address{" "}
                      <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <TbMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="you@example.com"
                        className="input-field pl-12"
                      />
                    </div>
                  </div>

                  {/* Gender & DOB Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) =>
                          handleInputChange("gender", e.target.value)
                        }
                        className={`input-field ${
                          errors.gender ? "input-error" : ""
                        }`}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                      {errors.gender && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <TbAlertCircle className="w-4 h-4" />
                          {errors.gender}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <DateInput
                        value={formData.date_of_birth}
                        onChange={(value) =>
                          handleInputChange("date_of_birth", value)
                        }
                        className={`input-field ${
                          errors.date_of_birth ? "input-error" : ""
                        }`}
                        error={!!errors.date_of_birth}
                      />
                      {errors.date_of_birth && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <TbAlertCircle className="w-4 h-4" />
                          {errors.date_of_birth}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* County & Sub-county */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <SearchableDropdown
                        label="County"
                        options={kenyaCounties}
                        value={formData.county}
                        onChange={(value) => handleInputChange("county", value)}
                        placeholder="Select county"
                        error={errors.county}
                        required
                        leftIcon={
                          <TbMapPin className="w-5 h-5 text-gray-400" />
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Sub-County
                      </label>
                      <input
                        type="text"
                        value={formData.sub_county}
                        onChange={(e) =>
                          handleInputChange("sub_county", e.target.value)
                        }
                        placeholder="Enter sub-county"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Family & Next of Kin */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 lg:p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 font-lexend mb-6 flex items-center gap-2">
                  <TbUserHeart className="w-6 h-6 text-primary-600" />
                  Next of Kin Details
                </h2>

                <div className="space-y-5 mb-8">
                  {/* NOK Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Next of Kin Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <TbUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.nok_name}
                        onChange={(e) =>
                          handleInputChange("nok_name", e.target.value)
                        }
                        placeholder="Enter next of kin name"
                        className={`input-field pl-12 ${
                          errors.nok_name ? "input-error" : ""
                        }`}
                      />
                    </div>
                    {errors.nok_name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <TbAlertCircle className="w-4 h-4" />
                        {errors.nok_name}
                      </p>
                    )}
                  </div>

                  {/* NOK Phone & Relationship */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <TbPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={nokPhoneInput.displayValue}
                          onChange={nokPhoneInput.handleChange}
                          onFocus={nokPhoneInput.handleFocus}
                          placeholder="+254 7XX XXX XXX"
                          className={`input-field pl-12 ${
                            errors.nok_phone ? "input-error" : ""
                          }`}
                        />
                      </div>
                      {errors.nok_phone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <TbAlertCircle className="w-4 h-4" />
                          {errors.nok_phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Relationship <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.nok_relationship}
                        onChange={(e) =>
                          handleInputChange("nok_relationship", e.target.value)
                        }
                        className={`input-field ${
                          errors.nok_relationship ? "input-error" : ""
                        }`}
                      >
                        <option value="">Select</option>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="child">Child</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.nok_relationship && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <TbAlertCircle className="w-4 h-4" />
                          {errors.nok_relationship}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dependants Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 font-lexend flex items-center gap-2">
                      <TbUsers className="w-5 h-5 text-secondary-600" />
                      Dependants
                    </h3>
                    <button
                      type="button"
                      onClick={addDependant}
                      disabled={dependants.length >= 7}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <TbUserPlus className="w-4 h-4" />
                      Add Dependant
                    </button>
                  </div>

                  {dependants.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
                      No dependants added yet. Click "Add Dependant" to include
                      family members.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {dependants.map((dep, index) => (
                        <div
                          key={dep.id}
                          className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ToggleSwitch
                                checked={dep.included}
                                onChange={() =>
                                  updateDependant(
                                    dep.id,
                                    "included",
                                    !dep.included
                                  )
                                }
                                size="small"
                                variant="success"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                Dependant {index + 1}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDependant(dep.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <TbTrash className="w-4 h-4" />
                            </button>
                          </div>

                          {dep.included && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <input
                                  type="text"
                                  value={dep.name}
                                  onChange={(e) =>
                                    updateDependant(
                                      dep.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Full name"
                                  className={`input-field text-sm ${
                                    errors[`dep_${index}_name`]
                                      ? "input-error"
                                      : ""
                                  }`}
                                />
                              </div>
                              <div>
                                <select
                                  value={dep.relationship}
                                  onChange={(e) =>
                                    updateDependant(
                                      dep.id,
                                      "relationship",
                                      e.target.value
                                    )
                                  }
                                  className={`input-field text-sm ${
                                    errors[`dep_${index}_relationship`]
                                      ? "input-error"
                                      : ""
                                  }`}
                                >
                                  <option value="">Relationship</option>
                                  <option value="spouse">Spouse</option>
                                  <option value="child">Child</option>
                                </select>
                              </div>
                              <div>
                                <DateInput
                                  value={dep.date_of_birth}
                                  onChange={(value) =>
                                    updateDependant(
                                      dep.id,
                                      "date_of_birth",
                                      value
                                    )
                                  }
                                  placeholder="Date of birth"
                                  className={`input-field text-sm ${
                                    errors[`dep_${index}_dob`]
                                      ? "input-error"
                                      : ""
                                  }`}
                                  error={!!errors[`dep_${index}_dob`]}
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={dep.id_number || ""}
                                  onChange={(e) =>
                                    updateDependant(
                                      dep.id,
                                      "id_number",
                                      e.target.value
                                    )
                                  }
                                  placeholder="ID number (if adult)"
                                  className="input-field text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Security & Submit */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 lg:p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 font-lexend mb-6 flex items-center gap-2">
                  <TbLock className="w-6 h-6 text-primary-600" />
                  Create Your Password
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <TbLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        placeholder="Create a password"
                        className={`input-field pl-12 ${
                          errors.password ? "input-error" : ""
                        }`}
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <TbAlertCircle className="w-4 h-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <TbLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.confirm_password}
                        onChange={(e) =>
                          handleInputChange("confirm_password", e.target.value)
                        }
                        placeholder="Confirm your password"
                        className={`input-field pl-12 ${
                          errors.confirm_password ? "input-error" : ""
                        }`}
                      />
                    </div>
                    {errors.confirm_password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <TbAlertCircle className="w-4 h-4" />
                        {errors.confirm_password}
                      </p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-8 p-4 bg-linear-to-r from-secondary-50 to-primary-50 rounded-xl border border-secondary-100">
                  <h3 className="font-bold text-gray-900 mb-3 font-lexend">
                    Registration Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{formData.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">
                        {phoneInput.displayValue}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dependants:</span>
                      <span className="font-medium">
                        {dependants.filter((d) => d.included).length}
                      </span>
                    </div>
                    {plan && (
                      <div className="flex justify-between pt-2 border-t border-secondary-200">
                        <span className="text-gray-600">First Payment:</span>
                        <span className="font-bold text-primary-600">
                          KES {plan.premium_amount / 100}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <MpesaIcon width={40} height={40} />
                    <div>
                      <p className="font-semibold text-gray-900">
                        M-Pesa Payment
                      </p>
                      <p className="text-sm text-gray-600">
                        You'll receive an M-Pesa prompt after registration
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Payment Activation */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 lg:p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 font-lexend mb-6 flex items-center gap-2">
                  <TbCash className="w-6 h-6 text-primary-600" />
                  Activate Your Policy
                </h2>

                <p className="text-gray-600 text-sm lg:text-base mb-6">
                  Complete your registration by making your first premium
                  payment to activate your policy
                </p>

                {paymentStatus === "idle" && (
                  <>
                    {paymentError && (
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                        <p className="text-sm font-medium">{paymentError}</p>
                      </div>
                    )}

                    {/* Amount input */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Payment Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-sm text-gray-500 font-bold">
                            KShs
                          </span>
                        </div>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : Math.round(parseFloat(e.target.value) || 0);
                            setPaymentAmount(value);
                            setPaymentError(null);
                          }}
                          className="input-field pl-16 font-semibold font-lexend"
                          min={70}
                          step="1"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Minimum: KShs 70. You can pay for multiple periods.
                      </p>
                    </div>

                    {/* Phone Number Input */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MpesaIcon variant="green" width={54} height={18} />
                        </div>
                        <input
                          type="tel"
                          value={paymentPhoneInput.displayValue}
                          onChange={paymentPhoneInput.handleChange}
                          onFocus={paymentPhoneInput.handleFocus}
                          placeholder="+254712345678"
                          className="input-field pl-20 font-semibold font-lexend"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        You will receive a payment prompt on your phone to enter
                        your PIN
                      </p>
                    </div>

                    {/* STK Push Payment Button */}
                    <button
                      onClick={handleSTKPush}
                      disabled={paymentStatus !== "idle"}
                      className="w-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 lg:py-3.5 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mb-6"
                    >
                      <span>Pay KShs {paymentAmount.toLocaleString()}</span>
                      <TbArrowRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {paymentStatus === "processing" && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-[3px] border-primary-600 mx-auto mb-6" />
                    <h4 className="text-lg font-semibold text-gray-500 mb-2">
                      Processing Payment
                    </h4>
                    <p className="text-gray-500 text-sm">
                      Please wait while we process your payment...
                    </p>
                  </div>
                )}

                {paymentStatus === "waiting" && (
                  <div className="flex flex-col items-center py-6 w-full">
                    <TbLoader2 className="w-10 h-10 text-slate-400 animate-spin mb-2" />

                    <div className="max-w-xl">
                      <p className="text-sm sm:text-base text-center text-gray-600 mb-3">
                        Mpesa STK Prompt sent to your phone{" "}
                        <span className="font-medium font-lexend text-slate-500">
                          {paymentPhoneInput.displayValue}
                        </span>
                      </p>

                      {/* Timer Display */}
                      <div className="mb-4 p-1">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="text-center">
                            <div className="text-base lg:text-lg font-bold text-slate-600 font-mono">
                              {formatTimeRemaining(timeRemaining)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full flex items-center justify-center space-x-2">
                        <span className="text-sm font-medium text-amber-600">
                          Waiting for confirmation
                        </span>
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse delay-300"></span>
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse delay-600"></span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentStatus === "success" && (
                  <div className="flex flex-col items-center w-full">
                    <div className="relative w-16 h-16 sm:w-20 mb-3 rounded-full flex items-center justify-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center">
                        <TbCheck className="h-10 w-10 text-secondary-700" />
                      </div>
                      <motion.svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 100 100"
                      >
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="47"
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="4"
                          strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </motion.svg>
                    </div>

                    <h3 className="text-lg md:text-xl font-semibold text-secondary-700 mb-2">
                      Payment Successful!
                    </h3>

                    {mpesaReceiptNumber && (
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-sans text-gray-500">
                              M-Pesa Receipt
                            </p>
                            <p className="text-base font-semibold text-secondary-700">
                              {mpesaReceiptNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-600 mb-6 text-center">
                      Your policy has been activated successfully!
                    </p>

                    <button
                      onClick={() => navigate("/pay")}
                      className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      Continue to Payment Page
                      <TbArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {paymentStatus === "error" && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <div className="flex items-center justify-center mx-auto mb-4">
                        <TbAlertCircle className="w-14 h-14 text-red-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-red-700 mb-4">
                        Payment Failed
                      </h4>
                      <p className="text-gray-500 mb-4 text-sm">
                        {paymentError ||
                          "Your payment could not be processed. Please try again."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleTryAgain}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300"
                      >
                        <TbRefresh className="mr-3 h-5 w-5" />
                        Retry Payment
                      </button>
                      <button
                        onClick={() => navigate("/pay")}
                        className="w-full px-6 py-3 border border-primary-600 rounded-xl text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Go to Payment Page
                      </button>
                    </div>
                  </div>
                )}

                {paymentStatus === "timeout" && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center mx-auto mb-2">
                        <TbAlertCircle className="w-14 h-14 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-amber-700 mb-4">
                        Payment Timeout
                      </h4>
                      <p className="text-gray-500 mb-4 text-sm font-normal">
                        The payment request has timed out. If you received an
                        M-Pesa confirmation message, the payment may have been
                        processed. Please check your payment history.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <button
                        onClick={handleTryAgain}
                        className="w-full flex justify-center items-center px-6 py-2.5 lg:py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300"
                      >
                        <TbRefresh className="mr-3 h-5 w-5" />
                        Retry Payment
                      </button>
                      <button
                        onClick={() => navigate("/pay")}
                        className="w-full px-6 py-2.5 lg:py-3 border border-primary-600 rounded-xl text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Go to Payment Page
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="px-6 lg:px-8 pb-6 lg:pb-8 flex justify-between gap-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  <TbArrowLeft className="w-5 h-5" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors font-medium shadow-lg shadow-primary-500/25"
                >
                  Continue
                  <TbArrowRight className="w-5 h-5" />
                </button>
              ) : currentStep === 3 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 text-white bg-secondary-600 hover:bg-secondary-700 rounded-xl transition-colors font-bold shadow-lg shadow-secondary-500/25 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <TbLoader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <TbCheck className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
