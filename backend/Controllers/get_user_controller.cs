using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
namespace Backend.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize(Roles = "Administrator")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly Microsoft.AspNetCore.Identity.UserManager<ApplicationUser> _userManager;

        public UsersController(ApplicationDbContext context, Microsoft.AspNetCore.Identity.UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users.ToListAsync();

       


            var dto = users.Select(u => new
            {
                id = u.Id,
                name = u.Name,
                userName = u.UserName,
                email = u.Email,
                role = u.Role,
                status = u.Status,
                image = u.ImagePath,
                
            });

            return Ok(dto);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());

            if (user == null)
                return NotFound(new { message = "User not found" });

            var delResult = await _userManager.DeleteAsync(user);
            if (!delResult.Succeeded)
                return BadRequest(new { errors = delResult.Errors.Select(e => e.Description) });

            return Ok(new { message = "User deleted successfully" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromForm] Backend.Models.RegisterRequest request)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound(new { message = "User not found" });

            user.Name = request.Name ?? user.Name;
            user.Email = request.Email ?? user.Email;
            user.Role = request.Role ?? user.Role;
            user.Status = request.Status ?? user.Status;
             if (!string.IsNullOrWhiteSpace(request.Username) && request.Username != user.UserName)
            {
                var usernameResult = await _userManager.SetUserNameAsync(user, request.Username);
                if (!usernameResult.Succeeded)
                    return BadRequest(new { errors = usernameResult.Errors.Select(e => e.Description) });
            }

            if (request.Image != null && request.Image.Length > 0)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "profiles");
                Directory.CreateDirectory(uploadsFolder);

                var fileName = $"{Guid.NewGuid():N}_{Path.GetFileName(request.Image.FileName)}";
                var fullPath = Path.Combine(uploadsFolder, fileName);

                await using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await request.Image.CopyToAsync(stream);
                }

                user.ImagePath = $"/uploads/profiles/{fileName}";
            }

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return BadRequest(new
                {
                    errors = updateResult.Errors
        .Select(e => e.Description)
                });

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var pwResult = await _userManager.ResetPasswordAsync(user, token, request.Password);
                if (!pwResult.Succeeded)
                    return BadRequest(new
                    {
                        errors = pwResult.Errors
        .Select(e => e.Description)
                    });
            }

            return Ok(new { message = "User updated" });
        }
    


    }
}