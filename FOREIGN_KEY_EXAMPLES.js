/**
 * FOREIGN KEY RELATIONSHIP EXAMPLES
 * 
 * These examples show the correct way to work with the fixed foreign key relationships.
 */

// ============================================
// BACKEND: Posting a new document
// ============================================

// Frontend sends: Document form data with template ID, signatory IDs
const formData = new FormData();
formData.append("TemplateID", "1");           // Required: Template ID
formData.append("ReferenceNo", "DOC-2024-001");
formData.append("Recipient", "John Doe");
formData.append("Subject", "Contract Review");
formData.append("Body", "Please review the attached contract...");
formData.append("PreparedBy", "5");           // FK: Signatory ID (optional)
formData.append("ApprovedBy", "3");           // FK: Signatory ID (optional)
formData.append("created_by", "2");           // FK: User ID who created (optional)
// formData.append("Attachment", file);

// Backend creates the document
// Models automatically load:
// - Template (from TemplateID)
// - PreparedBySignatory (from PreparedBy)
// - ApprovedBySignatory (from ApprovedBy)

// ============================================
// DATABASE: The cleaned up schema
// ============================================

// Documents table
// DocumentID (PK)
// TemplateID (FK → Templates.TemplateID)
// PreparedBy (FK → Signatories.SignatoryID) [nullable]
// ApprovedBy (FK → Signatories.SignatoryID) [nullable]
// CreatedBy (FK → user.UserID) [optional tracking]
// ReferenceNo, Recipient, Subject, Body, CreatedDate, GeneratedFile

// Templates table
// TemplateID (PK)
// CreatedBy (FK → user.UserID) [tracks who created this template]
// TemplateName, Category, Description, TemplateFile, Version, CreatedDate

// Signatories table
// SignatoryID (PK)
// CreatedBy (FK → user.UserID) [optional, tracks who created this signatory]
// Name, Position, SignatureImage

// ============================================
// FRONTEND: React example - Documents.jsx
// ============================================

const handleSave = async () => {
  try {
    const formData = new FormData();
    
    // Required: Template ID (EF will load the full Template object)
    formData.append("TemplateID", form.templateID || "1");
    
    // Document content
    formData.append("ReferenceNo", form.referenceNo || "");
    formData.append("Recipient", form.recipient || "");
    formData.append("Subject", form.subject || "");
    formData.append("Body", form.body || "");
    
    // Foreign Keys to Signatories (optional, but recommended)
    if (form.preparedBy) {
      formData.append("PreparedBy", form.preparedBy);
      // Backend will load: document.PreparedBySignatory (Signatory object)
    }
    
    if (form.approvedBy) {
      formData.append("ApprovedBy", form.approvedBy);
      // Backend will load: document.ApprovedBySignatory (Signatory object)
    }
    
    // Track who created this document
    formData.append("created_by", user?.id || "1");
    
    // Optional: Attachment
    if (form.attachment) {
      formData.append("Attachment", form.attachment);
    }

    if (editDocument) {
      await axios.put(
        `http://localhost:5146/api/Documents/${editDocument.documentID}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    } else {
      await axios.post("http://localhost:5146/api/Documents", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    }

    await loadData();
    setShowModal(false);
  } catch (error) {
    console.error("Save error:", error);
    alert("Unable to save document.");
  }
};

// ============================================
// FRONTEND: React example - Signatories select
// ============================================

const [signatories, setSignatories] = useState([]);
const [form, setForm] = useState({
  name: "",
  position: "",
  signatureImage: null,
  backgroundColor: "#ffffff",
  createdBy: user?.id || 1,  // FK: Who is creating this signatory
});

const handleSignatorySave = async () => {
  const formData = new FormData();
  formData.append("Name", form.name);
  formData.append("Position", form.position);
  formData.append("CreatedBy", form.createdBy);  // FK to user
  formData.append("BackgroundColor", form.backgroundColor);
  if (form.signatureImage) {
    formData.append("SignatureImage", form.signatureImage);
  }

  await axios.post("http://localhost:5146/api/Signatories", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

// In the document form, populate signatories dropdown:
<select
  value={form.preparedBy}
  onChange={(e) => setForm({ ...form, preparedBy: e.target.value })}
>
  <option value="">Select Signatory (Prepared By)</option>
  {signatories.map((sig) => (
    <option key={sig.signatoryID} value={sig.signatoryID}>
      {sig.name} - {sig.position}
    </option>
  ))}
</select>

// ============================================
// FRONTEND: React example - Templates select
// ============================================

const [templates, setTemplates] = useState([]);
const [form, setForm] = useState({
  templateID: "",
  referenceNo: "",
  // ... other fields
});

// Load data on mount
useEffect(() => {
  const loadData = async () => {
    try {
      const res = await axios.get("http://localhost:5146/api/Template");
      setTemplates(res.data || []);
      
      // Auto-select first template if available
      if (res.data?.length > 0) {
        setForm((prev) => ({
          ...prev,
          templateID: String(res.data[0].templateID)
        }));
      }
    } catch (error) {
      console.error("Failed to load templates", error);
    }
  };
  
  loadData();
}, []);

// In form JSX:
<select
  value={form.templateID}
  onChange={(e) => setForm({ ...form, templateID: e.target.value })}
>
  <option value="">Select Template</option>
  {templates.map((template) => (
    <option key={template.templateID} value={template.templateID}>
      {template.templateName}
    </option>
  ))}
</select>

// ============================================
// BACKEND: API Response Example
// ============================================

// GET /api/Documents returns:
[
  {
    documentID: 1,
    templateID: 1,
    referenceNo: "DOC-2024-001",
    recipient: "John Doe",
    subject: "Contract Review",
    body: "Please review...",
    preparedBy: 5,
    approvedBy: 3,
    createdBy: 2,
    createdDate: "2024-07-19T10:30:00Z",
    generatedFile: "uploads/documents/20240719_contract.pdf",
    
    // Loaded navigation properties (only if explicitly included):
    template: {
      templateID: 1,
      templateName: "Contract Template",
      category: "Legal",
      createdBy: 2,
      createdDate: "2024-07-15T09:00:00Z"
    },
    preparedBySignatory: {
      signatoryID: 5,
      name: "Alice Smith",
      position: "Manager"
    },
    approvedBySignatory: {
      signatoryID: 3,
      name: "Bob Johnson",
      position: "Director"
    }
  }
]

// ============================================
// NOTES
// ============================================

/**
 * Key Points:
 * 
 * 1. Foreign Keys: Always pass the ID of the related entity
 *    - PreparedBy = SignatoryID
 *    - ApprovedBy = SignatoryID
 *    - TemplateID = TemplateID
 *    - CreatedBy / created_by = UserID (who created this record)
 * 
 * 2. Navigation Properties: Automatically loaded by EF when queried
 *    - document.Template (full Template object)
 *    - document.PreparedBySignatory (full Signatory object)
 *    - document.ApprovedBySignatory (full Signatory object)
 * 
 * 3. No Shadow Properties: The new models eliminate confusing shadow columns
 *    - No more ApprovedBySignatorySignatoryID
 *    - No more PreparedBySignatorySignatoryID
 *    - No more CreatedByUserId or UserID duplicates
 * 
 * 4. Database Relationships:
 *    - Documents → Templates (1:Many, cascade delete)
 *    - Documents → Signatories (Many:1 for PreparedBy, SetNull on delete)
 *    - Documents → Signatories (Many:1 for ApprovedBy, SetNull on delete)
 *    - Templates → User (Many:1, Restrict on delete)
 *    - Signatories → User (Many:1, SetNull on delete)
 * 
 * 5. Migration: Run 'dotnet ef database update' to apply the cleanup
 */
