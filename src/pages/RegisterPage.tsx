import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TbLoader2, TbTrash } from "react-icons/tb";
import DateInput from "../components/ui/DateInput";
import SearchableDropdown from "../components/ui/SearchableDropdown";
import ToggleSwitch from "../components/ui/ToggleSwitch";
import { ToastContainer } from "../components/ui/Toast";
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
import ActivationStep from "../components/register/ActivationStep";
import { PiMapPinSimpleAreaBold } from "react-icons/pi";
import { RiUserAddLine } from "react-icons/ri";

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
  town: string;
  nok_name: string;
  nok_phone: string;
  nok_id_number: string;
  nok_relationship: string;
  nok_date_of_birth: string;
}

interface Dependant {
  id: string;
  name: string;
  relationship: string;
  date_of_birth: string;
  id_number?: string;
  gender?: string;
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
  town: "",
  nok_name: "",
  nok_phone: "",
  nok_id_number: "",
  nok_relationship: "",
  nok_date_of_birth: "",
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

  // Step 3 Payment Activation state
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  // Principal number stored for:
  // - Payment fallback (if subscriptionId unavailable)
  // - Member lookup and verification
  // - Future payment processing features
  const [principalNumber, setPrincipalNumber] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(70);
  const [paymentPhone, setPaymentPhone] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "waiting" | "success" | "error" | "timeout"
  >("idle");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [mpesaReceiptNumber, setMpesaReceiptNumber] = useState<string | null>(
    null
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Refs for polling interval and timeout (matching PaymentPage pattern)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Payment polling configuration (matching PaymentPage)
  const PAYMENT_POLL_INTERVAL = 3000; // 3 seconds
  const PAYMENT_MAX_ATTEMPTS = 20; // 1 minute total (20 * 3 seconds = 60 seconds)

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
      if (savedData.currentStep && savedData.currentStep < 3) {
        setCurrentStep(savedData.currentStep);
      }
    }

    // Fetch plan by slug
    fetchPlan();
  }, []);

  // Initialize payment amount when plan is loaded
  useEffect(() => {
    if (plan && paymentAmount === 70 && currentStep === 3) {
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
      gender: "",
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
    if (!formData.nok_id_number?.trim()) {
      newErrors.nok_id_number = "ID number is required";
    }
    if (!formData.nok_relationship) {
      newErrors.nok_relationship = "Relationship is required";
    }
    if (!formData.nok_date_of_birth) {
      newErrors.nok_date_of_birth = "Date of birth is required";
    } else {
      const ageError = getAgeValidationError(formData.nok_date_of_birth);
      if (ageError) {
        newErrors.nok_date_of_birth = ageError;
      }
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

  // Generate default password for registration
  const generateDefaultPassword = (): string => {
    // Generate a secure default password based on user data
    const idLast4 = formData.id_number.slice(-4) || "2024";
    return `Okoa${idLast4}!`;
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

    if (valid && currentStep < 3) {
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
    if (!validateStep2()) return;
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
          full_name: d.name.trim(),
          relationship: d.relationship as
            | "spouse"
            | "child"
            | "parent"
            | "sibling"
            | "other",
          date_of_birth: d.date_of_birth || undefined,
          gender: d.gender || undefined,
          id_number: d.id_number?.trim() || "",
          is_covered: true, // All included dependants are covered
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

      // Generate default password
      const defaultPassword = generateDefaultPassword();

      const payload = {
        role: "member" as const,
        full_name: formData.full_name.trim(),
        id_number: formData.id_number.trim(),
        phone: normalizePhoneNumber(phoneInput.normalizedValue),
        email: formData.email?.trim() || undefined,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        address: {
          town: formData.town?.trim() || formData.county, // Use county as fallback if town is empty
          county: formData.county,
        },
        password: defaultPassword,
        next_of_kin: {
          name: formData.nok_name.trim(),
          phone: normalizePhoneNumber(nokPhoneInput.normalizedValue),
          relationship: formData.nok_relationship,
          date_of_birth: formData.nok_date_of_birth,
          id_number: formData.nok_id_number?.trim() || undefined,
        },
        dependants:
          includedDependants.length > 0 ? includedDependants : undefined,
        agent_code: agentCode,
        plan_id: plan.id,
      };

      const response = await register(payload);

      // Log full response for debugging
      console.log("Registration response:", response);

      if (response.user && response.accessToken) {
        setAuth(response.user, response.accessToken, response.refreshToken);

        // Extract subscription ID and principal number from response
        const subId = response.subscription?.id;
        const principalNum = (response as any).member?.principal_number;

        // Validate that subscription was created
        if (!subId) {
          console.error(
            "Registration succeeded but subscription ID is missing:",
            response
          );
          showToast({
            type: "error",
            message:
              "Registration completed but subscription was not created. Please contact support.",
          });
          setIsSubmitting(false);
          return;
        }

        // Store subscription ID and principal number for Step 3 (Activation)
        setSubscriptionId(subId);
        setPrincipalNumber(principalNum || null);

        // Set payment amount from plan
        if (plan) {
          setPaymentAmount(Math.max(70, Math.round(plan.premium_amount / 100)));
        }

        // Set payment phone from user's registered phone
        const phoneValue =
          phoneInput.displayValue ||
          normalizePhoneNumber(phoneInput.normalizedValue);
        setPaymentPhone(phoneValue);
        paymentPhoneInput.setValue(phoneValue);
        setPaymentStatus("idle");

        // Always proceed to Step 3 (Payment Activation) like Innovasure does
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
        clearFormData("REGISTER");
        showToast({
          type: "success",
          message: "Registration successful. Activate your plan to finish.",
        });
      } else {
        // Response structure is invalid
        console.error("Invalid registration response structure:", response);
        showToast({
          type: "error",
          message:
            "Registration response is invalid. Please try again or contact support.",
        });
      }
    } catch (error: any) {
      // Log full error details for debugging
      console.error("Registration error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error,
      });

      // Extract user-friendly error message
      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Provide specific error messages for common issues
      if (errorMessage.includes("phone number already exists")) {
        errorMessage = "An account with this phone number already exists.";
      } else if (errorMessage.includes("ID number already exists")) {
        errorMessage = "An account with this ID number already exists.";
      } else if (errorMessage.includes("Invalid agent code")) {
        errorMessage = "Invalid agent code. Please contact support.";
      } else if (errorMessage.includes("Agent is not active")) {
        errorMessage =
          "The agent account is not active. Please contact support.";
      } else if (errorMessage.includes("Insurance plan not found")) {
        errorMessage = "Selected insurance plan is not available.";
      } else if (
        errorMessage.includes("Member already has an active subscription")
      ) {
        errorMessage = "You already have an active subscription.";
      }

      showToast({
        type: "error",
        message: errorMessage,
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

  // Start countdown timer for payment (using refs)
  const startCountdownTimer = useCallback(() => {
    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setTimeRemaining(60);
    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle STK Push payment initiation (matching PaymentPage pattern)
  const handleSTKPush = async () => {
    if (!subscriptionId) {
      setPaymentError(
        `Subscription ID not found${principalNumber ? ` (Principal: ${principalNumber})` : ""}. Please try registering again.`
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

    // Clear any existing polling interval and timeout
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setPaymentError(null);
    setPaymentStatus("processing");

    try {
      const response = await api.post("/payments/initiate", {
        subscriptionId: subscriptionId,
        amount: paymentAmount,
        phoneNumber: normalizedPhone,
      });

      const paymentId =
        response.data.paymentId ||
        response.data.transactionId ||
        response.data.conversationId;
      if (!paymentId) {
        throw new Error("Payment ID not received");
      }

      // Set up 60-second timeout to stop polling and show timeout state
      timeoutRef.current = setTimeout(() => {
        // Stop polling when timeout is reached
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setPaymentStatus("timeout");
      }, 60000); // 60 seconds = 60000ms

      // Start countdown timer
      setTimeRemaining(60);
      startCountdownTimer();
      setPaymentStatus("waiting");

      // Poll at configured interval for configured max attempts
      let attempts = 0;
      pollingIntervalRef.current = setInterval(async () => {
        attempts++;

        try {
          const statusResponse = await checkPaymentStatus(paymentId);

          if (
            statusResponse.status === "completed" ||
            statusResponse.status === "success"
          ) {
            // Clear timeout and intervals if payment succeeds
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setPaymentStatus("success");
            setMpesaReceiptNumber(
              statusResponse.payment?.mpesa_transaction_id ||
                statusResponse.payment?.mpesa_receipt ||
                null
            );
          } else if (statusResponse.status === "failed") {
            // Clear timeout and intervals if payment fails
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setPaymentStatus("error");
            setPaymentError("Payment failed. Please try again.");
          } else if (attempts >= PAYMENT_MAX_ATTEMPTS) {
            // Stop polling after max attempts, but don't show timeout yet
            // Let the timeout mechanism handle showing timeout state
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            // Don't set status here - let timeout handle it
          }
        } catch (err) {
          console.error("Error checking payment status:", err);
          if (attempts >= PAYMENT_MAX_ATTEMPTS) {
            // Stop polling after max attempts
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            // Don't set status here - let timeout handle it
          }
        }
      }, PAYMENT_POLL_INTERVAL);
    } catch (error: any) {
      // Clear timeout and intervals on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setPaymentStatus("error");
      setPaymentError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Payment failed. Please try again."
      );
    }
  };

  const handleTryAgain = () => {
    // Clear all intervals and timeouts
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setPaymentStatus("idle");
    setPaymentError(null);
    setMpesaReceiptNumber(null);
    setTimeRemaining(60);
  };

  // Cleanup intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <Layout navbarVariant="simple" navbarMaxWidth="narrow" footerVariant="full">
      <SEO
        title="Register for Okoa Familia - Join Affordable Family Health Insurance"
        description="Register for Okoa Familia and protect your family with affordable health insurance at just KShs. 70 per day. Complete registration in 3 simple steps. Cover up to 7 family members with comprehensive medical coverage."
        keywords="okoa familia registration, register okoa familia, okoa familia sign up, okoa familia join, okoa familia insurance registration, okoa familia kenya registration, how to register okoa familia, okoa familia application"
        canonicalUrl="/register"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Okoa Familia Registration",
            description:
              "Register for Okoa Familia affordable family health insurance. Complete your registration in 3 simple steps and protect up to 7 family members at just KShs. 70 per day.",
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
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to Register for Okoa Familia",
            description:
              "Step-by-step guide to register for Okoa Familia family health insurance",
            step: [
              {
                "@type": "HowToStep",
                position: 1,
                name: "Personal Information",
                text: "Enter your personal details including name, ID number, phone number, date of birth, and county",
              },
              {
                "@type": "HowToStep",
                position: 2,
                name: "Family & Next of Kin",
                text: "Add your next of kin details and include dependants (spouse and up to 6 children)",
              },
              {
                "@type": "HowToStep",
                position: 3,
                name: "Activate",
                text: "Complete your first payment of KShs. 70 via M-Pesa to activate your policy",
              },
            ],
          },
        ]}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="flex flex-col overflow-y-auto">
        <div className="relative">
          {/* Background Image for All Screens */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/bg.jpg')" }}
          >
            <div className="absolute inset-0 bg-linear-to-br from-primary-800/90 via-primary-900/90 to-secondary-700/80 backdrop-blur-xs"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 h-full">
            <div className="min-h-full flex flex-col pt-12 lg:pb-32 px-0 md:px-4">
              <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                {/* Logo/Brand */}
                <div className="text-center mb-4">
                  <div className="mb-2">
                    <img
                      src="/logo.webp"
                      alt="Okoa Familia Logo"
                      className="h-12 lg:h-16 w-auto mx-auto"
                    />
                  </div>
                  <p className="text-white/90 text-xl md:text-2xl lg:text-3xl font-bold text-shadow">
                    Member Onboarding
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center mb-8">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        currentStep === 1
                          ? "bg-secondary-600 text-white"
                          : "bg-white/30 text-white"
                      }`}
                    >
                      1
                    </div>
                    <div className="w-12 h-1 bg-white/30"></div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        currentStep === 2
                          ? "bg-secondary-600 text-white"
                          : "bg-white/30 text-white"
                      }`}
                    >
                      2
                    </div>
                    <div className="w-12 h-1 bg-white/30"></div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        currentStep === 3
                          ? "bg-secondary-600 text-white"
                          : "bg-white/30 text-white"
                      }`}
                    >
                      3
                    </div>
                  </div>
                </div>

                {/* Registration Card - Expands to fill available space on mobile */}
                <div className="grow flex flex-col min-h-0 bg-white/95 backdrop-blur-sm rounded-t-3xl lg:rounded-3xl lg:grow-0 shadow-2xl pb-12 p-5 md:p-6 lg:p-8 border border-white/20">
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h2 className="text-base md:text-[1.1rem] lg:text-xl font-semibold text-secondary-700 mb-2 md:mb-3">
                        Personal Information & Address
                      </h2>

                      {/* Row 1: Full Name and ID Number */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) =>
                              handleInputChange("full_name", e.target.value)
                            }
                            placeholder="Enter your full name"
                            className={`input-field ${errors.full_name ? "input-error" : ""}`}
                          />
                          {errors.full_name && (
                            <p className="text-red-500 text-xs lg:text-sm mt-1">
                              {errors.full_name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                            ID Number *
                          </label>
                          <input
                            type="text"
                            placeholder="12345678"
                            value={formData.id_number}
                            onChange={(e) =>
                              handleInputChange("id_number", e.target.value)
                            }
                            className={`input-field ${errors.id_number ? "input-error" : ""}`}
                          />
                          {errors.id_number && (
                            <p className="text-red-500 text-xs lg:text-sm mt-1">
                              {errors.id_number}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Phone and Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            placeholder="+254712345678"
                            value={phoneInput.displayValue}
                            onChange={phoneInput.handleChange}
                            onFocus={phoneInput.handleFocus}
                            className={`input-field ${errors.phone ? "input-error" : ""}`}
                          />
                          {errors.phone && (
                            <p className="text-red-500 text-xs lg:text-sm mt-1">
                              {errors.phone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                            Email (Optional)
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className={`input-field ${errors.email ? "input-error" : ""}`}
                            placeholder="email@example.com"
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs lg:text-sm mt-1">
                              {errors.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Row 3: Gender, Date of Birth */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                            Gender *
                          </label>
                          <select
                            value={formData.gender}
                            onChange={(e) =>
                              handleInputChange("gender", e.target.value)
                            }
                            className={`input-field ${errors.gender ? "input-error" : ""}`}
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                          {errors.gender && (
                            <p className="text-red-500 text-xs lg:text-sm mt-1">
                              {errors.gender}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                            Date of Birth (dd/mm/yyyy) *
                          </label>
                          <DateInput
                            value={formData.date_of_birth}
                            onChange={(value) =>
                              handleInputChange("date_of_birth", value)
                            }
                            className={`input-field ${errors.date_of_birth ? "input-error" : ""}`}
                            placeholder="dd/mm/yyyy"
                            error={!!errors.date_of_birth}
                          />
                          {errors.date_of_birth && (
                            <p className="text-red-500 text-xs lg:text-sm mt-1">
                              {errors.date_of_birth}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Address Section - Full Width */}
                      <div className="border border-gray-200 rounded-xl p-3.5 lg:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <SearchableDropdown
                              label="Your County"
                              options={kenyaCounties}
                              value={formData.county}
                              onChange={(value) =>
                                handleInputChange("county", value)
                              }
                              placeholder="Choose your county"
                              error={errors.county}
                              required
                              leftIcon={
                                <PiMapPinSimpleAreaBold className="h-5 w-5 text-gray-400" />
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                              Your Town *
                            </label>
                            <input
                              type="text"
                              value={formData.town}
                              onChange={(e) =>
                                handleInputChange("town", e.target.value)
                              }
                              className={`bg-white input-field ${errors.town ? "input-error" : ""}`}
                              placeholder="Enter your town"
                            />
                            {errors.town && (
                              <p className="text-red-500 text-xs lg:text-sm mt-1">
                                {errors.town}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Family & Next of Kin */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-base md:text-[1.1rem] lg:text-xl font-semibold text-secondary-700 mb-2 md:mb-3">
                        Dependants & Next of Kin
                      </h2>

                      {/* Next of Kin Section */}
                      <div className="-mx-2 lg:mx-0 border border-gray-200 rounded-xl p-3 lg:p-4">
                        <h3 className="font-semibold text-tertiary-700 mb-4">
                          Next of Kin Information
                        </h3>

                        <div className="space-y-3 lg:space-y-4">
                          {/* Name and Phone */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                value={formData.nok_name}
                                onChange={(e) =>
                                  handleInputChange("nok_name", e.target.value)
                                }
                                className={`input-field ${errors.nok_name ? "input-error" : ""}`}
                              />
                              {errors.nok_name && (
                                <p className="text-red-500 text-xs lg:text-sm mt-1">
                                  {errors.nok_name}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                placeholder="+254712345678"
                                value={nokPhoneInput.displayValue}
                                onChange={nokPhoneInput.handleChange}
                                onFocus={nokPhoneInput.handleFocus}
                                className={`input-field ${errors.nok_phone ? "input-error" : ""}`}
                              />
                              {errors.nok_phone && (
                                <p className="text-red-500 text-xs lg:text-sm mt-1">
                                  {errors.nok_phone}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* ID Number, Relationship, Date of Birth Next of Kin */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                            <div>
                              <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                                ID Number *
                              </label>
                              <input
                                type="text"
                                placeholder="12345678"
                                value={formData.nok_id_number}
                                onChange={(e) =>
                                  handleInputChange(
                                    "nok_id_number",
                                    e.target.value
                                  )
                                }
                                className={`input-field ${errors.nok_id_number ? "input-error" : ""}`}
                              />
                              {errors.nok_id_number && (
                                <p className="text-red-500 text-xs lg:text-sm mt-1">
                                  {errors.nok_id_number}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                                Relationship *
                              </label>
                              <select
                                value={formData.nok_relationship}
                                onChange={(e) =>
                                  handleInputChange(
                                    "nok_relationship",
                                    e.target.value
                                  )
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
                                <p className="text-red-500 text-xs lg:text-sm mt-1">
                                  {errors.nok_relationship}
                                </p>
                              )}
                            </div>

                            {/* Date of Birth Next of Kin */}
                            <div>
                              <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                                Date of Birth *
                              </label>
                              <DateInput
                                value={formData.nok_date_of_birth}
                                onChange={(value) =>
                                  handleInputChange("nok_date_of_birth", value)
                                }
                                className={`input-field ${errors.nok_date_of_birth ? "input-error" : ""}`}
                              />
                              {errors.nok_date_of_birth && (
                                <p className="text-red-500 text-xs lg:text-sm mt-1">
                                  {errors.nok_date_of_birth}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dependants Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base md:text-[1.1rem] lg:text-xl font-semibold text-tertiary-700">
                            Your Dependants
                          </h3>
                          <button
                            type="button"
                            onClick={addDependant}
                            disabled={dependants.length >= 7}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 rounded-lg transition-all disabled:opacity-50"
                          >
                            <RiUserAddLine className="w-4 h-4" />
                            Add Dependant
                          </button>
                        </div>

                        {dependants.length === 0 ? (
                          <p className="-mx-2 text-gray-500 text-sm text-center py-10 px-4 bg-gray-100 border border-gray-300 rounded-lg">
                            No dependants added yet. Click "Add Dependant" to
                            include family members.
                          </p>
                        ) : (
                          <div className="-mx-2 space-y-3 md:space-y-4 lg:space-y-5">
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
                                    <span className="text-sm font-medium text-red-700">
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
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                                    <div>
                                      <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                                        Full Name *
                                      </label>
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
                                        placeholder="Enter full name"
                                        className={`input-field text-sm lg:text-base ${
                                          errors[`dep_${index}_name`]
                                            ? "input-error"
                                            : ""
                                        }`}
                                      />
                                      {errors[`dep_${index}_name`] && (
                                        <p className="text-red-500 text-xs lg:text-sm mt-1">
                                          {errors[`dep_${index}_name`]}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                                        Relationship *
                                      </label>
                                      <select
                                        value={dep.relationship}
                                        onChange={(e) =>
                                          updateDependant(
                                            dep.id,
                                            "relationship",
                                            e.target.value
                                          )
                                        }
                                        className={`input-field text-sm lg:text-base ${
                                          errors[`dep_${index}_relationship`]
                                            ? "input-error"
                                            : ""
                                        }`}
                                      >
                                        <option value="">
                                          Select Relationship
                                        </option>
                                        <option value="spouse">Spouse</option>
                                        <option value="child">Child</option>
                                      </select>
                                      {errors[`dep_${index}_relationship`] && (
                                        <p className="text-red-500 text-xs lg:text-sm mt-1">
                                          {errors[`dep_${index}_relationship`]}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                                        Date of Birth (dd/mm/yyyy) *
                                      </label>
                                      <DateInput
                                        value={dep.date_of_birth}
                                        onChange={(value) =>
                                          updateDependant(
                                            dep.id,
                                            "date_of_birth",
                                            value
                                          )
                                        }
                                        placeholder="dd/mm/yyyy"
                                        className={`input-field text-sm lg:text-base ${
                                          errors[`dep_${index}_dob`]
                                            ? "input-error"
                                            : ""
                                        }`}
                                        error={!!errors[`dep_${index}_dob`]}
                                      />
                                      {errors[`dep_${index}_dob`] && (
                                        <p className="text-red-500 text-xs lg:text-sm mt-1">
                                          {errors[`dep_${index}_dob`]}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                                        Gender
                                      </label>
                                      <select
                                        value={dep.gender || ""}
                                        onChange={(e) =>
                                          updateDependant(
                                            dep.id,
                                            "gender",
                                            e.target.value
                                          )
                                        }
                                        className="input-field text-sm lg:text-base"
                                      >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs lg:text-sm font-google text-gray-600 mb-1">
                                        ID Number/Birth Certificate/Notification
                                      </label>
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
                                        className="input-field text-sm lg:text-base"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment Activation */}
                  {currentStep === 3 && (
                    <ActivationStep
                      subscriptionId={subscriptionId}
                      paymentAmount={paymentAmount}
                      paymentPhone={paymentPhone}
                      paymentStatus={paymentStatus}
                      timeRemaining={timeRemaining}
                      mpesaReceiptNumber={mpesaReceiptNumber}
                      paymentError={paymentError}
                      paymentPhoneInput={paymentPhoneInput}
                      onAmountChange={(amount) => {
                        setPaymentAmount(amount);
                        setPaymentError(null);
                      }}
                      onSTKPush={handleSTKPush}
                      onTryAgain={handleTryAgain}
                      onNavigateToPay={() => navigate("/pay")}
                      formatTimeRemaining={formatTimeRemaining}
                    />
                  )}

                  {/* Navigation Buttons */}
                  {currentStep < 3 && (
                    <div className="flex flex-col-reverse lg:flex-row gap-2 lg:gap-3 text-sm md:text-[0.9rem] lg:text-base mt-6">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors border border-gray-300"
                        >
                          Back
                        </button>
                      )}

                      {currentStep === 2 ? (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="flex-1 bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform shadow-lg disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <TbLoader2 className="w-5 h-5 animate-spin inline mr-2" />
                              Registering...
                            </>
                          ) : (
                            "Complete Registration"
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="flex-1 bg-linear-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform shadow-lg"
                        >
                          Next: Family & Next of Kin
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-gray-500 text-xs lg:text-sm mx-auto border-t border-gray-400 pt-4 mt-6 mb-4">
                    By completing Registration you agree to our{" "}
                    <a
                      href="https://innovasure.co.ke/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Terms & Conditions
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
