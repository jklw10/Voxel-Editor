#version 450
precision highp float;

layout(location = 0) uniform sampler2D screenTex;
layout(location = 1) uniform sampler2D depthTex;

layout(location = 0) out vec4 gColor;
layout(location = 1) out vec3 gPosition;
layout(location = 2) out vec3 gNormal;

uniform vec3 ViewPos;
uniform vec4 CamRot;

uniform vec3 SunDir;

uniform mat4 ViewMatrix;

//contains locations of chunks inside ChunkContainer
layout(std430, binding = 3) buffer ChunkLocator
{
    uint ChunkLocations[];
};
struct Chunk
{
    uint[16][16][16] Voxels;
};
//contains tigthly packed chunks, completely out of order
layout(std430, binding = 4) buffer ChunkContainer
{
    Chunk Chunks[];
};

struct VoxelLocator{
    uint ChunkIdentifier;
    uvec3 InChunkCoordinate;
    uvec3 ChunkCoordinate;
};

vec3 rotate(vec3 v, vec4 q)
{ 
    // separate the vector and scalar part of the quaternion
    vec3 u = q.xyz;
    float s = q.w;

    // Do the math
    return 2.0f * dot(u, v) * u
          + (s*s - dot(u, u)) * v
          + 2.0f * s * cross(u, v);
}

const int chunkOffset = 128*16;
uvec3 offsetCoord(ivec3 worldCoordinate){
    return uvec3(chunkOffset+worldCoordinate);
}
uvec3 getInChunkLocation(uvec3 worldCoordinate){
    //the first 4bits are for the coordinates inside the chunk
    return (worldCoordinate & uint(0x000F));
}
uvec3 getChunkLocation(uvec3 worldCoordinate){
    //the latter 8bits are for finding the chunklocator
    return (worldCoordinate & uint(0x0FF0)) >> 4;
}

uint getChunkIdentifier(uvec3 ChunkCoordinate){
    //they are turned one dimensional to find said chunk locator
    //ChunkCoordinate = uvec3(ChunkCoordinate + Center);
    uint ChunkIdentifierIndex = 
        (ChunkCoordinate.x) +
       ((ChunkCoordinate.y) << 8) +
       ((ChunkCoordinate.z) << 16);
     //todo world loop or something
    //then find the location of the chunk
    return ChunkLocations[ChunkIdentifierIndex];
}
VoxelLocator locateVoxel(ivec3 worldCoordinate){
    VoxelLocator vl;
    uvec3 WC = offsetCoord(worldCoordinate);
    vl.InChunkCoordinate = getInChunkLocation(WC);
    vl.ChunkCoordinate = getChunkLocation(WC);
    
    vl.ChunkIdentifier = getChunkIdentifier(vl.ChunkCoordinate);
    return vl;
}

vec4 intToCol(uint value){
    return vec4(
        (value & uint(0x000000FF)),
        (value & uint(0x0000FF00))>>8,
        (value & uint(0x00FF0000))>>16,
        (value & uint(0xFF000000))>>24)/255.;
}
in vec4 gl_FragCoord;
#define PI 3.1415926538

struct result
{
    vec4 color;
    vec3 position;
    vec3 normal;
    float dist;
    float light;
};
//god speed reading the next lines
vec3 distToVoxEdge(vec3 pos, vec3 dir){
    return (sign(dir) * (ivec3(floor(pos))-pos) + (sign(dir)*.5)+0.5) * abs(1/dir);
}
vec3 hitPos(vec3 pos, vec3 dir){
    vec3 d = abs(dir);
    vec3 f = sign(dir) * (floor(pos) - pos);
    return pos + min(min(d.x * f.x, d.y * f.y), d.z * f.z) * dir;
}
vec3 distToVoxEdge2(vec3 pos, vec3 dir){
    return (-sign(dir) * (fract(pos)) + (sign(dir)*.5)+0.5) * abs(1/dir);
}
vec3 distToVoxEdge3(vec3 pos, vec3 dir){
    vec3 fraction = abs(1/dir);
    //floor = nearest less than = always -> negative
    //fract = x-xfloor(x) = same wether negative or not.
    vec3 nextVoxel = fract(pos) + dir;
    vec3 under = min(vec3(0), nextVoxel+1);
    vec3 over  = max(vec3(0), nextVoxel-1);
    vec3 travelled = dir-under-over;
    
    ivec3 stepMask = ivec3(greaterThanEqual(fraction.xyz, max(fraction.yzx, fraction.zxy)));
        

    float pdist = length(stepMask*fraction);
    return pos+ pdist*dir;
}
vec4 GetVoxelColor(VoxelLocator p){
    if(p.ChunkIdentifier != 0){
        return intToCol( Chunks[p.ChunkIdentifier].Voxels[p.InChunkCoordinate.x][p.InChunkCoordinate.y][p.InChunkCoordinate.z]);
    }
    return vec4(0,0,0,0);
}

bool inBounds(uvec3 c){
    return c.x <16 && c.y<16 && c.z<16;
}

bool isSolid(VoxelLocator p){
    if(p.ChunkIdentifier != 0){
        uvec3 CC = p.InChunkCoordinate;
        //get the color of voxel at position
        vec4 tile = intToCol( Chunks[p.ChunkIdentifier].Voxels[CC.x][CC.y][CC.z]);  
        return tile.a > 0.99;
    }
    return false;
}
struct voxHit {
    vec4 color;
    float dist;
};

const int maxHits = 16;
/*
voxHit BlendHits(voxHit[maxHits] hits, int hitCount){
    vec4 accum = vec4(0);
   // accum = vec4(1,1,1,0);
    float overshoot = 0;
    
    //for(int i = hitCount; i >= 0; i--){
    for(int i = 0; i <= hitCount; i++){
        vec4 hc = hits[i].color;
        float hd = hits[i].dist;
        //1/1 = 1
        float maxd = 1./hc.a; //max distance travelable with hit alpha
        //1*.5 = .5
        float hitFilling = hc.a *hd; //how much alpha the hit will fill
        //1-0.9 = 0.1
        float leftA = 1.- accum.a; //how much is left of alpha
        //0.1/1 = 0.1
        float leftD = leftA / hc.a; //in distance
        //.5-.1 = 0.4;
        float aOver = max(hd - leftD,0.); //how much the hit will go over the limit.
        //hc.a = how much alpha will increase per 1 distance travelled
        overshoot = aOver; // hit overshoot in distance;

        //0.1
        float aDelta = min(leftA, hitFilling); //how much to change the color
        
        accum.rgb += hc.rgb*aDelta;
        //0.9+0.1 = 1;
        accum.a = accum.a+aDelta; // 1 or smaller.

        if (accum.a >= 0.99) break;
    }
    return voxHit(accum,overshoot);
}*/
voxHit BlendHits(voxHit[maxHits] hits, int hitCount){
    vec4 accum = vec4(0);
    float overshoot = 0;
    
    for(int i = 0; i <= hitCount; i++){
        vec4 hc = hits[i].color;
        float hd = hits[i].dist;
        float maxd = 1./hc.a; //max distance travelable with hit alpha
        float hitFilling = hc.a *hd; //how much alpha the hit will fill
        float leftA = 1.- accum.a; //how much is left of alpha
        float leftD = leftA / hc.a; //in distance
        float aOver = max(hd - leftD,0.); //how much the hit will go over the limit.
        overshoot = aOver; // hit overshoot in distance;

        // Calculate the actual amount of alpha that will be added to the accumulated color
        float aDelta = min(leftA, hitFilling / (1 - accum.a));

        accum.rgb += hc.rgb*aDelta;
        accum.a = accum.a+aDelta; // 1 or smaller.

        if (accum.a >= 0.99 || overshoot > 0) break;
    }
    return voxHit(accum,overshoot);
}

result raymarch(vec3 ro, vec3 dir) {
    result ret;
    ret.color = vec4(0);
    const vec3 sun = normalize(vec3(1,1,1));
    const int maxstep = 4000;
    const float drawdist = 400;
    //basic DDA setup
    ivec3 ipos = ivec3(floor(ro));
    vec3 absDir = abs(dir);
    vec3 deltaDist = 1/absDir;
    ivec3 stepDir = ivec3(sign((dir)));
    
    vec3 sideDist = (stepDir*(ipos-ro)+
                   stepDir*.5+.5)
                    *deltaDist;
    ivec3 posOff = ivec3(0,0,0);
    //offset world coordinate to be based in the middle of chunk array
    //uvec3 iwc = offsetCoord(ipos); 
    VoxelLocator p;
    ivec3 stepMask; 
    uvec3 CC; //coordinate inside a chunk
    
    voxHit[maxHits] hits;
    int curhit = 0;
    bool hit = false;
    for (int i = 0; i < maxstep; ++i) {
        //determines which coordinate to move in (always one dimension at a time)
        stepMask = ivec3(lessThanEqual(sideDist.xyz, min(sideDist.yzx, sideDist.zxy)));
        
        vec3 s = deltaDist*stepMask;   // increases ray distance
        ivec3 sd = stepDir*stepMask;  // increases map position
        
        //update the position of voxel to get
        //these accesses can probably be made way more sparse.
        ivec3 wPos = ipos+ posOff;
        p = locateVoxel(wPos+sd);


        //if chunk exists
        if(p.ChunkIdentifier != 0){
            CC = p.InChunkCoordinate;
            //get the color of voxel at position
            vec4 tile = intToCol( Chunks[p.ChunkIdentifier].Voxels[CC.x][CC.y][CC.z]);         
            bool opaque = tile.a > 0.99;
            vec3 pdist = s;
            float dist = (pdist.x+pdist.y+pdist.z);
            // If the sample alpha >= 0.01, we have hit something. 
            
            if (tile.a > 0.01) {
                hits[curhit] = voxHit(tile,dist);
                if(curhit>0) { //is going through transparent voxels
                    if(hits[curhit-1].color == tile){ // same color, extend previous hit.
                        hits[curhit] = voxHit(vec4(0),0); //blank this hit
                        curhit--; //doesn't actually take extra space then.
                        hits[curhit].dist += dist; //add distance
                    }
                }
                voxHit res = BlendHits(hits,curhit);
                //ret.color = vec4(vec3(res.dist),1); //TODO: this is debug
                curhit++;

                if(curhit >= maxHits)res.color.a = 1;

                if (res.color.a > 0.99){
                    ret.color = res.color;
                    vec3 ds = stepMask*sideDist;
                    float d = ds.x+ds.y+ds.z;
                    ret.color = vec4(vec3(fract(dist)),1);
                    ret.dist = dist-res.dist;
                    ret.position = ro+ret.dist*dir;
                    ret.normal = -sd;
                    if(!opaque){
                        ret.normal = -dir;
                    }
                    float l = dot(ret.normal, sun)*.5+.5;
                    l = inversesqrt(l);
                    

                    ret.light = l; // * f;
                    return ret;// if we hit something we can exit the loop;
                }
            }
        }
        
        //TODO: skip iterating empty chunk

        sideDist += s;   //apply offsets
        posOff += sd;  
    }
    ret.dist = length((vec3(stepMask)*(sideDist)));
    ret.position = ro+ret.dist*dir;
    ret.normal = -dir;
    return ret;
}


in vec2 TexCoords;

void main()
{
    //color = texture(screenTex, TexCoords); //feed color through
    //gl_FragDepth  = texture(depthTex, TexCoords).x;
    
    //gColor = vec4(0,0,0,1);

    float fov = 90; //TODO fov uniform soon:tm:
    vec2 uv = gl_FragCoord.xy;
    vec2 size = textureSize(screenTex,0);
    //copied and adapted, works nicely
    vec2 screenPos = (uv.xy / size.xy) * 2.0 - 1.0;
    //vec3 cameraDir = vec3(0.0, 0.0, 1.0);// negate camera look dirs to work
	//vec3 cameraPlaneU = vec3(1.0, 0.0, 0.0);
	//vec3 cameraPlaneV = vec3(0.0, 1.0, 0.0) * size.y / size.x;

	vec3 cameraDir = vec3(1.0, 0.0, 0.0);
	vec3 cameraPlaneU = vec3(0.0, 0.0, 1.0);
	vec3 cameraPlaneV = vec3(0.0, 1.0, 0.0) * size.y / size.x;
    vec3 rayDir = cameraDir + screenPos.x * cameraPlaneU + screenPos.y * cameraPlaneV;
	//rotate by camera rotation quaternion
	rayDir = normalize(rotate(rayDir,CamRot)); 
    //do the magic
    result r = raymarch(ViewPos,rayDir);
    //color = r.color/(r.dist/100);
    gColor.rgba = r.color.rgba;// .5-(r.normal*.5);
    gPosition.rgb = r.position;
    gNormal.rgb   = r.normal;

    //color.rg = uv;
    //gColor.a = 1;
    gColor.rgb *= gColor.a;
    //gColor.rgb *= r.light;
    
    //gColor.rgba = vec4(vec3(1/r.dist),1);
}

