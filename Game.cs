using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using System.Threading;

using OpenTK;
using OpenTK.Mathematics;
using OpenTK.Windowing.GraphicsLibraryFramework;
using OpenTK.Graphics.OpenGL4;

using OpenTK.Windowing.Common;

using Voxel_Engine;
using Voxel_Engine.Utility;
using Voxel_Engine.GUI;
using Voxel_Engine.DataHandling;
using Voxel_Engine.Rendering;

namespace Voxel_Editor
{
    class Game
    {
        static readonly IWorld<Voxel,Vector3i> MainWorld = new ChunkWorld();
        static double movementSpeed;
        static Vector3i max = new(300);

        static readonly ShaderPass SSAO = new("SSAO", 
            new Texture[] {
                new(TextureType.Color,"screenTex"),
                new(TextureType.Depth,"depthTex")
            });
        public static void OnLoad()
        {
            new Camera(new ShaderPassStack(SSAO)).Select();
            CreateSSAOKernel();

            UpdateWorld();

            Menu.MakeDefaults();
            UI.IsActive = true;
            UpdateModes();
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
        public static void OnUpdate(FrameEventArgs _)
        {
            UpdateControls();
        }
        static readonly Random r = new();
        static Quaternion cubeRot = Quaternion.Identity;
        public static void UpdateWorld()
        {

            /*
            Vector2i pos = (Vector2i)Camera.Main.Transform.Position.Xy;//World.Chunkify((Vector3i)Camera.Main.Transform.Position).CC.Xy;
            pos = Vector2i.Multiply(pos, 16);
            var dir = new Vector3((Vector2i)(MovSize.Xy.Normalized()));
            var sizeH = Vector3i.Divide(max, 2);
            MainWorld.ThrowAway();
            //*/
            
            for (int x = 0; x < 1000; x++)
            {
                for (int z = 0; z < 1000; z++)
                {
                    //if (World.ThrowCheck(World.Chunkify(new(x, 0, z)).CC, new(pos), Vector3.Multiply(dir * sizeH, -1)))
                    {
                        float noise1 = (float)MathHelper.Clamp(NoiseGenerator.Noise(x, z) + 0.5, 0.01, 1);//Patterns.noise(new Vector2(x/10f, z/10f));
                        float noise2 = (float)MathHelper.Clamp(NoiseGenerator.Noise(x / 10, z / 10) + 0.5, 0.01, 1);//Patterns.noise(new Vector2(x/10f, z/10f));
                        float noise = noise1 * noise2 * noise2;
                        Voxel v = new(255, 0, (byte)((1f - noise) * 255), 0);
                        MainWorld[new Vector3i(x, (int)(noise * 10), z)] = v;
                    }
                }
            }//*/
            /*
            Voxel v = new(System.Drawing.Color.FromArgb(255, 0, 100, 0));
            int cubeMax = 20;
            for (int x = -cubeMax / 2; x < cubeMax/2; x++)
            {
                for (int y = -cubeMax; y < cubeMax; y++)
                {
                    for (int z = -cubeMax*2; z < cubeMax*2; z++)
                    {
                        Vector3 pos = cubeRot* new Vector3(x, y, z);
            
                        MainWorld[(Vector3i)(pos)] = v;
                    }
                }
            }//*/

            Camera.Main?.LoadWorld(MainWorld);
        }
        
        static int mode =1;
        static Vector3 post;
        static Vector3 MovSize;
        public static void UpdateControls()
        {
            post = Camera.Main.Transform.Position;
            if(Math.Abs(MovSize.X) >= 16 || Math.Abs(MovSize.Y) >= 16 || Math.Abs(MovSize.Z) >= 16)
            {
                //UpdateWorld();
                MovSize = new(0);
            }
            if (Input.KeyPress(Keys.Escape))
            {
                UpdateWorld();
            }
            if (Input.KeyPress(Keys.F2))
            {
                Menu.Default.Debug.Toggle();
            }
            if (Input.KeyPress(Keys.F3))
            {
                Menu.Default.Debug.Toggle();
            }
            if (Input.KeyPress(Keys.F4))
            {
                mode--;
                UpdateModes();
                UpdateWorld();
            }
            if (Input.KeyPress(Keys.F5))
            {
                mode++;
                UpdateModes();
                UpdateWorld();
            }
            

            if (Input.KeyDown(Keys.R))
            {
                NoiseGenerator.Seed = r.Next(int.MaxValue);
                UpdateWorld();
            }
            if (Input.KeyDown(Keys.F))
            {
                cubeRot *= new Quaternion(0, 0, 0.1f,1);
            }
            if (Input.KeyDown(Keys.G))
            {
                cubeRot *= new Quaternion(0, 0,-0.1f, 1);
            }

            movementSpeed = Movement.ModifierKey(Keys.LeftShift,0.5,0.02) * Time.DeltaTime;
            Camera.Main.Transform.Position += Movement.Direction(Camera.Main.Transform.Rotation, (float)movementSpeed);

            MovSize += post - Camera.Main.Transform.Position;
            Vector3 rot = new(Engine.window.MouseState.Delta);
            Camera.RotateCamera(rot);
        }
        public static void UpdateModes()
        {
            SSAO.SetUniform1("Mode", mode);
            Console.SetCursorPosition(0, 0);
            Console.Write("Shader Mode: " + mode + "    ");
        }
        public static void OnFrame(FrameEventArgs _)
        {
        }
    }
    public class Relative
    {
        public bool INSIDE, POSITIVE, NEGATIVE;

        public static Relative From(int min, int max, double pos)
        {
            var r = new Relative();
            int posi = (int)Math.Floor(pos);
            if (max > posi && min > posi)
            {
                r.POSITIVE = true;
                return r;
            }
            else if (min < posi && max < posi)
            {
                r.NEGATIVE = true;
                return r;
            }
            r.INSIDE = true;
            return r;
        }
    }
}
