using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateForeignKeyToProjectOfficers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TemplateID",
                table: "Project_Officers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Project_Officers_TemplateID",
                table: "Project_Officers",
                column: "TemplateID");

            migrationBuilder.AddForeignKey(
                name: "FK_Project_Officers_Templates_TemplateID",
                table: "Project_Officers",
                column: "TemplateID",
                principalTable: "Templates",
                principalColumn: "TemplateID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Project_Officers_Templates_TemplateID",
                table: "Project_Officers");

            migrationBuilder.DropIndex(
                name: "IX_Project_Officers_TemplateID",
                table: "Project_Officers");

            migrationBuilder.DropColumn(
                name: "TemplateID",
                table: "Project_Officers");
        }
    }
}
