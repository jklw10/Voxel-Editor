#version 450
precision highp float;


in vec4 gl_FragCoord;
in vec4 Color;
out vec4 color;

void main()
{
	color = Color; 
}


