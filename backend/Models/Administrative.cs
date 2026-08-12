using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
   public class Administrative
{
    public int AdministrativeID { get; set; }

    public string? Name { get; set; } = null!;

    public string? Office { get; set; } = null!;

    public int? CreatedBy { get; set; }

    public string? SignatureImage_AD { get; set; }

    [ForeignKey(nameof(CreatedBy))]
    public ApplicationUser? CreatedByUser { get; set; }
}
}
