using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using YourApp.Services;

namespace YourApp.Controllers
{
    [ApiController]
    [Route("api/photos")]
    public class PhotosController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public PhotosController(IWebHostEnvironment env)
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

            var uploadsRoot = Path.Combine(_env.ContentRootPath, "uploads");
            var relativeUnderUploads = safeRelativePath.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase)
                ? safeRelativePath.Substring("uploads/".Length)
                : safeRelativePath;

            var absolutePath = Path.Combine(uploadsRoot, relativeUnderUploads);

            if (!System.IO.File.Exists(absolutePath))
                return NotFound($"File not found: {absolutePath}");

            byte[] normalizedPng;
            using (var input = System.IO.File.OpenRead(absolutePath))
            {
                normalizedPng = ProfilePhotoNormalizer.Normalize(input);
            }

            return File(normalizedPng, "image/png");
        }
    }
}