using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace Backend.Models
{
    public class ApplicationUser : IdentityUser<int>
    {
        public string Name { get; set; } = "";

        public string Role { get; set; } = "";

        public string Status { get; set; } = "Active";

        [Column("image_path")]
        public string? ImagePath { get; set; }
       
    }
}