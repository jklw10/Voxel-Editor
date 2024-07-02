using System;
using OpenTK.Mathematics;
using OpenTK.Windowing.GraphicsLibraryFramework;

using OpenTK.Windowing.Common;

using Voxel_Engine;
using Voxel_Engine.Utility;
using Voxel_Engine.GUI;
using Voxel_Engine.DataHandling;
using Voxel_Engine.Rendering;
using Voxel_Editor.Shaders;
using Voxel_Engine.Controls;
using static Voxel_Engine.Rendering.IGLType;

namespace Voxel_Editor
{
    class Game
    {
        static readonly IWorld<Voxel,Vector3i> MainWorld = new OctreeWorld(10);
        static double movementSpeed;
        static Vector3i max = new(100);
        
        public static void OnLoad()
        {
            new Camera(ShaderContainer.PassStack).Use();
            UpdateModes();
            UpdateWorld();
            Menu.MakeDefaults();
        }
        public static void OnUpdate(FrameEventArgs _)
        {
            UpdateControls();
        }
        static readonly Random r = new();
        public static void UpdateWorld()
        {
            for (int x = 0; x < max.X; x++)
            {
                for (int y = 0; y < max.Y; y++)
                {
                    float noise =(NoiseGenerator.Noise((x+ max.X) , (y+ max.Y) +0f) /2+.5f);
                    float pre1 = (NoiseGenerator.Noise((x+ max.X) / 100f, (y + max.Y) / 100f) / 2 + .5f);
                    float pre2 = (NoiseGenerator.Noise((x+ max.X) / (pre1* noise* 10f), (y + max.Y) / (pre1* noise*10f)) / 2 + .5f);
                    float noise2 = (noise*4) +0.5f-pre2; // SmoothStep(pre1, pre2,);
                    for (int i = 0; i < noise2 * 20; i++)
                    {
                        MainWorld[new(x, i, y)] = new Voxel(1,125,125, (byte)((1 - pre2) * 255));
                    }
                }
            }
            //MapLoader.LoadFile(MainWorld,"Accesses.txt",mode);

            //Camera.Main.(MainWorld);
        }
        
        static int mode =1;
        static int shaderMode = 1;
        public static void UpdateControls()
        {
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

            movementSpeed = Controls.ModifierKey(Keys.LeftShift,0.5,0.02) * Time.PhysicsDeltaTime;
            Vector3 pos = Camera.Main.Transform.Position;
            pos += Controls.Direction(Camera.Main.Transform.Rotation, (float)movementSpeed);
            Transform t = Camera.Main.Transform;
            t.Position = pos;
            Camera.Main.Transform = t;


            Vector3 rot = new(Engine.Window.MouseState.Delta);
            Camera.Main?.Transform.Rotate(rot);
        }
        public static void UpdateModes()
        {
            Console.SetCursorPosition(0, 0);
            Console.Write("Mode: " + mode      + new string(' ', 3-mode.ToString().Length) + "|");
            (ShaderContainer.SSAO as IRenderable).SetUniform(new(new("Mode"), new Int1(shaderMode)));
            Console.SetCursorPosition(0, 1);
            Console.Write("shaderMode: " + shaderMode + new string(' ', 3 - shaderMode.ToString().Length) + "|");
        }
        public static void OnFrame(FrameEventArgs _)
        {
        }
    }
}
