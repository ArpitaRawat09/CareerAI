import { RouterProvider } from "react-router-dom";
import { router } from "./app.route.jsx";
import { AuthProvider } from "./features/auth/service/auth.context.jsx";

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
