using System;
using Voxel_Engine;

namespace Voxel_Editor
{
    class Program
    {
        static void Main()
        {
            Console.WriteLine("Starting editor");

           // Engine.Initialize()
            Engine.Window.Load += Game.OnLoad;
            Engine.Window.UpdateFrame += Game.OnUpdate;
            Engine.Window.RenderFrame += Game.OnFrame;
            Engine.CreateWindow();
        }
    }
}
