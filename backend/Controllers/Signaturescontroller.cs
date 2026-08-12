using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using YourApp.Services;

namespace YourApp.Controllers
{
    [ApiController]
    [Route("api/signatures")]
    public class SignaturesController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public SignaturesController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpGet("normalized")]
        public IActionResult GetNormalized([FromQuery] string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return BadRequest("path is required.");

            // Prevent path traversal.
            var safeRelativePath = path.TrimStart('/', '\\').Replace("..", "");

            // Uploads live at ContentRootPath/uploads (see how ProjectOfficersController
            // saves files) — there's no wwwroot in this project.
            var uploadsRoot = Path.Combine(_env.ContentRootPath, "uploads");
            var relativeUnderUploads = safeRelativePath.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase)
                ? safeRelativePath.Substring("uploads/".Length)
                : safeRelativePath;

            var absolutePath = Path.Combine(uploadsRoot, relativeUnderUploads);

            if (!System.IO.File.Exists(absolutePath))
                return NotFound($"File not found: {absolutePath}");

            var profile = relativeUnderUploads.Replace('\\', '/')
                .StartsWith("administrative/", StringComparison.OrdinalIgnoreCase)
                ? SignatureProfile.AdministrativeSignature
                : SignatureProfile.OfficerSignature;

            byte[] normalizedPng;
            using (var input = System.IO.File.OpenRead(absolutePath))
            {
                normalizedPng = SignatureNormalizer.Normalize(input, profile);
            }

            return File(normalizedPng, "image/png");
        }
    }
}