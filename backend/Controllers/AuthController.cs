using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _config;

    public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration config)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
    }

    [EnableRateLimiting("login")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _userManager.FindByNameAsync(request.Username);
        if (user == null)
            return Unauthorized(new { message = "Invalid username or password" });
         var signInResult = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
        if (!signInResult.Succeeded)
            return Unauthorized(new { message = "Invalid username or password" });

        if (user.Status != "Active")
            return Unauthorized(new { message = "Account disabled" });
        var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName ?? ""),
        new Claim(ClaimTypes.Role, user.Role ?? "")

    };

        var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)
        );
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
               issuer: _config["Jwt:Issuer"],
               audience: _config["Jwt:Audience"],
               claims: claims,
               expires: DateTime.UtcNow.AddHours(1),
               signingCredentials: creds
           );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

  

        return Ok(new
        {
            token = tokenString,
            id = user.Id,
            name = user.Name,
            username = user.UserName,
            role = user.Role,
            
            image = user.ImagePath
        });
    }
    [HttpPost("admin-reset-password")]
    public async Task<IActionResult> AdminResetPassword(AdminResetRequest request)
    {
        
        var user = await _userManager.FindByIdAsync(request.UserId.ToString());
        if (user == null)
            return NotFound(new { message = "User not found" });

        // Remove old password hash and set new one
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToArray();
            return BadRequest(new { errors });
        }

        return Ok(new { message = "Password reset successful" });
    }


    [HttpPost("register")]
    public async Task<IActionResult> Register([FromForm] RegisterRequest request)
    {

        // check username existence
        var existing = await _userManager.FindByNameAsync(request.Username);
        if (existing != null)
            return BadRequest(new { message = "Username already exists" });

        
        var user = new ApplicationUser
        {
            UserName = request.Username,
            Name = request.Name,
            Email = request.Email,
            Role = request.Role ?? "",
            Status = request.Status ?? "Active",
            
        };

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

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            // return readable error descriptions (password policy, duplicate username, etc.)
            var errors = result.Errors.Select(e => e.Description).ToArray();
            return BadRequest(new { errors });
        }

        //added office type
        return Ok(new
        {
            id = user.Id,
            name = user.Name,
            username = user.UserName,
            role = user.Role,
          
            image = user.ImagePath
        });

    }
}

