import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import api from "../api/axios";

export default function EmployeeRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    //officeType: "",
  });

  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await api.get("/Template");

        console.log("Templates loaded:", response.data);

        setTemplates(response.data || []);
      } catch (error) {
        console.error(
          "Failed to load templates:",
          error
        );

        setMessage(
          "Unable to load Office Types."
        );
      }
    };

    loadTemplates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setMessage("Name is required.");
      return;
    }

    if (!form.username.trim()) {
      setMessage("Username is required.");
      return;
    }

    if (!form.password.trim()) {
      setMessage("Password is required.");
      return;
    }

    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (!form.officeType) {
      setMessage("Please select your Office Type.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("Name", form.name);
      formData.append("Username", form.username);
      formData.append("Email", form.email);
      formData.append("Password", form.password);

      // Employee accounts only
      formData.append("Role", "Employee");

      // Active by default
      formData.append("Status", "Active");

      // Regional or IMO
      formData.append("OfficeType", form.officeType);

      await api.post("/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Account created successfully.");

      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      console.error("Server response:", error.response?.data);

      setMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Unable to create account."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-700 via-white to-green-200 p-6 overflow-hidden relative">
  {/* Background Watermark */}
  <img
    src={logo}
    alt="Watermark"
    className="absolute w-175 opacity-10"
  />

  {/* Create Account Card */}
    <div className="relative backdrop-blur-md bg-black/15 border border-white/20 rounded-3xl shadow-2xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="flex justify-center">
        <img
            src={logo}
            alt="NIA Logo"
            className="w-24 h-24"
        />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white text-center mt-3">
        Sign Up
        </h1>

        <p className="text-center text-green-100 mb-8">
        Employee Registration
        </p>

        {message && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full border rounded-lg p-3"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Username
            </label>

            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full border rounded-lg p-3"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full border rounded-lg p-3"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="w-full border rounded-lg p-3"
            />
          </div>

          {/* Office Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Office Type
            </label>

            <select
              name="officeType"
              value={form.officeType}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            >
              <option value="">
                Select Office Type
              </option>

              {templates.map((template) => (
                <option
                  key={template.templateID}
                  value={template.name}
                >
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
          >
            {isSaving ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <div className="text-center mt-5">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-green-700 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}