#version 450
precision highp float;

layout(location = 0) uniform sampler2D screenTex;
layout(location = 1) uniform sampler2D depthTex;


uniform int SSAOSampleCount;

layout(std430, binding = 2) buffer SSAOKernel
{
    vec3 SSAOSample[];
};

in vec4 gl_FragCoord;
in vec2 TexCoords;
out vec4 color;

uniform vec2 Resolution;

uniform vec3 ViewPos;

vec3 FragWorldPos;

uniform int Mode;

uniform mat4 ProjMatrix;
uniform mat4 ViewMatrix;

float near = 0.1f;
float far = 1000f;

vec3 BlinnPhong(vec3 normal, vec3 fragPos, vec3 lightPos, vec3 lightColor){
    // diffuse
    vec3 lightDir = normalize(lightPos - fragPos);
    float diff = max(dot(lightDir, normal), 0.0);
    vec3 diffuse = diff * lightColor;
    // specular
    vec3 viewDir = normalize(ViewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = 0.0;
    vec3 halfwayDir = normalize(lightDir + viewDir);  
    spec = pow(max(dot(normal, halfwayDir), 0.0), 64.0);
    vec3 specular = spec * lightColor;    
    // simple attenuation
    float max_distance = 1.5;
    float distance = length(lightPos - fragPos);
    float attenuation = 1.0 / (distance * distance);
    
    diffuse *= attenuation;
    specular *= attenuation;
    
    return diffuse + specular;
}

float linearDepth(float depth){
	float ndc_depth = depth*2-1;
	return (2*near*far)/(far+near-ndc_depth*(far-near))/(far-near);
}

mat4 invProj;
mat4 invView;
vec3 ScreenToCam(vec3 frag){
    vec4 ndcPos;
    ndcPos.xyz = ((frag) * 2.0) - 1.0;
    ndcPos.w  = 1.0;
	vec4 clip = ndcPos * invProj;
    return (clip / clip.w).xyz;
}

vec3 ScreenToWorld(vec2 texCoords){
	vec3 posP = vec3(texCoords, texture(depthTex, texCoords).x)*2.0-1.0 ;
	vec4 posVS = vec4(posP,1) * invProj;
	return (vec4(posVS.xyz/posVS.w,1.0)*invView).xyz -ViewPos;
}

vec3 FragFromPos(vec3 pos)
{
	vec4 offset = vec4(pos+ViewPos, 1.0);
	offset      = offset * ViewMatrix * ProjMatrix;    // from world to clip-space
	offset.xyz /= offset.w;              
	return offset.xyz;
}
vec3 OriginalFragFromPos(vec3 pos)
{
	vec3 offset = FragFromPos(pos);
	vec2 texCoords = offset.xy * 0.5 + 0.5;
	return FragFromPos(ScreenToWorld(texCoords));
}
// Gold Noise function
const float PHI = 1.61803398874989484820459 * 00000.1; // Golden Ratio   
const float PI  = 3.14159265358979323846264 * 00000.1; // PI
const float SRT = 1.41421356237309504880169 * 10000.0; // Square Root of Two


float randomf(in vec2 coordinate, in float seed)
{
    return fract(sin(dot(coordinate*seed, vec2(PHI, PI)))*SRT);
}
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
vec4 randomQuat(in vec2 coordinate, in float seed){
	return vec4(randomf(coordinate, seed),randomf(coordinate, seed+1),randomf(coordinate, seed+2),1);
}
const vec2 nth = 1/Resolution;
layout(binding = 0, offset = 4) uniform atomic_uint Seed;
const float bias = 0.025;
vec3 SSAO(vec3 pos, vec3 normal, float depth, float radius){
	vec3 occlusion = vec3(1);
	for(int i = 0; i < SSAOSampleCount; i++){
		// - create the sample sphere
		float scale = i / float(SSAOSampleCount);
		scale = mix(0.1,1.0,scale*scale);  // concentrate towards middle

		//creating sample to test occlusion for
		vec3 Sample = SSAOSample[i] ; //basically a golden ratio turned into a sphere
		Sample = normalize(Sample);
		Sample = Rotate(Sample, randomQuat(gl_FragCoord.xy/5,atomicCounter(Seed))); //random rotation to decrease artifacting
		//TODO: make into a normal oriented half sphere
		Sample = dot(Sample, normal) > 0 ? Sample : reflect(Sample,normal); //if doesn't point outwards flip vector.
		
		Sample *= scale;
		Sample *= radius;

		//position sample at fragment's world position
		vec3 samplePos = pos + Sample;

		// - check for depth difference in the sample versus the original depth.
		vec3 sampScr = FragFromPos(samplePos);  //contains the depth calculated from the sample
		vec2 sTexCoords = sampScr.xy * 0.5 + 0.5;		  
		vec3 Base = FragFromPos(ScreenToWorld(sTexCoords));  //contains the depth of the original depth buffer. 



		vec3 direction = (sampScr- bias)- Base; //Base- samplePos;
		//depth = texture(depthTex, TexCoords).x; aka fragcoord depth not sample true depth or depth at sample's frag coord.
		float rangeCheck = smoothstep(0.0, 1.0, radius / distance(direction,vec3(0))); // should be exact copy of tutorial
		occlusion += ((dot(direction,vec3(0,0,1)) > 0) ? 1.0 : 0.0) * rangeCheck;     
		 
	}
	return 1.0 - (occlusion / SSAOSampleCount);
}
//a-b = b->a

const int PSampleSize = 5;
const int PSampleRet = PSampleSize*PSampleSize;
const int NSampleSize = PSampleSize-1;
const int NSampleRet = NSampleSize*NSampleSize;

vec3[NSampleRet] sampleNormals(vec2 spread){

	int success = 0;
	vec3 samples[NSampleRet];
	for(int y = 0; y < NSampleSize; y++){
		int offy = y*NSampleSize;
		for(int x = 0; x < NSampleSize; x++){

			int bump = PSampleSize/2;

			vec3 a = ScreenToWorld(TexCoords+ (ivec2(x,y)+ivec2(0,0)-bump)*spread/Resolution);
			vec3 b = ScreenToWorld(TexCoords+ (ivec2(x,y)+ivec2(1,0)-bump)*spread/Resolution);
			vec3 c = ScreenToWorld(TexCoords+ (ivec2(x,y)+ivec2(0,1)-bump)*spread/Resolution);
			vec3 d = ScreenToWorld(TexCoords+ (ivec2(x,y)+ivec2(1,1)-bump)*spread/Resolution);

			//float f1 = step(distance(b-a,c-b),2.0); 
			//float f2 = step(distance(b-d,c-b),2.0); 

			vec3 samp1 = normalize(cross(b-a,c-b)); // 00->10, 10->01
			vec3 samp2 = normalize(cross(b-c,d-b)); // 01->10, 11->01
			samples[offy+x]	= (samp1+samp2)/2;
		}
	}
	return samples;
}

int modeCount = 0;
bool ModeSelected(){
	modeCount++;
	return Mode == modeCount;
}


//step = first > second
//0 = first > second
//1 = first <= second
#define PRECISION 0.0
float IsZero(float val){
	return step(-PRECISION, val) * (1.0 - step(PRECISION, val));
}
float NotZero(float val){
	return 1.-IsZero(val);
}
float NotZero(vec3 val){
	return NotZero(val.x) * NotZero(val.y) * NotZero(val.z);
}

float gamma = 2.2;
void main()
{
	atomicCounterIncrement(Seed);
	invProj = inverse(ProjMatrix);
	invView = inverse(ViewMatrix);
	float fDist = texture(depthTex, TexCoords).x;

	color = vec4(pow(texture(screenTex, TexCoords).rgb, vec3(1/gamma)),1);
	
	FragWorldPos = ScreenToWorld(TexCoords);

	vec3 Normals[NSampleRet] = sampleNormals(vec2(1,1));
	vec3 avg = vec3(0);
	for(int x = 0; x < NSampleRet; x++)
	{
		avg	 += Normals[x];
	}
	avg /= NSampleRet;
	
	if (ModeSelected()){
		color.xyz *= vec3(SSAO(FragWorldPos,avg,fDist,2.));
	}
	if (ModeSelected()){
		color.xyz = avg/2+0.5;
	}
	if (ModeSelected()){
		color = vec4(fract(ScreenToWorld(TexCoords)),1);
	}
	if (ModeSelected()){
		color.xyz = vec3(OriginalFragFromPos(FragWorldPos).z);
	}
	
}
