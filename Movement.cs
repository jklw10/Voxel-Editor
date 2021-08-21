﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Voxel_Editor
{
    using Voxel_Engine.Utility;
    using OpenTK.Windowing.GraphicsLibraryFramework;
    using OpenTK.Mathematics;

    class Movement
    {
        public static Vector3 Direction(Quaternion direction, float movementSpeed)
        {
            Vector3 output = new(0);
            if (Input.KeyDown(Keys.W))
            {
                output += direction * -Vector3.UnitZ;
            }
            if (Input.KeyDown(Keys.A))
            {
                output += direction * -Vector3.UnitX;
            }
            if (Input.KeyDown(Keys.S))
            {
                output += direction * Vector3.UnitZ;
            }
            if (Input.KeyDown(Keys.D))
            {
                output += direction * Vector3.UnitX;
            }
            if (Input.KeyDown(Keys.Space))
            {
                output += direction * Vector3.UnitY;
            }
            if (Input.KeyDown(Keys.LeftControl))
            {
                output += direction * -Vector3.UnitY;
            }
            if(output != Vector3.Zero)
            {
                output.Normalize();
            }
            output *= movementSpeed;
            return output;
        }
        public static double ModifierKey(Keys key, double down, double up) => Input.KeyDown(key) ? down : up;
    }
}
