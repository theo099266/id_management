using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixAllForeignKeys4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Signatories_Users_CreatedBy",
                table: "Signatories");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_CreatedBy",
                table: "Documents",
                column: "CreatedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Users_CreatedBy",
                table: "Documents",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Signatories_Users_CreatedBy",
                table: "Signatories",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Restrict);
            migrationBuilder.DropTable(
                name: "User");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Users_CreatedBy",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Signatories_Users_CreatedBy",
                table: "Signatories");

            migrationBuilder.DropIndex(
                name: "IX_Documents_CreatedBy",
                table: "Documents");

            migrationBuilder.AddForeignKey(
                name: "FK_Signatories_Users_CreatedBy",
                table: "Signatories",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID");
        }
    }
}
