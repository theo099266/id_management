using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace YourApp.Controllers
{
    [ApiController]
    [Route("api/files")]
    public class FilesController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public FilesController(IWebHostEnvironment env)
        {
            _env = env;
        }

        // Templates are shared, non-sensitive design assets — safe to expose
        // without login so the ID card preview can render for anyone signed in
        // to any part of the app, or even pre-auth if you ever need that.
        [HttpGet("templates/{**path}")]
        [AllowAnonymous]
        public IActionResult GetTemplate(string path) => ServeFile("templates", path);

        // Employee photos / general uploads stay behind the app's default
        // "must be logged in" policy (no [Authorize] override needed — the
        // global FallbackPolicy already covers it), so any authenticated
        // user can view them but anonymous requests get 401.
        [HttpGet("uploads/{**path}")]
        public IActionResult GetUpload(string path) => ServeFile("", path);

        private IActionResult ServeFile(string subfolder, string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return BadRequest("path is required.");

            // Prevent path traversal.
            var safeRelativePath = path.TrimStart('/', '\\').Replace("..", "");

            var uploadsRoot = string.IsNullOrEmpty(subfolder)
                ? Path.Combine(_env.ContentRootPath, "uploads")
                : Path.Combine(_env.ContentRootPath, "uploads", subfolder);

            var absolutePath = Path.Combine(uploadsRoot, safeRelativePath);

            if (!System.IO.File.Exists(absolutePath))
                return NotFound($"File not found: {absolutePath}");

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(absolutePath, out var contentType))
                contentType = "application/octet-stream";

            return PhysicalFile(absolutePath, contentType);
        }
    }
}