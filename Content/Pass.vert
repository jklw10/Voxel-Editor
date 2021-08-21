#version 450
in int gl_VertexID;
out vec2 TexCoords;

void main()
{
    gl_Position   = vec4(0,0,0,1);
	gl_Position.x = float(gl_VertexID/2)*4.-1.;
	gl_Position.y = float(gl_VertexID%2)*-4.+1.;
	TexCoords.x   = float(gl_VertexID/2)*2.;
	TexCoords.y =1.-float(gl_VertexID%2)*2.;
}
