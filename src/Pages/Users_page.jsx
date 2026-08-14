import { useEffect, useState, useRef } from "react";
import api, { API_BASE_URL } from "../api/axios";
import {
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaEyeSlash,
} from "react-icons/fa";
import useDragAndDrop from "../components/useDragAndDrop";
import { useModalClose } from "../components/Clickouside";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import useTableSort from "../components/useTableSort";
import SortableHeader from "../components/SortableHeader";
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

export default function Templates() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    userName: "",
    email: "",
    passwordHash: "",
    role: "",
    status: "",
  });
  const [templates, setTemplates] = useState([]);

useEffect(() => {
  api.get("/Template")
    .then((res) => setTemplates(res.data || []))
    .catch((err) => console.error("Failed to load templates", err));
}, []);

  const [form, setForm] = useState({
    name: "",
    userName: "",
    email: "",
    passwordHash: "",
    role: "",
    status: "Active",
    image: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    user: null,
  });

  const [deleting, setDeleting] = useState(false);
  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useDragAndDrop({
      onFile: (file) => {
        setForm((prev) => ({ ...prev, image: file }));
        setPreview(URL.createObjectURL(file));
      },
    });

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleReset = async () => {
    if (!selectedUser) return;

    try {
      const response = await api.post("/Auth/admin-reset-password", {
        userId: selectedUser.id,
        newPassword,
      });

      alert(response.data.message);

      setShowResetModal(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (error) {
      alert(
        error.response?.data?.errors?.join(", ") ??
          error.response?.data?.message ??
          "Error resetting password",
      );
    }
  };

  const validateForm = () => {
    const errors = {
      name: "",
      userName: "",
      email: "",
      passwordHash: "",
      role: "",
      status: "",
    };

    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.userName.trim()) errors.userName = "Username is required.";
    if (!form.role.trim()) errors.role = "Role is required.";
    if (!form.status.trim()) errors.status = "Status is required.";
    if (!editUser && !form.passwordHash.trim())
      errors.passwordHash = "Password is required.";
    if (form.passwordHash.trim() && form.passwordHash.trim().length < 6)
      errors.passwordHash = "Password must be at least 6 characters.";

    return errors;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, image: file }));

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else {
      setPreview(null);
    }
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const { overlayProps, contentProps } = useModalClose(() => {
    setShowModal(false);
    setShowPassword(false);
  });

  useEffect(() => {
    api
      .get("/users")
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const searchedUsers = users.filter((user) => {
    const q = search.toLowerCase();

    return (
      user.name?.toLowerCase().includes(q) ||
      user.userName?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.role?.toLowerCase().includes(q) ||
      user.status?.toLowerCase().includes(q)
    );
  });

  const {
    sortedData: filteredUsers,
    sortConfig,
    handleSort,
  } = useTableSort(searchedUsers);

  const deleteUser = async () => {
    if (!deleteModal.user) return;

    try {
      setDeleting(true);

      await api.delete(`/users/${deleteModal.user.id}`);

      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.user.id));

      setDeleteModal({
        open: false,
        user: null,
      });
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
    }
  };

  const clearErrors = () => {
    setErrorMessage("");

    setFieldErrors({
      name: "",
      userName: "",
      email: "",
      passwordHash: "",
      role: "",
      status: "",
    });
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    const hasValidationError = Object.values(validationErrors).some(Boolean);

    if (hasValidationError) {
      setFieldErrors(validationErrors);
      setErrorMessage("Please complete the highlighted fields.");
      return;
    }

    try {
      clearErrors();

      const formData = new FormData();
      formData.append("Name", form.name);
      formData.append("Username", form.userName);
      formData.append("Email", form.email ?? "");
      if (!editUser) formData.append("Password", form.passwordHash);
      formData.append("Role", form.role);
      formData.append("Status", form.status);

      if (form.image) formData.append("Image", form.image);

      if (editUser) {
        // Update user information
        await api.put(`/users/${editUser.id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Change password only if something was entered
        if (form.passwordHash.trim() !== "") {
          await api.post("/Auth/admin-reset-password", {
            userId: editUser.id,
            newPassword: form.passwordHash,
          });
        }
      } else {
        await api.post("/Auth/register", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // refresh list
      const response = await api.get("/users");
      setUsers(response.data);
      setShowModal(false);
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const mappedErrors = {
        name: "",
        userName: "",
        email: "",
        passwordHash: "",
        role: "",
        status: "",
      };

      if (validationErrors) {
        if (validationErrors.Name?.[0]) mappedErrors.name = "Name is required.";
        if (validationErrors.Username?.[0])
          mappedErrors.userName = "Username is required.";
        if (validationErrors.Password?.[0])
          mappedErrors.passwordHash = "Password is required.";
        if (validationErrors.Password?.[0]?.includes("at least 6"))
          mappedErrors.passwordHash = "Password must be at least 6 characters.";
        if (validationErrors.Role?.[0]) mappedErrors.role = "Role is required.";
        if (validationErrors.Status?.[0])
          mappedErrors.status = "Status is required.";
      }

      setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));

      if (Object.values(mappedErrors).some(Boolean)) {
        setErrorMessage("Please complete the highlighted fields.");
      } else if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Unable to connect to the server.");
      }
    }
  };
  return (
    <div className="p-8 bg-[#F5FFF5] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Users</h1>

          <p className="text-gray-600">Manage all Users</p>
        </div>

        <button
          onClick={() => {
            setEditUser(null);
            clearErrors();
            setPreview(null);

            setForm({
              name: "",
              userName: "",
              email: "",
              passwordHash: "",
              role: "",
              status: "Active",
              image: null,
            });
            clearErrors();
            setShowModal(true);
          }}
          className="bg-[#2E7D32] hover:bg-green-700 text-white px-5 py-3 rounded-lg flex items-center gap-2"
        >
          <FaPlus />
          Add Users
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="relative w-80">
          <FaSearch className="absolute left-4 top-4 text-gray-400" />

          <input
            type="text"
            placeholder="Search Users Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-center">
          <thead className="bg-[#76d47b] text-white">
            <tr>
              <SortableHeader
                label="ID"
                sortKey="id"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <SortableHeader
                label="Name"
                sortKey="name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <SortableHeader
                label="Username"
                sortKey="userName"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <SortableHeader
                label="Email"
                sortKey="email"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <SortableHeader
                label="Role"
                sortKey="role"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <SortableHeader
                label="Status"
                sortKey="status"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <th className="text-center py-3">Image</th>

              <th className="text-center py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b hover:bg-green-50 transition"
              >
                <td className="p-4 text-center">{user.id}</td>

                <td>{user.name}</td>

                <td>{user.userName}</td>

                <td>{user.email}</td>

                <td>{user.role}</td>

                <td>{user.status}</td>

                <td>
                  <div className="flex justify-center items-center">
                    {user.image ? (
                      <img
                        src={getImageSrc(user.image)}
                        alt="profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </td>

                <td>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => {
                        clearErrors();
                        setEditUser(user);
                        setPreview(getImageSrc(user.image));

                        setForm({
                          name: user.name,
                          userName: user.userName,
                          email: user.email,
                          passwordHash: "",
                          role: user.role,
                          status: user.status,
                          image: null,
                        });

                        setShowModal(true);
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() =>
                        setDeleteModal({
                          open: true,
                          user,
                        })
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div
          className="fixed inset-0 bg-black/10 flex justify-center items-center z-50"
          {...overlayProps}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto p-6"
            {...contentProps}
          >
            <h2 className="text-2xl font-bold text-green-800 mb-5">
              {editUser ? "Edit User" : "Add User"}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <input
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className={`w-full border p-2 rounded ${fieldErrors.name ? "border-red-500 focus:ring-2 focus:ring-red-300" : "border-gray-300"}`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Username"
                    value={form.userName}
                    onChange={(e) =>
                      handleFieldChange("userName", e.target.value)
                    }
                    className={`w-full border p-2 rounded ${fieldErrors.userName ? "border-red-500 focus:ring-2 focus:ring-red-300" : "border-gray-300"}`}
                  />
                  {fieldErrors.userName && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.userName}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className={`w-full border p-2 rounded ${fieldErrors.email ? "border-red-500 focus:ring-2 focus:ring-red-300" : "border-gray-300"}`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="relative w-full">
                  <div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        editUser
                          ? "Leave blank to keep current password"
                          : "Password"
                      }
                      value={form.passwordHash}
                      onChange={(e) =>
                        handleFieldChange("passwordHash", e.target.value)
                      }
                      className={`w-full border p-2 rounded pr-10 ${
                        fieldErrors.passwordHash
                          ? "border-red-500 focus:ring-2 focus:ring-red-300"
                          : "border-gray-300"
                      }`}
                    />

                    {fieldErrors.passwordHash && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.passwordHash}
                      </p>
                    )}
                  </div>

                  {showPassword ? (
                    <FaEyeSlash
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700"
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <FaEye
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700"
                      onClick={() => setShowPassword(true)}
                    />
                  )}
                </div>

                <div>
                  <select
                    value={form.role}
                    onChange={(e) => handleFieldChange("role", e.target.value)}
                    className={`w-full border p-2 rounded ${fieldErrors.role ? "border-red-500 focus:ring-2 focus:ring-red-300" : "border-gray-300"}`}
                  >
                    <option value="" disabled>Select Role</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                  {fieldErrors.role && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.role}
                    </p>
                  )}
                </div>

                <div>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      handleFieldChange("status", e.target.value)
                    }
                    className={`w-full border p-2 rounded ${fieldErrors.status ? "border-red-500 focus:ring-2 focus:ring-red-300" : "border-gray-300"}`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {fieldErrors.status && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.status}
                    </p>
                  )}
                </div>

            
              </div>

              <div className="border rounded p-3 mt-2">
                <label className="block text-sm font-medium mb-2">
                  Profile Image
                </label>

                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <label
                  htmlFor="profileImage"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition
                  ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded"
                    />
                  ) : (
                    <>
                      <span className="text-3xl mb-3">📸</span>
                      <span className="font-medium text-gray-700">
                        {isDragging
                          ? "Drop image here"
                          : "Click or drag an image here"}
                      </span>
                      <span className="text-sm text-gray-500">
                        JPG, PNG, GIF
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-6 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-5 py-2 bg-green-700 text-white rounded"
              >
                {editUser ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal
        open={deleteModal.open}
        loading={deleting}
        title="Delete User"
        message="You are about to permanently remove this user from the system."
        itemName={deleteModal.user?.name}
        confirmText="Delete User"
        onCancel={() =>
          setDeleteModal({
            open: false,
            user: null,
          })
        }
        onConfirm={deleteUser}
      />
    </div>
  );
}
