using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ClosedXML.Excel;
using System.IO.Compression;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator")]
    public class ProjectOfficersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ProjectOfficersController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetProjectOfficers()
        {
            var data = await _context.Project_Officers
    .Include(p => p.CreatedByUser)
    .Include(p => p.ValidatedBy)
    .Include(p => p.Template)
    .OrderBy(p => p.Template != null ? p.Template.Name : "")
    .ThenBy(p => p.Name)
    .Select(p => new
    {
        p.ID,
        p.Name,
        p.Office,
        p.Employee_Id_NO,
        p.Address,
        p.Contact_Num,
        p.Date_of_Birth,
        p.IssueDate,
        p.Expiration_date,
        p.Blood_Type,
        p.Emergency_Con_Name,
        p.Emergency_Con,
        p.ImagePath,
        p.Signaturepath,
        p.CreatedBy,
        p.Validated_by,
        p.TemplateID,
        CreatedByName = p.CreatedByUser != null ? p.CreatedByUser.Name : null,
        ValidatedByName = p.ValidatedBy != null ? p.ValidatedBy.Name : null,
        ValidatedByOffice = p.ValidatedBy != null ? p.ValidatedBy.Office : null,
        ValidatedBySignature = p.ValidatedBy != null ? p.ValidatedBy.SignatureImage_AD : null,
        TemplateName = p.Template != null ? p.Template.Name : null,   // this is your "OfficeType" now
        TemplateFrontBackground = p.Template != null ? p.Template.FrontID_background_image : null,
        TemplateFrontFooter = p.Template != null ? p.Template.FrontID_Footer_image : null,
        TemplateBackBackground = p.Template != null ? p.Template.BackID_background : null
    })
    .ToListAsync();

            return Ok(data);
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Project_Officers>> Create(
            [FromForm] ProjectOfficerRequest request)
        {
            // Get the currently logged-in user
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdString))
            {
                return Unauthorized("User is not logged in.");
            }

            if (!int.TryParse(userIdString, out int userId))
            {
                return Unauthorized("Invalid user ID.");
            }

            // Get the employee account
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return Unauthorized("User account not found.");
            }

            // Get Regional / IMO from the employee account
            var isAdmin = User.IsInRole("Administrator");

            Template? template = null;

            if (isAdmin)
            {
                // Administrator chooses the template
                if (!request.TemplateID.HasValue)
                {
                    return BadRequest("Please select an ID template.");
                }

                template = await _context.Templates
                    .FirstOrDefaultAsync(t =>
                        t.TemplateID == request.TemplateID.Value);
            }

            // Employee automatically uses their assigned Office Type
            /*var officeType = user.OfficeType?.Trim();

            if (string.IsNullOrWhiteSpace(officeType))
            {
                return BadRequest(
                    "Your account does not have an Office Type assigned."
                );
            }

            template = await _context.Templates
                .FirstOrDefaultAsync(t =>
                    t.Name != null &&
                    t.Name.Trim().ToLower() == officeType.ToLower());
        }

        if (template == null)
        {
            return BadRequest("Template could not be found.");
        }*/


            var officer = new Project_Officers
            {
                Name = request.Name!,
                Office = request.Office ?? "",

                Employee_Id_NO = request.Employee_Id_NO!,
                Address = request.Address!,
                Contact_Num = request.Contact_Num ?? "",

                Date_of_Birth = request.Date_of_Birth,
                IssueDate = request.IssueDate,
                Expiration_date = request.Expiration_date,

                Blood_Type = request.Blood_Type ?? "",
                Emergency_Con_Name = request.Emergency_Con_Name ?? "",
                Emergency_Con = request.Emergency_Con ?? "",

                CreatedBy = userId,
                Validated_by = request.Validated_by,

                TemplateID = template.TemplateID,

                ImagePath = await SavePlainImageAsync(
    request.Image,
    "profiles",
    request.Name!
),

                Signaturepath = await SaveAndRemoveBackgroundAsync(
    request.Signature,
    "signatures",
    request.BackgroundColor,
    request.Name!
)
            };

            _context.Project_Officers.Add(officer);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetProjectOfficers),
                new { id = officer.ID },
                officer);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] ProjectOfficerRequest request)
        {
            var officer = await _context.Project_Officers.FindAsync(id);
            if (officer == null) return NotFound();

            officer.Name = request.Name ?? officer.Name;
            officer.Office = request.Office ?? "";
            officer.Employee_Id_NO = request.Employee_Id_NO ?? officer.Employee_Id_NO;
            officer.Address = request.Address ?? officer.Address;
            officer.Contact_Num = request.Contact_Num ?? officer.Contact_Num;
            officer.Date_of_Birth = request.Date_of_Birth ?? officer.Date_of_Birth;
            officer.IssueDate = request.IssueDate ?? officer.IssueDate;
            officer.Expiration_date = request.Expiration_date ?? officer.Expiration_date;
            officer.Blood_Type = request.Blood_Type ?? officer.Blood_Type;
            officer.Emergency_Con_Name = request.Emergency_Con_Name ?? officer.Emergency_Con_Name;
            officer.Emergency_Con = request.Emergency_Con ?? officer.Emergency_Con;
            officer.CreatedBy = request.CreatedBy ?? officer.CreatedBy;
            officer.Validated_by = request.Validated_by ?? officer.Validated_by;
            officer.TemplateID = request.TemplateID ?? officer.TemplateID;

            if (request.RemoveImage)
            {
                if (!string.IsNullOrWhiteSpace(officer.ImagePath))
                {
                    var oldImagePath = Path.Combine(
                        _env.ContentRootPath,
                        officer.ImagePath.Replace(
                            "/",
                            Path.DirectorySeparatorChar.ToString()
                        )
                    );

                    if (System.IO.File.Exists(oldImagePath))
                    {
                        System.IO.File.Delete(oldImagePath);
                    }
                }

                // Clear database column
                officer.ImagePath = null;
            }

            // CASE 2: User selected a NEW image
            else if (request.Image != null && request.Image.Length > 0)
            {
                var oldImagePath = officer.ImagePath;

                // Save the NEW image first
                var newImagePath = await SavePlainImageAsync(
                    request.Image,
                    "profiles",
                    officer.Name
                );

                if (string.IsNullOrWhiteSpace(newImagePath))
                {
                    return StatusCode(500, "Image could not be saved.");
                }

                // Update database to new image
                officer.ImagePath = newImagePath;

                // Delete OLD image AFTER the new one was successfully saved
                if (!string.IsNullOrWhiteSpace(oldImagePath))
                {
                    var oldFullPath = Path.Combine(
                        _env.ContentRootPath,
                        oldImagePath.Replace(
                            "/",
                            Path.DirectorySeparatorChar.ToString()
                        )
                    );

                    if (System.IO.File.Exists(oldFullPath))
                    {
                        System.IO.File.Delete(oldFullPath);
                    }
                }
            }


            if (request.RemoveSignatureImage)
            {
                if (!string.IsNullOrEmpty(officer.Signaturepath))
                {
                    var oldSigPath = Path.Combine(
                        _env.ContentRootPath,
                        officer.Signaturepath.Replace("/", Path.DirectorySeparatorChar.ToString())
                    );

                    if (System.IO.File.Exists(oldSigPath))
                    {
                        System.IO.File.Delete(oldSigPath);
                    }
                }

                officer.Signaturepath = null;
            }
            else if (request.Signature != null && request.Signature.Length > 0)
            {
                try
                {

                    if (!string.IsNullOrEmpty(officer.Signaturepath))
                    {
                        var oldSigPath = Path.Combine(
                            _env.ContentRootPath,
                            officer.Signaturepath.Replace(
                                "/",
                                Path.DirectorySeparatorChar.ToString()
                            )
                        );

                        if (System.IO.File.Exists(oldSigPath))
                        {
                            System.IO.File.Delete(oldSigPath);
                        }
                    }

                    var newSignaturePath =
    await SaveAndRemoveBackgroundAsync(
        request.Signature,
        "signatures",
        request.BackgroundColor,
        officer.Name
    );

                    if (string.IsNullOrEmpty(newSignaturePath))
                    {
                        return StatusCode(500, "Signature image could not be processed.");
                    }

                    officer.Signaturepath = newSignaturePath;

                }
                catch (Exception ex)
                {
                    return StatusCode(500, new
                    {
                        message = "Signature upload failed.",
                        error = ex.Message
                    });
                }
            }
            else if (!string.IsNullOrWhiteSpace(request.BackgroundColor) && !string.IsNullOrEmpty(officer.Signaturepath))
            {
                var newPath = await ReprocessExistingImageAsync(officer.Signaturepath, "signatures", request.BackgroundColor);
                if (newPath != null)
                {
                    var oldPath = Path.Combine(_env.ContentRootPath, officer.Signaturepath.Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (System.IO.File.Exists(oldPath) &&
                        !oldPath.Equals(Path.Combine(_env.ContentRootPath, newPath.Replace("/", Path.DirectorySeparatorChar.ToString())), StringComparison.OrdinalIgnoreCase))
                    {
                        System.IO.File.Delete(oldPath);
                    }
                    officer.Signaturepath = newPath;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var officer = await _context.Project_Officers.FindAsync(id);
            if (officer == null) return NotFound();

            if (!string.IsNullOrEmpty(officer.ImagePath))
            {
                var imgPath = Path.Combine(_env.ContentRootPath, officer.ImagePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
                if (System.IO.File.Exists(imgPath))
                    System.IO.File.Delete(imgPath);
            }

            if (!string.IsNullOrEmpty(officer.Signaturepath))
            {
                var sigPath = Path.Combine(_env.ContentRootPath, officer.Signaturepath.Replace("/", Path.DirectorySeparatorChar.ToString()));
                if (System.IO.File.Exists(sigPath))
                    System.IO.File.Delete(sigPath);
            }

            _context.Project_Officers.Remove(officer);
            await _context.SaveChangesAsync();

            return NoContent();
        }



        [HttpDelete("{id}/image")]
        public async Task<IActionResult> DeleteImage(int id)
        {
            Console.WriteLine($"[DeleteImage] Called with id={id}");

            var officer = await _context.Project_Officers.FindAsync(id);
            if (officer == null)
            {
                Console.WriteLine($"[DeleteImage] Officer with id={id} not found.");
                return NotFound();
            }

            Console.WriteLine($"[DeleteImage] Current ImagePath='{officer.ImagePath}'");

            if (!string.IsNullOrEmpty(officer.ImagePath))
            {
                var path = Path.Combine(
                    _env.ContentRootPath,
                    officer.ImagePath.Replace("/", Path.DirectorySeparatorChar.ToString())
                );

                Console.WriteLine($"[DeleteImage] Resolved file path='{path}'");

                if (System.IO.File.Exists(path))
                {
                    try
                    {
                        System.IO.File.Delete(path);
                        Console.WriteLine("[DeleteImage] File deleted from disk.");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[DeleteImage] Failed to delete file: {ex.Message}");
                        return StatusCode(500, new { message = "Failed to delete image file.", error = ex.Message });
                    }
                }
                else
                {
                    Console.WriteLine("[DeleteImage] File does not exist on disk, skipping delete.");
                }

                officer.ImagePath = null;
                await _context.SaveChangesAsync();
                Console.WriteLine("[DeleteImage] ImagePath cleared and saved.");
            }
            else
            {
                Console.WriteLine("[DeleteImage] ImagePath was already null/empty, nothing to do.");
            }

            return NoContent();
        }


        [HttpGet("byUser/{userId}")]
        public async Task<IActionResult> GetProjectOfficersByUser(int userId)
        {
            var data = await _context.Project_Officers
                .Include(p => p.CreatedByUser)
                .Include(p => p.ValidatedBy)
                .Include(p => p.Template)
                .Where(p => p.CreatedBy == userId)
                .OrderBy(p => p.Name)
                .Select(p => new
                {
                    p.ID,
                    p.Name,
                    p.Office,
                    p.ImagePath,
                    p.Signaturepath,
                    p.CreatedBy,
                    p.TemplateID,
                    CreatedByName = p.CreatedByUser != null ? p.CreatedByUser.Name : null
                })
                .ToListAsync();

            return Ok(data);
        }
        private static string SanitizeFileName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return "Unknown";

            var invalidChars = Path.GetInvalidFileNameChars();

            var cleaned = new string(
                name.Trim()
                    .Select(c => invalidChars.Contains(c) ? '_' : c)
                    .ToArray()
            );

            cleaned = System.Text.RegularExpressions.Regex.Replace(
                cleaned,
                @"\s+",
                "_"
            );

            return cleaned;
        }
        [HttpPost("rename-all-images")]
        public async Task<IActionResult> RenameAllImages()
        {
            var officers = await _context.Project_Officers
                .ToListAsync();

            int profileCount = 0;
            int signatureCount = 0;

            var date = DateTime.Now.ToString("yyyyMMdd");

            foreach (var officer in officers)
            {
                if (string.IsNullOrWhiteSpace(officer.Name))
                    continue;

                var safeName = SanitizeFileName(officer.Name);

                // =========================
                // PROFILE IMAGE
                // =========================
                if (!string.IsNullOrWhiteSpace(officer.ImagePath))
                {
                    var oldImagePath = Path.Combine(
                        _env.ContentRootPath,
                        officer.ImagePath.Replace(
                            "/",
                            Path.DirectorySeparatorChar.ToString()
                        )
                    );

                    if (System.IO.File.Exists(oldImagePath))
                    {
                        var extension = Path.GetExtension(oldImagePath);

                        if (string.IsNullOrWhiteSpace(extension))
                            extension = ".png";

                        var newFileName =
                            $"{date}_{safeName}_profile{extension}";

                        var newFullPath = Path.Combine(
                            _env.ContentRootPath,
                            "uploads",
                            "profiles",
                            newFileName
                        );

                        // Don't overwrite another existing file
                        if (System.IO.File.Exists(newFullPath) &&
                            !oldImagePath.Equals(
                                newFullPath,
                                StringComparison.OrdinalIgnoreCase))
                        {
                            newFileName =
                                $"{date}_{safeName}_profile_{Guid.NewGuid():N}{extension}";

                            newFullPath = Path.Combine(
                                _env.ContentRootPath,
                                "uploads",
                                "profiles",
                                newFileName
                            );
                        }

                        if (!oldImagePath.Equals(
                            newFullPath,
                            StringComparison.OrdinalIgnoreCase))
                        {
                            System.IO.File.Move(
                                oldImagePath,
                                newFullPath
                            );
                        }

                        officer.ImagePath = Path.Combine(
                            "uploads",
                            "profiles",
                            newFileName
                        ).Replace('\\', '/');

                        profileCount++;
                    }
                }

                // =========================
                // SIGNATURE
                // =========================
                if (!string.IsNullOrWhiteSpace(officer.Signaturepath))
                {
                    var oldSignaturePath = Path.Combine(
                        _env.ContentRootPath,
                        officer.Signaturepath.Replace(
                            "/",
                            Path.DirectorySeparatorChar.ToString()
                        )
                    );

                    if (System.IO.File.Exists(oldSignaturePath))
                    {
                        var newFileName =
                            $"{date}_{safeName}_signature.png";

                        var newFullPath = Path.Combine(
                            _env.ContentRootPath,
                            "uploads",
                            "signatures",
                            newFileName
                        );

                        // Don't overwrite another existing file
                        if (System.IO.File.Exists(newFullPath) &&
                            !oldSignaturePath.Equals(
                                newFullPath,
                                StringComparison.OrdinalIgnoreCase))
                        {
                            newFileName =
                                $"{date}_{safeName}_signature_{Guid.NewGuid():N}.png";

                            newFullPath = Path.Combine(
                                _env.ContentRootPath,
                                "uploads",
                                "signatures",
                                newFileName
                            );
                        }

                        if (!oldSignaturePath.Equals(
                            newFullPath,
                            StringComparison.OrdinalIgnoreCase))
                        {
                            System.IO.File.Move(
                                oldSignaturePath,
                                newFullPath
                            );
                        }

                        officer.Signaturepath = Path.Combine(
                            "uploads",
                            "signatures",
                            newFileName
                        ).Replace('\\', '/');

                        signatureCount++;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "All officer images have been renamed successfully.",
                profilesRenamed = profileCount,
                signaturesRenamed = signatureCount,
                totalOfficers = officers.Count
            });
        }

        [HttpPost("{id}/reprocess")]
        public async Task<IActionResult> Reprocess(int id, [FromBody] ProjectOfficerRequest req)
        {
            var officer = await _context.Project_Officers.FindAsync(id);
            if (officer == null) return NotFound();
            if (string.IsNullOrEmpty(officer.Signaturepath)) return BadRequest("No signature to reprocess.");

            var newPath = await ReprocessExistingImageAsync(officer.Signaturepath, "signatures", req.BackgroundColor);
            if (newPath == null) return StatusCode(500, "Reprocessing failed.");

            var oldPath = Path.Combine(_env.ContentRootPath, officer.Signaturepath.Replace("/", Path.DirectorySeparatorChar.ToString()));
            if (System.IO.File.Exists(oldPath) &&
                !oldPath.Equals(Path.Combine(_env.ContentRootPath, newPath.Replace("/", Path.DirectorySeparatorChar.ToString())), StringComparison.OrdinalIgnoreCase))
                System.IO.File.Delete(oldPath);

            officer.Signaturepath = newPath;
            await _context.SaveChangesAsync();
            return NoContent();
        }


        private async Task<string?> SavePlainImageAsync(
    IFormFile? file,
    string folderName,
    string officerName)
        {
            if (file == null || file.Length == 0)
                return null;

            var uploadsFolder = Path.Combine(
                _env.ContentRootPath,
                "uploads",
                folderName
            );

            Directory.CreateDirectory(uploadsFolder);

            var safeName = SanitizeFileName(officerName);

            var extension = Path.GetExtension(file.FileName);

            if (string.IsNullOrWhiteSpace(extension))
                extension = ".png";

            var suffix = folderName.Equals(
                "profiles",
                StringComparison.OrdinalIgnoreCase)
                ? "profile"
                : "image";

            var fileName =
                $"{DateTime.Now:yyyyMMdd}_{safeName}_{suffix}{extension}";

            var fullPath = Path.Combine(
                uploadsFolder,
                fileName
            );

            // Avoid accidentally overwriting another officer
            if (System.IO.File.Exists(fullPath))
            {
                fileName =
                    $"{DateTime.Now:yyyyMMdd}_{safeName}_{suffix}_{Guid.NewGuid():N}{extension}";

                fullPath = Path.Combine(
                    uploadsFolder,
                    fileName
                );
            }

            await using var stream =
                new FileStream(fullPath, FileMode.Create);

            await file.CopyToAsync(stream);

            return Path.Combine(
                "uploads",
                folderName,
                fileName
            ).Replace('\\', '/');
        }
        private async Task<string?> SaveAndRemoveBackgroundAsync(
    IFormFile? file,
    string folderName,
    string? bgColorHex,
    string officerName)
        {
            if (file == null || file.Length == 0)
                return null;

            var uploadsFolder = Path.Combine(
                _env.ContentRootPath,
                "uploads",
                folderName
            );

            Directory.CreateDirectory(uploadsFolder);

            var safeName = SanitizeFileName(officerName);

            var fileName =
                $"{DateTime.Now:yyyyMMdd}_{safeName}_signature.png";

            var fullPath = Path.Combine(
                uploadsFolder,
                fileName
            );

            if (System.IO.File.Exists(fullPath))
            {
                fileName =
                    $"{DateTime.Now:yyyyMMdd}_{safeName}_signature_{Guid.NewGuid():N}.png";

                fullPath = Path.Combine(
                    uploadsFolder,
                    fileName
                );
            }

            using var ms = new MemoryStream();

            await file.CopyToAsync(ms);

            ms.Position = 0;

            // Image now unambiguously means ImageSharp.Image
            using var image =
                await Image.LoadAsync<Rgba32>(ms);

            bool hasColorRequest =
                !string.IsNullOrWhiteSpace(bgColorHex) &&
                !bgColorHex.Equals(
                    "undefined",
                    StringComparison.OrdinalIgnoreCase);

            if (hasColorRequest)
                RemoveBackgroundColor(image, bgColorHex!);

            await image.SaveAsPngAsync(fullPath);

            return Path.Combine(
                "uploads",
                folderName,
                fileName
            ).Replace('\\', '/');
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
        [HttpGet("export-zip")]
        public async Task<IActionResult> ExportProjectOfficersZip()
        {
            var officers = await _context.Project_Officers
                .Include(p => p.CreatedByUser)
                .Include(p => p.ValidatedBy)
                .Include(p => p.Template)
                .OrderBy(p => p.Name)
                .ToListAsync();

            using var zipStream = new MemoryStream();

            using (var archive = new ZipArchive(
                zipStream,
                ZipArchiveMode.Create,
                true))
            {
                // =====================================================
                // EXCEL
                // =====================================================

                using var workbook = new XLWorkbook();

                var worksheet = workbook.Worksheets.Add("Project Officers");

                string[] headers =
                {
            "ID",
            "Name",
            "Office",
            "Employee ID No.",
            "Address",
            "Contact Number",
            "Date of Birth",
            "Issue Date",
            "Expiration Date",
            "Blood Type",
            "Emergency Contact Name",
            "Emergency Contact",
            "Created By",
            "Validated By",
            "Template"
        };

                for (int i = 0; i < headers.Length; i++)
                {
                    worksheet.Cell(1, i + 1).Value = headers[i];
                }

                worksheet.Range(1, 1, 1, headers.Length)
                    .Style.Font.Bold = true;

                int row = 2;

                foreach (var officer in officers)
                {
                    worksheet.Cell(row, 1).Value = officer.ID;
                    worksheet.Cell(row, 2).Value = officer.Name;
                    worksheet.Cell(row, 3).Value = officer.Office;
                    worksheet.Cell(row, 4).Value = officer.Employee_Id_NO;
                    worksheet.Cell(row, 5).Value = officer.Address;
                    worksheet.Cell(row, 6).Value = officer.Contact_Num;

                    if (officer.Date_of_Birth.HasValue)
                        worksheet.Cell(row, 7).Value =
                            officer.Date_of_Birth.Value.ToString("yyyy-MM-dd");

                    if (officer.IssueDate.HasValue)
                        worksheet.Cell(row, 8).Value =
                            officer.IssueDate.Value.ToString("yyyy-MM-dd");

                    if (officer.Expiration_date.HasValue)
                        worksheet.Cell(row, 9).Value =
                            officer.Expiration_date.Value.ToString("yyyy-MM-dd");

                    worksheet.Cell(row, 10).Value = officer.Blood_Type;
                    worksheet.Cell(row, 11).Value = officer.Emergency_Con_Name;
                    worksheet.Cell(row, 12).Value = officer.Emergency_Con;
                    worksheet.Cell(row, 13).Value =
                        officer.CreatedByUser?.Name ?? "";
                    worksheet.Cell(row, 14).Value =
                        officer.ValidatedBy?.Name ?? "";
                    worksheet.Cell(row, 15).Value =
                        officer.Template?.Name ?? "";

                    // =================================================
                    // PROFILE IMAGE IN EXCEL
                    // =================================================

                    if (!string.IsNullOrWhiteSpace(officer.ImagePath))
                    {
                        var imagePath = Path.Combine(
                            _env.ContentRootPath,
                            officer.ImagePath.Replace(
                                "/",
                                Path.DirectorySeparatorChar.ToString()
                            )
                        );

                        if (System.IO.File.Exists(imagePath))
                        {
                            worksheet.AddPicture(imagePath)
                                .MoveTo(worksheet.Cell(row, 16))
                                .WithSize(100, 120);
                        }
                    }

                    // =================================================
                    // SIGNATURE IN EXCEL
                    // =================================================

                    if (!string.IsNullOrWhiteSpace(officer.Signaturepath))
                    {
                        var signaturePath = Path.Combine(
                            _env.ContentRootPath,
                            officer.Signaturepath.Replace(
                                "/",
                                Path.DirectorySeparatorChar.ToString()
                            )
                        );

                        if (System.IO.File.Exists(signaturePath))
                        {
                            worksheet.AddPicture(signaturePath)
                                .MoveTo(worksheet.Cell(row, 17))
                                .WithSize(150, 70);
                        }
                    }

                    worksheet.Row(row).Height = 100;

                    row++;
                }

                worksheet.Column(1).Width = 8;
                worksheet.Column(2).Width = 28;
                worksheet.Column(3).Width = 25;
                worksheet.Column(4).Width = 18;
                worksheet.Column(5).Width = 35;
                worksheet.Column(6).Width = 18;
                worksheet.Column(7).Width = 15;
                worksheet.Column(8).Width = 15;
                worksheet.Column(9).Width = 18;
                worksheet.Column(10).Width = 12;
                worksheet.Column(11).Width = 28;
                worksheet.Column(12).Width = 20;
                worksheet.Column(13).Width = 25;
                worksheet.Column(14).Width = 25;
                worksheet.Column(15).Width = 25;
                worksheet.Column(16).Width = 18;
                worksheet.Column(17).Width = 25;

                worksheet.RangeUsed().Style.Alignment.Vertical =
                    XLAlignmentVerticalValues.Center;

                worksheet.RangeUsed().Style.Alignment.WrapText = true;

                worksheet.SheetView.FreezeRows(1);

                // =====================================================
                // SAVE EXCEL INTO ZIP
                // =====================================================

                var excelEntry = archive.CreateEntry(
                    "Project_Officers.xlsx",
                    CompressionLevel.Fastest
                );

                using (var excelStream = excelEntry.Open())
                using (var tempExcel = new MemoryStream())
                {
                    workbook.SaveAs(tempExcel);

                    tempExcel.Position = 0;

                    await tempExcel.CopyToAsync(excelStream);
                }

                // =====================================================
                // PROFILE IMAGES
                // =====================================================

                foreach (var officer in officers)
                {
                    if (string.IsNullOrWhiteSpace(officer.ImagePath))
                        continue;

                    var imagePath = Path.Combine(
                        _env.ContentRootPath,
                        officer.ImagePath.Replace("/", Path.DirectorySeparatorChar.ToString())
                    );

                    if (!System.IO.File.Exists(imagePath))
                        continue;

                    var extension = Path.GetExtension(imagePath);
                    var safeName = SanitizeFileName(officer.Name ?? "Unknown");
                    var safeTemplateName = SanitizeFileName(officer.Template?.Name ?? "No_Template");

                    var profileFileName = $"{safeName}_{safeTemplateName}_profile{extension}";

                    var entry = archive.CreateEntry($"profiles/{profileFileName}", CompressionLevel.Fastest);
                    await using var entryStream = entry.Open();
                    await using var fileStream = new FileStream(imagePath, FileMode.Open, FileAccess.Read);
                    await fileStream.CopyToAsync(entryStream);
                }

                // =====================================================
                // SIGNATURE IMAGES
                // =====================================================

                foreach (var officer in officers)
                {
                    if (string.IsNullOrWhiteSpace(officer.Signaturepath))
                        continue;

                    var signaturePath = Path.Combine(
                        _env.ContentRootPath,
                        officer.Signaturepath.Replace("/", Path.DirectorySeparatorChar.ToString())
                    );

                    if (!System.IO.File.Exists(signaturePath))
                        continue;

                    var safeName = SanitizeFileName(officer.Name ?? "Unknown");
                    var safeTemplateName = SanitizeFileName(officer.Template?.Name ?? "No_Template");

                    var signatureFileName = $"{safeName}_{safeTemplateName}_signature.png";

                    var entry = archive.CreateEntry($"signatures/{signatureFileName}", CompressionLevel.Fastest);
                    await using var entryStream = entry.Open();
                    await using var fileStream = new FileStream(signaturePath, FileMode.Open, FileAccess.Read);
                    await fileStream.CopyToAsync(entryStream);
                }
            }

            zipStream.Position = 0;

            var fileName =
                $"Project_Officers_{DateTime.Now:yyyyMMdd_HHmmss}.zip";

            return File(
                zipStream.ToArray(),
                "application/zip",
                fileName
            );
        }
    }

    public class ProjectOfficerRequest
    {
        public string? Name { get; set; }
        public string? Office { get; set; }
        public string? Section { get; set; }
        public string? OfficeType { get; set; }
        public string? Employee_Id_NO { get; set; }
        public string? Address { get; set; }
        public string? Contact_Num { get; set; }
        public DateOnly? Date_of_Birth { get; set; }
        public DateOnly? IssueDate { get; set; }
        public DateOnly? Expiration_date { get; set; }
        public string? Blood_Type { get; set; }
        public string? Emergency_Con_Name { get; set; }
        public string? Emergency_Con { get; set; }
        public int? CreatedBy { get; set; }
        public int? Validated_by { get; set; }
        public int? TemplateID { get; set; }

        public IFormFile? Image { get; set; }
        public IFormFile? Signature { get; set; }
        public string? BackgroundColor { get; set; }
        public bool RemoveImage { get; set; }
        public bool RemoveSignatureImage { get; set; }
    }
}