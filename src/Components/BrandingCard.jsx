import { useEffect, useState } from "react";
import api from "../api/axios"; 
import logo from "../assets/logo.png";

export default function BrandingCard() {
  const [system, setSystem] = useState({
    backend: false,
    database: false,
    lastChecked: null,
  });

  const [internet, setInternet] = useState(navigator.onLine);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const updateInternet = () => setInternet(navigator.onLine);

    window.addEventListener("online", updateInternet);
    window.addEventListener("offline", updateInternet);

    const checkSystem = async () => {
      try {
        const res = await api.get("/Health");

        setSystem({
          backend: true,
          database: res.data.database,
          lastChecked: new Date(),
        });
      } catch {
        setSystem({
          backend: false,
          database: false,
          lastChecked: new Date(),
        });
      }
    };

    checkSystem();

    const interval = setInterval(checkSystem, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", updateInternet);
      window.removeEventListener("offline", updateInternet);
    };
  }, []);

  const StatusBadge = ({ active, onlineText, offlineText }) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        active
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      ● {active ? onlineText : offlineText}
    </span>
  );

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 h-full">

      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={logo}
          alt="NIA Logo"
          className="w-16 h-16 object-contain"
        />

        <div>
          <h2 className="text-xl font-bold text-green-800">
            ID Management System
          </h2>

          <p className="text-sm text-gray-500">
            Welcome, {user?.name ?? "Administrator"}
          </p>
        </div>
      </div>

      <div className="border-t my-5"></div>

      {/* Status */}
      <div className="space-y-4">

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Internet</span>

          <StatusBadge
            active={internet}
            onlineText="Connected"
            offlineText="Offline"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Backend API</span>

          <StatusBadge
            active={system.backend}
            onlineText="Online"
            offlineText="Offline"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Database</span>

          <StatusBadge
            active={system.database}
            onlineText="Connected"
            offlineText="Disconnected"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">ID Generation</span>

          <span className="font-semibold text-green-700">
            {system.backend && system.database ? "Ready" : "Unavailable"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Photo Processing</span>

          <span className="font-semibold text-green-700">
            {system.backend ? "Available" : "Unavailable"}
          </span>
        </div>

      </div>

      <div className="border-t mt-6 pt-4">

        <div className="flex justify-between text-sm text-gray-500">
          <span>Last Checked</span>

          <span>
            {system.lastChecked
              ? system.lastChecked.toLocaleTimeString()
              : "--"}
          </span>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            National Irrigation Administration
          </p>

          <p className="font-semibold text-green-700">
            Employee Identification Card Management
          </p>
        </div>

      </div>

    </div>
  );
}