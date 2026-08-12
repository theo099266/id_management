import logo from "../assets/logo.png";
import {
  FaHome,
  FaFileAlt,
  FaFolderOpen,
  FaUsers,
  FaPalette,
  FaPen,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { routes } from "../config/routes";
const menuItems = [
  {
    text: "Dashboard",
    icon: <FaHome />,
    path: "/dashboard",
    roles: ["Administrator", "Template Designer", "Office Staff"],
  },
  {
    text: "Officers",
    icon: <FaFileAlt />,
    path: "/Identification",
    roles: ["Administrator", "Template Designer"],
  },
  {
    text: "Administratives",
    icon: <FaFolderOpen />,
    path: "/Administratives",
    roles: ["Administrator", "Template Designer", "Office Staff"],
  },
  {
    text: "Template",
    icon: <FaFolderOpen />,
    path: "/Templates",
    roles: ["Administrator", "Template Designer", "Office Staff"],
  },
  {
    text: "Users",
    icon: <FaUsers />,
    path: "/Users",
    roles: ["Administrator"],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const user = (() => {
    if (typeof window === "undefined") return null;

    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  const role = user?.role || "";
  const visibleMenu = routes.filter((route) => route.roles[user.role]);

  return (
    <div className="w-64 bg-[#f7f7f7] text-white-800 min-h-screen shadow-lg border-r border-green-300">
      <div className="p-6 text-center">
        <img src={logo} className="w-20 mx-auto" />
        <h2 className="font-bold mt-3">NIA ID System</h2>
        {role ? <p className="text-sm text-green-700 mt-2">{role}</p> : null}
      </div>

      <nav className="mt-8 space-y-2">
        {visibleMenu.map((route) => (
          <Menu
            key={route.key}
            icon={route.icon}
            text={route.title}
            onClick={() => navigate(route.path)}
          />
        ))}
      </nav>
    </div>
  );
}

function Menu({ icon, text, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-6 py-3 text-[#0a0e0a] hover:bg-[#0a360d] hover:text-white rounded-lg cursor-pointer transition-all duration-200"
    >
      {icon}
      {text}
    </div>
  );
}
