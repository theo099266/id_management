using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixTemplateForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Signatories_ApprovedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Signatories_PreparedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Signatories_User_CreatedByUserUserID",
                table: "Signatories");

            migrationBuilder.DropForeignKey(
                name: "FK_Templates_Users_CreatedByUserId",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Templates_CreatedByUserId",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Signatories_CreatedByUserUserID",
                table: "Signatories");

            migrationBuilder.DropIndex(
                name: "IX_Documents_ApprovedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_PreparedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Templates");

            migrationBuilder.DropColumn(
                name: "CreatedByUserUserID",
                table: "Signatories");

            migrationBuilder.DropColumn(
                name: "ApprovedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "PreparedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.CreateIndex(
                name: "IX_Templates_CreatedBy",
                table: "Templates",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Signatories_CreatedBy",
                table: "Signatories",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ApprovedBy",
                table: "Documents",
                column: "ApprovedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_PreparedBy",
                table: "Documents",
                column: "PreparedBy");
            

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Signatories_ApprovedBy",
                table: "Documents",
                column: "ApprovedBy",
                principalTable: "Signatories",
                principalColumn: "SignatoryID");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Signatories_PreparedBy",
                table: "Documents",
                column: "PreparedBy",
                principalTable: "Signatories",
                principalColumn: "SignatoryID");

            migrationBuilder.AddForeignKey(
                name: "FK_Signatories_User_CreatedBy",
                table: "Signatories",
                column: "CreatedBy",
                principalTable: "User",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Templates_Users_CreatedBy",
                table: "Templates",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Users_UserID",
                table: "documents",
                column: "UserID",
                principalTable: "users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Restrict);


        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Signatories_ApprovedBy",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Signatories_PreparedBy",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Signatories_User_CreatedBy",
                table: "Signatories");

            migrationBuilder.DropForeignKey(
                name: "FK_Templates_Users_CreatedBy",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Templates_CreatedBy",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Signatories_CreatedBy",
                table: "Signatories");

            migrationBuilder.DropIndex(
                name: "IX_Documents_ApprovedBy",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_PreparedBy",
                table: "Documents");

            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "Templates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserUserID",
                table: "Signatories",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApprovedBySignatorySignatoryID",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PreparedBySignatorySignatoryID",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Templates_CreatedByUserId",
                table: "Templates",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Signatories_CreatedByUserUserID",
                table: "Signatories",
                column: "CreatedByUserUserID");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ApprovedBySignatorySignatoryID",
                table: "Documents",
                column: "ApprovedBySignatorySignatoryID");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_PreparedBySignatorySignatoryID",
                table: "Documents",
                column: "PreparedBySignatorySignatoryID");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Signatories_ApprovedBySignatorySignatoryID",
                table: "Documents",
                column: "ApprovedBySignatorySignatoryID",
                principalTable: "Signatories",
                principalColumn: "SignatoryID");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Signatories_PreparedBySignatorySignatoryID",
                table: "Documents",
                column: "PreparedBySignatorySignatoryID",
                principalTable: "Signatories",
                principalColumn: "SignatoryID");

            migrationBuilder.AddForeignKey(
                name: "FK_Signatories_User_CreatedByUserUserID",
                table: "Signatories",
                column: "CreatedByUserUserID",
                principalTable: "User",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Templates_Users_CreatedByUserId",
                table: "Templates",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "UserID");
        }
    }
}
