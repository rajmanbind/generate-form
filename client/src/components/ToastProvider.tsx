import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const showToast = (message: string, type: "success" | "error") => {
  if (type === "success") {
    toast.success(message);
  } else {
    toast.error(message);
  }
};

const ToastProvider = () => {
  return <ToastContainer position="top-right" autoClose={3000} />;
};

export default ToastProvider;
