import React, { useEffect, useRef, ReactNode } from "react";
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

    useEffect(() => {
        if (!isOpen) return;

        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            tabIndex={-1}
            ref={modalRef}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            style={{ animation: "fadeIn 0.2s ease" }}
        >
            <div
                className={`bg-white rounded shadow-lg p-6 w-full mx-4 ${sizes[size]} max-h-[80vh] overflow-auto relative`}
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
};

export default Modal;
