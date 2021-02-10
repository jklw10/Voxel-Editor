using System;
using System.Collections.Generic;
using System.Text;
using Voxel_Engine;
using OpenTK;
using OpenTK.Mathematics;
using OpenTK.Windowing.GraphicsLibraryFramework;
using OpenTK.Graphics.OpenGL4;

using System.Threading.Tasks;
using System.Threading;

using OpenTK.Windowing.Common;

using Voxel_Engine.Utility;
using Voxel_Engine.GUI;
using Voxel_Engine.DataHandling;
using Voxel_Engine.Rendering;

namespace Voxel_Editor
{
    class Game
    {
        static Camera cam;
        static float movementSpeed;
        public static void OnLoad()
        {

            World w = new World();
            
           
            for (int i = 0; i < 100; i++)
            {
                Voxel v = new Voxel(new Color4(Math.Abs((5-(i+0)%10)/ 10f), Math.Abs((5 - (i + 3) % 10) / 10f), Math.Abs((5 - (i + 6) % 10)/ 10f), 1f), new Vector3(1, i, 1));
                w.Write(new Vector3i(1, i, 1), v);
            }
            //Camera.Initialize();


            cam = new Camera(Engine.window.Size);
            cam.LoadWorld(w);
            cam.Select();
            Menu.MakeDefaults();
            UI.IsActive = true;
        }

        public static void OnUpdate(FrameEventArgs obj)
        {
            if (Input.KeyPress(Keys.Escape))
            {
                UI.ToggleMouseAttachment();
            }
            if (Input.KeyPress(Keys.F3))
            {
                Menu.Default.Debug.Toggle();
            }
            if (Input.KeyDown(Keys.LeftControl))
            {
                movementSpeed = 0.5f;
            }
            else
            {
                movementSpeed = 0.04f;
            }
            if (Input.KeyDown(Keys.W))
            {
                Camera.Main.Transform.Position += Camera.Main.Transform.Rotation * Vector3.UnitZ *-movementSpeed;
            }
            if (Input.KeyDown(Keys.A))
            {
                Camera.Main.Transform.Position += Camera.Main.Transform.Rotation * Vector3.UnitX *-movementSpeed;
            }
            if (Input.KeyDown(Keys.S))
            {
                Camera.Main.Transform.Position += Camera.Main.Transform.Rotation * Vector3.UnitZ * movementSpeed;
            }
            if (Input.KeyDown(Keys.D))
            {
                Camera.Main.Transform.Position += Camera.Main.Transform.Rotation * Vector3.UnitX * movementSpeed; 
            }
            if (Input.KeyDown(Keys.Space))
            {
                Camera.Main.Transform.Position += Camera.Main.Transform.Rotation * Vector3.UnitY * movementSpeed;
            }
            if (Input.KeyDown(Keys.LeftShift))
            {
                Camera.Main.Transform.Position += Camera.Main.Transform.Rotation * Vector3.UnitY *-movementSpeed;
            }
            
            Camera.RotateCamera(Engine.window.MouseState.Delta);
        }
        public static void OnFrame(FrameEventArgs obj)
        {
        }
    }
}
