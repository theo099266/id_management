using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SetTemplateDeleteToNull : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Templates_TemplateID",
                table: "Documents");

            migrationBuilder.AlterColumn<int>(
                name: "TemplateID",
                table: "Documents",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Templates_TemplateID",
                table: "Documents",
                column: "TemplateID",
                principalTable: "Templates",
                principalColumn: "TemplateID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Templates_TemplateID",
                table: "Documents");

            migrationBuilder.AlterColumn<int>(
                name: "TemplateID",
                table: "Documents",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Templates_TemplateID",
                table: "Documents",
                column: "TemplateID",
                principalTable: "Templates",
                principalColumn: "TemplateID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
