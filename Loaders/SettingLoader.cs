using Newtonsoft.Json;
using OpenTK.Windowing.GraphicsLibraryFramework;
using System;
using System.IO;
using System.Reflection;

namespace Voxel_Editor
{
    class SettingLoader
    {
        public static Config? LoadSettings(string path)
        {
            string loc = Assembly.GetExecutingAssembly().Location;
            string Path =
            System.IO.Path.GetDirectoryName(loc) + "\\Content\\" + path;
            if (!File.Exists(Path))
            {
                throw new FileNotFoundException("file not found at " + Path);
            }
            string Text = File.ReadAllText(Path);
            return JsonConvert.DeserializeObject<Config>(Text);
        }
    }
    class Config
    {
        public Keys[] MovementDirections;

        public Config(Keys[]? movementDirections = null)
        {
            MovementDirections = movementDirections ?? new Keys[]{Keys.W, Keys.A, Keys.S, Keys.D, Keys.Space, Keys.LeftControl };
        }
    }
}
