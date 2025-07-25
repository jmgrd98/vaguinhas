'use client';

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react"; // Import X icon from lucide-react

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
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={24} />
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