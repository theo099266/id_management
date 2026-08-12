using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Template
{
    public int TemplateID { get; set; }

    public string? Name { get; set; }
    public List<string> Office { get; set; } = new();
    public List<string> Section { get; set; } = new();

    public string? FrontID_background_image { get; set; }
    public string? FrontID_Footer_image { get; set; }
    public string? BackID_background { get; set; }

    public int? CreatedBy { get; set; }

    [ForeignKey(nameof(CreatedBy))]
    public ApplicationUser? CreatedByUser { get; set; }
}
}
