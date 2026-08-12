using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenCvSharp;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

            var data = await System.IO.File.ReadAllBytesAsync(existingPath);
            using var mat = Cv2.ImDecode(data, ImreadModes.Unchanged);
            if (mat.Empty())
                return null;

            if (mat.Channels() == 4 && string.IsNullOrWhiteSpace(bgColorHex))
                return existingRelativePath;

            if (string.IsNullOrWhiteSpace(bgColorHex) || bgColorHex == "undefined")
                return existingRelativePath;

            using var hsv = new Mat();
            Cv2.CvtColor(mat, hsv, ColorConversionCodes.BGR2HSV);

            var target = System.Drawing.ColorTranslator.FromHtml(bgColorHex);
            var targetHue = target.GetHue() / 2.0;
            var targetSat = target.GetSaturation() * 255;
            var targetVal = target.GetBrightness() * 255;

            var lower = new Scalar(Math.Max(0, targetHue - 18), Math.Max(0, targetSat - 55), Math.Max(0, targetVal - 70));
            var upper = new Scalar(Math.Min(179, targetHue + 18), Math.Min(255, targetSat + 55), Math.Min(255, targetVal + 70));

            using var mask = new Mat();
            Cv2.InRange(hsv, lower, upper, mask);

            if (target.GetSaturation() < 0.12 && target.GetBrightness() > 0.8)
            {
                using var gray = new Mat();
                Cv2.CvtColor(mat, gray, ColorConversionCodes.BGR2GRAY);
                using var brightMask = new Mat();
                Cv2.Threshold(gray, brightMask, 240, 255, ThresholdTypes.Binary);

                if (brightMask.Size() != mask.Size() || brightMask.Type() != mask.Type())
                {
                    Cv2.Resize(brightMask, brightMask, mask.Size());
                    brightMask.ConvertTo(brightMask, mask.Type());
                }

                Cv2.BitwiseOr(mask, brightMask, mask);
            }
            if (target.GetBrightness() < 0.15)
{
    using var gray = new Mat();
    Cv2.CvtColor(mat, gray, ColorConversionCodes.BGR2GRAY);

    using var darkMask = new Mat();

    // Adjust threshold if needed
    Cv2.Threshold(gray, darkMask, 40, 255, ThresholdTypes.BinaryInv);

    Cv2.BitwiseOr(mask, darkMask, mask);
}

            using var kernel = Cv2.GetStructuringElement(MorphShapes.Rect, new Size(3, 3));
            Cv2.MorphologyEx(mask, mask, MorphTypes.Open, kernel);
            Cv2.MorphologyEx(mask, mask, MorphTypes.Close, kernel);

            using var result = new Mat();
            Cv2.CvtColor(mat, result, ColorConversionCodes.BGR2BGRA);

            int rows = result.Rows;
            int cols = result.Cols;
            for (int y = 0; y < rows; y++)
            {
                for (int x = 0; x < cols; x++)
                {
                    if (mask.At<byte>(y, x) == 255)
                    {
                        var pixel = result.At<Vec4b>(y, x);
                        pixel[3] = 0;
                        result.Set(y, x, pixel);
                    }
                }
            }

            var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads", folderName);
            Directory.CreateDirectory(uploadsFolder);
            var baseName = Path.GetFileNameWithoutExtension(existingPath);
            var safeFileName = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{baseName}.png";
            var fullPath = Path.Combine(uploadsFolder, safeFileName);
            Cv2.ImWrite(fullPath, result);

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
            var data = ms.ToArray();
            using var mat = Cv2.ImDecode(data, ImreadModes.Unchanged);

            if (mat.Empty())
                return null;

            if (mat.Channels() == 4)
            {
                Cv2.ImWrite(fullPath, mat);
                return Path.Combine("uploads", folderName, safeFileName).Replace('\\', '/');
            }

            if (string.IsNullOrWhiteSpace(bgColorHex) || bgColorHex == "undefined")
            {
                Cv2.ImWrite(fullPath, mat);
                return Path.Combine("uploads", folderName, safeFileName).Replace('\\', '/');
            }

            using var hsv = new Mat();
            Cv2.CvtColor(mat, hsv, ColorConversionCodes.BGR2HSV);

            var target = System.Drawing.ColorTranslator.FromHtml(bgColorHex);
            var targetHue = target.GetHue() / 2.0;
            var targetSat = target.GetSaturation() * 255;
            var targetVal = target.GetBrightness() * 255;

            var lower = new Scalar(Math.Max(0, targetHue - 18), Math.Max(0, targetSat - 55), Math.Max(0, targetVal - 70));
            var upper = new Scalar(Math.Min(179, targetHue + 18), Math.Min(255, targetSat + 55), Math.Min(255, targetVal + 70));

            using var mask = new Mat();
            Cv2.InRange(hsv, lower, upper, mask);

            if (target.GetSaturation() < 0.12 && target.GetBrightness() > 0.8)
            {
                using var gray = new Mat();
                Cv2.CvtColor(mat, gray, ColorConversionCodes.BGR2GRAY);
                using var brightMask = new Mat();
                Cv2.Threshold(gray, brightMask, 240, 255, ThresholdTypes.Binary);

                if (brightMask.Size() != mask.Size() || brightMask.Type() != mask.Type())
                {
                    Cv2.Resize(brightMask, brightMask, mask.Size());
                    brightMask.ConvertTo(brightMask, mask.Type());
                }

                Cv2.BitwiseOr(mask, brightMask, mask);
            }

            using var kernel = Cv2.GetStructuringElement(MorphShapes.Rect, new Size(3, 3));
            Cv2.MorphologyEx(mask, mask, MorphTypes.Open, kernel);
            Cv2.MorphologyEx(mask, mask, MorphTypes.Close, kernel);

            using var result = new Mat();
            Cv2.CvtColor(mat, result, ColorConversionCodes.BGR2BGRA);

            int rows = result.Rows;
            int cols = result.Cols;
            for (int y = 0; y < rows; y++)
            {
                for (int x = 0; x < cols; x++)
                {
                    if (mask.At<byte>(y, x) == 255)
                    {
                        var pixel = result.At<Vec4b>(y, x);
                        pixel[3] = 0;
                        result.Set(y, x, pixel);
                    }
                }
            }

            Cv2.ImWrite(fullPath, result);
            return Path.Combine("uploads", folderName, safeFileName).Replace('\\', '/');
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