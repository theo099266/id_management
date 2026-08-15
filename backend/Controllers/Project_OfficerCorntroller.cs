using Backend.Models;
using Backend.Services;
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

                ImagePath = await SavePlainImageAsync(request.Image, "profiles"),

                Signaturepath = await SaveAndRemoveBackgroundAsync(
                    request.Signature,
                    "signatures",
                    request.BackgroundColor)
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

            if (request.Image != null && request.Image.Length > 0)
            {
                // User uploaded a NEW image
                if (!string.IsNullOrEmpty(officer.ImagePath))
                {
                    var oldImgPath = Path.Combine(
                        _env.ContentRootPath,
                        officer.ImagePath.Replace("/", Path.DirectorySeparatorChar.ToString()));

                    if (System.IO.File.Exists(oldImgPath))
                        System.IO.File.Delete(oldImgPath);
                }

                officer.ImagePath = await SavePlainImageAsync(request.Image, "profiles");
            }



            if (request.Signature != null && request.Signature.Length > 0)
            {
                try
                {
                    Console.WriteLine("=================================");
                    Console.WriteLine("SIGNATURE UPLOAD START");
                    Console.WriteLine($"File: {request.Signature.FileName}");
                    Console.WriteLine($"Length: {request.Signature.Length}");
                    Console.WriteLine($"ContentType: {request.Signature.ContentType}");
                    Console.WriteLine($"BackgroundColor: {request.BackgroundColor}");
                    Console.WriteLine("=================================");

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
                            request.BackgroundColor
                        );

                    if (string.IsNullOrEmpty(newSignaturePath))
                    {
                        return StatusCode(500, "Signature image could not be processed.");
                    }

                    officer.Signaturepath = newSignaturePath;

                    Console.WriteLine($"SIGNATURE SAVED: {newSignaturePath}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine("=================================");
                    Console.WriteLine("SIGNATURE UPLOAD ERROR");
                    Console.WriteLine(ex.ToString());
                    Console.WriteLine("=================================");

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
            var officer = await _context.Project_Officers.FindAsync(id);
            if (officer == null) return NotFound();

            if (!string.IsNullOrEmpty(officer.ImagePath))
            {
                var path = Path.Combine(_env.ContentRootPath, officer.ImagePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
                if (System.IO.File.Exists(path))
                    System.IO.File.Delete(path);

                officer.ImagePath = null;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpDelete("{id}/signature")]
        public async Task<IActionResult> DeleteSignature(int id)
        {
            var officer = await _context.Project_Officers.FindAsync(id);
            if (officer == null) return NotFound();

            if (!string.IsNullOrEmpty(officer.Signaturepath))
            {
                var path = Path.Combine(_env.ContentRootPath, officer.Signaturepath.Replace("/", Path.DirectorySeparatorChar.ToString()));
                if (System.IO.File.Exists(path))
                    System.IO.File.Delete(path);

                officer.Signaturepath = null;
                await _context.SaveChangesAsync();
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


        private async Task<string?> SavePlainImageAsync(IFormFile? file, string folderName)
        {
            if (file == null || file.Length == 0)
                return null;

            var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads", folderName);
            Directory.CreateDirectory(uploadsFolder);

            var safeFileName = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{Path.GetFileNameWithoutExtension(file.FileName)}{Path.GetExtension(file.FileName)}";
            var fullPath = Path.Combine(uploadsFolder, safeFileName);

            using var stream = new FileStream(fullPath, FileMode.Create);
            await file.CopyToAsync(stream);

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
    }
}