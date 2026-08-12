import {
  FaHome,
  FaIdCard,
  FaFolderOpen,
  FaUsers,
  FaPalette,
  FaPen,
} from "react-icons/fa";

// Administrator
import AdminDashboard from "../Pages/Dashboard";
import ProjectOfficers from "../Pages/Project_Officers";
import Administratives from "../Pages/Administratives";
import Users from "../Pages/Users_page";
import Template from "../Pages/Template";
import EmployeeProjectOfficer from "../Pages/EmployeeProjectOfficer";


export const routes = [
  {
    key: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    icon: <FaHome />,
    roles: {
      Administrator: AdminDashboard,

    },
  },

  {
    key: "Project_Officer",
    title: "Placeholder",
    path: "/Identification",
    icon: <FaIdCard  />,
    roles: {
      Administrator: ProjectOfficers,
      Employee: EmployeeProjectOfficer

    },
  },


  {
    key: "administrative",
    title: "Administrative",
    path: "/Administratives",
    icon: <FaFolderOpen />,
    roles: {
    Administrator: Administratives,
}
  },

  {
    key: "users",
    title: "Users",
    path: "/users",
    icon: <FaUsers />,
    roles: {
      Administrator: Users,
    },
  },
  {
    key:"Template",
    title:"Templates",
    path: "/Templates",
    icon: <FaUsers />,
    roles: {
      Administrator: Template,
    },
  }
];