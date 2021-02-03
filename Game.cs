using System;
using System.Collections.Generic;
using System.Text;
using Voxel_Engine;
using OpenTK;
using OpenTK.Mathematics;
using OpenTK.Windowing.GraphicsLibraryFramework;
using System.Threading;
using OpenTK.Windowing.Common;

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
            cam.Select();
            Engine.window.MouseMove += OnMouseMove;
            cam.LoadWorld(w);
            UI.ImGuiAction += () => { };
            UI.IsActive = false;
        }

        private static void OnMouseMove(MouseMoveEventArgs MMEArgs)
        {
            Camera.Main.CameraLookAt = (Quaternion.FromAxisAngle(Vector3.UnitX, MMEArgs.DeltaX) * Quaternion.FromAxisAngle(Vector3.UnitZ, MMEArgs.DeltaY)) * cam.CameraLookAt;
        }

        public static void OnUpdate(FrameEventArgs obj)
        {
            if (Input.KeyPress(Keys.Escape))
            {
                Engine.window.CursorGrabbed = !Engine.window.CursorGrabbed;
               // Engine.window.CursorVisible = !Engine.window.CursorVisible;
                
            }
        }
        
        public static void OnFrame(FrameEventArgs obj)
        {
        }
    }
}
