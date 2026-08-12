import React, { useEffect, useState } from "react";
import SignaturePad from "../components/Signature_Pad";
import api from "../api/axios";

const EmployeeProjectOfficer = () => {
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  

  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState(null);

  // Templates created by Administrator
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form
  const [form, setForm] = useState({
  name: "",
  office: "",
  section: "",
  employee_Id_NO: "",
  address: "",
  contact_Num: "",
  dateOfBirth: "",
  bloodType: "",
  emergencyConName: "",
  emergencyCon: "",
  image: null,
  signature: null,
  backgroundColor: "",
  templateId: "",
});

  // Load logged-in user
  useEffect(() => {
  const savedUser = JSON.parse(
    localStorage.getItem("user") || "null"
  );

   console.log("Logged-in user:", savedUser);
  console.log(
    "Office Type:",
    savedUser?.officeType
  );

  setUser(savedUser);

  if (savedUser) {
    setForm((prev) => ({
      ...prev,
      name: (savedUser.name || "").toUpperCase(),
    }));
  }
}, []); 

  // Load templates created by Administrator
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await api.get("/Template");

        setTemplates(response.data || []);
      } catch (error) {
        console.error(
          "Failed to load templates:",
          error
        );
      }
    };

    loadTemplates();
  }, []);

  // Automatically select the template
  // matching the employee's Office Type
  useEffect(() => {
     if (!user?.officeType || templates.length === 0) {
    return;
  }

  const template = templates.find(
    (t) =>
      t.name?.trim().toLowerCase() ===
      user.officeType.trim().toLowerCase()
  );

  console.log("Office Type:", user.officeType);
  console.log("Matched Template:", template);

  setSelectedTemplate(template || null);

  // Save the template ID into the form
  if (template) {
    setForm((prev) => ({
      ...prev,
      templateId: template.templateID,
    }));
  }
}, [user, templates]);

  // Generic form change
  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
            ? files?.[0] || null
            : value,
    }));
  };

  // Submit employee ID
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!officeType) {
      setMessage(
        "Your account does not have an Office Type assigned."
      );
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("Name", form.name);
      const combinedOffice = [
        form.section,
        form.office,
      ]
        .filter(Boolean)
        .join("\n");

      formData.append(
        "Office",
        combinedOffice
      );

      formData.append(
        "Employee_Id_NO",
        form.employee_Id_NO
      );

      formData.append(
        "Address",
        form.address
      );

      formData.append(
        "Contact_Num",
        form.contact_Num
      );

      formData.append(
        "OfficeType",
        officeType
      );

      formData.append(
        "TemplateID",
        form.templateId
      );

      formData.append(
        "CreatedBy",
        user?.id
      );

      // --------------------------------------------------
      // Dates
      // --------------------------------------------------

      if (form.dateOfBirth) {
        formData.append(
          "Date_of_Birth",
          form.dateOfBirth
        );
      }

      // --------------------------------------------------
      // Other information
      // --------------------------------------------------

      formData.append(
        "Blood_Type",
        form.bloodType
      );

      formData.append(
        "Emergency_Con_Name",
        form.emergencyConName
      );

      formData.append(
        "Emergency_Con",
        form.emergencyCon
      );

      // --------------------------------------------------
      // Image
      // --------------------------------------------------

      if (form.image) {
        formData.append(
          "Image",
          form.image
        );
      }

      // --------------------------------------------------
      // Signature
      // --------------------------------------------------

      if (form.signature) {
        formData.append(
          "Signature",
          form.signature
        );
      }

      // --------------------------------------------------
      // Signature background color
      // --------------------------------------------------

      if (form.backgroundColor) {
        formData.append(
          "BackgroundColor",
          form.backgroundColor
        );
      }

      // --------------------------------------------------
      // Send to backend
      // --------------------------------------------------
      

      console.log("===== CREATE ID DEBUG =====");
      console.log("Logged-in user:", JSON.parse(localStorage.getItem("user")));
      console.log("Office Type:", officeType);
      console.log("Selected Template:", selectedTemplate);
      console.log("Template ID:", selectedTemplate?.templateID);
      console.log("CreatedBy being sent:",formData.get("CreatedBy"));
      console.log("TemplateID being sent:",formData.get("TemplateID"));
      console.log("Template Name:", selectedTemplate?.name);
      console.log("Form Office:", form.office);
      console.log("Form Section:", form.section);
      console.log("===========================");

      const response = await api.post(
        "/ProjectOfficers",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      console.log(
        "Employee ID created:",
        response.data
      );

      setMessage(
        "ID created successfully."
      );
    } catch (error) {
      console.error(
        "Employee ID creation error:",
        error
      );

      console.error(
        "Server response:",
        error.response?.data
      );

      setMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Unable to create ID."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------
  // Save drawn signature
  // --------------------------------------------------

  const handleSignatureSave = (dataUrl) => {
    const arr = dataUrl.split(",");

    const mime =
      arr[0].match(/:(.*?);/)[1];

    const bstr = atob(arr[1]);

    let n = bstr.length;

    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] =
        bstr.charCodeAt(n);
    }

    const file = new File(
      [u8arr],
      "employee-signature.png",
      {
        type: mime,
      }
    );

    setForm((prev) => ({
      ...prev,
      signature: file,
    }));

    setSignaturePreview(dataUrl);

    setIsSignatureOpen(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* --------------------------------------------------
          HEADER
      -------------------------------------------------- */}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-700">
          Create My ID
        </h1>

        <p className="text-gray-600 mt-1">
          Create your employee identification card.
        </p>

        {user && (
          <p className="text-sm text-gray-500 mt-2">
            Account:{" "}
            <strong>
              {user.username}
            </strong>

            {" • "}

            Office Type:{" "}
            <strong>
              {user.officeType}
            </strong>
          </p>
        )}
      </div>

      {/* --------------------------------------------------
          FORM
      -------------------------------------------------- */}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 space-y-6"
      >

        {/* --------------------------------------------------
            PERSONAL INFORMATION
        -------------------------------------------------- */}

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* NAME */}

            <div>
              <label className="block mb-1 font-medium">
                Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                readOnly
                className="w-full border rounded p-2 bg-gray-100"
              />
            </div>

            {/* EMPLOYEE ID */}

            <div>
              <label className="block mb-1 font-medium">
                Employee ID No.
              </label>

              <input
                type="text"
                name="employee_Id_NO"
                value={form.employee_Id_NO}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              />
            </div>

            {/* OFFICE */}

            <div>
              <label className="block mb-1 font-medium">
                Office
              </label>

              <select
                name="office"
                value={form.office}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required={
                  officeType.toLowerCase() !==
                  "imo"
                }
              >
                <option value="">
                  Select Office
                </option>

                {(selectedTemplate?.office || []).map(
                  (office) => (
                    <option
                      key={office}
                      value={office}
                    >
                      {office}
                    </option>
                  )
                )}
              </select>

              {officeType.toLowerCase() ===
                "imo" && (
                <p className="text-xs text-gray-500 mt-1">
                  Office/Division is optional for IMO.
                </p>
              )}
            </div>

            {/* SECTION */}

            <div>
              <label className="block mb-1 font-medium">
                Section
              </label>

              <select
                name="section"
                value={form.section}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              >
                <option value="">
                  Select Section
                </option>

                {(selectedTemplate?.section || []).map(
                  (section) => (
                    <option
                      key={section}
                      value={section}
                    >
                      {section}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* CONTACT */}

            <div>
              <label className="block mb-1 font-medium">
                Contact Number
              </label>

              <input
                type="text"
                name="contact_Num"
                value={form.contact_Num}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            {/* ADDRESS */}

            <div className="md:col-span-2">
              <label className="block mb-1 font-medium">
                Address
              </label>

              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            {/* DATE OF BIRTH */}

            <div>
              <label className="block mb-1 font-medium">
                Date of Birth
              </label>

              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            {/* BLOOD TYPE */}

            <div>
              <label className="block mb-1 font-medium">
                Blood Type
              </label>

              <input
                type="text"
                name="bloodType"
                value={form.bloodType}
                onChange={handleChange}
                placeholder="e.g. O+"
                className="w-full border rounded p-2"
              />
            </div>

          </div>
        </div>

        {/* --------------------------------------------------
            EMERGENCY CONTACT
        -------------------------------------------------- */}

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Emergency Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block mb-1 font-medium">
                Contact Name
              </label>

              <input
                type="text"
                name="emergencyConName"
                value={form.emergencyConName}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Contact Number
              </label>

              <input
                type="text"
                name="emergencyCon"
                value={form.emergencyCon}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>

          </div>
        </div>

        {/* --------------------------------------------------
            ID IMAGES
        -------------------------------------------------- */}

        <div>
          <h2 className="text-xl font-semibold mb-4">
            ID Images
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* PROFILE PICTURE */}

            <div>
              <label className="block mb-1 font-medium">
                Profile Picture
              </label>

              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="w-full border rounded p-2"
              />

              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  name="removeImageBackground"
                  checked={
                    form.removeImageBackground
                  }
                  onChange={handleChange}
                />

                Remove image background
              </label>
            </div>

            {/* SIGNATURE */}

            <div>
              <label className="block mb-1 font-medium">
                Signature
              </label>

              <div className="border rounded-lg p-4">

                <input
                  type="file"
                  name="signature"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />

                <div className="text-center my-3 text-gray-500">
                  OR
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsSignatureOpen(true)
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                >
                  Write Signature
                </button>

                {signaturePreview && (
                  <div className="mt-4">

                    <p className="text-sm text-gray-500 mb-2">
                      Signature Preview
                    </p>

                    <img
                      src={signaturePreview}
                      alt="Signature Preview"
                      className="border rounded w-full h-24 object-contain"
                    />

                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* --------------------------------------------------
            MESSAGE
        -------------------------------------------------- */}

        {message && (
          <div className="p-3 rounded bg-gray-100">
            {message}
          </div>
        )}

        {/* --------------------------------------------------
            SUBMIT
        -------------------------------------------------- */}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded"
        >
          {isSaving
            ? "Creating ID..."
            : "Create My ID"}
        </button>

      </form>

      {/* --------------------------------------------------
          SIGNATURE POPUP
      -------------------------------------------------- */}

      {isSignatureOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl shadow-xl p-6 w-[850px] max-w-[95vw]">

            <div className="flex justify-between items-center mb-4">

              <h2 className="text-xl font-bold">
                Write Signature
              </h2>

              <button
                type="button"
                onClick={() =>
                  setIsSignatureOpen(false)
                }
                className="text-gray-500 hover:text-gray-800 text-xl"
              >
                ✕
              </button>

            </div>

            <SignaturePad
              onSave={handleSignatureSave}
            />

          </div>

        </div>
      )}

    </div>
  );
};

export default EmployeeProjectOfficer;