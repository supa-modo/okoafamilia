/**
 * Ratiba Setup Modal - Okoa Familia
 * Prompts user to set up M-Pesa Ratiba (automatic daily premium payments).
 */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { TbCheck, TbAlertCircle, TbCalendarDot } from "react-icons/tb";
import { setupRatiba } from "../services/ratibaService";

interface RatibaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  phoneNumber: string;
  dailyPremiumAmount: number;
  startDateDisplay?: string;
  endDateDisplay?: string;
  onSuccess?: () => void;
  showLoginPromptOnUnauthorized?: boolean;
}

const RatibaSetupModal: React.FC<RatibaSetupModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
  phoneNumber,
  dailyPremiumAmount,
  startDateDisplay = "Tomorrow",
  endDateDisplay = "Policy end date (366 days)",
  onSuccess,
  showLoginPromptOnUnauthorized = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleOptIn = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      await setupRatiba(subscriptionId, phoneNumber);
      setStatus("success");
      onSuccess?.();
    } catch (error: any) {
      setStatus("error");
      if (error.response?.status === 401) {
        setErrorMessage("Please log in to your account to set up automatic payments.");
      } else {
        setErrorMessage(
          error.response?.data?.error ||
          error.message ||
          "Failed to set up automatic payments. Please try again later."
        );
      }
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100000 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="max-w-150 w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 lg:px-6 py-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <TbCalendarDot className="w-6 h-6 text-primary-600 shrink-0" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Set Up Automatic Payments
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-500 hover:text-red-600 rounded-full p-1"
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="px-4 lg:px-6 pb-6 pt-0">
              {status === "idle" && (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    M-Pesa Ratiba automatically deducts{" "}
                    <strong>KSh {Math.round(dailyPremiumAmount).toLocaleString()}</strong>{" "}
                    daily from your M-Pesa to keep your policy active.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone number</span>
                      <span className="font-medium text-gray-800">{phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily amount</span>
                      <span className="font-medium text-gray-800">
                        KSh {Math.round(dailyPremiumAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start</span>
                      <span className="font-medium text-gray-800">{startDateDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End</span>
                      <span className="font-medium text-gray-800">{endDateDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frequency</span>
                      <span className="font-medium text-gray-800">Daily</span>
                    </div>
                  </div>
                  <div className="flex flex-row-reverse gap-3">
                    <button
                      type="button"
                      onClick={handleOptIn}
                      disabled={!subscriptionId || !phoneNumber}
                      className="flex-1 px-4 py-2.5 lg:py-3 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-full disabled:opacity-50"
                    >
                      Yes, Opt Me In
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 lg:py-3 text-sm border border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50"
                    >
                      Not Now
                    </button>
                  </div>
                </>
              )}

              {status === "loading" && (
                <div className="py-8 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-[3px] border-primary-600 mb-4"></div>
                  <p className="text-sm text-gray-600 text-center">
                    Setting up automatic payments… You may receive a PIN prompt on your phone.
                  </p>
                </div>
              )}

              {status === "success" && (
                <div className="py-6 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <TbCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Automatic Payments Enabled
                  </h4>
                  <p className="text-sm text-gray-600 text-center mb-6">
                    Your daily premium will be deducted automatically from your M-Pesa balance.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl"
                  >
                    Done
                  </button>
                </div>
              )}

              {status === "error" && (
                <div className="py-6">
                  <div className="flex items-center gap-2 mb-3 text-red-600">
                    <TbAlertCircle className="w-6 h-6 shrink-0" />
                    <h4 className="font-semibold">Setup Failed</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-5">{errorMessage}</p>
                  {showLoginPromptOnUnauthorized && errorMessage?.includes("log in") && (
                    <a
                      href="/login"
                      className="block w-full mb-3 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-center"
                    >
                      Log in to set up automatic payments
                    </a>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleOptIn}
                      className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default RatibaSetupModal;
