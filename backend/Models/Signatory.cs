using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Signatory
    {
        public int SignatoryID { get; set; }
        public string? Name { get; set; }
        public string? Position { get; set; }
        public string? SignatureImage { get; set; }

        public int? CreatedBy { get; set; }

        [ForeignKey(nameof(CreatedBy))]
        public ApplicationUser? CreatedByUser { get; set; }
    }
}
