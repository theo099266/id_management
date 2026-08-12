using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixForeignKeyDeleteBehavior : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Signatories_ApprovedBy",
                table: "Documents");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Signatories_ApprovedBy",
                table: "Documents",
                column: "ApprovedBy",
                principalTable: "Signatories",
                principalColumn: "SignatoryID",
                onDelete: ReferentialAction.SetNull);


            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Signatories_PreparedBy",
                table: "Documents");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Signatories_PreparedBy",
                table: "Documents",
                column: "PreparedBy",
                principalTable: "Signatories",
                principalColumn: "SignatoryID",
                onDelete: ReferentialAction.SetNull);


            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Users_CreatedBy",
                table: "Documents");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Users_CreatedBy",
                table: "Documents",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
