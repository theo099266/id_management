using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class User
    {
        public int UserID { get; set; }

        public string Name { get; set; } = null!;

        public string UserName { get; set; } = null!;

        public string? Email { get; set; }

        public string PasswordHash { get; set; } = null!;

        public string Role { get; set; } = null!;

        public string Status { get; set; } = "Active";

        [Column("image_path")]
public string? ImagePath { get; set; }


        public ICollection<Project_Officers>? Project_Officers { get; set; }
    }
}
