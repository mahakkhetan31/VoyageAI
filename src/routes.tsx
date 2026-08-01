import { Routes, Route } from "react-router-dom";
import {
  HomePage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  ChatPage,
  TripsPage,
  TripDetailPage,
  BudgetPage,
  DocumentsPage,
  ItineraryPage,
  NotFoundPage,
} from "./pages";
import ProtectedRoute from "./components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute><TripsPage /></ProtectedRoute>} />
      <Route path="/trips/:tripId" element={<ProtectedRoute><TripDetailPage /></ProtectedRoute>} />
      <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
      <Route path="/itinerary" element={<ProtectedRoute><ItineraryPage /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
