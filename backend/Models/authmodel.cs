namespace Backend.Models
{
    public class AdminResetRequest
    {
        public int UserId { get; set; }
        public string NewPassword { get; set; } = string.Empty;
    }
}
