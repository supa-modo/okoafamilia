import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbSearch,
  TbCheck,
  TbAlertCircle,
  TbArrowRight,
  TbLoader2,
  TbId,
  TbPhone,
} from "react-icons/tb";
import MpesaIcon from "../components/ui/MpesaIcon";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import Layout from "../components/Layout";
import {
  searchSubscriberByIdNumber,
  initiatePublicPayment,
  checkPublicPaymentStatus,
  SubscriberSearchResponse,
} from "../services/paymentService";

type PaymentStep = "search" | "confirm" | "processing" | "success";

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
  const [paymentAmount, setPaymentAmount] = useState<number>(70);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Payment polling configuration
  const PAYMENT_POLL_INTERVAL = 3000;
  const PAYMENT_MAX_ATTEMPTS = 20;

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
        setPhoneNumber(response.phoneNumber || "");
        setHasPhoneBeenEdited(false);
        setPaymentAmount(response.suggestedAmount / 100 || 70);
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
    if (!memberData || !memberData.subscription) return;

    // Clear any existing polling interval
    const existingPollInterval = (window as any).__paymentPollInterval;
    if (existingPollInterval) {
      clearInterval(existingPollInterval);
      delete (window as any).__paymentPollInterval;
    }

    setError("");
    setPaymentResult(null);
    setLoading(true);

    let pollInterval: ReturnType<typeof setInterval> | null = null;

    try {
      setStep("processing");
      const response = await initiatePublicPayment({
        subscriptionId: memberData.subscription.id,
        amount: paymentAmount,
        phoneNumber: phoneNumber,
        idNumber: memberData.subscriber.account_number || searchValue,
      });

      const paymentId = response.paymentId || response.conversationId;
      if (!paymentId) {
        throw new Error("Payment ID not received");
      }

      // Poll for payment status
      let attempts = 0;
      let isPolling = true;

      pollInterval = setInterval(async () => {
        if (!isPolling) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }

        attempts++;

        try {
          const statusResponse = await checkPublicPaymentStatus(paymentId);

          if (
            statusResponse.status === "completed" ||
            statusResponse.status === "success"
          ) {
            isPolling = false;
            if (pollInterval) {
              clearInterval(pollInterval);
              delete (window as any).__paymentPollInterval;
            }
            setPaymentResult({
              status: "success",
              ...statusResponse.payment,
              mpesa_transaction_id:
                statusResponse.payment?.mpesa_transaction_id ||
                statusResponse.payment?.mpesa_receipt ||
                statusResponse.payment?.raw_response?.mpesa_receipt,
            });
            setStep("success");
            setLoading(false);
          } else if (statusResponse.status === "failed") {
            isPolling = false;
            if (pollInterval) {
              clearInterval(pollInterval);
              delete (window as any).__paymentPollInterval;
            }
            setError("Payment failed. Please try again.");
            setStep("confirm");
            setLoading(false);
          } else if (attempts >= PAYMENT_MAX_ATTEMPTS) {
            isPolling = false;
            if (pollInterval) {
              clearInterval(pollInterval);
              delete (window as any).__paymentPollInterval;
            }
            setError(
              "Payment verification timeout. Please check your phone and try again."
            );
            setStep("confirm");
            setLoading(false);
          }
        } catch (err) {
          console.error("Error checking payment status:", err);
          if (attempts >= PAYMENT_MAX_ATTEMPTS) {
            isPolling = false;
            if (pollInterval) {
              clearInterval(pollInterval);
              delete (window as any).__paymentPollInterval;
            }
            setError(
              "Payment verification timeout. Please check your phone and try again."
            );
            setStep("confirm");
            setLoading(false);
          }
        }
      }, PAYMENT_POLL_INTERVAL);

      (window as any).__paymentPollInterval = pollInterval;
    } catch (err: any) {
      if (pollInterval) {
        clearInterval(pollInterval);
        delete (window as any).__paymentPollInterval;
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

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      const pollInterval = (window as any).__paymentPollInterval;
      if (pollInterval) {
        clearInterval(pollInterval);
        delete (window as any).__paymentPollInterval;
      }
    };
  }, []);

  const handleReset = () => {
    const pollInterval = (window as any).__paymentPollInterval;
    if (pollInterval) {
      clearInterval(pollInterval);
      delete (window as any).__paymentPollInterval;
    }

    setStep("search");
    setSearchValue("");
    setMemberData(null);
    setPhoneNumber("");
    setIsEditingPhone(false);
    setHasPhoneBeenEdited(false);
    setPaymentAmount(70);
    setIsEditingAmount(false);
    setError("");
    setPaymentResult(null);
  };

  const formatCurrency = (amount: number, isInCents: boolean = false) => {
    const amountInKES = isInCents ? amount / 100 : amount;
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInKES);
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
      footerVariant="simple"
      background="bg-gradient-to-br from-primary-50 via-white to-secondary-50"
      contentClassName="pb-12 px-4 sm:px-6 lg:px-8"
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-2xl lg:text-3xl font-extrabold font-open text-gray-900 mb-2">
            Lipa Okoa Familia
          </h1>
          <p className="text-gray-600">
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
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
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

                <form onSubmit={handleSearch} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
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
                        className={`flex-1 px-4 py-3 font-medium text-sm transition-all ${
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
                        className={`flex-1 px-4 py-3 font-medium text-sm transition-all ${
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
                          <TbPhone className="w-5 h-5 text-gray-400" />
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
                        className="input-field pl-12"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !searchValue.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <p className="text-gray-600 text-sm mb-3">
                    Not registered yet?
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-sm"
                  >
                    Join Okoa Familia Today
                    <TbArrowRight className="w-4 h-4" />
                  </Link>
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
              transition={{ duration: 0.4 }}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
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

                {/* Member Info */}
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-5 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Member Name</p>
                    <h3 className="text-lg font-bold text-gray-900 font-lexend">
                      {maskName(memberData.subscriber.full_name)}
                    </h3>
                    {memberData.plan && (
                      <p className="text-sm text-primary-600 mt-1">
                        {memberData.plan.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Amount to Pay</p>
                    {isEditingAmount ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={paymentAmount || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setPaymentAmount(0);
                              return;
                            }
                            const numValue = parseFloat(val);
                            if (!isNaN(numValue) && numValue >= 0) {
                              setPaymentAmount(Math.round(numValue));
                            }
                          }}
                          className="w-28 px-3 py-2 text-right input-field text-base"
                          min="70"
                        />
                        <button
                          onClick={() => setIsEditingAmount(false)}
                          className="px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-primary-600 font-lexend">
                          {formatCurrency(paymentAmount, false)}
                        </p>
                        <button
                          onClick={() => setIsEditingAmount(true)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">M-Pesa Number</p>
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
                        className="flex-1 input-field"
                      />
                      <button
                        onClick={() => setIsEditingPhone(false)}
                        className="px-4 py-2 bg-primary-600 text-white font-medium text-sm rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">
                        {hasPhoneBeenEdited || isEditingPhone
                          ? formatPhoneNumber(phoneNumber)
                          : maskPhoneNumber(phoneNumber)}
                      </span>
                      <button
                        onClick={() => {
                          setHasPhoneBeenEdited(true);
                          setIsEditingPhone(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 underline text-sm font-medium"
                      >
                        Change
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    M-Pesa prompt will be sent to this number
                  </p>
                </div>

                {/* M-Pesa Info */}
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-6">
                  <div className="flex items-center gap-3">
                    <MpesaIcon width={40} height={40} />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Pay via M-Pesa
                      </p>
                      <p className="text-sm text-gray-600">
                        You'll receive an M-Pesa prompt on your phone
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handlePayment}
                    disabled={
                      loading || !phoneNumber.trim() || paymentAmount < 70
                    }
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-secondary-600 hover:bg-secondary-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-secondary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <TbLoader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Confirm Payment
                        <TbArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
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
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <TbLoader2 className="w-10 h-10 text-primary-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-lexend mb-3">
                  Check Your Phone
                </h3>
                <p className="text-gray-600 mb-6">
                  An M-Pesa payment prompt has been sent to{" "}
                  <span className="font-semibold text-gray-800">
                    {hasPhoneBeenEdited
                      ? formatPhoneNumber(phoneNumber)
                      : maskPhoneNumber(phoneNumber)}
                  </span>
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    Please enter your M-Pesa PIN to complete the payment. This
                    may take a few seconds...
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-10 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="w-20 h-20 rounded-full bg-secondary-100 flex items-center justify-center">
                    <TbCheck className="w-10 h-10 text-secondary-600" />
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

                <h3 className="text-xl font-bold text-gray-900 font-lexend mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your Okoa Familia cover is active. Stay protected!
                </p>

                {/* Payment Receipt */}
                <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(
                          paymentResult?.amount || paymentAmount * 100,
                          true
                        )}
                      </span>
                    </div>
                    {paymentResult?.mpesa_transaction_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">M-Pesa Receipt:</span>
                        <span className="font-bold text-primary-600">
                          {paymentResult.mpesa_transaction_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                >
                  Make Another Payment
                  <TbArrowRight className="w-5 h-5" />
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
