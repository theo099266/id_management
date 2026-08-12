using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;
namespace Backend
{
    public class ApplicationDbContext
        : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>
    {

        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {

        }


        public DbSet<Signatory> Signatories { get; set; }
        public DbSet<Project_Officers> Project_Officers { get; set; }
        public DbSet<Template> Templates { get; set; }

        public DbSet<Administrative> Administratives { get; set; }



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Keep mapping if you want Users table named "Users" and Id column named "UserID"
            modelBuilder.Entity<ApplicationUser>().ToTable("Users");
            modelBuilder.Entity<ApplicationUser>().Property(x => x.Id).HasColumnName("UserID");
            // modelBuilder.Entity<ApplicationUser>(b =>
            // {
            //     b.Ignore(u => u.PhoneNumber);
            //     b.Ignore(u => u.PhoneNumberConfirmed);
            //     b.Ignore(u => u.TwoFactorEnabled);
            //     b.Ignore(u => u.LockoutEnd);
            //     b.Ignore(u => u.LockoutEnabled);
            //     b.Ignore(u => u.AccessFailedCount);
            // });
            modelBuilder.Entity<Signatory>()
                .HasOne(s => s.CreatedByUser)
                .WithMany()
                .HasForeignKey(s => s.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
            //.OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Project_Officers>()
                .HasOne(s => s.CreatedByUser)
                .WithMany()
                .HasForeignKey(s => s.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<Template>()
            .HasOne(s => s.CreatedByUser)
            .WithMany()
            .HasForeignKey(s => s.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);
            //.OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Project_Officers>()
    .HasOne(d => d.ValidatedBy)
    .WithMany()
    .HasForeignKey(d => d.Validated_by)
    .OnDelete(DeleteBehavior.SetNull);

            // NEW: Project_Officers -> Template
            modelBuilder.Entity<Project_Officers>()
                .HasOne(d => d.Template)
                .WithMany()
                .HasForeignKey(d => d.TemplateID)
                .OnDelete(DeleteBehavior.SetNull);
            var stringListComparer = new ValueComparer<List<string>>(
    (a, b) => (a ?? new()).SequenceEqual(b ?? new()),
    v => v.Aggregate(0, (hash, s) => HashCode.Combine(hash, s.GetHashCode())),
    v => v.ToList());

            modelBuilder.Entity<Template>()
                .Property(t => t.Office)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
                    v => string.IsNullOrEmpty(v)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(stringListComparer);

            modelBuilder.Entity<Template>()
                .Property(t => t.Section)
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
                    v => string.IsNullOrEmpty(v)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(stringListComparer);

        }

    }

}