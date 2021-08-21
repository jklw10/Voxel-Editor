using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using System.Resources;
using System.Reflection;
using Newtonsoft.Json;
using OpenTK.Mathematics;
namespace Voxel_Editor
{
    using Voxel_Engine.DataHandling;
    class MapLoader
    {
        public static void LoadFile(ChunkWorld world,string path,int mode)
        {
            string loc = Assembly.GetExecutingAssembly().Location;
            string Path =
            System.IO.Path.GetDirectoryName(loc) + "\\Content\\" + path;
            if (!File.Exists(Path))
            {
                throw new FileNotFoundException("file not found at " + Path);
            }
            string Text = File.ReadAllText(Path);

            Root? asd = JsonConvert.DeserializeObject<Root>(Text);

            if (asd is null || asd.BlockChecks is null) return;
            foreach(IntermediaryVoxel v in asd.BlockChecks)
            {
                if(mode == (int)v.AccessType){
                    world.Write(new((int)Math.Round(v.x), (int)Math.Round(v.y), (int)Math.Round(v.z)), new(System.Drawing.Color.FromArgb(100,(byte)v.AccessType * 100,100)));
                }
            }
        }
    }
    public class IntermediaryVoxel
    {
        [JsonProperty(PropertyName = "accesstype")]
        public AccessType AccessType;
        public double x, y, z;
    }
    public class Root
    {

        [JsonProperty(PropertyName = "blockChecks")]
        public List<IntermediaryVoxel>? BlockChecks { get; set; }
    }
    public enum AccessType
    {
        WORLDGET, CACHEGET, CACHEWRITE
    }
}
