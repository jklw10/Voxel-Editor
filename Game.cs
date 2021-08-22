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
using Voxel_Editor.Shaders;

namespace Voxel_Editor
{
    class Game
    {
        static readonly IWorld<Voxel,Vector3i> MainWorld = new ChunkWorld();
        static double movementSpeed;
        static Vector3i max = new(300);

        public static void OnLoad()
        {
            ShaderContainer.Init();
            new Camera(ShaderContainer.PassStack).Select();

            UpdateWorld();

            Menu.MakeDefaults();
            UpdateModes();
        }
        public static void OnUpdate(FrameEventArgs _)
        {
            UpdateControls();
        }
        static readonly Random r = new();
        public static void UpdateWorld()
        {

            /*
            Vector2i pos = (Vector2i)Camera.Main.Transform.Position.Xy;//World.Chunkify((Vector3i)Camera.Main.Transform.Position).CC.Xy;
            pos = Vector2i.Multiply(pos, 16);
            var dir = new Vector3((Vector2i)(MovSize.Xy.Normalized()));
            var sizeH = Vector3i.Divide(max, 2);
            MainWorld.ThrowAway();
            //*/
            /*
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
            MapLoader.LoadFile(MainWorld,"Accesses.txt",mode);

            Camera.Main.LoadWorld(MainWorld);
        }
        
        static int mode =1;
        static int shaderMode = 1;
        static Vector3 post;
        static Vector3 MovSize;
        public static void UpdateControls()
        {
            if (Input.KeyPress(Keys.Escape))
            {
                UpdateWorld();
            }
            if (Input.KeyPress(Keys.F3))
            {
                Menu.Default.Debug.Toggle();
            }
            if(Controls.Move(Keys.F4, Keys.F5, ref shaderMode) |
               Controls.Move(Keys.F,  Keys.G,  ref mode))
            {
                UpdateModes();
                UpdateWorld();
            }

            //if (Input.KeyDown(Keys.R))
            //{
            //    NoiseGenerator.Seed = r.Next(int.MaxValue);
            //    UpdateWorld();
            //}
            //if (Input.KeyDown(Keys.F))
            //{
            //    cubeRot *= new Quaternion(0, 0, 0.1f,1);
            //}
            //if (Input.KeyDown(Keys.G))
            //{
            //    cubeRot *= new Quaternion(0, 0,-0.1f, 1);
            //}

            movementSpeed = Controls.ModifierKey(Keys.LeftShift,0.5,0.02) * Time.PhysicsDeltaTime;
            Camera.Main.Transform.Position += Controls.Direction(Camera.Main.Transform.Rotation, (float)movementSpeed);

            MovSize += post - Camera.Main.Transform.Position;
            Vector3 rot = new(Engine.window.MouseState.Delta);
            Camera.RotateCamera(rot);
        }
        public static void UpdateModes()
        {
            Console.SetCursorPosition(0, 0);
            Console.Write("Mode: " + mode      + new string(' ', 3-mode.ToString().Length) + "|");
            ShaderContainer.SSAO.SetUniform1("Mode", shaderMode);
            Console.SetCursorPosition(0, 1);
            Console.Write("shaderMode: " + shaderMode + new string(' ', 3 - shaderMode.ToString().Length) + "|");
        }
        public static void OnFrame(FrameEventArgs _)
        {
        }
    }
}
