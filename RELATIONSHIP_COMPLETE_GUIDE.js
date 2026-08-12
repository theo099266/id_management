/**
 * COMPLETE RELATIONSHIP MAPPING GUIDE
 * 
 * This shows how CreatedBy, PreparedBy, ApprovedBy, TemplateID work together
 * with proper data flow from frontend → backend → frontend display
 */

// ============================================
// 1. DOCUMENT TABLE RELATIONSHIPS
// ============================================

/*
Document {
  documentID: int (PK)
  templateID: int (FK → Template)
  referenceNo: string
  recipient: string
  subject: string
  body: string
  preparedBy: int? (FK → Signatory.SignatoryID)
  approvedBy: int? (FK → Signatory.SignatoryID)
  createdBy: int? (FK → User.UserID) ← Who created this document
  createdDate: datetime
  generatedFile: string?
  
  // Navigation properties (loaded by EF)
  template: Template {
    templateID
    templateName
    createdBy: int (FK → User.UserID) ← Who created the template
    createdByUser: {
      id, name, email
    }
  }
  preparedBySignatory: Signatory {
    signatoryID
    name
    position
    createdBy: int? (FK → User.UserID)
  }
  approvedBySignatory: Signatory {
    signatoryID
    name
    position
    createdBy: int? (FK → User.UserID)
  }
}
*/

// ============================================
// 2. FRONTEND: Form to Save Document
// ============================================

// Documents.jsx → handleSave()
const handleSave = async () => {
  const formData = new FormData();
  
  // Required ForeignKey: Which template to use
  formData.append("TemplateID", form.templateID);
  // ↓ Backend loads: document.template = Templates table where TemplateID = this value
  // ↓ Also loads: document.template.createdByUser (who created the template)
  
  // Document content
  formData.append("ReferenceNo", form.referenceNo);
  formData.append("Recipient", form.recipient);
  formData.append("Subject", form.subject);
  formData.append("Body", form.body);
  
  // Optional FK: Which signatory prepared this
  if (form.preparedBy) {
    formData.append("PreparedBy", form.preparedBy);
    // ↓ Backend loads: document.preparedBySignatory = Signatories where SignatoryID = this value
  }
  
  // Optional FK: Which signatory approved this
  if (form.approvedBy) {
    formData.append("ApprovedBy", form.approvedBy);
    // ↓ Backend loads: document.approvedBySignatory = Signatories where SignatoryID = this value
  }
  
  // Track who is creating this document (user creator link)
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.id) {
    formData.append("created_by", user.id);
    // ↓ Sets: document.createdBy = user.id
    // ↓ This links the document to the User table for audit trail
  }
  
  // File attachment
  if (form.attachment) {
    formData.append("Attachment", form.attachment);
  }

  await axios.post("http://localhost:5146/api/Documents", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

// ============================================
// 3. BACKEND: API Response Includes All Data
// ============================================

// DocumentsController.GetDocuments() returns:
[
  {
    documentID: 1,
    templateID: 5,
    referenceNo: "TR-2024-001",
    recipient: "John Smith",
    subject: "Contract Approval",
    body: "Please review...",
    preparedBy: 3,          // SignatoryID
    approvedBy: 7,          // SignatoryID
    createdBy: 2,           // UserID who created this document
    createdDate: "2024-07-19T10:30:00Z",
    generatedFile: "uploads/documents/20240719_contract.pdf",
    
    // ↓ Loaded navigation properties with full data
    template: {
      templateID: 5,
      templateName: "Contract Template",
      category: "Legal",
      description: "For legal contracts",
      createdBy: 4,         // UserID who created this template
      createdDate: "2024-07-15T09:00:00Z",
      createdByUser: {      // Who created the template
        id: 4,
        name: "Alice Johnson",
        email: "alice@company.com",
        role: "Template Designer"
      }
    },
    
    preparedBySignatory: {  // Who prepared/signed
      signatoryID: 3,
      name: "Bob Wilson",
      position: "Manager",
      createdBy: 2
    },
    
    approvedBySignatory: {  // Who approved/signed
      signatoryID: 7,
      name: "Carol Davis",
      position: "Director",
      createdBy: 2
    }
  }
]

// ============================================
// 4. FRONTEND: Display All Relationships Cleanly
// ============================================

// Documents.jsx → render table
<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Reference</th>
      <th>Template</th>
      <th>Recipient</th>
      <th>Prepared By</th>
      <th>Approved By</th>
      <th>Created</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {documents.map((doc) => (
      <tr key={doc.documentID}>
        <td>{doc.documentID}</td>
        <td>{doc.referenceNo}</td>
        
        {/* Template name comes from loaded navigation property */}
        <td>{doc.template?.templateName || "—"}</td>
        
        <td>{doc.recipient}</td>
        
        {/* Signatory name comes from loaded navigation property */}
        <td>{doc.preparedBySignatory?.name || "—"}</td>
        
        {/* Signatory name comes from loaded navigation property */}
        <td>{doc.approvedBySignatory?.name || "—"}</td>
        
        <td>{new Date(doc.createdDate).toLocaleDateString()}</td>
        <td>
          <button onClick={() => editDocument(doc)}>Edit</button>
          <button onClick={() => deleteDocument(doc.documentID)}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

// ============================================
// 5. DETAILED DATA FLOW EXAMPLE
// ============================================

/*
SCENARIO: User "John" (ID=2) creates a document

STEP 1: Frontend Form Selection
  - User selects Template: "Contract" (TemplateID=5)
  - User selects Prepared By: "Bob Wilson" (SignatoryID=3)
  - User selects Approved By: "Carol Davis" (SignatoryID=7)
  - John submits form

STEP 2: Frontend Sends FormData
  TemplateID: "5"
  ReferenceNo: "TR-2024-001"
  Recipient: "John Smith"
  PreparedBy: "3"
  ApprovedBy: "7"
  created_by: "2"  (John's user ID from localStorage)

STEP 3: Backend Creates Document
  var document = new Document {
    TemplateID = 5,           // Links to Templates table
    ReferenceNo = "TR-2024-001",
    PreparedBy = 3,           // Links to Signatories table
    ApprovedBy = 7,           // Links to Signatories table
    CreatedBy = 2,            // Links to User table (John)
    CreatedDate = DateTime.UtcNow
  };
  
  _context.Documents.Add(document);
  await _context.SaveChangesAsync();

STEP 4: Backend Returns Full Response
  GET /api/Documents returns documents with:
  - .template (full Template object, including createdByUser)
  - .preparedBySignatory (full Signatory object)
  - .approvedBySignatory (full Signatory object)
  
  Frontend receives:
  {
    documentID: 1,
    templateID: 5,
    referenceNo: "TR-2024-001",
    preparedBy: 3,
    approvedBy: 7,
    createdBy: 2,
    
    template: {
      templateID: 5,
      templateName: "Contract Template",
      createdByUser: { id: 4, name: "Alice Johnson" }
    },
    preparedBySignatory: {
      signatoryID: 3,
      name: "Bob Wilson",
      position: "Manager"
    },
    approvedBySignatory: {
      signatoryID: 7,
      name: "Carol Davis",
      position: "Director"
    }
  }

STEP 5: Frontend Displays
  - Template: "Contract Template" (from doc.template.templateName)
  - Prepared By: "Bob Wilson" (from doc.preparedBySignatory.name)
  - Approved By: "Carol Davis" (from doc.approvedBySignatory.name)
  - Created By: John (from createdBy = 2, but stored in localStorage)
*/

// ============================================
// 6. GETTING CREATOR'S NAME (Optional)
// ============================================

// Option A: Store user info in localStorage (current approach)
const user = JSON.parse(localStorage.getItem("user"));
// Display creator name: user.name

// Option B: Load users separately and match by ID
const [users, setUsers] = useState([]);

useEffect(() => {
  axios.get("http://localhost:5146/api/users")
    .then(res => setUsers(res.data));
}, []);

const getCreatorName = (createdBy) => {
  const creator = users.find(u => u.id === createdBy);
  return creator?.name || "Unknown";
};

// Usage in table:
<td>{getCreatorName(doc.createdBy)}</td>

// ============================================
// 7. ENFORCING RELATIONSHIPS IN CODE
// ============================================

// Backend: ResolveTemplateIdAsync ensures valid template
private async Task<int> ResolveTemplateIdAsync(int requestedTemplateId)
{
  if (requestedTemplateId > 0)
  {
    var exists = await _context.Templates
      .AnyAsync(t => t.TemplateID == requestedTemplateId);
    if (exists)
      return requestedTemplateId;
  }
  
  // Fallback to first template if invalid
  var fallback = await _context.Templates
    .OrderBy(t => t.TemplateID)
    .FirstOrDefaultAsync();
  
  if (fallback == null)
    throw new InvalidOperationException(
      "No templates found. Create a template first.");
  
  return fallback.TemplateID;
}

// Frontend: Validate before sending
const handleSave = () => {
  if (!form.templateID) {
    alert("Please select a template");
    return;
  }
  
  // Rest of save logic...
};

// ============================================
// 8. SUMMARY OF FOREIGN KEYS
// ============================================

/*
Document ForeignKeys:
  TemplateID     → Templates.TemplateID (required, cascade delete)
  PreparedBy     → Signatories.SignatoryID (optional, set null on delete)
  ApprovedBy     → Signatories.SignatoryID (optional, set null on delete)
  CreatedBy      → User.UserID (optional, for audit trail)

Template ForeignKey:
  CreatedBy      → User.UserID (who created the template)

Signatory ForeignKey:
  CreatedBy      → User.UserID (who created the signatory)

VISUAL MAPPING:
  User
   ├─ Created Templates (1:Many)
   ├─ Created Signatories (1:Many)
   └─ Created Documents (1:Many via CreatedBy)
   
  Template
   ├─ Has Creator (User)
   └─ Has Many Documents (1:Many)
   
  Signatory
   ├─ Has Creator (User)
   ├─ Used for PreparedBy (Many:1 via Document.PreparedBy)
   └─ Used for ApprovedBy (Many:1 via Document.ApprovedBy)
   
  Document
   ├─ Uses Template (Many:1)
   ├─ Uses PreparedBySignatory (Many:1)
   ├─ Uses ApprovedBySignatory (Many:1)
   └─ Tracks Creator User (Many:1 via CreatedBy)
*/

// ============================================
// 9. QUICK CHECKLIST
// ============================================

/*
✓ Backend Models have [ForeignKey] attributes
✓ DocumentsController includes all navigation properties
✓ Frontend appends created_by with user ID
✓ Frontend appends preparedBy/approvedBy with signatory IDs
✓ Frontend appends templateID
✓ Table displays doc.template.templateName (not ID)
✓ Table displays doc.preparedBySignatory.name (not ID)
✓ Table displays doc.approvedBySignatory.name (not ID)
✓ Database has proper foreign key constraints
✓ Migration is applied: dotnet ef database update
✓ Backend restarted after migration
*/
