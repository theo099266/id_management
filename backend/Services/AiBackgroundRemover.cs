// Services/AiBackgroundRemover.cs
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using System.Threading;
namespace Backend.Services
{
    public class AiBackgroundRemover : IDisposable
    {
        private readonly Lazy<InferenceSession> _sessionLazy;
        private InferenceSession Session => _sessionLazy.Value;
        private const int ModelSize = 320; // U²-Net standard input size

        public AiBackgroundRemover(string modelPath)
        {
            // Don't touch the native ONNX runtime here — defer until first real use.
            // This means DI can construct this service (and anything that depends on it,
            // including unrelated controllers) even on hosts where the native ONNX
            // binaries can't load. The failure only surfaces when background removal
            // is actually invoked.
            _sessionLazy = new Lazy<InferenceSession>(
    () => new InferenceSession(modelPath),
    LazyThreadSafetyMode.ExecutionAndPublication
);
        }

        /// <summary>
        /// Runs U²-Net on the image and returns a PNG (with alpha) as a byte array,
        /// with the background made transparent based on the predicted saliency mask.
        /// </summary>
        public async Task<byte[]> RemoveBackgroundAsync(byte[] inputImageBytes)
        {
            using var original = Image.Load<Rgba32>(inputImageBytes);
            int origW = original.Width;
            int origH = original.Height;

            // Preprocess: resize to model input size, normalize to [0,1]
            using var resized = original.Clone(ctx => ctx.Resize(ModelSize, ModelSize));

            var input = new DenseTensor<float>(new[] { 1, 3, ModelSize, ModelSize });
            resized.ProcessPixelRows(accessor =>
            {
                for (int y = 0; y < ModelSize; y++)
                {
                    var row = accessor.GetRowSpan(y);
                    for (int x = 0; x < ModelSize; x++)
                    {
                        var px = row[x];
                        input[0, 0, y, x] = px.R / 255f;
                        input[0, 1, y, x] = px.G / 255f;
                        input[0, 2, y, x] = px.B / 255f;
                    }
                }
            });

            var inputName = Session.InputMetadata.Keys.First();
            var inputs = new List<NamedOnnxValue> { NamedOnnxValue.CreateFromTensor(inputName, input) };

            using var results = await Task.Run(() => Session.Run(inputs));
            var output = results.First().AsTensor<float>(); // shape [1,1,320,320] saliency map

            // Build a grayscale mask image at model resolution, then resize up to original size
            using var maskImg = new Image<L8>(ModelSize, ModelSize);
            float min = float.MaxValue, max = float.MinValue;
            for (int y = 0; y < ModelSize; y++)
                for (int x = 0; x < ModelSize; x++)
                {
                    var v = output[0, 0, y, x];
                    if (v < min) min = v;
                    if (v > max) max = v;
                }
            float range = Math.Max(max - min, 1e-6f);

            maskImg.ProcessPixelRows(accessor =>
            {
                for (int y = 0; y < ModelSize; y++)
                {
                    var row = accessor.GetRowSpan(y);
                    for (int x = 0; x < ModelSize; x++)
                    {
                        float norm = (output[0, 0, y, x] - min) / range; // 0..1
                        row[x] = new L8((byte)(norm * 255));
                    }
                }
            });

            maskImg.Mutate(ctx => ctx.Resize(origW, origH));

            // Apply mask as alpha channel on the original-resolution image
            using var result = original.Clone();
            result.ProcessPixelRows(maskImg, (resultAccessor, maskAccessor) =>
            {
                for (int y = 0; y < origH; y++)
                {
                    var resultRow = resultAccessor.GetRowSpan(y);
                    var maskRow = maskAccessor.GetRowSpan(y);
                    for (int x = 0; x < origW; x++)
                    {
                        var alpha = maskRow[x].PackedValue;
                        var p = resultRow[x];
                        resultRow[x] = new Rgba32(p.R, p.G, p.B, alpha);
                    }
                }
            });

            using var ms = new MemoryStream();
            await result.SaveAsPngAsync(ms);
            return ms.ToArray();
        }

        public void Dispose()
        {
            if (_sessionLazy.IsValueCreated)
                _sessionLazy.Value.Dispose();
        }
    }
}