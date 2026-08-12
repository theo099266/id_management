import logo from "../assets/logo.png";
import { login } from "../api/auth";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter your username and password.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await login({
        username,
        password,
      });

      if (!response.data.token) {
        throw new Error("No token received");
      }

      localStorage.setItem("token", response.data.token);

      localStorage.setItem(
      "user",
      JSON.stringify({
        id: response.data.id,
        name: response.data.name,
        username: response.data.username,
        role: response.data.role,
        officeType: response.data.officeType,
        image: response.data.image,
      }),
    );

      navigate("/dashboard");
    } catch (error) {
      if (error.response && error.response.data?.message) {
        setLoginError(error.response.data.message);
      } else {
        setLoginError("Invalid username or password");
      }
    } finally {
      setIsLoggingIn(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-700 via-white to-green-200 p-6 overflow-hidden relative">
      {/* Background Watermark */}
      <img src={logo} alt="Watermark" className="absolute w-175 opacity-10" />

      {/* Login Card */}
      <div className="relative backdrop-blur-md bg-black/15 border border-white/20 rounded-3xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logo} alt="NIA Logo" className="w-24 h-24" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white text-center mt-3">
          Login
        </h1>

        <p className="text-center text-green-100 mb-8">ID Management System</p>

        {loginError && (
          <div className="mb-5 rounded-lg bg-red-600/15 border border-red-500/30 backdrop-blur-sm px-4 py-3 shadow-md animate-fadeIn">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-red-500 text-2xl" />
              <div>
                <h3 className="font-semibold text-white">Login Failed</h3>
                <p className="text-sm text-red-100">{loginError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Username */}
        <div className="mb-5">
          <label className="text-white text-sm">Username</label>

          <div className="relative mt-2">
            <FaUser className="absolute left-4 top-4 text-gray-500" />

            <input
              ref={usernameRef}
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  passwordRef.current?.focus();
                }
              }}
              className="w-full pl-12 pr-4 py-3 rounded-xl outline-none"
            />
          </div>
        </div>

        {/* Password */}

        <div className="mb-5">
          <label className="text-white text-sm">Password</label>

          <div className="relative mt-2">
            <FaLock className="absolute left-4 top-4 text-gray-500" />

            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
              className="w-full pl-12 pr-12 py-3 rounded-xl outline-none"
            />

            {showPassword ? (
              <FaEyeSlash
                className="absolute right-4 top-4 text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <FaEye
                className="absolute right-4 top-4 text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>
        </div>

        {/* Remember */}

        <div className="flex justify-between items-center text-white text-sm mb-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Remember Me
          </label>
        </div>
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2
            ${
              isLoggingIn
                ? "bg-green-700 text-white cursor-not-allowed opacity-90 shadow-lg shadow-green-600/30"
                : "bg-green-800 hover:bg-green-900 text-white active:scale-[0.99] active:shadow-md"
            }`}
        >
          {isLoggingIn ? (
            <>
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Logging in...</span>
            </>
          ) : (
            "Login"
          )}
        </button>
      </div>
    </div>
  );
}
