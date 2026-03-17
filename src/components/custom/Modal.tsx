import React, { useEffect, useRef, ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../custom/Button";
import { FaXmark } from "react-icons/fa6";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string | ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg";
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = "md",
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        // Lock body and html scroll
        const originalHtmlOverflow = window.getComputedStyle(document.documentElement).overflow;
        const originalBodyOverflow = window.getComputedStyle(document.body).overflow;
        
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";

        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        const handleBackdropClick = (e: MouseEvent) => {
            const selection = window.getSelection();
            const hasSelection = selection && selection.toString().trim().length > 0;
            
            if (e.target === modalRef.current && !hasSelection) {
                onClose();
            }
        };

        window.addEventListener("keydown", onEsc);
        
        const currentModal = modalRef.current;
        if (currentModal) {
            currentModal.addEventListener("click", handleBackdropClick);
        }

        return () => {
            // Restore styles
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.body.style.overflow = originalBodyOverflow;
            
            window.removeEventListener("keydown", onEsc);
            if (currentModal) {
                currentModal.removeEventListener("click", handleBackdropClick);
            }
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const sizes = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-6xl",
    };

    const modalContent = (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            tabIndex={-1}
            ref={modalRef}
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-[1000]"
            style={{ animation: "fadeIn 0.2s ease" }}
        >
            <div
                className={`bg-white rounded shadow-lg p-6 w-full mx-4 ${sizes[size]} max-h-[90vh] overflow-auto relative`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cross close button */}
                <Button style="secondary" onClick={onClose} aria-label="Close modal" extraStyles="absolute top-3 right-3 !p-2 !rounded-full" >
                    <FaXmark />
                </Button>

                {/* Header */}
                {title && (
                    <h2
                        id="modal-title"
                        className="text-xl font-semibold absolute top-4 left-3"
                        tabIndex={0}
                    >
                        {title}
                    </h2>
                )}

                {/* Body */}
                <div className="my-4">{children}</div>

                {/* Footer */}
                {footer && <div className="mt-3">{footer}</div>}
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default Modal;
