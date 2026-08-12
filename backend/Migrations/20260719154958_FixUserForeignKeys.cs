using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixUserForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Brandings_User_UserID",
                table: "Brandings");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Users_UserID",
                table: "Documents");
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_User_UserID",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Signatories_User_CreatedBy",
                table: "Signatories");

            migrationBuilder.DropForeignKey(
                name: "FK_Templates_User_UserID",
                table: "Templates");

     
            migrationBuilder.DropIndex(
                name: "IX_Templates_UserID",
                table: "Templates");

            migrationBuilder.DropIndex(
                name: "IX_Documents_UserID",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Brandings_UserID",
                table: "Brandings");

            migrationBuilder.DropColumn(
                name: "UserID",
                table: "Templates");

            migrationBuilder.DropColumn(
                name: "UserID",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "UserID",
                table: "Brandings");

            migrationBuilder.AddForeignKey(
                name: "FK_Signatories_Users_CreatedBy",
                table: "Signatories",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Signatories_Users_CreatedBy",
                table: "Signatories");

            migrationBuilder.AddColumn<int>(
                name: "UserID",
                table: "Templates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserID",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserID",
                table: "Brandings",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Email = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    image_path = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Name = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PasswordHash = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Role = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.UserID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Templates_UserID",
                table: "Templates",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_UserID",
                table: "Documents",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Brandings_UserID",
                table: "Brandings",
                column: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Brandings_User_UserID",
                table: "Brandings",
                column: "UserID",
                principalTable: "User",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Users_UserID",
                table: "Documents",
                column: "UserID",
                principalTable: "Users",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Signatories_User_CreatedBy",
                table: "Signatories",
                column: "CreatedBy",
                principalTable: "User",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Templates_User_UserID",
                table: "Templates",
                column: "UserID",
                principalTable: "User",
                principalColumn: "UserID");
        }
    }
}
