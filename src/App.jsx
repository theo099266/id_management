import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/Login";
import EmployeeRegister from "./Pages/EmployeeRegister";

import MainLayout from "./layout/Main";
import { routes } from "./config/routes";


function getStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, allowedRoles }) {
  const user = getStoredUser();
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!user?.role) {
    return <Navigate to="/" replace />;
  }

    if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Returns the correct page depending on role
function RolePage({ route }) {
  const user = getStoredUser();

  if (!user?.role) {
    return <Navigate to="/" replace />;
  }

  const Component = route.roles[user.role];

  if (!Component) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Component />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public pages */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/register"
          element={<EmployeeRegister />}
        />

        {/* Protected pages */}
        <Route element={<MainLayout />}>
          {routes.map((route) => (
            <Route
              key={route.key}
              path={route.path}
              element={
                <ProtectedRoute
                  allowedRoles={Object.keys(route.roles)}
                >
                  <RolePage route={route} />
                </ProtectedRoute>
              }
            />
          ))}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
