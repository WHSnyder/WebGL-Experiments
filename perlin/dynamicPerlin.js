function readOBJFile(fileName, scale, reverse) {
  
  var request = new XMLHttpRequest();

  request.open('GET', fileName, false); // Create a request to acquire the file
  request.send(); 

  return onReadOBJFile(request.responseText, fileName, scale, reverse);
}

var objects = {};
objects["cat"] = readOBJFile("./models/gitcat.obj", 2, 0);

var catdata = objects["cat"].getDrawingInfo()


/*

BEGIN MARK'S CODE 


*/

var dataUpdateFrag = 
`#version 300 es

precision mediump float;
precision mediump sampler2D;

uniform sampler2D startTex;
uniform float timer;


in vec2 index;

layout(location=0) out vec4 newPosition;
layout(location=1) out vec4 newVelocity;


vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0; 
}

float mod289(float x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0; 
}

vec4 permute(vec4 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float permute(float x) {
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r){
  return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r){
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip){
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;

  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; 

  return p;
}

// (sqrt(5) - 1)/4 = F4, used once below
#define F4 0.309016994374947451

float snoise(vec4 v) {

  const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
                  0.276393202250021,  // 2 * G4
                  0.414589803375032,  // 3 * G4
                 -0.447213595499958); // -1 + 4 * G4

  // First corner
  vec4 i  = floor(v + dot(v, vec4(F4)) );
  vec4 x0 = v -   i + dot(i, C.xxxx);

  // Other corners

  // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
  vec4 i0;
  vec3 isX = step( x0.yzw, x0.xxx );
  vec3 isYZ = step( x0.zww, x0.yyz );

  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;

  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  // i0 now contains the unique values 0,1,2,3 in each channel
  vec4 i3 = clamp( i0, 0.0, 1.0 );
  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

  
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;

  // Permutations
  i = mod289(i); 
  float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute( permute( permute( permute (
       i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
     + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
     + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
     + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

  // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
  // 7*7*6 = 294, which is close to the ring size 17*17 = 289.

  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

  vec4 p0 = grad4(j0,   ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4,p4));

  // Mix contributions from the five corners
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
         + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;
}

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}


void main() {
  //vec3 randoffset = vec3(rand(vec2(timer,index.x)), rand(vec2(index.y,timer/10.0)), rand(vec2(timer,index.x)))/1000.0;
  float rando = rand(vec2(timer * timer * index.y, timer * index.x * index.y));
  vec3 pos = texture( startTex, index ).xyz;
  
  vec3 inc = vec3(0.0);
  inc.x = snoise(vec4(pos.x, pos.y, pos.z, timer/10000.0)) * 0.01;
  inc.y = snoise(vec4(pos.x, pos.y, pos.z, 1.352+timer/10000.0)) * 0.01;
  inc.z = snoise(vec4(pos.x, pos.y, pos.z, 12.352+timer/10000.0)) * 0.01;

  pos = pos + 50.0 * inc;
  pos.y += .5;

  newPosition = vec4(pos, 1.0);
  newVelocity = vec4(50.0 * inc, 1.0);
}`;

/*

END MARK'S CODE

*/


var pointLightVert =
`#version 300 es

precision mediump float;
precision mediump sampler2D;

uniform sampler2D dataTex;
uniform sampler2D velTex;

uniform mat4 mvp;

uniform float numParticles;
uniform float radius;

layout(location=0) in vec2 dataIndex;

out vec4 color;
out vec4 position;


void main(){

  	vec4 pos = texture(dataTex, dataIndex/numParticles);
    color = vec4(abs(normalize(texture(velTex, dataIndex/numParticles).xyz)),1.0);

  	vec4 plusRadius = pos + vec4(radius, 0.0, 0.0, 0.0);

  	position = pos;
  
  	vec4 clipPos = mvp * pos;
  	vec4 clipPlusRadius = mvp * plusRadius;

  	float fraction = abs(clipPlusRadius.x - clipPos.x)/radius;

  	gl_Position = clipPos;
  	gl_PointSize = fraction * (radius/2.0) * 1000.0;
}`;


var pointLightFrag = 
`#version 300 es

precision mediump float;

uniform sampler2D gNorm;
uniform sampler2D gGeom;
uniform sampler2D gColor;

uniform float radius;

in vec4 color;
in vec4 position;

out vec4 fragColor;

void main(){

  vec2 index = gl_FragCoord.xy/vec2(1000,700);

  vec4 norm = texture(gNorm, index);
  vec4 geom = texture(gGeom, index);
  vec4 fColor = texture(gColor, index);

  vec4 toPoint = geom - position;
  float atten = (radius - clamp(length(toPoint), 0.0, radius))/radius;

  float strength = 0.0 - clamp(dot(normalize(toPoint), norm), -1.0, 0.0);
  fragColor = vec4(atten * atten * strength * color * fColor);    
} `;

/*

*/


var pointVert = 
`#version 300 es  

precision mediump float;
precision mediump sampler2D;

uniform sampler2D dataTex;
uniform sampler2D velTex;

uniform mat4 mvp;
uniform float numParticles;

layout(location=0) in vec2 dataIndex;

out vec4 color;

void main(){

  color = vec4(abs(normalize(texture(velTex, dataIndex/numParticles).xyz)),1.0);

  gl_Position = mvp * texture(dataTex, dataIndex/numParticles);
  gl_PointSize = 2.0;
}`;


var pointFrag = 
`#version 300 es  

precision mediump float;

in vec4 color;
out vec4 fragColor;

void main() {
    fragColor = color;
}`;



//Dummy shader for accessing data texture w/fullscreen quad. 

var quad_vs = 
`#version 300 es

layout(location=0) in vec2 aPosition;

out vec2 index;

void main() {

    index = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition,0.0,1.0);
}`;



//Gpass vertex shader

var objGPassVert = 
`#version 300 es

precision mediump float;
precision mediump sampler2D;

uniform mat4 mvp;

layout(location=0) in vec3 normal;
layout(location=1) in vec3 position;


out vec4 fNorm;
out vec4 fGeom;
out vec4 fColor;


void main(){
    
    fGeom = vec4(position, 1.0);
    fNorm = vec4(normal, 0.0);
    fColor = vec4(0.5, 0.5, 0.5, 1.0);

    gl_Position = mvp * vec4(position,1.0);
}`;



//Gpass fragment

var objGPassFrag = 
`#version 300 es

precision mediump float;

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



//Base lighting pass, may be used in future versions with more lighting.

var globalPassFrag = 
`#version 300 es

precision mediump float;
precision mediump sampler2D;

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




var depthVert = 
`#version 300 es

precision mediump float;

//uniform mat4 frust;
uniform mat4 mvp;

layout(location=0) in vec3 normal;
layout(location=1) in vec3 position;

out vec4 fragColor;


void main(){

    fragColor = vec4(0.5, 0.5, 0.5, 1.0);
    gl_Position = mvp * vec4(position,1.0); 
}`;


var depthFrag = 
`#version 300 es

precision mediump float;


in vec4 fragColor;

out vec4 color;


void main(){
    color = fragColor; 
}`;




//Basic mouse movement parameters.
var deltamX = 0;
var deltamY = 0;

var g_up = vec3.fromValues(0.0,1.0,0.0);


utils.addTimerElement();


if (!testExtension("EXT_color_buffer_float")) {
    document.body.innerHTML = "This example requires extension <b>EXT_color_buffer_float</b> which is not supported on this system."
}

let canvas = document.getElementById("view");

/* 
*  Some of these settings may be unnecessary, but I experienced unpredictable behaviour with the stencil buffer
*  until I overkilled the settings.  Maybe worth a PR. 
*/

let app = PicoGL.createApp(canvas, {stencil:true})
.clearColor(0.0, 0.0, 0.0, 1.0)
.clearMask(PicoGL.COLOR_BUFFER_BIT | PicoGL.DEPTH_BUFFER_BIT | PicoGL.STENCIL_BUFFER_BIT)
.depthTest()
.depthFunc(PicoGL.LEQUAL)
.stencilTest()
.stencilOp(PicoGL.KEEP, PicoGL.KEEP, PicoGL.REPLACE)
.blend()
.cullBackfaces()
.blendFunc(PicoGL.ONE, PicoGL.ONE);


let timer = app.createTimer();

//Dim refers to number of particles and thus size of data texture, radius is extent of point lights 
const dim = 40;
const radius = 0.5;

var NUM_PARTICLES = dim * dim;

let posData = new Float32Array(NUM_PARTICLES * 4); //position data tex
let velData = new Float32Array(NUM_PARTICLES * 4); //velocities data tex for controlling brightness and BVH testing
let posIndicies = new Float32Array(NUM_PARTICLES * 2); //indices into data textures for each particle 


for (let i = 0; i < NUM_PARTICLES * 4; i+=4){

    posIndicies[i/2] = (i/4) % dim;
    posIndicies[i/2 + 1] = Math.floor((i/4)/dim);

    posData[i] = (Math.random() * 2 - 1);
    posData[i + 1] = (Math.random() * 2 - 1);
    posData[i + 2] = (Math.random() * 2 - 1);
    posData[i + 3] = 1.0;

    velData[i] = 0.0
    velData[i + 1] = 0.0
    velData[i + 2] = 0.0;
    velData[i + 3] = 0.0;
}



const noiseDim = 64;


//Same texture as dataTex, needed because buffers cannot be read from and written to simultaneously 
let startTex = app.createTexture2D(posData, dim, dim, {
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT,
    internalFormat: PicoGL.RGBA16F
});


let dataTex = app.createTexture2D(posData, dim, dim, {
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT,
    internalFormat: PicoGL.RGBA16F
});


let velTex = app.createTexture2D(velData, dim, dim, { 
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT,
    internalFormat: PicoGL.RGBA16F
});


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

//Multitarget buffer for scene info.  Material isn't used now, but may be later.
let gBuffer = app.createFramebuffer(app.width, app.height)
.colorTarget(0, gNormals)
.colorTarget(1, gGeometry)
.colorTarget(2, gMaterial)
.depthTarget(depthTarget);


console.assert(gBuffer.getStatus() === PicoGL.FRAMEBUFFER_COMPLETE, "G-buffer framebuffer is not complete!");


let indices = app.createVertexBuffer(PicoGL.FLOAT, 2, posIndicies)
let points = app.createVertexArray()
.vertexAttributeBuffer(0, indices);


//Fullscreen quad.
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
.colorTarget(0, dataTex)
.colorTarget(1, velTex);



var frust = mat4.create();
mat4.perspective(frust, Math.PI/2, 1000/700, .1, null);

var mvp = mat4.create()


var flag = false;
var time = performance.now();
var frameNum = 0;


let quadShader = app.createShader(PicoGL.VERTEX_SHADER, quad_vs);
let dataUpdateShader = app.createShader(PicoGL.FRAGMENT_SHADER, dataUpdateFrag);

let pointLightVertShader = app.createShader(PicoGL.VERTEX_SHADER, pointLightVert);
let pointLightFragShader = app.createShader(PicoGL.FRAGMENT_SHADER, pointLightFrag);

let pointVertShader = app.createShader(PicoGL.VERTEX_SHADER, pointVert);
let pointFragShader = app.createShader(PicoGL.FRAGMENT_SHADER, pointFrag);

let depthVertShader = app.createShader(PicoGL.VERTEX_SHADER, depthVert);
let depthFragShader = app.createShader(PicoGL.FRAGMENT_SHADER, depthFrag);

let globalLightShader = app.createShader(PicoGL.FRAGMENT_SHADER, globalPassFrag);

let objGPassVertShader = app.createShader(PicoGL.VERTEX_SHADER, objGPassVert);
let objGPassFragShader = app.createShader(PicoGL.FRAGMENT_SHADER, objGPassFrag);


let timeNow = performance.now()/1000;
let lastTime = timeNow;

var cont = 1;
var moved = false;

app.createPrograms([pointLightVertShader, pointLightFragShader],
                   [pointVertShader, pointFragShader], 
                   [quadShader, dataUpdateShader], 
                   [objGPassVertShader, objGPassFragShader],
                   [quadShader, globalLightShader],
                   [depthVertShader, depthFragShader])
                  .then((
                    [pointLightProgram, pointProgram,
                     updateProgram, gPassProgram, 
                     globalLightProgram, depthProgram]
                   ) => {
    
    let updatePositionCall = app.createDrawCall(updateProgram, quadArray)
    .primitive(PicoGL.TRIANGLES)

    let lightsPass = app.createDrawCall(pointLightProgram, points)
    .primitive(PicoGL.POINTS)
    .texture("gNorm", gBuffer.colorAttachments[0])
    .texture("gGeom", gBuffer.colorAttachments[1])
    .texture("gColor", gBuffer.colorAttachments[2])
    .uniform("numParticles", dim)
    .uniform("radius", radius)

    let pointsPass = app.createDrawCall(pointProgram, points)
    .primitive(PicoGL.POINTS)
    .uniform("numParticles", dim)

    let gPass = app.createDrawCall(gPassProgram, catArray)
    .primitive(PicoGL.TRIANGLES);

    let globalLightPass = app.createDrawCall(globalLightProgram, quadArray)
    .texture("gNorms", gBuffer.colorAttachments[0])
    .texture("gColor", gBuffer.colorAttachments[2])
    .primitive(PicoGL.TRIANGLES);

    let depthPass = app.createDrawCall(depthProgram, catArray)
    .primitive(PicoGL.TRIANGLES)

    
    function draw() {

        if (cont == 0){
          return;
        }

        if (keyMap.get(65)){
            player.move(0.1,0.0,0.0);
            moved = true;
        }

        if (keyMap.get(68)){
            player.move(-0.1,0.0,0.0);
            moved = true;
        }

        if (keyMap.get(87)){
            player.move(0.0,0.0,-0.1);
            moved = true;
        }

        if (keyMap.get(83)){
            player.move(0.0,0.0,0.1);
            moved = true;
        }

        if (!mouseRead){
            player.rotate(player.left, deltamY/100);
            player.rotate(g_up, -deltamX/100);
            mouseRead = true;
            moved = true;
        }

        if (moved){
	        playerView = player.getView()
	        mat4.multiply(mvp, frust, playerView)
	        moved = false;
    	}	
        

        if (timer.ready()) {
            utils.updateTimerElement(timer.cpuTime, timer.gpuTime);
        }
        timer.start();


        timeNow = performance.now()/1000;

        updatePositionCall.uniform("timer", timeNow*1000);

        lastTime = timeNow;

        updatePositionCall.texture("startTex", startTex)
        updateFramebuffer.colorTarget(0, dataTex)
        updateFramebuffer.colorTarget(1, velTex)
        

        app.viewport(0, 0, dim, dim);
        app.drawFramebuffer(updateFramebuffer).noBlend().clear();
        updatePositionCall.draw();



        lightsPass.texture("dataTex", dataTex);
        lightsPass.texture("velTex", velTex);
        pointsPass.texture("dataTex", dataTex);
        pointsPass.texture("velTex", velTex);
        


        app.defaultViewport();
        app.drawFramebuffer(gBuffer)
        .depthMask(true)
        .noBlend()
        .clearColor(0.0, 0.0, 0.0, 1.0)
        .clear()

        gPass.uniform("mvp", mvp);
        gPass.draw()     
        

        app.defaultDrawFramebuffer()
        .blend()
        .blendFunc(PicoGL.ONE, PicoGL.ONE)
        .depthMask(false)
        .clear()


        globalLightPass.draw();


        app.blendFunc(PicoGL.ZERO, PicoGL.ONE)
        .depthMask(true)


        app.stencilTest()
        .stencilFunc(PicoGL.ALWAYS, 1, 0xFF)
        .stencilOp(PicoGL.KEEP, PicoGL.KEEP, PicoGL.REPLACE)
        .stencilMask(0xFFFF);
        depthPass.uniform("mvp", mvp)
        depthPass.draw()


        app.depthMask(false)
 	      .blendFunc(PicoGL.SRC_COLOR, PicoGL.ONE)
 		    .stencilFunc(PicoGL.EQUAL, 1, 0xFF)
 		    .stencilMask(0);


        lightsPass.uniform("mvp", mvp);
        lightsPass.draw();

        app.noStencilTest()
        pointsPass.uniform("mvp", mvp);
        pointsPass.draw();

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
          //obselete
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

    requestAnimationFrame(draw);
});





