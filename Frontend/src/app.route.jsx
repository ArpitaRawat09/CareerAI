import { createBrowserRouter } from "react-router-dom";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import ProtectedRoute from "./features/auth/components/Protected";
import Dashboard from "./features/auth/pages/DashBoard";
import Interview from "./features/interview/pages/Interview";
import InterviewReport from "./features/interview/pages/InterviewReport";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
       <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/interview",
    element: (
      <ProtectedRoute>
        <Interview />
      </ProtectedRoute>
    ),
  },
  {
    path: "/interview/report",
    element: (
      <ProtectedRoute>
        <InterviewReport />
      </ProtectedRoute>
    ),
  },
  {
    path: "/interview/report/:interviewId",
    element: (
      <ProtectedRoute>
        <InterviewReport />
      </ProtectedRoute>
    ),
  },
]);
