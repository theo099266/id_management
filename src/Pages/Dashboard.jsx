import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import RecentProjectOfficers from "../components/RecentProjectOfficers";
import BrandingCard from "../components/BrandingCard";
import api from "../api/axios"; 

export default function Dashboard() {
  const [stats, setStats] = useState({
    templates: 0,
    documents: 0,
    users: 0,
    signatures: 0,
    branding: 0,
  });
  const [recentOfficers, setRecentOfficers] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [AdministrativesRes, ProjectOfficersRes, usersRes] =
          await Promise.all([
            api.get("/Administrative"),
            api.get("/ProjectOfficers"),
            api.get("/users"),
          ]);

        setStats({
          templates: AdministrativesRes.data?.length || 0,
          documents: ProjectOfficersRes.data?.length || 0,
          users: usersRes.data?.length || 0,
        });

        setUsers(usersRes.data || []);

        const latestOfficers = [...(ProjectOfficersRes.data || [])]
          .sort((a, b) => {
            // Sort by newest IssueDate first
            const dateA = a.issueDate ? new Date(a.issueDate).getTime() : 0;
            const dateB = b.issueDate ? new Date(b.issueDate).getTime() : 0;

            // If IssueDate is the same or missing, fall back to ID
            if (dateB !== dateA) return dateB - dateA;

            return b.ID - a.ID;
          })
          .slice(0, 5);

        setRecentOfficers(latestOfficers);
      } catch (error) {
        console.error("Dashboard data load failed", error);
      }
    };

    loadDashboardData();
  }, []);

  const getCreatorName = (createdBy) => {
    if (!createdBy) return "Unknown";
    const creator = users.find((u) => u.id === createdBy);
    return creator?.name || "Unknown";
  };

  return (
    <div className="p-8 bg-[#F5FFF5] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of ID system activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        <StatCard
          title="Total Users"
          value={stats.users}
          className="xl:col-span-2"
        />

        <StatCard
          title="No. of Validator "
          value={stats.templates}
          className="xl:col-span-2"
        />

        <StatCard title="No. of Placeholder" value={stats.documents} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
        <div className="xl:col-span-2">
          <RecentProjectOfficers officers={recentOfficers} />
        </div>

        <BrandingCard />
      </div>
    </div>
  );
}