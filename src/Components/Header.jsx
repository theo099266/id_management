import { useState, useRef, useEffect } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/axios";

const BACKEND_URL = "https://id-management-api.runasp.net";

const getImageSrc = (path) => {
  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:image") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  return `${BACKEND_URL}/${path.replace(/^\/+/, "")}`;
};

export default function Header() {
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-[#81e987] shadow-lg px-8 py-4 flex justify-between items-center">
      <div className="text-2xl text-green-700 cursor-pointer" />

      <div className="relative" ref={dropdownRef}>
        {/* User Icon + Name */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowLogout(!showLogout)}
        >
          <div className="flex justify-center items-center">
            {user?.image ? (
              <img
                src={getImageSrc(user.image)}
                alt="profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="font-semibold">{user?.name || "Guest"}</span>
        </div>

        {/* Dropdown */}
        {showLogout && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-50">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-red-50 border rounded-lg"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
