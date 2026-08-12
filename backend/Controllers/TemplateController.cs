using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TemplateController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public TemplateController(
            ApplicationDbContext context,
            IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }


        // GET ALL
        [HttpGet]
        public async Task<IActionResult> GetTemplates()
        {
            var data = await _context.Templates
                .Include(t => t.CreatedByUser)
                .OrderBy(t => t.Name)
                .Select(t => new
                {
                    t.TemplateID,
                    t.Name,
                    t.FrontID_background_image,
                    t.FrontID_Footer_image,
                    t.BackID_background,
                    t.Office,
                    t.Section,
                    t.CreatedBy,
                    CreatedByName = t.CreatedByUser != null
                        ? t.CreatedByUser.Name
                        : null
                })
                .ToListAsync();

            return Ok(data);
        }


        // GET ONE
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var template = await _context.Templates
                .Include(t => t.CreatedByUser)
                .Where(t => t.TemplateID == id)
                .Select(t => new
                {
                    t.TemplateID,
                    t.Name,
                    t.FrontID_background_image,
                    t.FrontID_Footer_image,
                    t.BackID_background,
                    t.Office,
                    t.Section,
                    t.CreatedBy,
                    CreatedByName = t.CreatedByUser != null
                        ? t.CreatedByUser.Name
                        : null
                })
                .FirstOrDefaultAsync();

            if (template == null)
                return NotFound();

            return Ok(template);
        }


        // CREATE
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromForm] TemplateRequest request)
        {

            var template = new Template
            {
                Name = request.Name,
                CreatedBy = request.CreatedBy,

                Office = request.Office ?? new List<string>(),
                Section = request.Section ?? new List<string>(),

                FrontID_background_image =
                    await SaveImage(request.FrontBackground, "templates"),

                FrontID_Footer_image =
                    await SaveImage(request.FrontFooter, "templates"),

                BackID_background =
                    await SaveImage(request.BackBackground, "templates")
            };


            _context.Templates.Add(template);

            await _context.SaveChangesAsync();

            return Ok(template);
        }




        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromForm] TemplateRequest request)
        {

            var template = await _context.Templates
                .FindAsync(id);


            if (template == null)
                return NotFound();



            template.Name =
                request.Name ?? template.Name;


            template.CreatedBy =
                request.CreatedBy ?? template.CreatedBy;

            // Full replace when the frontend sends a new list.
            // If Office/Section is omitted from the form entirely, keep the existing values.
            if (request.Office != null)
                template.Office = request.Office;

            if (request.Section != null)
                template.Section = request.Section;



            if(request.FrontBackground != null)
            {
                DeleteFile(template.FrontID_background_image);

                template.FrontID_background_image =
                    await SaveImage(
                        request.FrontBackground,
                        "templates");
            }


            if(request.FrontFooter != null)
            {
                DeleteFile(template.FrontID_Footer_image);

                template.FrontID_Footer_image =
                    await SaveImage(
                        request.FrontFooter,
                        "templates");
            }



            if(request.BackBackground != null)
            {
                DeleteFile(template.BackID_background);

                template.BackID_background =
                    await SaveImage(
                        request.BackBackground,
                        "templates");
            }



            await _context.SaveChangesAsync();


            return NoContent();
        }





        // DELETE TEMPLATE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {

            var template =
                await _context.Templates.FindAsync(id);


            if(template == null)
                return NotFound();



            DeleteFile(template.FrontID_background_image);
            DeleteFile(template.FrontID_Footer_image);
            DeleteFile(template.BackID_background);



            _context.Templates.Remove(template);

            await _context.SaveChangesAsync();


            return NoContent();
        }





        // DELETE ONLY IMAGE
        [HttpDelete("{id}/image/{type}")]
        public async Task<IActionResult> DeleteImage(
            int id,
            string type)
        {

            var template =
                await _context.Templates.FindAsync(id);


            if(template == null)
                return NotFound();



            switch(type.ToLower())
            {
                case "frontbackground":

                    DeleteFile(template.FrontID_background_image);
                    template.FrontID_background_image = null;

                    break;


                case "frontfooter":

                    DeleteFile(template.FrontID_Footer_image);
                    template.FrontID_Footer_image = null;

                    break;


                case "backbackground":

                    DeleteFile(template.BackID_background);
                    template.BackID_background = null;

                    break;


                default:
                    return BadRequest("Invalid image type");
            }



            await _context.SaveChangesAsync();


            return NoContent();
        }


        // DELETE A SINGLE OFFICE ENTRY FROM THE LIST
        [HttpDelete("{id}/office")]
        public async Task<IActionResult> DeleteOffice(int id, [FromQuery] string value)
        {
            var template = await _context.Templates.FindAsync(id);
            if (template == null) return NotFound();

            template.Office.Remove(value);

            await _context.SaveChangesAsync();
            return NoContent();
        }


        // DELETE A SINGLE SECTION ENTRY FROM THE LIST
        [HttpDelete("{id}/section")]
        public async Task<IActionResult> DeleteSection(int id, [FromQuery] string value)
        {
            var template = await _context.Templates.FindAsync(id);
            if (template == null) return NotFound();

            template.Section.Remove(value);

            await _context.SaveChangesAsync();
            return NoContent();
        }






        // GET BY USER
        [HttpGet("byUser/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {

            var data =
                await _context.Templates
                .Where(x => x.CreatedBy == userId)
                .OrderBy(x => x.Name)
                .ToListAsync();


            return Ok(data);
        }






        private async Task<string?> SaveImage(
            IFormFile? file,
            string folder)
        {

            if(file == null || file.Length == 0)
                return null;



            var upload =
                Path.Combine(
                    _env.ContentRootPath,
                    "uploads",
                    folder);



            Directory.CreateDirectory(upload);



            var filename =
                $"{DateTime.UtcNow:yyyyMMddHHmmss}_{file.FileName}";


            var path =
                Path.Combine(upload, filename);



            using(var stream =
                new FileStream(path, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }



            return Path.Combine(
                "uploads",
                folder,
                filename)
                .Replace("\\","/");
        }





        private void DeleteFile(string? relativePath)
        {

            if(string.IsNullOrEmpty(relativePath))
                return;



            var fullPath =
                Path.Combine(
                    _env.ContentRootPath,
                    relativePath.Replace(
                        "/",
                        Path.DirectorySeparatorChar.ToString()));



            if(System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
            }

        }

    }




    public class TemplateRequest
    {
        public string? Name { get; set; }

        public int? CreatedBy { get; set; }

        public List<string>? Office { get; set; }
        public List<string>? Section { get; set; }

        public IFormFile? FrontBackground { get; set; }

        public IFormFile? FrontFooter { get; set; }

        public IFormFile? BackBackground { get; set; }
    }
}