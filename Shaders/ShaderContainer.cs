using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Voxel_Engine.Rendering;
using Voxel_Engine.Utility;
using OpenTK.Graphics.OpenGL4;

namespace Voxel_Editor.Shaders
{
    class ShaderContainer
    {
        public static readonly ShaderPass SSAO = new("SSAO",
            new Texture[] {
                new(TextureType.Color,"screenTex"),
                new(TextureType.Depth,"depthTex")
            });
        public static readonly ShaderPassStack PassStack = new(SSAO);

        public static void Init()
        {
            CreateSSAOKernel();
        }

        public static void CreateSSAOKernel()
        {
            int SSAOSampleCount = 128;
            int SSAOKernelBuffer = GL.GenBuffer();
            SSAO.SetUniform1("SSAOSampleCount", SSAOSampleCount);
            SSAO.Use();
            float[] positions = Tools.SpherePoints(SSAOSampleCount);
            GL.BindBuffer(BufferTarget.ShaderStorageBuffer, SSAOKernelBuffer);
            GL.BufferData(BufferTarget.ShaderStorageBuffer, sizeof(float) * positions.Length, positions, BufferUsageHint.StaticDraw);
            GL.BindBufferBase(BufferRangeTarget.ShaderStorageBuffer, 2, SSAOKernelBuffer);
            GL.BindBuffer(BufferTarget.ShaderStorageBuffer, 0);
        }
    }
}
