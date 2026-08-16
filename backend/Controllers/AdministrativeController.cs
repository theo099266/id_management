using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator")]
    public class AdministrativeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public AdministrativeController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetAdministratives()
        {
            var data = await _context.Administratives
                .Include(a => a.CreatedByUser)
                .OrderBy(a => a.Name)
                .Select(a => new
                {
                    a.AdministrativeID,
                    a.Name,
                    a.Office,
                    a.SignatureImage_AD,
                    a.CreatedBy,
                    CreatedByName = a.CreatedByUser != null ? a.CreatedByUser.Name : null
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost]
        public async Task<ActionResult<Administrative>> Create([FromForm] AdministrativeRequest request)
        {
            var admin = new Administrative
            {
                Name = request.Name!,
                Office = request.Office!,
                CreatedBy = request.CreatedBy,
                SignatureImage_AD = await SaveAndRemoveBackgroundAsync(
                    request.SignatureImage,
                    "administrative",
                    request.BackgroundColor
                )
            };

            _context.Administratives.Add(admin);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAdministratives), new { id = admin.AdministrativeID }, admin);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] AdministrativeRequest request)
        {
            var admin = await _context.Administratives.FindAsync(id);
            if (admin == null) return NotFound();

            admin.Name = request.Name ?? admin.Name;
            admin.Office = request.Office ?? admin.Office;
            admin.CreatedBy = request.CreatedBy ?? admin.CreatedBy;

            if (request.SignatureImage != null && request.SignatureImage.Length > 0)
            {
                // delete old file
                if (!string.IsNullOrEmpty(admin.SignatureImage_AD))
                {
                    var oldFilePath = Path.Combine(
                        _env.ContentRootPath,
                        admin.SignatureImage_AD.Replace("/", Path.DirectorySeparatorChar.ToString())
                    );
                    if (System.IO.File.Exists(oldFilePath))
                        System.IO.File.Delete(oldFilePath);
                }

                admin.SignatureImage_AD = await SaveAndRemoveBackgroundAsync(
                    request.SignatureImage, "administrative", request.BackgroundColor
                );
            }
            else if (!string.IsNullOrWhiteSpace(request.BackgroundColor) && !string.IsNullOrEmpty(admin.SignatureImage_AD))
            {
                // Reprocess existing stored image using the new background color
                var newPath = await ReprocessExistingImageAsync(admin.SignatureImage_AD, "administrative", request.BackgroundColor);
                if (newPath != null)
                {
                    var oldPath = Path.Combine(_env.ContentRootPath, admin.SignatureImage_AD.Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (System.IO.File.Exists(oldPath) &&
                        !oldPath.Equals(Path.Combine(_env.ContentRootPath, newPath.Replace("/", Path.DirectorySeparatorChar.ToString())), StringComparison.OrdinalIgnoreCase))
                    {
                        System.IO.File.Delete(oldPath);
                    }
                    admin.SignatureImage_AD = newPath;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var admin = await _context.Administratives.FindAsync(id);
            if (admin == null) return NotFound();

            if (!string.IsNullOrEmpty(admin.SignatureImage_AD))
            {
                var path = Path.Combine(
                    _env.ContentRootPath,
                    admin.SignatureImage_AD.Replace("/", Path.DirectorySeparatorChar.ToString())
                );

                if (System.IO.File.Exists(path))
                    System.IO.File.Delete(path);
            }

            _context.Administratives.Remove(admin);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}/image")]
        public async Task<IActionResult> DeleteImage(int id)
        {
            var admin = await _context.Administratives.FindAsync(id);
            if (admin == null) return NotFound();

            if (!string.IsNullOrEmpty(admin.SignatureImage_AD))
            {
                var path = Path.Combine(
                    _env.ContentRootPath,
                    admin.SignatureImage_AD.Replace("/", Path.DirectorySeparatorChar.ToString())
                );

                if (System.IO.File.Exists(path))
                    System.IO.File.Delete(path);

                admin.SignatureImage_AD = null;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpGet("byUser/{userId}")]
        public async Task<IActionResult> GetAdministrativesByUser(int userId)
        {
            var data = await _context.Administratives
                .Include(a => a.CreatedByUser)
                .Where(a => a.CreatedBy == userId)
                .OrderBy(a => a.Name)
                .Select(a => new
                {
                    a.AdministrativeID,
                    a.Name,
                    a.Office,
                    a.SignatureImage_AD,
                    a.CreatedBy,
                    CreatedByName = a.CreatedByUser != null ? a.CreatedByUser.Name : null
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost("{id}/reprocess")]
        public async Task<IActionResult> Reprocess(int id, [FromBody] AdministrativeRequest req)
        {
            var admin = await _context.Administratives.FindAsync(id);
            if (admin == null) return NotFound();
            if (string.IsNullOrEmpty(admin.SignatureImage_AD)) return BadRequest("No image to reprocess.");

            var newPath = await ReprocessExistingImageAsync(admin.SignatureImage_AD, "administrative", req.BackgroundColor);
            if (newPath == null) return StatusCode(500, "Reprocessing failed.");

            var oldPath = Path.Combine(_env.ContentRootPath, admin.SignatureImage_AD.Replace("/", Path.DirectorySeparatorChar.ToString()));
            if (System.IO.File.Exists(oldPath) &&
                !oldPath.Equals(Path.Combine(_env.ContentRootPath, newPath.Replace("/", Path.DirectorySeparatorChar.ToString())), StringComparison.OrdinalIgnoreCase))
                System.IO.File.Delete(oldPath);

            admin.SignatureImage_AD = newPath;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<string?> ReprocessExistingImageAsync(string existingRelativePath, string folderName, string? bgColorHex)
        {
            if (string.IsNullOrEmpty(existingRelativePath))
                return null;

            var existingPath = Path.Combine(_env.ContentRootPath, existingRelativePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
            if (!System.IO.File.Exists(existingPath))
                return null;

            bool hasColorRequest = !string.IsNullOrWhiteSpace(bgColorHex) &&
                !bgColorHex.Equals("undefined", StringComparison.OrdinalIgnoreCase);

            if (!hasColorRequest)
                return existingRelativePath;

            using var image = await Image.LoadAsync<Rgba32>(existingPath);

            RemoveBackgroundColor(image, bgColorHex!);

            var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads", folderName);
            Directory.CreateDirectory(uploadsFolder);
            var baseName = Path.GetFileNameWithoutExtension(existingPath);
            var safeFileName = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{baseName}.png";
            var fullPath = Path.Combine(uploadsFolder, safeFileName);

            await image.SaveAsPngAsync(fullPath);

            return Path.Combine("uploads", folderName, safeFileName).Replace('\\', '/');
        }

        private async Task<string?> SaveAndRemoveBackgroundAsync(IFormFile? file, string folderName, string? bgColorHex = null)
        {
            if (file == null || file.Length == 0)
                return null;

            var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads", folderName);
            Directory.CreateDirectory(uploadsFolder);

            var safeFileName = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{Path.GetFileNameWithoutExtension(file.FileName)}.png";
            var fullPath = Path.Combine(uploadsFolder, safeFileName);

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            using var image = await Image.LoadAsync<Rgba32>(ms);

            bool hasColorRequest = !string.IsNullOrWhiteSpace(bgColorHex) &&
                !bgColorHex.Equals("undefined", StringComparison.OrdinalIgnoreCase);

            if (hasColorRequest)
                RemoveBackgroundColor(image, bgColorHex!);

            await image.SaveAsPngAsync(fullPath);

            return Path.Combine("uploads", folderName, safeFileName).Replace('\\', '/');
        }

        private static void RemoveBackgroundColor(Image<Rgba32> image, string bgColorHex)
        {
            var target = System.Drawing.ColorTranslator.FromHtml(bgColorHex);
            var (targetH, targetS, targetV) = RgbToHsv(target.R, target.G, target.B);

            bool nearWhite = targetS < 0.12 && targetV > 0.8;
            bool nearBlack = targetV < 0.15;

            const double hueTol = 36;              // OpenCV used ±18 on a 0-179 scale -> ±36 on 0-360
            const double satTol = 55.0 / 255.0;
            const double valTol = 70.0 / 255.0;

            image.ProcessPixelRows(accessor =>
            {
                for (int y = 0; y < accessor.Height; y++)
                {
                    var row = accessor.GetRowSpan(y);
                    for (int x = 0; x < row.Length; x++)
                    {
                        ref var px = ref row[x];
                        var (h, s, v) = RgbToHsv(px.R, px.G, px.B);

                        double hueDiff = Math.Min(Math.Abs(h - targetH), 360 - Math.Abs(h - targetH));
                        bool matches = hueDiff <= hueTol
                            && Math.Abs(s - targetS) <= satTol
                            && Math.Abs(v - targetV) <= valTol;

                        if (!matches && nearWhite) matches = v > 240.0 / 255.0;
                        if (!matches && nearBlack) matches = v < 40.0 / 255.0;

                        if (matches) px.A = 0;
                    }
                }
            });
        }

        private static (double H, double S, double V) RgbToHsv(byte r, byte g, byte b)
        {
            double rd = r / 255.0, gd = g / 255.0, bd = b / 255.0;
            double max = Math.Max(rd, Math.Max(gd, bd));
            double min = Math.Min(rd, Math.Min(gd, bd));
            double delta = max - min;

            double h = 0;
            if (delta > 0.00001)
            {
                if (max == rd) h = 60 * (((gd - bd) / delta) % 6);
                else if (max == gd) h = 60 * (((bd - rd) / delta) + 2);
                else h = 60 * (((rd - gd) / delta) + 4);
            }
            if (h < 0) h += 360;

            return (h, max <= 0 ? 0 : delta / max, max);
        }
    }

    public class AdministrativeRequest
    {
        public string? Name { get; set; }
        public string? Office { get; set; }
        public int? CreatedBy { get; set; }
        public IFormFile? SignatureImage { get; set; }
        public string? BackgroundColor { get; set; }
    }
}