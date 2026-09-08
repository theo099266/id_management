import logo from "../assets/logo.png";
import {
  FaHome,
  FaFileAlt,
  FaFolderOpen,
  FaUsers,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { routes } from "../config/routes";
import { useModalClose } from "./Clickouside";
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

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { overlayProps, contentProps } = useModalClose(onClose);

  const user = (() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  const role = user?.role || "";
  const visibleMenu = routes.filter((route) => route.roles[user?.role]);

  const handleNavigate = (path) => {
    navigate(path);
    onClose?.(); // auto-close on mobile after picking a page
  };

  return (
    <>
      {/* backdrop — mobile only, shown while sidebar is open */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" {...overlayProps} />
      )}

      <div
        {...contentProps}
        className={`fixed md:static top-0 left-0 h-full md:h-auto md:min-h-screen w-64
        bg-[#f7f7f7] text-white-800 shadow-lg border-r border-green-300 z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
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
              onClick={() => handleNavigate(route.path)}
            />
          ))}
        </nav>
      </div>
    </>
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