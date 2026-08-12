using Microsoft.AspNetCore.Http;

namespace Backend.Models
{
    public class RegisterRequest
    {
        public string Name { get; set; } = "";

        public string Username { get; set; } = "";

        public string? Email { get; set; }

        public string Password { get; set; } = "";

        public string Role { get; set; } = "";

        public string Status { get; set; } = "Active";

        //public string? OfficeType { get; set; } 

        public IFormFile? Image { get; set; }
    }
}
