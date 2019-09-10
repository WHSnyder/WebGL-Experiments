
function readOBJFile(fileName, scale, reverse) {
  
  var request = new XMLHttpRequest();

  request.open('GET', fileName, false); // Create a request to acquire the file
  request.send(); 

  return onReadOBJFile(request.responseText, fileName, scale, reverse);
}

var objects = {};

objects["cat"] = readOBJFile("./models/gitcat.obj", 2, 0);
//objects["volume"] = readOBJFile("./models/lightVolume.obj", 1, 0);


var catdata = objects["cat"].getDrawingInfo()
//var volumeData = objects["volume"].getDrawingInfo





var SimplexNoise = function(r) {
    if (r == undefined) r = Math;
  this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0], 
                                 [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1], 
                                 [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]]; 
  this.p = [];
  for (var i=0; i<256; i++) {
      this.p[i] = Math.floor(Math.random()*256);
  }
  // To remove the need for index wrapping, double the permutation table length 
  this.perm = []; 
  for(var i=0; i<512; i++) {
        this.perm[i]=this.p[i & 255];
    } 

  // A lookup table to traverse the simplex around a given point in 4D. 
  // Details can be found where this table is used, in the 4D noise method. 
  this.simplex = [ 
    [0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0], 
    [0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0], 
    [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0], 
    [1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0], 
    [1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0], 
    [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0], 
    [2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0], 
    [2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]; 
};

SimplexNoise.prototype.dot = function(g, x, y) { 
    return g[0]*x + g[1]*y;
};

SimplexNoise.prototype.noise = function(xin, yin) { 
  var n0, n1, n2; // Noise contributions from the three corners 
  // Skew the input space to determine which simplex cell we're in 
  var F2 = 0.5*(Math.sqrt(3.0)-1.0); 
  var s = (xin+yin)*F2; // Hairy factor for 2D 
  var i = Math.floor(xin+s); 
  var j = Math.floor(yin+s); 
  var G2 = (3.0-Math.sqrt(3.0))/6.0; 
  var t = (i+j)*G2; 
  var X0 = i-t; // Unskew the cell origin back to (x,y) space 
  var Y0 = j-t; 
  var x0 = xin-X0; // The x,y distances from the cell origin 
  var y0 = yin-Y0; 
  // For the 2D case, the simplex shape is an equilateral triangle. 
  // Determine which simplex we are in. 
  var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords 
  if(x0>y0) {i1=1; j1=0;} // lower triangle, XY order: (0,0)->(1,0)->(1,1) 
  else {i1=0; j1=1;}      // upper triangle, YX order: (0,0)->(0,1)->(1,1) 
  // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and 
  // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where 
  // c = (3-sqrt(3))/6 
  var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords 
  var y1 = y0 - j1 + G2; 
  var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords 
  var y2 = y0 - 1.0 + 2.0 * G2; 
  // Work out the hashed gradient indices of the three simplex corners 
  var ii = i & 255; 
  var jj = j & 255; 
  var gi0 = this.perm[ii+this.perm[jj]] % 12; 
  var gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12; 
  var gi2 = this.perm[ii+1+this.perm[jj+1]] % 12; 
  // Calculate the contribution from the three corners 
  var t0 = 0.5 - x0*x0-y0*y0; 
  if(t0<0) n0 = 0.0; 
  else { 
    t0 *= t0; 
    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);  // (x,y) of grad3 used for 2D gradient 
  } 
  var t1 = 0.5 - x1*x1-y1*y1; 
  if(t1<0) n1 = 0.0; 
  else { 
    t1 *= t1; 
    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1); 
  }
  var t2 = 0.5 - x2*x2-y2*y2; 
  if(t2<0) n2 = 0.0; 
  else { 
    t2 *= t2; 
    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2); 
  } 
  // Add contributions from each corner to get the final noise value. 
  // The result is scaled to return values in the interval [-1,1]. 
  return 70.0 * (n0 + n1 + n2); 
};

// 3D simplex noise 
SimplexNoise.prototype.noise3d = function(xin, yin, zin) { 
  var n0, n1, n2, n3; // Noise contributions from the four corners 
  // Skew the input space to determine which simplex cell we're in 
  var F3 = 1.0/3.0; 
  var s = (xin+yin+zin)*F3; // Very nice and simple skew factor for 3D 
  var i = Math.floor(xin+s); 
  var j = Math.floor(yin+s); 
  var k = Math.floor(zin+s); 
  var G3 = 1.0/6.0; // Very nice and simple unskew factor, too 
  var t = (i+j+k)*G3; 
  var X0 = i-t; // Unskew the cell origin back to (x,y,z) space 
  var Y0 = j-t; 
  var Z0 = k-t; 
  var x0 = xin-X0; // The x,y,z distances from the cell origin 
  var y0 = yin-Y0; 
  var z0 = zin-Z0; 
  // For the 3D case, the simplex shape is a slightly irregular tetrahedron. 
  // Determine which simplex we are in. 
  var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords 
  var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords 
  if(x0>=y0) { 
    if(y0>=z0) 
      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } // X Y Z order 
      else if(x0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } // X Z Y order 
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } // Z X Y order 
    } 
  else { // x0<y0 
    if(y0<z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } // Z Y X order 
    else if(x0<z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } // Y Z X order 
    else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } // Y X Z order 
  } 
  // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z), 
  // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and 
  // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where 
  // c = 1/6.
  var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords 
  var y1 = y0 - j1 + G3; 
  var z1 = z0 - k1 + G3; 
  var x2 = x0 - i2 + 2.0*G3; // Offsets for third corner in (x,y,z) coords 
  var y2 = y0 - j2 + 2.0*G3; 
  var z2 = z0 - k2 + 2.0*G3; 
  var x3 = x0 - 1.0 + 3.0*G3; // Offsets for last corner in (x,y,z) coords 
  var y3 = y0 - 1.0 + 3.0*G3; 
  var z3 = z0 - 1.0 + 3.0*G3; 
  // Work out the hashed gradient indices of the four simplex corners 
  var ii = i & 255; 
  var jj = j & 255; 
  var kk = k & 255; 
  var gi0 = this.perm[ii+this.perm[jj+this.perm[kk]]] % 12; 
  var gi1 = this.perm[ii+i1+this.perm[jj+j1+this.perm[kk+k1]]] % 12; 
  var gi2 = this.perm[ii+i2+this.perm[jj+j2+this.perm[kk+k2]]] % 12; 
  var gi3 = this.perm[ii+1+this.perm[jj+1+this.perm[kk+1]]] % 12; 
  // Calculate the contribution from the four corners 
  var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0; 
  if(t0<0) n0 = 0.0; 
  else { 
    t0 *= t0; 
    n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0); 
  }
  var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1; 
  if(t1<0) n1 = 0.0; 
  else { 
    t1 *= t1; 
    n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1); 
  } 
  var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2; 
  if(t2<0) n2 = 0.0; 
  else { 
    t2 *= t2; 
    n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2); 
  } 
  var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3; 
  if(t3<0) n3 = 0.0; 
  else { 
    t3 *= t3; 
    n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3); 
  } 
  // Add contributions from each corner to get the final noise value. 
  // The result is scaled to stay just inside [-1,1] 
  return 32.0*(n0 + n1 + n2 + n3); 
};



var pointVert =
`#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D dataTex;

uniform mat4 view;
uniform mat4 frust;

layout(location=0) in vec2 dataIndex;

out vec4 color;
out vec4 position;
out float pixelRadius;


void main(){

	float radius = .3;

    vec4 pos = texture(dataTex, dataIndex/48.0);
    vec4 plusRadius = pos + vec4(radius, 0.0, 0.0, 0.0);


    position = pos;

    mat4 mvp = frust * view;
    
    vec4 clipPos = mvp * pos;
    vec4 clipPlusRadius = mvp * plusRadius;

    float fraction = abs(clipPlusRadius.x - clipPos.x)/radius;

    pixelRadius = fraction * (radius/2.0) * 1000.0;


    gl_Position = clipPos;
    gl_PointSize = pixelRadius;

    color = vec4(1.0,1.0,1.0,1.0);
} `;



var pointFrag = 
`#version 300 es

precision highp float;

uniform mat4 frust;
uniform mat4 view;
uniform sampler2D gNorm;
uniform sampler2D gGeom;
uniform sampler2D gColor;

in vec4 color;
in vec4 position;
in float pixelRadius;

out vec4 fragColor;

void main(){

	float radius = 0.3;

    fragColor = color;
    vec2 index = gl_FragCoord.xy/vec2(1000,700);

    vec4 norm = texture(gNorm, index);
    vec4 geom = texture(gGeom, index);
    vec4 fColor = texture(gColor, index);

    vec4 toPoint = geom - position;
    float atten = (radius - clamp(length(toPoint), 0.0, radius))/radius;

    float strength = 0.0;

    float fromCenter = length(2.0 * gl_PointCoord - 1.0);

    if (fromCenter > 2.0/pixelRadius){
    	if (norm.x == 0.0 && norm.y == 0.0 && norm.z == 0.0){
      		discard;
    	}
    	else {
    		strength = 0.0 - clamp(dot(normalize(toPoint), norm), -1.0, 0.0);
    		fragColor = vec4((atten * strength * fColor));
    	}
    }
    
    if (position.z < geom.z){
    	discard;
    }	
    
} `;


var quad_vs = 
`#version 300 es  

layout(location=0) in vec2 aPosition;

out vec2 index;

void main() {

    index = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition,0.0,1.0);
}`;


var pointVelFrag = 
`#version 300 es

precision highp float;
precision highp sampler3D;
precision highp sampler2D;

uniform sampler2D dataTex;
uniform sampler2D velTex;
uniform sampler3D flowField;  

uniform float timeDiff;

in vec2 index;

layout(location=0) out vec4 newPosition;
layout(location=1) out vec4 newVelocity;


void main(){
    
    vec3 pos = texture(dataTex, index).xyz; 
    vec3 velocity = texture(velTex, index).xyz;

    vec3 flow = .01 * texture(flowField, (pos.xyz/12.0)).xyz;
    vec3 newPos = pos + .01 * timeDiff * velocity; 

    newPosition = vec4(newPos.xyz, 1.0);
    newVelocity = vec4((velocity + 1.0 * flow).xyz, 1.0);
}`;



var objectVShader = 
`#version 300 es

precision highp float;
precision highp sampler2D;

uniform float timeDiff;

uniform mat4 view;
uniform mat4 frust;


layout(location=0) in vec3 normal;
layout(location=1) in vec3 position;


out vec4 fNorm;
out vec4 fGeom;
out vec4 fColor;


void main(){

    mat4 mvp = frust * view;
    
    fGeom = vec4(position, 1.0);
    fNorm = vec4(normal, 0.0);
    fColor = vec4(0.5, 0.0, 0.7, 1.0);

    gl_Position = mvp * vec4(position,1.0);
}`;




var objectFShader = 
`#version 300 es

precision highp float;

in vec4 fNorm;
in vec4 fGeom;
in vec4 fColor;

layout(location=0) out vec4 oNorm;
layout(location=1) out vec4 oGeom;
layout(location=2) out vec4 oColor;

void main(){
    
    oNorm = fNorm;
    oGeom = fGeom;
    oColor = fColor;
}`;



var lightPassFShader = 
`#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D gNorms;
uniform sampler2D gColor;

in vec2 index;

out vec4 oColor;

void main(){
    
    vec4 lightDir = vec4(0.0, -1.0, 0.0, 1.0);
    vec4 normal = texture(gNorms,index);
    vec4 color = texture(gColor, index);

    float lightStrength = dot(normal, lightDir) * 0.75;
    
    if (lightStrength > 0.0){
      lightStrength = 0.0;
    }
    else {
      lightStrength = 0.0 - lightStrength;
    }

    oColor = .4 * lightStrength * vec4(1.0,1.0,1.0,1.0) * color;
}`;



var noiseViz = 
`#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D noiseTex;

in vec2 index;

out vec4 fragColor;


void main(){

	vec4 noiseVal = texture(noiseTex, index);
    fragColor = vec4(noiseVal.x, noiseVal.y, 0.0,1.0); 
}`;





var noiseGen = new SimplexNoise();


var deltamX = 0;
var deltamY = 0;

var g_up = vec3.fromValues(0.0,1.0,0.0);


utils.addTimerElement();


if (!testExtension("EXT_color_buffer_float")) {
    document.body.innerHTML = "This example requires extension <b>EXT_color_buffer_float</b> which is not supported on this system."
}

let canvas = document.getElementById("view");


let app = PicoGL.createApp(canvas)
.clearColor(0.0, 0.0, 0.0, 1.0)
.depthTest()
.depthFunc(PicoGL.LEQUAL)
.blendFunc(PicoGL.ONE, PicoGL.ONE);


let timer = app.createTimer();


const dim = 48;

var NUM_PARTICLES = dim * dim;

let posData = new Float32Array(NUM_PARTICLES * 4);
let velData = new Float32Array(NUM_PARTICLES * 4);
let posIndicies = new Float32Array(NUM_PARTICLES * 2);

let texIndex = 0;


for (let i = 0; i < NUM_PARTICLES * 4; i+=4){

    posIndicies[i/2] = (i/4) % dim;
    posIndicies[i/2 + 1] = Math.floor((i/4)/dim);

    posData[i] = 1 * (Math.random() * 2 - 1);
    posData[i + 1] = 1 * (Math.random() * 2 - 1);
    posData[i + 2] = 1 * (Math.random() * 2 - 1);
    posData[i + 3] = 1.0;

    velData[i] = 0 * (Math.random() * 2 - 1);
    velData[i + 1] = 0 * (Math.random() * 2 - 1);
    velData[i + 2] = 0.0;
    velData[i + 3] = 0.0;
}




const noiseDim = 64;

let textureData = new Float32Array(noiseDim * noiseDim * noiseDim * 4);
let textureIndex = 0;


function testBound(num,dimen){

	let mid = dimen / 2;
	let diff = num - mid;
	let diffAbs = Math.abs(diff);

	if (diffAbs > 10){
		return (diffAbs/4 * (diff/diffAbs));
	}
	return 0;
}




for (let i = 0; i < noiseDim; ++i) {
	let iBound = testBound(i, noiseDim);
    for (let j = 0; j < noiseDim; ++j) {
    	let jBound = testBound(j, noiseDim)
        for (let k = 0; k < noiseDim; ++k) {
        	let kBound = testBound(k, noiseDim)
                
            let iadj = .07*i;///noiseDim;
            let jadj = .07*j;///noiseDim;
            let kadj = .07*k;///noiseDim;

            let x =noiseGen.noise(jadj,kadj) 
            let y =noiseGen.noise(iadj,kadj)
            let z =noiseGen.noise(iadj,jadj)

            if (x < 0){
              x *= .99;
            } 

            if (y > 0){
              y *= .9
            }
            
            textureData[textureIndex++] = x;// + iBound;
            textureData[textureIndex++] = y;//+ jBound;
            textureData[textureIndex++] = z;// + kBound;
            textureData[textureIndex++] = 0;
        }
    }
}


let noiseTex = app.createTexture3D(textureData, noiseDim, noiseDim, noiseDim, { 
    internalFormat: PicoGL.RGBA16F, 
    minFilter: PicoGL.LINEAR,
    magFilter: PicoGL.LINEAR,
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT
});

let noiseTexB = app.createTexture2D(textureData, noiseDim, noiseDim, { 
    internalFormat: PicoGL.RGBA16F, 
    minFilter: PicoGL.LINEAR,
    magFilter: PicoGL.LINEAR,
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT
});

let dataTexA = app.createTexture2D(posData, dim, dim, {
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT,
    internalFormat: PicoGL.RGBA16F
});

let dataTexB = app.createTexture2D(posData, dim, dim, {
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT,
    internalFormat: PicoGL.RGBA16F
});


let velTexA  = app.createTexture2D(velData, dim, dim, { 
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT,
    internalFormat: PicoGL.RGBA16F
});

let velTexB  = app.createTexture2D(velData, dim, dim, { 
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT,
    internalFormat: PicoGL.RGBA16F
});


//let gNormalsArray = new Float32Array(canvas.width * canvas.height * 4);


let gNormals = app.createTexture2D(app.width, app.height, {
    internalFormat: PicoGL.RGBA16F
});

let gGeometry = app.createTexture2D(app.width, app.height, {
    internalFormat: PicoGL.RGBA16F
});

let gMaterial = app.createTexture2D(app.width, app.height, {
    internalFormat: PicoGL.RGBA16F
});

let depthTarget = app.createRenderbuffer(app.width, app.height, PicoGL.DEPTH_COMPONENT16);



let gBuffer = app.createFramebuffer(app.width, app.height)
.colorTarget(0, gNormals)
.colorTarget(1, gGeometry)
.colorTarget(2, gMaterial)
.depthTarget(depthTarget);



console.assert(gBuffer.getStatus() === PicoGL.FRAMEBUFFER_COMPLETE, "G-buffer framebuffer is not complete!");




let indices = app.createVertexBuffer(PicoGL.FLOAT, 2, posIndicies)
let points = app.createVertexArray()
.vertexAttributeBuffer(0, indices);


let quadPositions = app.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
    -1, 1,
    -1, -1,
    1, -1,
    -1, 1,
    1, -1,
    1, 1,
]));


let quadArray = app.createVertexArray()
.vertexAttributeBuffer(0, quadPositions);


var cat_positions = app.createVertexBuffer(PicoGL.FLOAT, 3, catdata.vertices);
var cat_normals = app.createVertexBuffer(PicoGL.FLOAT, 3, catdata.normals);

var catArray = app.createVertexArray()
.vertexAttributeBuffer(0, cat_normals)
.vertexAttributeBuffer(1, cat_positions)


let updateFramebuffer = app.createFramebuffer(dim, dim)
.colorTarget(0, dataTexB)
.colorTarget(1, velTexA);

let noiseFramebuffer = app.createFramebuffer(noiseDim, noiseDim)
.colorTarget(0, noiseTexB);

let projMatrix = mat4.create();
mat4.perspective(projMatrix, Math.PI / 2, canvas.width / canvas.height, 0.1, null);




var flag = false;
var time = performance.now();
var frameNum = 0;


let quadShader = app.createShader(PicoGL.VERTEX_SHADER, quad_vs);
let noiseVizShader = app.createShader(PicoGL.FRAGMENT_SHADER, noiseViz);
let velUpdateShader = app.createShader(PicoGL.FRAGMENT_SHADER, pointVelFrag);
let pointShader = app.createShader(PicoGL.VERTEX_SHADER, pointVert);
let pointFragShader = app.createShader(PicoGL.FRAGMENT_SHADER, pointFrag);


let timeNow = performance.now()/1000;
let lastTime = timeNow;

app.createPrograms([pointShader, pointFragShader], 
                   [quadShader, velUpdateShader], 
                   [quadShader, noiseVizShader],
                   [objectVShader, objectFShader],
                   [quadShader, lightPassFShader])
                  .then((
                    [pointProgram, updateProgram, noiseProgram, objProgram, finalProgram]
                   ) => {
    
    let updatePositionCall = app.createDrawCall(updateProgram, quadArray)
    .primitive(PicoGL.TRIANGLES)
    .texture("dataTex", dataTexA)
    .texture("flowField", noiseTex)
    .texture("velTex", velTexA);

    let drawCall = app.createDrawCall(pointProgram, points)
    .primitive(PicoGL.POINTS)
    .texture("dataTex", dataTexA)
    .texture("gNorm", gBuffer.colorAttachments[0])
    .texture("gGeom", gBuffer.colorAttachments[1])
    .texture("gColor", gBuffer.colorAttachments[2])
    .uniform("view", player.getView())
    .uniform("frust", projMatrix)

    let noiseCall = app.createDrawCall(noiseProgram, quadArray)
    .texture("noiseTex", noiseTex)
    .primitive(PicoGL.TRIANGLES);

    let gPass = app.createDrawCall(objProgram, catArray)
    .uniform("frust", projMatrix)
    .primitive(PicoGL.TRIANGLES);

    let finalPass = app.createDrawCall(finalProgram, quadArray)
    .texture("gNorms", gBuffer.colorAttachments[0])
    .texture("gColor", gBuffer.colorAttachments[2])
    .primitive(PicoGL.TRIANGLES);



   
    
    function draw() {


        if (keyMap.get(65)){
            console.log("to the left...");
            player.move(0.1,0.0,0.0);
        }

        if (keyMap.get(68)){
            player.move(-0.1,0.0,0.0);
        }

        if (!mouseRead){

            player.rotate(player.left, deltamY/100);
            player.rotate(g_up, -deltamX/100);

            mouseRead = true;
        }

        playerView = player.getView()


        
        if (timer.ready()) {
            utils.updateTimerElement(timer.cpuTime, timer.gpuTime);
        }
        timer.start();

        timeNow = performance.now()/1000;

        updatePositionCall.uniform("timeDiff", timeNow - lastTime);

        lastTime = timeNow;

        if (!flag){
        	//updatePositionCall.texture("noiseTex", noiseTex)
            updatePositionCall.texture("dataTex", dataTexA)
            updatePositionCall.texture("velTex", velTexA)
            updateFramebuffer.colorTarget(0, dataTexB)
            updateFramebuffer.colorTarget(1, velTexB)

            noiseCall.texture("noiseTex", noiseTex);
            noiseFramebuffer.colorTarget(0, noiseTexB);
        }
        else {
        	//updatePositionCall.texture("noiseTex", noiseTexB)
            updatePositionCall.texture("dataTex", dataTexB)
            updatePositionCall.texture("velTex", velTexB)
            updateFramebuffer.colorTarget(0, dataTexA)
            updateFramebuffer.colorTarget(1, velTexA)

            noiseCall.texture("noiseTex", noiseTexB);
            noiseFramebuffer.colorTarget(0, noiseTex)
        }
        app.viewport(0, 0, dim, dim);
        app.drawFramebuffer(updateFramebuffer).noBlend();
        updatePositionCall.draw();


        if (!flag){
            drawCall.texture("dataTex", dataTexB);
        }
        else {
            drawCall.texture("dataTex", dataTexA);
        }

        flag = !flag;

        


        /*
        app.viewport(0, 0, noiseDim, noiseDim);
        app.drawFramebuffer(noiseFramebuffer)
        .noBlend()
        .depthMask(false);
        noiseCall.draw();
        */
        

        app.defaultViewport();
        app.drawFramebuffer(gBuffer)
        .depthMask(true)
        .noBlend()
        .clearColor(0.0, 0.0, 0.0, 1.0)
        .clear()


        gPass.uniform("view", playerView);
        gPass.draw()
        

        app.defaultViewport();
        app.defaultDrawFramebuffer()
        .blend()
        .blendFunc(PicoGL.ONE, PicoGL.ONE)
        .depthMask(false)
        .clearColor(0.0, 0.0, 0.0, 1.0)
        .clear()


        finalPass.draw();


        app.defaultDrawFramebuffer().blend().depthMask(false);
        app.defaultViewport();
        app.blendFunc(PicoGL.SRC_COLOR, PicoGL.ONE);



        drawCall.uniform("view", playerView);
        drawCall.draw();



        timer.end();

        requestAnimationFrame(draw);
    }

    var current_time = 0;



    var dir = 0;
    var n = 0;

    var currTime, timePassed;
    var clicktime = 0;
    var clickpos = vec3.fromValues(0.0,0.0,6.7);

    var mouseInitialized = false;
    var deltamX = 0, delatmY = 0;
    var mouseRead = false;

    var down = false,up = false;
    var lastX = 0,lastY = 0;






    function updateClick(){

        clicktime = performance.now()/1000;
        vec3.add(clickpos, player.focusVec, player.eyePt);

        clickData.set(0, clicktime)
        .set(1, clickpos)
        .update()
    }



    function mouseHandler(e){

        mouseRead = false;

        if (!mouseInitialized){
            deltamX = 0;
            deltamY = 0;
            mouseInitialized = true;
        }
        else {
            deltamX = e.pageX - mouseX;
            deltamY = e.pageY - mouseY;
        }

        mouseX = e.pageX;
        mouseY = e.pageY;
    }




    var keyMap = new Map();

    keyMap.set(87, false);//forward
    keyMap.set(65, false);//left
    keyMap.set(68, false);//right
    keyMap.set(83, false);//backward
    keyMap.set(71, false);//go
    keyMap.set(84, false);//terminate

    function keydown(event) {
        
        if (event.keyCode == 71 && !keyMap.get(71)){
            cont = 1;

            window.requestAnimationFrame(draw);
        }
        else if (event.keyCode == 84){
            cont = 0;
            keyMap.set(71, false);
        }
        else if (event.keyCode == 87){
        }
        keyMap.set(event.keyCode, true);
    }


    function keyup(event) {

        if (event.keyCode != 71){
            keyMap.set(event.keyCode, false);
        }
    }


    window.addEventListener("keydown", keydown, false);
    window.addEventListener("keyup", keyup, false);

    window.addEventListener("mouseup", function(event) {
        mouseX = event.clientX;
        mouseY = event.clientY;
        picked = true; 
    });
    window.addEventListener("mousemove", mouseHandler, false);
    window.addEventListener("click", updateClick, false);


    requestAnimationFrame(draw);
});





