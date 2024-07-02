namespace Voxel_Editor.Shaders;

using Voxel_Engine.Rendering;
using Voxel_Engine.Utility;
using Voxel_Engine.DataHandling;

using OpenTK.Graphics.OpenGL4;
using static Voxel_Engine.Rendering.IGLType;

static class ShaderContainer
{

    static Uniform SampleCountLocation = new("SSAOSampleCount", new Int1(0));
    static readonly Texture color = new(TextureType.Color4, new("gColor"));
    static readonly Texture position = new(TextureType.Float3, new("gPosition"));
    static readonly Texture normal = new(TextureType.Float3, new("gNormal"));
    static readonly Texture AO = new(TextureType.Float, new("AO"));

    public static readonly ShaderPass RT = new("Raymarch",
        input: null,
        output: new(
            color,
            position,
            normal
        ));

    public static readonly ShaderPass SSAO = MakeSSAOShader();

    public static readonly ShaderPass Filter = new("Filter",
        input: new Texture[] {
            color,
            position,
            normal,
            AO
        });
    public static readonly RenderPassStack PassStack = new(RT, SSAO, Filter);

    static ShaderContainer()
    {
        MakeSSAOShader();
    }

    readonly static ShaderStorageBuffer<float> SSAOKernelBuffer = new(2, BufferUsageHint.StaticDraw);
    readonly static int SSAOSampleCount = 32;
    public static ShaderPass MakeSSAOShader()
    {
        ShaderPass shader = new("SSAO",
        input: new Texture[] {
            position,
            normal
        },
        output: new(
            AO
        ));

        (shader as IRenderable).Use();
        SampleCountLocation.value = new Int1(SSAOSampleCount);
        (shader as IRenderable).SetUniform(SampleCountLocation);
        float[] positions = Tools.SpherePoints(SSAOSampleCount);
        SSAOKernelBuffer.SetData(positions);
        GL.BindBuffer(BufferTarget.ShaderStorageBuffer, 0);
        return shader;
    }
}
