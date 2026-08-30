using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace YourApp.Services
{
    public static class ProfilePhotoNormalizer
    {
        // How much breathing room to keep around the detected subject
        // on the sides we DO trim (top/left/right).
        private const int Padding = 10;

        // --- Alpha-based detection (primary path: transparent PNG) ---
        private const byte AlphaSubjectThreshold = 20; // matches SignatureNormalizer's AlphaInkThreshold

        // If fewer than this fraction of pixels are meaningfully
        // transparent, the image is treated as NOT actually cut out —
        // falls back to background-color detection instead.
        private const double MinTransparentPixelFraction = 0.02;

        // --- Color-distance detection (fallback path: solid background) ---
        private const int CornerSampleSize = 6;
        private const int BackgroundColorTolerance = 28;

        // Output canvas — match your ID card's photo slot aspect ratio.
        private const int CanvasW = 600;
        private const int CanvasH = 900;

        public static byte[] Normalize(Stream inputImageStream)
{
    using Image<Rgba32> src = Image.Load<Rgba32>(inputImageStream);

    bool hasTransparency = HasMeaningfulTransparency(src);

    var bounds = hasTransparency
        ? FindSubjectBoundsByAlpha(src)
        : FindSubjectBoundsByColorDistance(src, SampleBackgroundColor(src));

    if (bounds is null)
    {
        return EncodePng(src);
    }

    var (minX, minY, maxX, _) = bounds.Value;

    int cropTop = Math.Max(0, minY - Padding);
    int cropBottom = src.Height;
    int cropHeight = cropBottom - cropTop;

    if (cropHeight <= 0)
    {
        return EncodePng(src);
    }

    // Height is fixed and considered final — it already spans exactly
    // from "just above the head" to the bottom edge. It must never be
    // touched again after this point, or the head can get clipped.
    //
    // Width is the only dimension allowed to flex, so the final crop
    // matches the canvas's aspect ratio exactly. This guarantees the
    // later resize is a plain aspect-correct scale — never a "cover"
    // scale — so nothing can overflow off the top or bottom again.
    double targetAspect = (double)CanvasW / CanvasH;
    int desiredWidth = (int)Math.Round(cropHeight * targetAspect);

    int subjectCenterX = (minX + maxX) / 2;
    int cropLeft = subjectCenterX - desiredWidth / 2;
    int cropRight = cropLeft + desiredWidth;

    // Shift the window back into the image bounds if the centered
    // window would run off either edge, rather than shrinking it
    // (shrinking would reintroduce a mismatched aspect ratio).
    if (cropLeft < 0)
    {
        cropRight -= cropLeft;
        cropLeft = 0;
    }
    if (cropRight > src.Width)
    {
        cropLeft -= (cropRight - src.Width);
        cropRight = src.Width;
        if (cropLeft < 0) cropLeft = 0;
    }

    int cropWidth = Math.Min(cropRight, src.Width) - cropLeft;

    if (cropWidth <= 0)
    {
        return EncodePng(src);
    }

    using var cropped = src.Clone(ctx =>
        ctx.Crop(new Rectangle(cropLeft, cropTop, cropWidth, cropHeight)));

    using var output = new Image<Rgba32>(CanvasW, CanvasH);
    output.Mutate(ctx => ctx.BackgroundColor(Color.Transparent));

    // The crop above was already built to match the canvas aspect ratio,
    // so this is now a plain fit-to-canvas resize — not a "cover" scale —
    // meaning neither dimension can overflow, and destY is always 0.
    // Nothing can get pushed out of frame from here on.
    using (var resized = cropped.Clone(ctx => ctx.Resize(new ResizeOptions
    {
        Size = new Size(CanvasW, CanvasH),
        Mode = ResizeMode.Stretch,
        Sampler = KnownResamplers.Lanczos3,
    })))
    {
        output.Mutate(ctx => ctx.DrawImage(resized, new Point(0, 0), 1f));
    }

    return EncodePng(output);
}
        // Scans a sparse grid (every 4th pixel) rather than every pixel —
        // this only needs to answer "is this image cut out at all?",
        // not produce exact bounds, so full precision isn't worth the cost.
        private static bool HasMeaningfulTransparency(Image<Rgba32> img)
        {
            long total = 0;
            long transparent = 0;

            img.ProcessPixelRows(accessor =>
            {
                for (int y = 0; y < accessor.Height; y += 4)
                {
                    var row = accessor.GetRowSpan(y);
                    for (int x = 0; x < row.Length; x += 4)
                    {
                        total++;
                        if (row[x].A <= AlphaSubjectThreshold) transparent++;
                    }
                }
            });

            if (total == 0) return false;
            return (double)transparent / total >= MinTransparentPixelFraction;
        }

        private static (int minX, int minY, int maxX, int maxY)? FindSubjectBoundsByAlpha(Image<Rgba32> img)
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
                        if (row[x].A <= AlphaSubjectThreshold) continue;

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

        private static Rgba32 SampleBackgroundColor(Image<Rgba32> img)
        {
            var samples = new List<Rgba32>();

            void SampleCorner(int x0, int y0)
            {
                img.ProcessPixelRows(accessor =>
                {
                    for (int y = y0; y < y0 + CornerSampleSize && y < accessor.Height; y++)
                    {
                        var row = accessor.GetRowSpan(y);
                        for (int x = x0; x < x0 + CornerSampleSize && x < row.Length; x++)
                        {
                            samples.Add(row[x]);
                        }
                    }
                });
            }

            // Only the TOP two corners — for a half-body/hip-level shot
            // the bottom corners are far more likely to already contain
            // the subject (clothing), which would poison the background
            // estimate.
            SampleCorner(0, 0);
            SampleCorner(Math.Max(0, img.Width - CornerSampleSize), 0);

            if (samples.Count == 0) return new Rgba32(255, 255, 255, 255);

            return new Rgba32(
                (byte)samples.Average(p => p.R),
                (byte)samples.Average(p => p.G),
                (byte)samples.Average(p => p.B),
                255);
        }

        private static (int minX, int minY, int maxX, int maxY)? FindSubjectBoundsByColorDistance(Image<Rgba32> img, Rgba32 bgColor)
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
                        if (!IsSubjectPixel(row[x], bgColor)) continue;

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

        private static bool IsSubjectPixel(Rgba32 p, Rgba32 bgColor)
        {
            int dr = p.R - bgColor.R;
            int dg = p.G - bgColor.G;
            int db = p.B - bgColor.B;
            double distance = Math.Sqrt(dr * dr + dg * dg + db * db);
            return distance > BackgroundColorTolerance;
        }

        private static byte[] EncodePng(Image<Rgba32> img)
        {
            using var ms = new MemoryStream();
            img.SaveAsPng(ms);
            return ms.ToArray();
        }
    }
}