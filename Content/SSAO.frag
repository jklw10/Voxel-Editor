#version 450
precision highp float;

layout(location = 0) uniform sampler2D gPosition;
layout(location = 1) uniform sampler2D gNormal;

layout(location = 0) out float AO;

uniform int SSAOSampleCount;

layout(std430, binding = 2) buffer SSAOKernel
{
    vec3 SSAOSample[];
};

in vec4 gl_FragCoord;
in vec2 TexCoords;

uniform vec3 ViewPos;
uniform vec4 CamRot;

float near = 0.1f;
float far = 1000f;

vec3 Rotate(vec3 v, vec4 q)
{ 
    // separate the vector and scalar part of the quaternion
    vec3 u = q.xyz;
    float s = q.w;

    // Do the math
    return 2.0f * dot(u, v) * u
          + (s*s - dot(u, u)) * v
          + 2.0f * s * cross(u, v);
}
vec2 FlattenToScreen(vec3 pos, vec4 cameraRotation) {
  // Calculate the camera's forward direction in 3D space
  vec3 forward = vec3(0, 0, 1);
  forward = Rotate(forward, cameraRotation);

  // Calculate the camera's up direction in 3D space
  vec3 up = vec3(0, 1, 0);
  up = Rotate(up, cameraRotation);

  // Calculate the camera's right direction in 3D space
  vec3 right = cross(forward, up);

  // Calculate the 3D projection of the point onto the camera's view plane
  vec3 projection = pos - dot(pos, forward) * forward;

  // Calculate the 2D coordinates of the point on the camera's view plane
  vec2 screenCoords = vec2(dot(projection, right), dot(projection, up));

  return screenCoords;
}
layout(binding = 0, offset = 4) uniform atomic_uint Seed;
const float bias = 0.025;
float SSAO(vec3 pos, vec3 normal, float radius){
	float occlusion = 1.;
	float miss = 1.;
	//x-y = y->x
	vec3 camdiff = ViewPos- pos;
	float l = length(camdiff);
	if(l > far) return 1;
	l = 1/l;
	vec3 camDir = camdiff*l;
	vec3 absDir = abs(camDir);
	vec3 notDir = 1-absDir; //used for cool math
	//radius *=l;

	for(int i = 0; i < SSAOSampleCount; i++){
		// - create the sample sphere
		float scale = i / float(SSAOSampleCount);
		scale = mix(0.1,1.0,scale*scale);  // concentrate towards middle
		
		//creating sample to test occlusion for
		vec3 Sample = SSAOSample[i]; //basically a golden ratio turned into a sphere
		Sample = normalize(Sample); //into direction
		Sample *= scale; //multiply by distance from center
		Sample *= radius;
		Sample *= l; // divide by how far from camera. to read a smaller area of texture.

		//flatten sample to a 2d coord to read from texture :)
		/*vec2 tSamp = vec2(
			notDir.x*Sample.x+
			Sample.y*absDir.x,
			Sample.y*absDir.z+
			Sample.z*absDir.x+
			Sample.z*absDir.y); //*/

		vec2 tSamp= FlattenToScreen(Sample, CamRot);

		vec2 sTexCoords = TexCoords+ tSamp; 
		vec2 size = textureSize(gPosition,0);

		vec3 sPos = texture(gPosition, sTexCoords).rgb;
		
		bvec4 OOBs = lessThan(vec4(sTexCoords,size),vec4(0,0,sTexCoords));
		
		vec3 sampDiff = sPos-pos;
		float sampDist = length(sampDiff);
		vec3 sampDir = normalize(sampDiff);

		float towardCam = dot(camDir,sampDir);

		float tooFar = float(sampDist > radius || OOBs.x||OOBs.y||OOBs.z||OOBs.w);
		miss += tooFar;

		occlusion += towardCam * (1-tooFar);     
		
	}
	return 1.0- (occlusion / (SSAOSampleCount));
}

void main()
{
	vec3 pos = texture(gPosition, TexCoords).rgb;
	vec3 normal = texture(gNormal, TexCoords).rgb;
	//preferrably magic number into uniform but eh, soon:tm:
	float ssao = SSAO(pos, normal,2.);
	AO = ssao;
}
