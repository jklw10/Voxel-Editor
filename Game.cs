using System;
using System.Collections.Generic;
using System.Text;
using Voxel_Engine;
using OpenTK;
using OpenTK.Mathematics;
using OpenTK.Windowing.GraphicsLibraryFramework;
using OpenTK.Graphics.OpenGL4;

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
        public static void OnLoad()
        {
            
            World w = new World();
            w.Select();
            Chunk c = new Chunk(0,0,0);
            Voxel v = new Voxel(new Color4(1f, 1f, 1f, 1f),new Vector3(1, 1, 1));
            v.Transform.Scale = new Vector3(1, 1, 1);
            c.Write(new Vector3i(1, 1, 1), v);
            w.ToDraw.Add(c);
            //Camera.Initialize();


            cam = new Camera(Engine.window.Size);
            cam.LoadWorld(w);
            cam.Select();
            UI.ImGuiAction += () => { };
            UI.IsActive = false;
            Engine.window.RenderFrequency = 144;
        }

        private static void RotateCamera(Vector2 dir)
        {
            float speed = 0.02f;
            Camera.Main.CameraLookAt =( Matrix4.CreateRotationZ(dir.X * speed) * Matrix4.CreateRotationY(dir.Y * speed) * new Vector4(Camera.Main.CameraLookAt)).Xyz;


        }

        public static void OnUpdate(FrameEventArgs obj)
        {
            if (Input.KeyPress(Keys.Escape))
            {
                Engine.window.CursorGrabbed = !Engine.window.CursorGrabbed;
            }
            RotateCamera(Engine.window.MouseState.Delta);
        }
        public static void OnFrame(FrameEventArgs obj)
        {
        }
    }
}
