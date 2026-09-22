import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import React from "react";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();

  // If the authentication state is still loading, show a loading message
  if (loading) {
    return (
      <main>
        <h1>Loading......</h1>
      </main>
    );
  }

  // If the user is not authenticated, redirect to the login page
  if (!user) {
    return <Navigate to={"/login"} replace />;
  }

  return children;
};

export default Protected;
