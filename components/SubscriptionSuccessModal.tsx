'use client';

import { motion, AnimatePresence } from "framer-motion";

interface SubscriptionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  resendConfirmation: (email: string) => Promise<void>;
  cooldown: number;
  canResend: boolean;
}

const SubscriptionSuccessModal = ({ 
  isOpen, 
  onClose,
  resendConfirmation,
  cooldown,
  canResend
}: SubscriptionSuccessModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-black text-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-[#FF914D] relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="text-center">
              <div className="text-[#FF914D] text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Cadastro feito!</h2>
              <p className="text-gray-300 mb-6">
                Enviamos um link de confirmação para seu e-mail.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    resendConfirmation(localStorage.getItem("confirmationEmail") || "");
                  }}
                  className={`py-3 px-4 rounded-lg text-center font-bold ${
                    !canResend 
                      ? "bg-gray-700 cursor-not-allowed text-gray-400" 
                      : "bg-[#FF914D] hover:bg-[#FF914D]/90 cursor-pointer text-white"
                  } transition-colors`}
                  disabled={!canResend}
                >
                  {cooldown > 0 
                    ? `Reenviar em ${cooldown}s` 
                    : "Reenviar confirmação"}
                </button>
                
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/jmgrd98/vaguinhas"
                  className="py-3 px-4 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Deixe uma estrela em nosso repo no Github ⭐
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionSuccessModal;