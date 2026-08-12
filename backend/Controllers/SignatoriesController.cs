using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenCvSharp;
namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SignatoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public SignatoriesController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Signatory>>> GetSignatories()
        {
            var signatories = await _context.Signatories
    .Include(s => s.CreatedByUser)
    .OrderBy(s => s.Name)
    .Select(s => new
    {
        s.SignatoryID,
        s.Name,
        s.Position,
        s.SignatureImage,
        s.CreatedBy,
        CreatedByName = s.CreatedByUser != null
            ? s.CreatedByUser.Name
            : null
    })
    .ToListAsync();

            return Ok(signatories);
        }

        [HttpPost]
        public async Task<ActionResult<Signatory>> Create([FromForm] SignatoryRequest request)
        {
            var signatory = new Signatory
            {
                Name = request.Name,
                Position = request.Position,
                CreatedBy = request.CreatedBy,
                SignatureImage = await SaveAndRemoveBackgroundAsync(
    request.SignatureImage,
    "signatures",
    request.BackgroundColor
)
            };

            _context.Signatories.Add(signatory);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSignatories), new { id = signatory.SignatoryID }, signatory);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] SignatoryRequest request)
        {
            var signatory = await _context.Signatories.FindAsync(id);
            if (signatory == null) return NotFound();

            signatory.Name = request.Name ?? signatory.Name;
            signatory.Position = request.Position ?? signatory.Position;
            signatory.CreatedBy = request.CreatedBy ?? signatory.CreatedBy;

            // If a new file is uploaded, delete old and save new (existing behavior)
            if (request.SignatureImage != null && request.SignatureImage.Length > 0)
            {
                // delete old file...
                signatory.SignatureImage = await SaveAndRemoveBackgroundAsync(request.SignatureImage, "signatures", request.BackgroundColor);
            }
            else if (!string.IsNullOrWhiteSpace(request.BackgroundColor) && !string.IsNullOrEmpty(signatory.SignatureImage))
            {
                // Reprocess existing stored image using the new background color
                var newPath = await ReprocessExistingImageAsync(signatory.SignatureImage, "signatures", request.BackgroundColor);
                if (newPath != null)
                {
                    // Optionally delete old file if you created a new one
                    var oldPath = Path.Combine(_env.ContentRootPath, signatory.SignatureImage.Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (System.IO.File.Exists(oldPath) && !oldPath.Equals(Path.Combine(_env.ContentRootPath, newPath.Replace("/", Path.DirectorySeparatorChar.ToString())), StringComparison.OrdinalIgnoreCase))
                    {
                        System.IO.File.Delete(oldPath);
                    }
                    signatory.SignatureImage = newPath;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var signatory = await _context.Signatories.FindAsync(id);

            if (signatory == null)
                return NotFound();

            // Delete image file
            if (!string.IsNullOrEmpty(signatory.SignatureImage))
            {
                var imagePath = Path.Combine(
                    _env.ContentRootPath,
                    signatory.SignatureImage.Replace("/", Path.DirectorySeparatorChar.ToString())
                );

                if (System.IO.File.Exists(imagePath))
                {
                    System.IO.File.Delete(imagePath);
                }
            }

            // Delete database row
            _context.Signatories.Remove(signatory);
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

            // Read bytes
            var data = await System.IO.File.ReadAllBytesAsync(existingPath);
            using var mat = Cv2.ImDecode(data, ImreadModes.Unchanged);
            if (mat.Empty())
                return null;

            // If already has alpha and bgColorHex is null, keep it
            if (mat.Channels() == 4 && string.IsNullOrWhiteSpace(bgColorHex))
            {
                return existingRelativePath;
            }

            // Reuse the same removal logic as SaveAndRemoveBackgroundAsync
            // (extract the core mask/alpha creation into a shared method)
            using var hsv = new Mat();
            Cv2.CvtColor(mat, hsv, ColorConversionCodes.BGR2HSV);

            if (string.IsNullOrWhiteSpace(bgColorHex) || bgColorHex == "undefined")
            {
                // No color requested — just return existing path
                return existingRelativePath;
            }

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

            // Save to a new file name (or overwrite existing)
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

                return Path.Combine("uploads", folderName, safeFileName)
                    .Replace('\\', '/');
            }

            // Existing background removal...
            if (mat.Empty())
                return null;
            if (string.IsNullOrWhiteSpace(bgColorHex))
            {
                Cv2.ImWrite(fullPath, mat);
                return Path.Combine("uploads", folderName, safeFileName).Replace('\\', '/');
            }

            using var hsv = new Mat();
            Cv2.CvtColor(mat, hsv, ColorConversionCodes.BGR2HSV);
            if (string.IsNullOrWhiteSpace(bgColorHex) || bgColorHex == "undefined")
            {
                Cv2.ImWrite(fullPath, mat);
                return Path.Combine("uploads", folderName, safeFileName).Replace('\\', '/');
            }


            var target = System.Drawing.ColorTranslator.FromHtml(bgColorHex);
            var targetHue = target.GetHue() / 2.0;
            var targetSat = target.GetSaturation() * 255;
            var targetVal = target.GetBrightness() * 255;

            var lower = new Scalar(
                Math.Max(0, targetHue - 18),
                Math.Max(0, targetSat - 55),
                Math.Max(0, targetVal - 70));
            var upper = new Scalar(
                Math.Min(179, targetHue + 18),
                Math.Min(255, targetSat + 55),
                Math.Min(255, targetVal + 70));

            using var mask = new Mat();
            Cv2.InRange(hsv, lower, upper, mask);

            if (target.GetSaturation() < 0.12 && target.GetBrightness() > 0.8)
            {
                using var gray = new Mat();
                Cv2.CvtColor(mat, gray, ColorConversionCodes.BGR2GRAY);

                using var brightMask = new Mat();
                Cv2.Threshold(gray, brightMask, 240, 255, ThresholdTypes.Binary);

                // Ensure same size/type before combining
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
        [HttpDelete("{id}/image")]
        public async Task<IActionResult> DeleteImage(int id)
        {
            var signatory = await _context.Signatories.FindAsync(id);

            if (signatory == null)
                return NotFound();

            if (!string.IsNullOrEmpty(signatory.SignatureImage))
            {
                var filePath = Path.Combine(
                    _env.ContentRootPath,
                    signatory.SignatureImage.Replace("/", Path.DirectorySeparatorChar.ToString())
                );

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                signatory.SignatureImage = null;

                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
        [HttpGet("byUser/{userId}")]
        public async Task<ActionResult<IEnumerable<Signatory>>> GetSignatoriesByUser(int userId)
        {
            var signatories = await _context.Signatories
                .Include(s => s.CreatedByUser)
                .Where(s => s.CreatedBy == userId)
                .OrderBy(s => s.Name)
                .Select(s => new
                {
                    s.SignatoryID,
                    s.Name,
                    s.Position,
                    s.SignatureImage,
                    s.CreatedBy,
                    CreatedByName = s.CreatedByUser != null
            ? s.CreatedByUser.Name
            : null
                })
    .ToListAsync();

            return Ok(signatories);
        }
        [HttpPost("{id}/reprocess")]
        public async Task<IActionResult> Reprocess(int id, [FromBody] SignatoryRequest req)
        {
            var signatory = await _context.Signatories.FindAsync(id);
            if (signatory == null) return NotFound();
            if (string.IsNullOrEmpty(signatory.SignatureImage)) return BadRequest("No image to reprocess.");

            var newPath = await ReprocessExistingImageAsync(signatory.SignatureImage, "signatures", req.BackgroundColor);
            if (newPath == null) return StatusCode(500, "Reprocessing failed.");

            // delete old file if different
            var oldPath = Path.Combine(_env.ContentRootPath, signatory.SignatureImage.Replace("/", Path.DirectorySeparatorChar.ToString()));
            if (System.IO.File.Exists(oldPath) && !oldPath.Equals(Path.Combine(_env.ContentRootPath, newPath.Replace("/", Path.DirectorySeparatorChar.ToString())), StringComparison.OrdinalIgnoreCase))
                System.IO.File.Delete(oldPath);

            signatory.SignatureImage = newPath;
            await _context.SaveChangesAsync();
            return NoContent();
        }


    }

    public class SignatoryRequest
    {
        public string? Name { get; set; }
        public string? Position { get; set; }
        public int? CreatedBy { get; set; }
        public IFormFile? SignatureImage { get; set; }
        public string? BackgroundColor { get; set; }
    }
}
