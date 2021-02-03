using System;
using Voxel_Engine;

namespace Voxel_Editor
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Starting editor");

           // Engine.Initialize()
            Engine.window.Load += Game.OnLoad;
            Engine.window.UpdateFrame += Game.OnUpdate;
            Engine.window.RenderFrame += Game.OnFrame;
            Engine.CreateWindow();
        }
    }
}
