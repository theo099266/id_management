using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Project_Officers
    {
        public int ID { get; set; }

        public string Name { get; set; } = null!;

        public string? Office { get; set; } = null!;
        
        //xxxxx`public string? OfficeType { get; set; }

        public string Employee_Id_NO { get; set; } = null!;

        public string? Address { get; set; } = null!;

        public string Contact_Num { get; set; }  = null!;
        public DateOnly? Date_of_Birth { get; set; }
        public DateOnly? Expiration_date { get; set; }
        public DateOnly? IssueDate { get; set; }
        public string? Blood_Type { get; set; }  = null!;
        public string Emergency_Con_Name { get; set; }  = null!;
        public string Emergency_Con { get; set; }  = null!;
        public int? CreatedBy { get; set; }
        public int? Validated_by { get; set; }

        [ForeignKey(nameof(Validated_by))]
        public Administrative? ValidatedBy { get; set; }

        [Column("image_path")]
        public string? ImagePath { get; set; }
        [Column("Signature_path")]
        public string? Signaturepath { get; set; }
        [ForeignKey(nameof(CreatedBy))]
        public ApplicationUser? CreatedByUser { get; set; }

        public int? TemplateID { get; set; }

        [ForeignKey(nameof(TemplateID))]
        public Template? Template { get; set; }
    }
}