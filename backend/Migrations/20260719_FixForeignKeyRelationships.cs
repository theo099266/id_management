using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class FixForeignKeyRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop existing shadow property foreign keys
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Signatories_ApprovedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Signatories_PreparedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_User_UserID",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Templates_User_UserID",
                table: "Templates");

            migrationBuilder.DropForeignKey(
                name: "FK_Templates_Users_CreatedByUserId",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Documents_ApprovedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_PreparedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_UserID",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Templates_CreatedByUserId",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Templates_UserID",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Signatories_CreatedByUserUserID",
                table: "Signatories");

            // Drop redundant shadow columns
            migrationBuilder.DropColumn(
                name: "ApprovedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "PreparedBySignatorySignatoryID",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "UserID",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Templates");

            migrationBuilder.DropColumn(
                name: "UserID",
                table: "Templates");

            migrationBuilder.DropColumn(
                name: "CreatedByUserUserID",
                table: "Signatories");

            // Add proper foreign keys using existing columns
            migrationBuilder.CreateIndex(
                name: "IX_Documents_PreparedBy",
                table: "Documents",
                column: "PreparedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ApprovedBy",
                table: "Documents",
                column: "ApprovedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Templates_CreatedBy",
                table: "Templates",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Signatories_CreatedBy",
                table: "Signatories",
                column: "CreatedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Signatories_PreparedBy",
                table: "Documents",
                column: "PreparedBy",
                principalTable: "Signatories",
                principalColumn: "SignatoryID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Signatories_ApprovedBy",
                table: "Documents",
                column: "ApprovedBy",
                principalTable: "Signatories",
                principalColumn: "SignatoryID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Templates_User_CreatedBy",
                table: "Templates",
                column: "CreatedBy",
                principalTable: "user",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Signatories_User_CreatedBy",
                table: "Signatories",
                column: "CreatedBy",
                principalTable: "user",
                principalColumn: "UserID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverse the migration
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Signatories_PreparedBy",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Signatories_ApprovedBy",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Templates_User_CreatedBy",
                table: "Templates");

            migrationBuilder.DropForeignKey(
                name: "FK_Signatories_User_CreatedBy",
                table: "Signatories");

            migrationBuilder.DropIndex(
                name: "IX_Documents_PreparedBy",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_ApprovedBy",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Templates_CreatedBy",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Signatories_CreatedBy",
                table: "Signatories");

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

            migrationBuilder.AddColumn<int>(
                name: "UserID",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "Templates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserID",
                table: "Templates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserUserID",
                table: "Signatories",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ApprovedBySignatorySignatoryID",
                table: "Documents",
                column: "ApprovedBySignatorySignatoryID");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_PreparedBySignatorySignatoryID",
                table: "Documents",
                column: "PreparedBySignatorySignatoryID");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_UserID",
                table: "Documents",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Templates_CreatedByUserId",
                table: "Templates",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Templates_UserID",
                table: "Templates",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Signatories_CreatedByUserUserID",
                table: "Signatories",
                column: "CreatedByUserUserID");

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
                name: "FK_Documents_User_UserID",
                table: "Documents",
                column: "UserID",
                principalTable: "user",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Templates_User_UserID",
                table: "Templates",
                column: "UserID",
                principalTable: "user",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Templates_Users_CreatedByUserId",
                table: "Templates",
                column: "CreatedByUserId",
                principalTable: "users",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Signatories_User_CreatedByUserUserID",
                table: "Signatories",
                column: "CreatedByUserUserID",
                principalTable: "user",
                principalColumn: "UserID");
        }
    }
}
