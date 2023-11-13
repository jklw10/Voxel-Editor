#version 450
precision highp float;

layout(location = 0) uniform sampler2D gColor;
layout(location = 1) uniform sampler2D gPosition;
layout(location = 2) uniform sampler2D gNormal;
layout(location = 3) uniform sampler2D AO;

in vec2 TexCoords;

uniform int Mode;

out vec4 color;

float gamma = 2.2;

int modeCount = 0;
bool ModeSelected(){
	modeCount++;
	return Mode == modeCount;
}
vec2 UvFromWpos(vec3 pos, vec3 center, vec3 size){
  vec3 hSize = size / 2f;
  vec3 pDir = normalize( center - pos);
  vec3 dir;
  dir.x = dot(pDir,vec3(1,0,0));  
  dir.y = dot(pDir,vec3(0,1,0)); 
  dir.z = dot(pDir,vec3(0,0,1)); 
  //find plane that the point lies on
  vec3 absD = (abs(dir));
  
  bvec3 faceMask = greaterThanEqual(absD.xyz, max(absD.yzx, absD.zxy));

  dir += sign(dir) * vec3(faceMask);

  ivec3 absDir = ivec3(abs(dir));
  ivec3 notDir = 1 - absDir;
  pos/=size;
  pos = fract(pos);
  //squeeze coordinate to be on said plane and get the 2d position.
  vec2 uv= vec2(
      notDir.x*pos.x + notDir.y*pos.y*absDir.x,

      notDir.y*pos.y*absDir.z+
      notDir.z*pos.z*absDir.x+
      notDir.z*pos.z*absDir.y); 

  return uv;
}
vec2 UvFromWpos2(vec3 pos, vec3 center, vec3 size){
  vec3 hSize = size / 2f;
  vec3 pDir = normalize( center - pos);
  vec3 dir;
  dir.x = dot(pDir,vec3(1,0,0));  
  dir.y = dot(pDir,vec3(0,1,0)); 
  dir.z = dot(pDir,vec3(0,0,1)); 
  //find plane that the point lies on
  vec3 absD = (abs(dir));
  
  bvec3 faceMask = greaterThanEqual(absD.xyz, max(absD.yzx, absD.zxy));

  dir += sign(dir) * vec3(faceMask);

  ivec3 absDir = ivec3(abs(dir));
  ivec3 notDir = 1 - absDir;
  pos/=size;
  pos = fract(pos);
  //squeeze coordinate to be on said plane and get the 2d position.
  vec2 uv= vec2(
      notDir.x*pos.x+ 
      absDir.x*pos.y,
      absDir.z*pos.y+
      absDir.x*pos.z+
      absDir.y*pos.z); 

  return uv;
}
vec2 wUvFromWpos(vec3 pos, vec3 normal, vec3 size){
  vec3 absDir = vec3(abs(normal));
  vec3 notDir = 1 - absDir;
  pos/=size;
  //squeeze coordinate to be on said plane and get the 2d position.
  vec2 uv= vec2(
      notDir.x*pos.x +
      notDir.y*pos.y*absDir.x,
      notDir.y*pos.y*absDir.z+
      notDir.z*pos.z*absDir.x+
      notDir.z*pos.z*absDir.y); 

  return uv;
}
vec2 wUvFromWpos2(vec3 pos, vec3 normal, vec3 size){
  vec3 absDir = vec3(abs(normal));
  vec3 notDir = 1 - absDir;
  pos/=size;
  //squeeze coordinate to be on said plane and get the 2d position.
   vec2 uv= vec2(
      notDir.x*pos.x+ 
      absDir.x*pos.y,
      absDir.z*pos.y+
      absDir.x*pos.z+
      absDir.y*pos.z);  

  return uv;
}
int Seed = 1111111;
int Octaves = 8;
float Amplitude = 1;
float Frequency = 0.015;
float Persistence = 0.65;
float NoiseGeneration(int x, int y)
{
    int n = x + y * 57;
    n = (n << 13) ^ n;

    return (1.0 - ((n * (n * n * 15731 + 789221) + Seed) & 0x7fffffff) / 1073741824.0);
}
float SmoothLerp(float x, float y, float a)
{
    float value = (1 - cos(a * 3.141592653)) * 0.5;
    return x * (1 - value) + y * value;
}
float Smooth(vec2 pos)
{
    ivec2 ipos = ivec2(pos);
    float n1 = NoiseGeneration((ipos.x),      (ipos.y));
    float n2 = NoiseGeneration((ipos.x) + 1,  (ipos.y));
    float n3 = NoiseGeneration((ipos.x),      (ipos.y) + 1);
    float n4 = NoiseGeneration((ipos.x) + 1,  (ipos.y) + 1);

    float i1 = SmoothLerp(n1, n2, fract(pos.x));
    float i2 = SmoothLerp(n3, n4, fract(pos.x));

    return SmoothLerp(i1, i2, fract(pos.y));
}
float Noise(vec2 pos)
{
    //returns -1 to 1
    float total = 0.0;
    float freq = Frequency, amp = Amplitude;
    for(int i = 0; i < Octaves; ++i)
    {
        total += Smooth(pos * freq) * amp;
        freq *= 2;
        amp *= Persistence;
    }
    if (total < -2.4) total = -2.4;
    else if (total > 2.4) total = 2.4;

    return float(total / 2.4);
}
void main()
{
	color.rgb = texture(gColor,TexCoords).rgb;// * texture(AO,TexCoords).r;
	color.a = 1;
	vec3 pos = texture(gPosition,TexCoords).rgb;
	vec3 normal = texture(gNormal,TexCoords).rgb;
	float AO = texture(AO,TexCoords).r;
    if(ModeSelected()){
		color.rgb = fract(vec3((abs(wUvFromWpos(pos,normal,vec3(1)))),0));
	}
    if(ModeSelected()){
		color.rgb = fract(vec3((abs(wUvFromWpos2(pos,normal,vec3(1)))),0));
	}
	if (ModeSelected()){
		color.rgb *= AO;
	}
	if (ModeSelected()){
		color.rgb = vec3(AO);
	}
	if (ModeSelected()){
		color.rgb = .5+.5*normal;
	}
	if (ModeSelected()){
		color.rgb = fract((pos-.001)/16);
	}
	if (ModeSelected()){
		color.rgb = mix(vec3(1),color.rgb,min(1000/(length(pos)),1));
	}
	if(ModeSelected()){
		color.rgb += vec3(Noise(abs(wUvFromWpos(pos,normal,vec3(1)))))/10;
		color.rgb += AO/2;
	}
    
	//color.rgb = (pow(color.rgb, vec3(1/gamma)));
}