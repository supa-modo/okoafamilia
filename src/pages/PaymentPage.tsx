import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbSearch,
  TbCheck,
  TbAlertCircle,
  TbArrowRight,
  TbLoader2,
  TbId,
  TbPhoneCall,
  TbShieldCheckFilled,
  TbClockExclamation,
  TbShieldX,
} from "react-icons/tb";
import { PiClockCounterClockwiseBold } from "react-icons/pi";
import MpesaIcon from "../components/ui/MpesaIcon";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import {
  searchSubscriberByIdNumber,
  initiatePublicPayment,
  checkPublicPaymentStatus,
  SubscriberSearchResponse,
} from "../services/paymentService";
import { normalizePhoneNumber } from "../utils/validation";

type PaymentStep = "search" | "confirm" | "processing" | "success" | "timeout";

// TypeScript interface for payment result
interface PaymentResult {
  status: "success" | "failed";
  amount?: number;
  mpesa_transaction_id?: string;
  [key: string]: any;
}

const PaymentPage = () => {
  const { toasts, dismissToast } = useToast();

  const [step, setStep] = useState<PaymentStep>("search");
  const [searchType, setSearchType] = useState<"id_number" | "phone">(
    "id_number"
  );
  const [searchValue, setSearchValue] = useState("");
  const [memberData, setMemberData] = useState<SubscriberSearchResponse | null>(
    null
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [hasPhoneBeenEdited, setHasPhoneBeenEdited] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [hasAmountBeenEdited, setHasAmountBeenEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null
  );

  // Payment polling configuration
  const PAYMENT_POLL_INTERVAL = 3000; // 3 seconds
  const PAYMENT_MAX_ATTEMPTS = 20; // 1 minute total (20 * 3 seconds = 60 seconds)

  // Ref to store polling interval ID for cleanup on unmount
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  // Ref to store timeout ID for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validate phone number format (Kenyan format)
  const isValidPhoneNumber = useCallback((phone: string): boolean => {
    const normalized = normalizePhoneNumber(phone);
    return /^\+254[0-9]{9}$/.test(normalized);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response =
        searchType === "id_number"
          ? await searchSubscriberByIdNumber(searchValue.trim())
          : await searchSubscriberByIdNumber(undefined, searchValue.trim());

      if (response && response.subscriber) {
        if (!response.subscription) {
          setError(
            "No active subscription found. Please complete registration first."
          );
          setLoading(false);
          return;
        }

        setMemberData(response);
        // Normalize phone number from API response
        const normalizedPhone = response.phoneNumber
          ? normalizePhoneNumber(response.phoneNumber)
          : "";
        setPhoneNumber(normalizedPhone);
        setHasPhoneBeenEdited(false);

        // Pre-fill amount based on overdue balance or default to 70
        let suggestedAmount = 70;
        if (response.subscription) {
          // Check if there's a balance_breakdown with net_balance_due
          const balanceBreakdown = (response.subscription as any)
            .balance_breakdown;
          if (balanceBreakdown && balanceBreakdown.net_balance_due > 0) {
            suggestedAmount = Math.max(
              70,
              Math.round(balanceBreakdown.net_balance_due)
            );
          } else if (response.suggestedAmount && response.suggestedAmount > 0) {
            suggestedAmount = Math.max(70, response.suggestedAmount);
          }
        }
        setPaymentAmount(suggestedAmount);
        setHasAmountBeenEdited(false);
        setError(""); // Clear any previous errors on successful search
        setStep("confirm");
      } else {
        setError(
          "Member not found. Please check your ID number or phone and try again."
        );
      }
    } catch (err: any) {
      console.error("Error fetching member:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Member not found. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    // Guard against multiple simultaneous payment requests
    if (loading) {
      return;
    }

    if (!memberData || !memberData.subscription) {
      setError("No active subscription found. Please contact support.");
      return;
    }

    // Validate nationalId is present
    const nationalId = memberData.subscriber.account_number || searchValue;
    if (!nationalId || !nationalId.trim()) {
      setError("ID number is required. Please try searching again.");
      return;
    }

    // Validate and normalize phone number
    if (!phoneNumber || !phoneNumber.trim()) {
      setError("Phone number is required for payment.");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber.trim());
    if (!normalizedPhone || !isValidPhoneNumber(normalizedPhone)) {
      setError("Please enter a valid Kenyan phone number");
      return;
    }

    // Validate minimum amount - check if there's an overdue amount that affects minimum
    const minAmount = memberData.plan?.premium_amount || 70;

    if (!paymentAmount || paymentAmount < minAmount) {
      setError(
        `Payment amount must be at least ${new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(minAmount)}`
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const paymentData = {
        subscriptionId: memberData.subscription.id,
        amount: paymentAmount,
        phoneNumber: normalizedPhone, // Use normalized phone number
        idNumber: nationalId.trim(),
      };

      setStep("processing");
      const response = await initiatePublicPayment(paymentData);

      // Poll for payment status
      const paymentId = response.paymentId || response.conversationId;
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
        setLoading(false);
        setStep("timeout");
      }, 60000); // 60 seconds = 60000ms

      // Poll at configured interval for configured max attempts
      // Store interval ID in ref for cleanup on unmount
      let attempts = 0;
      pollingIntervalRef.current = setInterval(async () => {
        attempts++;

        try {
          const statusResponse = await checkPublicPaymentStatus(paymentId);

          if (
            statusResponse.status === "completed" ||
            statusResponse.status === "success"
          ) {
            // Clear timeout if payment succeeds
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setPaymentResult({
              status: "success",
              ...statusResponse.payment,
            });
            setStep("success");
            setLoading(false);
          } else if (statusResponse.status === "failed") {
            // Clear timeout if payment fails
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setError("Payment failed. Please try again.");
            setStep("confirm");
            setLoading(false);
          } else if (attempts >= PAYMENT_MAX_ATTEMPTS) {
            // Stop polling after max attempts, but don't show timeout yet
            // Let the timeout mechanism handle showing timeout state
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            // Don't set step here - let timeout handle it
          }
        } catch (err) {
          console.error("Error checking payment status:", err);
          if (attempts >= PAYMENT_MAX_ATTEMPTS) {
            // Stop polling after max attempts
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            // Don't set step here - let timeout handle it
          }
        }
      }, PAYMENT_POLL_INTERVAL);
    } catch (err: any) {
      // Clear timeout and polling interval on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      console.error("Error initiating payment:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to initiate payment. Please try again."
      );
      setStep("confirm");
      setLoading(false);
    }
  };

  // Cleanup polling interval and timeout on component unmount to prevent memory leaks
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
    };
  }, []);

  const handleReset = () => {
    // Clear any active polling interval and timeout
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStep("search");
    setSearchValue("");
    setMemberData(null);
    setPhoneNumber("");
    setIsEditingPhone(false);
    setHasPhoneBeenEdited(false);
    setPaymentAmount(0);
    setIsEditingAmount(false);
    setHasAmountBeenEdited(false);
    setError("");
    setPaymentResult(null);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/^\+?254/, "").replace(/^0/, "");
    return `+254${cleaned}`;
  };

  const maskName = (fullName: string) => {
    if (!fullName) return "";
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 0) return "";
    if (nameParts.length === 1) return fullName;

    const firstName = nameParts[0];
    const remainingChars = fullName.substring(firstName.length).trim();
    const maskedRemaining = "*".repeat(remainingChars.length);

    return `${firstName} ${maskedRemaining}`;
  };

  const maskPhoneNumber = (phone: string) => {
    if (!phone) return "";
    let cleaned = phone.replace(/^\+?254/, "");
    if (!cleaned.startsWith("0")) {
      cleaned = `0${cleaned}`;
    }
    if (cleaned.length < 5) return cleaned;

    const firstTwo = cleaned.substring(0, 2);
    const lastThree = cleaned.substring(cleaned.length - 3);
    const middleLength = cleaned.length - 5;
    const maskedMiddle = "*".repeat(middleLength);

    return `${firstTwo}${maskedMiddle}${lastThree}`;
  };

  return (
    <Layout
      navbarVariant="simple"
      navbarMaxWidth="narrow"
      footerVariant="full"
      background="bg-gradient-to-br from-primary-50 via-white to-secondary-50"
      contentClassName="pb-12 px-4 sm:px-6 lg:px-8"
    >
      <SEO
        title="Pay Okoa Familia Daily Premium - M-Pesa Payment"
        description="Pay your Okoa Familia daily premium of KShs. 70 via M-Pesa. Quick and secure payment to keep your family health insurance active. Search by ID number and complete payment in minutes."
        keywords="okoa familia payment, pay okoa familia, okoa familia mpesa, okoa familia daily payment, okoa familia premium payment, okoa familia pay online, okoa familia payment portal"
        canonicalUrl="/pay"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Okoa Familia Payment",
            description:
              "Pay your Okoa Familia daily premium via M-Pesa. Secure payment portal for Okoa Familia insurance.",
            url: "https://okoafamilia.innovasure.co.ke/pay",
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
                name: "Payment",
                item: "https://okoafamilia.innovasure.co.ke/pay",
              },
            ],
          },
        ]}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-xl mx-auto py-12 lg:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-2xl lg:text-3xl font-extrabold font-google text-secondary-700 mb-2">
            Lipa Okoa Familia
          </h1>
          <p className="text-gray-600 font-google text-sm lg:text-base">
            Pay your daily premium quickly and securely via M-Pesa
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Search */}
          {step === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 -mx-1 p-5 md:p-6 lg:p-8">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 flex items-start gap-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4"
                  >
                    <TbAlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </motion.div>
                )}

                <form
                  onSubmit={handleSearch}
                  className="space-y-5 lg:space-y-6"
                >
                  <div>
                    <label className="block text-sm lg:text-[0.9rem] font-semibold lg:font-bold text-gray-700 mb-2 lg:mb-3 font-google">
                      Search By
                    </label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchType("id_number");
                          setSearchValue("");
                          setError("");
                        }}
                        className={`flex-1 px-4 py-2.5 lg:py-3 font-semibold font-google text-xs md:text-[0.82rem] lg:text-sm transition-all ${
                          searchType === "id_number"
                            ? "bg-primary-600 text-white"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        ID Number
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchType("phone");
                          setSearchValue("");
                          setError("");
                        }}
                        className={`flex-1 px-4 py-2.5 lg:py-3 font-semibold font-google text-xs md:text-[0.82rem] lg:text-sm transition-all ${
                          searchType === "phone"
                            ? "bg-primary-600 text-white"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Phone Number
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        {searchType === "id_number" ? (
                          <TbId className="w-5 h-5 text-gray-400" />
                        ) : (
                          <TbPhoneCall className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={
                          searchType === "id_number"
                            ? "Enter your ID number"
                            : "Enter your phone number"
                        }
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="input-field pl-12 py-2 lg:py-2.5"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !searchValue.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 lg:py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg lg:rounded-xl transition-colors shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                  >
                    {loading ? (
                      <>
                        <TbLoader2 className="w-5 h-5 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <TbSearch className="w-5 h-5" />
                        Find My Account
                      </>
                    )}
                  </button>
                </form>

                {/* Register CTA */}
                <div className="mt-6 pt-5 lg:pt-6 border-t border-gray-200 text-center flex items-center justify-center gap-2 font-google">
                  <p className="text-gray-500 text-xs md:text-[0.83rem] lg:text-sm font-medium">
                    Not registered yet?
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-xs md:text-[0.83rem] lg:text-sm"
                  >
                    Join Okoa Familia Today
                    <TbArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* M-Pesa Payment Instructions */}
              <div className="mt-6 pt-6 flex justify-center text-center font-light">
                <div className="">
                  <p className="flex items-center gap-2 text-[0.9rem] md:text-base lg:text-lg text-gray-800 mb-3 lg:mb-4 font-outfit">
                    You can also pay directly via Mpesa using these steps:
                  </p>
                  <ol className="space-y-2 lg:space-y-2.5 text-[0.9rem] md:text-base lg:text-lg text-gray-800 font-outfit mx-auto max-w-md">
                    <li className="flex items-start gap-2 justify-center">
                      <span>Go to M-Pesa menu</span>
                    </li>
                    <li className="flex items-start gap-2 justify-center">
                      <span>
                        1. Select{" "}
                        <strong className="font-semibold">
                          Lipa na M-Pesa
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2 justify-center">
                      <span>
                        2. Select{" "}
                        <strong className="font-semibold">Paybill</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2 justify-center">
                      <span>
                        3. Enter Business No:{" "}
                        <strong className="text-secondary-600 font-semibold font-lexend">
                          3002000
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2 justify-center">
                      <span>
                        4. Enter Account No:{" "}
                        <strong className="text-secondary-600 font-semibold font-lexend">
                          Policy Number (BICxxxxxx)
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2 justify-center">
                      <span>
                        5. Enter Amount{" "}
                        <strong className="text-secondary-600 font-semibold font-lexend">
                          (min. KShs 70)
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2 justify-center">
                      <span>
                        6. Enter Your M-Pesa PIN to complete the payment
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Confirm Payment Details */}
          {step === "confirm" && memberData && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white backdrop-blur-sm rounded-2xl lg:rounded-2xl shadow-2xl border border-white/20 p-4 md:p-6 lg:p-8">
                {error && (
                  <div className="mb-4 lg:mb-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-[0.78rem] lg:text-sm font-medium font-outfit">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Subscriber Info */}
                <div className="bg-slate-100 rounded-xl p-4 md:p-6 mb-3 lg:mb-6">
                  <div className="text-center">
                    <h4 className="text-base lg:text-lg font-semibold text-primary-700 mb-1 font-lexend">
                      <span className="text-sm lg:text-base font-normal font-outfit text-gray-600">
                        Name:
                      </span>{" "}
                      {maskName(memberData.subscriber.full_name)}
                    </h4>
                    <p className="text-primary-700 font-lexend font-semibold">
                      <span className="text-sm lg:text-base font-normal font-outfit text-gray-600">
                        ID Number:
                      </span>{" "}
                      {memberData.subscriber.account_number}
                    </p>
                  </div>
                  <div className="text-center mt-1.5 lg:mt-2">
                    {memberData.subscription && (
                      <div className="mb-6 space-y-2 lg:space-y-3">
                        {memberData.plan && (
                          <div className="flex items-center justify-center gap-2">
                            <p className="font-semibold text-slate-600 font-lexend text-sm lg:text-base">
                              {memberData.plan.name || "N/A"}
                            </p>
                            <div>
                              {memberData.subscription.status === "active" && (
                                <TbShieldCheckFilled className="w-5 h-5 text-green-600" />
                              )}
                              {memberData.subscription.status === "pending" && (
                                <TbClockExclamation className="w-5 h-5 text-yellow-600" />
                              )}
                              {memberData.subscription.status ===
                                "suspended" && (
                                <TbShieldX className="w-5 h-5 text-red-600" />
                              )}
                              {memberData.subscription.status === "expired" && (
                                <PiClockCounterClockwiseBold className="w-5 h-5 text-red-600" />
                              )}
                              {memberData.subscription.status ===
                                "inactive" && (
                                <TbClockExclamation className="w-5 h-5 text-yellow-600" />
                              )}
                            </div>
                          </div>
                        )}

                        {memberData.subscription.next_due_date && (
                          <div className="flex items-center justify-center text-[0.8rem] lg:text-sm text-gray-600 font-outfit">
                            <span>
                              Next Due Date:{" "}
                              <span className="font-semibold font-lexend">
                                {formatDate(
                                  memberData.subscription.next_due_date
                                )}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Summary */}
                {memberData.subscription && (
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-[0.8rem] lg:text-sm text-gray-600 font-outfit">
                          Amount to Pay
                          {memberData.subscription?.balance_breakdown &&
                            memberData.subscription.balance_breakdown
                              .overdue_amount > 0 &&
                            !isEditingAmount &&
                            !hasAmountBeenEdited && (
                              <span className="text-red-600 font-semibold ml-1">
                                (+ Overdue -{" "}
                                {formatCurrency(
                                  memberData.subscription.balance_breakdown
                                    .overdue_amount
                                )}
                                )
                              </span>
                            )}
                        </p>
                      </div>
                      {isEditingAmount ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={paymentAmount || ""}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              // Allow empty string temporarily for better UX
                              if (inputValue === "") {
                                setPaymentAmount(0);
                                setHasAmountBeenEdited(true);
                                setError("");
                                return;
                              }
                              const numValue = parseFloat(inputValue);
                              if (!isNaN(numValue) && numValue >= 0) {
                                setPaymentAmount(Math.round(numValue));
                                setHasAmountBeenEdited(true);
                                setError("");
                              }
                            }}
                            className="w-32 px-4 py-2 text-right input-field text-base"
                          />
                          <button
                            onClick={() => setIsEditingAmount(false)}
                            className="px-3 py-2 bg-primary-600 text-white text-sm lg:text-base font-medium rounded-lg hover:bg-primary-700 transition-colors font-outfit"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-xl lg:text-2xl font-lexend font-extrabold text-secondary-700">
                            {formatCurrency(paymentAmount)}
                          </p>
                          <button
                            onClick={() => setIsEditingAmount(true)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium underline underline-offset-2 font-outfit"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone Number */}
                <div className="mb-6 md:mb-8">
                  {isEditingPhone ? (
                    <div className="flex gap-3">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          setHasPhoneBeenEdited(true);
                        }}
                        placeholder="07XX XXX XXX"
                        className="flex-1 px-4 py-2 input-field"
                      />
                      <button
                        onClick={() => setIsEditingPhone(false)}
                        className="px-6 py-2 bg-primary-600 text-white font-medium text-sm rounded-lg hover:bg-primary-700 transition-colors font-outfit"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="border border-gray-300 rounded-lg px-4 py-2 mr-3 w-full text-sm lg:text-base text-gray-700 font-lexend font-semibold">
                        {hasPhoneBeenEdited || isEditingPhone
                          ? formatPhoneNumber(phoneNumber)
                          : maskPhoneNumber(phoneNumber)}
                      </span>
                      <button
                        onClick={() => {
                          setHasPhoneBeenEdited(true);
                          setIsEditingPhone(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 underline underline-offset-4 text-sm font-medium font-outfit"
                      >
                        Change
                      </button>
                    </div>
                  )}
                  <p className="text-xs lg:text-sm text-gray-500 mt-2 font-outfit pl-2">
                    M-Pesa payment confirmation prompt will be sent to this
                    number
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="gap-2 lg:gap-3 flex flex-col lg:flex-row-reverse">
                  <button
                    onClick={handlePayment}
                    disabled={
                      loading || !phoneNumber.trim() || paymentAmount <= 0
                    }
                    className="w-full px-6 py-2 lg:py-2.5 bg-secondary-700 border border-secondary-700 text-white font-semibold rounded-lg hover:bg-secondary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-lexend flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <TbLoader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="text-sm md:text-base">
                            Pay with{" "}
                          </span>
                          <MpesaIcon
                            width={60}
                            height={20}
                            variant="white"
                            className="mt-0.5"
                          />
                        </div>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full px-6 py-2 lg:py-2.5 border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg hover:bg-gray-50 transition-colors font-outfit"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Processing Payment */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 lg:p-12 text-center">
              <h3 className="text-lg lg:text-xl font-extrabold text-amber-700 mb-3 font-google">
              Check Your Phone
                </h3>
                <p className="text-gray-600 mb-6 font-outfit">
                  An M-Pesa payment prompt has been sent to{" "}
                  <span className="font-semibold font-lexend text-gray-800">
                    {hasPhoneBeenEdited
                      ? formatPhoneNumber(phoneNumber)
                      : maskPhoneNumber(phoneNumber)}
                  </span>
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 lg:p-4 mb-6">
                  <p className="text-sm text-yellow-800 font-outfit">
                    Please enter your M-Pesa PIN to complete the payment. This
                    may take a few seconds...
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-9 lg:h-10 w-9 lg:w-10 mb-2 border-b-2 border-primary-600"></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Timeout */}
          {step === "timeout" && (
            <motion.div
              key="timeout"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 lg:p-10 text-center">
                <div className="flex items-center justify-center mx-auto mb-2 lg:mb-4">
                  <TbAlertCircle className="w-11 md:w-12 lg:w-14 h-11 md:h-12 lg:h-14 text-amber-600" />
                </div>
                <h3 className="text-lg lg:text-xl font-extrabold text-amber-700 mb-3 font-google">
                  Payment Timeout
                </h3>
                <p className="text-gray-600 mb-4 lg:mb-6 text-sm lg:text-base font-outfit">
                  If you received an M-Pesa confirmation message, the payment
                  may have been processed. Please check your payment history or
                  try again.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleReset}
                    className="w-full px-6 py-2.5 lg:py-3 bg-primary-600 text-white text-[0.8rem] md:text-sm font-google font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <TbArrowRight className="w-5 h-5 rotate-180" />
                    Try Again
                  </button>
                  <button
                    onClick={() => setStep("confirm")}
                    className="w-full px-6 py-2.5 lg:py-3 border border-primary-600 text-primary-600 text-[0.8rem] md:text-sm font-google font-semibold rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    Go Back to Payment
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {step === "success" && paymentResult && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 lg:p-10 text-center">
                <div className="relative w-14 md:w-16 h-14 md:h-16 lg:w-18 lg:h-18 mb-3 lg:mb-4 rounded-full mx-auto flex items-center justify-center">
                  <div className="w-14 md:w-16 h-14 md:h-16 rounded-full flex items-center justify-center">
                    <TbCheck className="h-9 md:h-10 lg:h-11 w-9 md:w-10 lg:w-11 text-secondary-700" />
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
                <h3 className="text-lg lg:text-xl font-extrabold text-secondary-700 mb-3 font-google">
                Payment Successful!
                </h3>
                <p className="text-gray-600 mb-4 lg:mb-6 text-sm lg:text-base font-outfit">
                  Your payment has been received and processed successfully.
                </p>

                {/* Payment Receipt */}
                <div className="border border-gray-200 rounded-lg p-4 lg:p-5 mb-6 text-left">
                  <div className="space-y-3 text-sm font-outfit">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-semibold font-lexend text-secondary-700">
                        {formatCurrency(paymentResult.amount || paymentAmount)}
                      </span>
                    </div>
                    {paymentResult.mpesa_transaction_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">M-Pesa Receipt:</span>
                        <span className="font-semibold font-lexend text-secondary-700">
                          {paymentResult.mpesa_transaction_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleReset}
                 className="w-full px-8 py-2.5 lg:py-3 border border-primary-600 text-primary-600 text-[0.8rem] md:text-sm font-google font-semibold rounded-lg hover:bg-primary-50 transition-colors" >
                  <span>Make Another Payment</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default PaymentPage;
