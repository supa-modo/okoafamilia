import { motion } from "framer-motion";
import {
  TbArrowRight,
  TbCheck,
  TbAlertCircle,
  TbLoader2,
  TbRefresh,
} from "react-icons/tb";
import MpesaIcon from "../ui/MpesaIcon";

interface UsePhoneInputReturn {
  displayValue: string;
  normalizedValue: string;
  handleFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setValue: (value: string) => void;
}

interface ActivationStepProps {
  subscriptionId: string | null;
  paymentAmount: number;
  paymentPhone: string;
  paymentStatus:
    | "idle"
    | "processing"
    | "waiting"
    | "success"
    | "error"
    | "timeout";
  timeRemaining: number;
  mpesaReceiptNumber: string | null;
  paymentError: string | null;
  paymentPhoneInput: UsePhoneInputReturn;
  onAmountChange: (amount: number) => void;
  onSTKPush: () => void;
  onTryAgain: () => void;
  onNavigateToPay: () => void;
  formatTimeRemaining: (seconds: number) => string;
}

const ActivationStep = ({
  subscriptionId,
  paymentAmount,
  paymentStatus,
  timeRemaining,
  mpesaReceiptNumber,
  paymentError,
  paymentPhoneInput,
  onAmountChange,
  onSTKPush,
  onTryAgain,
  onNavigateToPay,
  formatTimeRemaining,
}: ActivationStepProps) => {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="lg:p-2"
    >
      <h2 className="text-base lg:text-lg font-bold text-secondary-700 font-google mb-2 md:mb-3 lg:mb-4 flex items-center gap-2">
        Activate Your Policy
      </h2>

      <p className="text-gray-600 text-sm lg:text-base mb-6">
        Complete your registration by making your first premium payment to
        activate your policy
      </p>

      {paymentStatus === "idle" && (
        <>
          {paymentError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">{paymentError}</p>
            </div>
          )}

          {!subscriptionId && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">
                Subscription not found. Please try registering again.
              </p>
            </div>
          )}

          {/* Amount input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-sm text-gray-500 font-bold">KShs</span>
              </div>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => {
                  const value =
                    e.target.value === ""
                      ? 0
                      : Math.round(parseFloat(e.target.value) || 0);
                  onAmountChange(value);
                }}
                className="input-field pl-16 font-semibold font-google"
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
                className="input-field pl-20 font-semibold font-google"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              You will receive a payment prompt on your phone to enter your PIN
            </p>
          </div>

          {/* STK Push Payment Button */}
          <button
            onClick={onSTKPush}
            disabled={paymentStatus !== "idle" || !subscriptionId}
            className="w-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 lg:py-3.5 rounded-full font-semibold text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mb-6"
          >
            <span>Pay KShs {paymentAmount.toLocaleString()}</span>
            <TbArrowRight className="w-5 h-5" />
          </button>
        </>
      )}

      {paymentStatus === "processing" && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 lg:p-12 text-center">
          <h3 className="text-lg lg:text-xl font-extrabold text-amber-700 mb-3 font-google">
            Check Your Phone
          </h3>
          <p className="text-gray-600 mb-6 font-outfit">
            An M-Pesa payment prompt has been sent to{" "}
            <span className="font-semibold font-lexend text-gray-800">
              {paymentPhoneInput.displayValue}
            </span>
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 lg:p-4 mb-6">
            <p className="text-sm text-yellow-800 font-outfit">
              Please enter your M-Pesa PIN to complete the payment. This may
              take a few seconds...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-9 lg:h-10 w-9 lg:w-10 mb-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      )}

      {paymentStatus === "waiting" && (
        <div className="flex flex-col items-center py-6 w-full">
          <TbLoader2 className="w-10 h-10 text-slate-400 animate-spin mb-2" />

          <div className="max-w-xl">
            <p className="text-sm sm:text-base text-center text-gray-600 mb-3">
              Mpesa STK Prompt sent to your phone{" "}
              <span className="font-medium font-google text-slate-500">
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
            Your policy has been activated successfully!
          </p>

          {/* Payment Receipt */}
          {mpesaReceiptNumber && (
            <div className="border border-gray-200 rounded-lg p-4 lg:p-5 mb-6 text-left">
              <div className="space-y-3 text-sm font-outfit">
                <div className="flex justify-between">
                  <span className="text-gray-600">M-Pesa Receipt:</span>
                  <span className="font-semibold font-lexend text-secondary-700">
                    {mpesaReceiptNumber}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onNavigateToPay}
            className="w-full px-8 py-2.5 lg:py-3 border border-primary-600 text-primary-600 text-[0.8rem] md:text-sm font-google font-semibold rounded-lg hover:bg-primary-50 transition-colors"
          >
            Continue to Payment Page
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
              onClick={onTryAgain}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300"
            >
              <TbRefresh className="mr-3 h-5 w-5" />
              Retry Payment
            </button>
            <button
              onClick={onNavigateToPay}
              className="w-full px-6 py-3 border border-primary-600 rounded-full text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Go to Payment Page
            </button>
          </div>
        </div>
      )}

      {paymentStatus === "timeout" && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 lg:p-10 text-center">
          <div className="flex items-center justify-center mx-auto mb-2 lg:mb-4">
            <TbAlertCircle className="w-11 md:w-12 lg:w-14 h-11 md:h-12 lg:h-14 text-amber-600" />
          </div>
          <h3 className="text-lg lg:text-xl font-extrabold text-amber-700 mb-3 font-google">
            Payment Timeout
          </h3>
          <p className="text-gray-600 mb-4 lg:mb-6 text-sm lg:text-base font-outfit">
            If you received an M-Pesa confirmation message, the payment may have
            been processed. Please check your payment history or try again.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onTryAgain}
              className="w-full px-6 py-2.5 lg:py-3 bg-primary-600 text-white text-[0.8rem] md:text-sm font-google font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <TbArrowRight className="w-5 h-5 rotate-180" />
              Try Again
            </button>
            <button
              onClick={onNavigateToPay}
              className="w-full px-6 py-2.5 lg:py-3 border border-primary-600 text-primary-600 text-[0.8rem] md:text-sm font-google font-semibold rounded-lg hover:bg-primary-50 transition-colors"
            >
              Go to Payment Page
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ActivationStep;
