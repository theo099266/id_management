using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddIssueAndExpirationDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Administrative_Users_CreatedBy",
                table: "Administrative");

            migrationBuilder.DropForeignKey(
                name: "FK_Project_Officers_Administrative_Validated_by",
                table: "Project_Officers");

            migrationBuilder.DropForeignKey(
                name: "FK_Signatory_Users_CreatedBy",
                table: "Signatory");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Signatory",
                table: "Signatory");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Administrative",
                table: "Administrative");

            migrationBuilder.RenameTable(
                name: "Signatory",
                newName: "Signatories");

            migrationBuilder.RenameTable(
                name: "Administrative",
                newName: "Administratives");

            migrationBuilder.RenameIndex(
                name: "IX_Signatory_CreatedBy",
                table: "Signatories",
                newName: "IX_Signatories_CreatedBy");

            migrationBuilder.RenameIndex(
                name: "IX_Administrative_CreatedBy",
                table: "Administratives",
                newName: "IX_Administratives_CreatedBy");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "Date_of_Birth",
                table: "Project_Officers",
                type: "date",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateOnly>(
                name: "Expiration_date",
                table: "Project_Officers",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "IssueDate",
                table: "Project_Officers",
                type: "date",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Signatories",
                table: "Signatories",
                column: "SignatoryID");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Administratives",
                table: "Administratives",
                column: "AdministrativeID");

            migrationBuilder.AddForeignKey(
                name: "FK_Administratives_Users_CreatedBy",
                table: "Administratives",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Project_Officers_Administratives_Validated_by",
                table: "Project_Officers",
                column: "Validated_by",
                principalTable: "Administratives",
                principalColumn: "AdministrativeID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Signatories_Users_CreatedBy",
                table: "Signatories",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Administratives_Users_CreatedBy",
                table: "Administratives");

            migrationBuilder.DropForeignKey(
                name: "FK_Project_Officers_Administratives_Validated_by",
                table: "Project_Officers");

            migrationBuilder.DropForeignKey(
                name: "FK_Signatories_Users_CreatedBy",
                table: "Signatories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Signatories",
                table: "Signatories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Administratives",
                table: "Administratives");

            migrationBuilder.DropColumn(
                name: "Expiration_date",
                table: "Project_Officers");

            migrationBuilder.DropColumn(
                name: "IssueDate",
                table: "Project_Officers");

            migrationBuilder.RenameTable(
                name: "Signatories",
                newName: "Signatory");

            migrationBuilder.RenameTable(
                name: "Administratives",
                newName: "Administrative");

            migrationBuilder.RenameIndex(
                name: "IX_Signatories_CreatedBy",
                table: "Signatory",
                newName: "IX_Signatory_CreatedBy");

            migrationBuilder.RenameIndex(
                name: "IX_Administratives_CreatedBy",
                table: "Administrative",
                newName: "IX_Administrative_CreatedBy");

            migrationBuilder.UpdateData(
                table: "Project_Officers",
                keyColumn: "Date_of_Birth",
                keyValue: null,
                column: "Date_of_Birth",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Date_of_Birth",
                table: "Project_Officers",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Signatory",
                table: "Signatory",
                column: "SignatoryID");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Administrative",
                table: "Administrative",
                column: "AdministrativeID");

            migrationBuilder.AddForeignKey(
                name: "FK_Administrative_Users_CreatedBy",
                table: "Administrative",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Project_Officers_Administrative_Validated_by",
                table: "Project_Officers",
                column: "Validated_by",
                principalTable: "Administrative",
                principalColumn: "AdministrativeID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Signatory_Users_CreatedBy",
                table: "Signatory",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
