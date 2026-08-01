import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 4700);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`toast toast--${type} ${isClosing ? "toast--closing" : ""}`}>
      <div className="toast__icon">
        {type === "success" && "✓"}
        {type === "error" && "✕"}
        {type === "info" && "ℹ"}
      </div>
      <div className="toast__message">{message}</div>
      <button className="toast__close" onClick={handleClose}>
        ✕
      </button>
    </div>
  );
}
