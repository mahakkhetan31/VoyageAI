import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: ReactNode;
}

function ProtectedRoute({ children }: Props) {
  const { isLoading } = useAuth();


  if (isLoading) {
    return <div className="auth-loading">Loading...</div>;
  }

  // Bypass login temporarily since backend is disconnected
  // if (!user) {
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  return <>{children}</>;
}

export default ProtectedRoute;
