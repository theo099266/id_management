using System;
using System.IO;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace YourApp.Services
{
    public enum SignatureProfile
    {
        OfficerSignature,
        AdministrativeSignature,
    }

    public static class SignatureNormalizer
    {
        private const int Padding = 10;
        private const byte AlphaInkThreshold = 20;
        private const byte ColorInkThreshold = 240;
        private const byte ContrastThreshold = 180;

        // Layout constants shared by both profiles.
        private const int CanvasW = 1600;
        private const int MaxDrawW = 1500;
        private const int TallMaxDrawW = 1600;
        private const int DefaultMaxDrawH = 400;
        private static readonly double TargetRatio = (double)MaxDrawW / DefaultMaxDrawH; // ~3.75

        private const double TallWidthBoost = 1.5;
        private const double TallHeightBoost = 1.3;
        private const double WideWidthBoost = 2.0;
        private const double WideHeightBoost = 1.5;
        private const int FixedDrawW = 1500;

        // Profile-specific constants.
        private static int CanvasH(SignatureProfile profile) =>
            profile == SignatureProfile.AdministrativeSignature ? 500 : 750;

        private static int TallMaxDrawH(SignatureProfile profile) =>
            profile == SignatureProfile.AdministrativeSignature ? 520 : 700;

        private const int MinTallWidth = 650; // administrative profile only

        public static byte[] Normalize(Stream inputImageStream, SignatureProfile profile = SignatureProfile.OfficerSignature)
        {
            using Image<Rgba32> src = Image.Load<Rgba32>(inputImageStream);

            var bounds = FindInkBounds(src);
            if (bounds is null)
            {
                return EncodePng(src);
            }

            var (minX, minY, maxX, maxY) = bounds.Value;

            minX = Math.Max(0, minX - Padding);
            minY = Math.Max(0, minY - Padding);
            maxX = Math.Min(src.Width - 1, maxX + Padding);
            maxY = Math.Min(src.Height - 1, maxY + Padding);

            int cropWidth = maxX - minX;
            int cropHeight = maxY - minY;
            if (cropWidth <= 0 || cropHeight <= 0)
            {
                return EncodePng(src);
            }

            int canvasH = CanvasH(profile);
            var (drawWidth, drawHeight) = ComputeDrawSize(cropWidth, cropHeight, profile);

            using var output = new Image<Rgba32>(CanvasW, canvasH);
            output.Mutate(ctx => ctx.BackgroundColor(Color.Transparent));

            using (var cropped = src.Clone(ctx => ctx.Crop(new Rectangle(minX, minY, cropWidth, cropHeight))))
            {
                cropped.Mutate(ctx => ctx.Resize(new ResizeOptions
                {
                    Size = new Size((int)Math.Round(drawWidth), (int)Math.Round(drawHeight)),
                    Mode = ResizeMode.Stretch,
                    Sampler = KnownResamplers.Lanczos3,
                }));

                int destX = (int)Math.Round((CanvasW - drawWidth) / 2);
                int destY = (int)Math.Round((canvasH - drawHeight) / 2);

                output.Mutate(ctx => ctx.DrawImage(cropped, new Point(destX, destY), 1f));
            }

            BoostContrast(output);

            return EncodePng(output);
        }

        private static byte[] EncodePng(Image<Rgba32> img)
        {
            using var ms = new MemoryStream();
            img.SaveAsPng(ms);
            return ms.ToArray();
        }

        private static (int minX, int minY, int maxX, int maxY)? FindInkBounds(Image<Rgba32> img)
        {
            int minX = img.Width, maxX = 0, minY = img.Height, maxY = 0;
            bool found = false;

            img.ProcessPixelRows(accessor =>
            {
                for (int y = 0; y < accessor.Height; y++)
                {
                    var row = accessor.GetRowSpan(y);
                    for (int x = 0; x < row.Length; x++)
                    {
                        var p = row[x];
                        bool isInk = p.A > AlphaInkThreshold &&
                                     (p.R < ColorInkThreshold || p.G < ColorInkThreshold || p.B < ColorInkThreshold);

                        if (!isInk) continue;

                        found = true;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            });

            return found ? (minX, minY, maxX, maxY) : null;
        }

        private static (double drawWidth, double drawHeight) ComputeDrawSize(int cropWidth, int cropHeight, SignatureProfile profile)
        {
            int tallMaxDrawH = TallMaxDrawH(profile);

            double signatureRatio = (double)cropWidth / cropHeight;
            bool isTall = cropHeight > cropWidth;

            double ratioDiff = Math.Abs(signatureRatio - TargetRatio) / TargetRatio;
            bool isNearPerfect =
                !isTall &&
                ratioDiff < 0.15 &&
                cropWidth >= MaxDrawW * 0.85 &&
                cropHeight >= DefaultMaxDrawH * 0.7;

            double drawWidth, drawHeight;

            if (isNearPerfect)
            {
                double scale = Math.Min((double)MaxDrawW / cropWidth, (double)DefaultMaxDrawH / cropHeight);
                drawWidth = cropWidth * scale;
                drawHeight = cropHeight * scale;
            }
            else if (isTall)
            {
                double heightScale = (double)tallMaxDrawH / cropHeight;
                drawHeight = cropHeight * heightScale * TallHeightBoost;
                if (drawHeight > tallMaxDrawH) drawHeight = tallMaxDrawH;

                if (profile == SignatureProfile.AdministrativeSignature)
                {
                    // Administrative profile: stretch toward TallMaxDrawW, but never
                    // narrower than MinTallWidth, even if that means extra distortion.
                    double naturalWidth = cropWidth * (drawHeight / cropHeight);
                    double stretchedWidth = Math.Min(naturalWidth * TallWidthBoost, TallMaxDrawW);
                    drawWidth = Math.Max(stretchedWidth, MinTallWidth);
                }
                else
                {
                    drawWidth = cropWidth * heightScale * TallWidthBoost;
                    if (drawWidth > TallMaxDrawW) drawWidth = TallMaxDrawW;
                }
            }
            else
            {
                double baseScale = Math.Min((double)MaxDrawW / cropWidth, (double)DefaultMaxDrawH / cropHeight);

                drawWidth = Math.Min(cropWidth * baseScale * WideWidthBoost, MaxDrawW);
                drawHeight = Math.Min(cropHeight * baseScale * WideHeightBoost, DefaultMaxDrawH);

                double boostMaxH = profile == SignatureProfile.AdministrativeSignature
                    ? (drawWidth < 1200 ? 435 : 400)
                    : (drawWidth < 1200 ? 600 : 500);

                if (drawWidth < FixedDrawW)
                {
                    double widthNeededScale = FixedDrawW / drawWidth;
                    double heightAllowedScale = boostMaxH / drawHeight;
                    double boostScale = Math.Min(widthNeededScale, heightAllowedScale);

                    drawWidth *= boostScale;
                    drawHeight *= boostScale;
                }
            }

            return (drawWidth, drawHeight);
        }

        private static void BoostContrast(Image<Rgba32> img)
        {
            img.ProcessPixelRows(accessor =>
            {
                for (int y = 0; y < accessor.Height; y++)
                {
                    var row = accessor.GetRowSpan(y);
                    for (int x = 0; x < row.Length; x++)
                    {
                        ref var p = ref row[x];
                        if (p.R < ContrastThreshold)
                        {
                            p.R = 0;
                            p.G = 0;
                            p.B = 0;
                        }
                    }
                }
            });
        }
    }
}