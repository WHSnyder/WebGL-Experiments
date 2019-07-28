var quad_vs = 
`#version 300 es  

layout(location=0) in vec4 aPosition;

out vec2 vScreenUV;

void main() {

    vScreenUV = aPosition.xy * 0.5 + 0.5;
    gl_Position = aPosition;
}`;



var update_force_fs = 
`#version 300 es   

precision highp float;

#define GRAVITY vec3(0.0, -0.00005, 0.0)
#define WIND vec3(0.0, 0.0, 0.000008)
#define DAMPING 0.99

in vec2 vScreenUV;

uniform sampler2D uPositionBuffer;
uniform sampler2D uNormalBuffer;
uniform sampler2D uOldPositionBuffer;

layout(location=0) out vec3 outPosition;
layout(location=1) out vec3 outOldPosition;


void main() {

    ivec2 dimensions = textureSize(uPositionBuffer, 0);
    ivec2 maxTexelCoord = dimensions - 1;

    ivec2 texelCoord = ivec2(vScreenUV * vec2(dimensions));
    
    vec3 position = texelFetch(uPositionBuffer, texelCoord, 0).xyz;
    vec3 normal = texelFetch(uNormalBuffer, texelCoord, 0).xyz;
    vec3 oldPosition = texelFetch(uOldPositionBuffer, texelCoord, 0).xyz;

    vec3 temp = position;
    
    if (texelCoord != ivec2(0, 0) && 
        texelCoord != ivec2(maxTexelCoord.x, 0) &&
        texelCoord != ivec2(0, maxTexelCoord.y) && 
        texelCoord != ivec2(maxTexelCoord.x, maxTexelCoord.y)) {
        
        position += (position - oldPosition) * DAMPING + GRAVITY;
        float wDotN = dot(WIND, normal);
        position += abs(wDotN) * sign(wDotN) * normal;
    }

    outPosition = position;
    outOldPosition = temp;
}`;


    
var update_constraint_fs =
`#version 300 es

precision highp float;

in vec2 vScreenUV;

// uModVal and dir used to select the direction
// to look for the neighbour we're going to check

layout(std140) uniform ConstraintUniforms {

    ivec2 uDir;
    int uModVal;
    float uRestDistance;   
};

uniform sampler2D uPositionBuffer;
uniform float slice;


out vec3 outPosition;


void main() {
    
    //get position of particle---------------
    
    ivec2 dimensions = textureSize(uPositionBuffer, 0);
    ivec2 texelCoord = ivec2(vScreenUV * vec2(dimensions));
    vec3 position = texelFetch(uPositionBuffer, texelCoord, 0).xyz;
    ivec2 maxTexelCoord = dimensions - 1;

    
    //---------------------------------------



    int iDot = abs(texelCoord.x * uDir.x) + abs(texelCoord.y * uDir.y);

    int neg = iDot % 2 == uModVal ? 1 : -1;
    
    bool otherPin = false;

    if (texelCoord != ivec2(0, 0) && 
        texelCoord != ivec2(dimensions.x - 1, 0) &&
        texelCoord != ivec2(0, maxTexelCoord.y) && 
        texelCoord != ivec2(maxTexelCoord.x, maxTexelCoord.y)) {
        
        ivec2 otherCoord = texelCoord + uDir * neg;
        
        if (otherCoord == ivec2(0, 0) || otherCoord == ivec2(dimensions.x - 1, 0)) {
            
            otherPin = true;
        }
        
        if (all(greaterThanEqual(otherCoord, ivec2(0, 0))) && all(lessThan(otherCoord, dimensions))
            && !((otherCoord.y == dimensions.y/2 + 10 || otherCoord.y == dimensions.y/2 - 10) && slice > 0.0)){// && uModVal == 0 && uDir == ivec2(0,1))) {
            
            vec3 otherPosition = texelFetch(uPositionBuffer, otherCoord, 0).xyz;
            
            vec3 diffVec = otherPosition - position;
            float dist = length(diffVec);
            
            if (dist > uRestDistance) {
                position += diffVec * (1.0 - uRestDistance / dist) * (otherPin ? 1.0 : 0.5);
            }
        }
    }
    
    
    outPosition = position;
}`;




var update_normal_fs =
`#version 300 es

precision highp float;
in vec2 vScreenUV;

uniform sampler2D uPositionBuffer;
out vec3 outNormal;

void main() {
    
    ivec2 dimensions = textureSize(uPositionBuffer, 0);
    ivec2 texelCoord = ivec2(vScreenUV * vec2(dimensions));

    vec3 position = texelFetch(uPositionBuffer, texelCoord, 0).xyz;
    vec3 normal = vec3(0.0);
    
    if (texelCoord.x > 0) {
        
        vec3 left = texelFetch(uPositionBuffer, texelCoord - ivec2(1, 0), 0).xyz;
        
        if (texelCoord.y > 0) {
            
            vec3 down = texelFetch(uPositionBuffer, texelCoord - ivec2(0, 1), 0).xyz;
            normal += normalize(cross(left - position, down - position));
        }
        
        if (texelCoord.y < dimensions.y - 1) {
            
            vec3 up = texelFetch(uPositionBuffer, texelCoord + ivec2(0, 1), 0).xyz;
            normal += normalize(cross(up - position, left - position));
        }
    }
    
    if (texelCoord.x < dimensions.x - 1) {
        
        vec3 right = texelFetch(uPositionBuffer, texelCoord + ivec2(1, 0), 0).xyz;
        
        if (texelCoord.y > 0) {
            
            vec3 down = texelFetch(uPositionBuffer, texelCoord - ivec2(0, 1), 0).xyz;
            normal += normalize(cross(down - position, right - position));
        }
        
        if (texelCoord.y < dimensions.y - 1) {
            
            vec3 up = texelFetch(uPositionBuffer, texelCoord + ivec2(0, 1), 0).xyz;
            normal += normalize(cross(right - position, up - position));
        }
    }
    
    outNormal = normalize(normal);
}`;



var update_cut_fs = 
`#version 300 es   

precision highp float;

in vec2 vScreenUV;

layout(std140, column_major) uniform  SceneUniforms {
    
    mat4 viewProj;
    vec4 lightPosition;
};

uniform sampler2D uPositionBuffer;

uniform vec2 cutUV[10] 

layout(location=0) out vec3 outPosition;



void main() {

    ivec2 dimensions = textureSize(uPositionBuffer, 0);
    ivec2 maxTexelCoord = dimensions - 1;
    ivec2 texelCoord = ivec2(vScreenUV * vec2(dimensions));
    
    vec3 position = texelFetch(uPositionBuffer, texelCoord, 0).xyz;
    
    vec2 screenPos = (viewproj * vec4(position,1.0)).xy;

    int i = 0;

    position = vec3(1.0,1.0,1.0);

    for (i = 0; i < 10; i++){

        if (length(screenPos - cutUV[i]) < 1.0) {
            position = vec3(0.0,0.0,0.0);
        }
    }    
    
    outPosition = position;
}`;

   


var cloth_vs = 
`#version 300 es   

layout(location=0) in ivec2 aTexelCoord;
layout(location=1) in vec2 aUV;

uniform sampler2D uPositionBuffer;
uniform sampler2D uNormalBuffer;

uniform float slice;

layout(std140, column_major) uniform SceneUniforms {
    
    mat4 viewProj;
    vec4 lightPosition;
};

out vec3 vPosition;
out vec2 vUV;
out vec3 vNormal;
out float cut;


void main() {

    vec3 position = texelFetch(uPositionBuffer, aTexelCoord, 0).xyz;
    
    ivec2 dimensions = textureSize(uPositionBuffer, 0);

    cut = 1.0;
    
    if ((aTexelCoord.y == dimensions.y/2 + 10 || aTexelCoord.y == dimensions.y/2 - 10) && (slice > 0.0)){
        
        cut = 0.0;
    }

    vPosition = position;

    vNormal = texelFetch(uNormalBuffer, aTexelCoord, 0).xyz;
    vUV = aUV;

    gl_PointSize = 4.0;

    gl_Position = viewProj * vec4(position, 1.0);
}`;    



var phong_fs =
`#version 300 es

precision highp float;

layout(std140, column_major) uniform SceneUniforms {
    mat4 viewProj;
    vec4 lightPosition;
};

uniform sampler2D uDiffuse;

in vec3 vPosition;
in vec2 vUV;
in vec3 vNormal;
in float cut;

out vec4 fragColor;

void main() {

    if (cut < 1.0) {
        discard;
    }
    
    
    vec3 color = texture(uDiffuse, vUV).rgb;
    vec3 normal = normalize(vNormal);
    vec3 lightVec = -normalize(vPosition - lightPosition.xyz);
    
    float diffuse = abs(dot(lightVec, normal));
    float ambient = 0.1;
    
    fragColor = vec4(color * (diffuse + ambient), 1.0);
}`;


       
utils.addTimerElement();

if (!testExtension("EXT_color_buffer_float")) {
    document.body.innerHTML = "This example requires extension <b>EXT_color_buffer_float</b> which is not supported on this system."
}

let canvas = document.getElementById("view");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let app = PicoGL.createApp(canvas)
.clearColor(0.0, 0.0, 0.0, 1.0)
.depthTest();

let timer = app.createTimer();

const CONSTRAINT_ITERATIONS = 20;
const DATA_TEXTURE_DIM = 60;
const NUM_PARTICLES = DATA_TEXTURE_DIM * DATA_TEXTURE_DIM;
const STRUCTURAL_REST = 1 / DATA_TEXTURE_DIM;
const SHEAR_REST = Math.sqrt(2 * STRUCTURAL_REST * STRUCTURAL_REST);
const BALL_RADIUS = 0.15;
const BALL_RANGE = 0.9;

///////////////////
// PROGRAMS
///////////////////

// Generic quad vertex shader
let quadShader = app.createShader(PicoGL.VERTEX_SHADER, quad_vs);

let constraintShader = app.createShader(PicoGL.FRAGMENT_SHADER, update_constraint_fs);
let normalShader = app.createShader(PicoGL.FRAGMENT_SHADER, update_normal_fs);
let forceShader = app.createShader(PicoGL.FRAGMENT_SHADER, update_force_fs);

// Update wind and gravity forces
//let updateForceFsSource = document.getElementById("update-force-fs").text.trim();

// Apply structural and shear constraints
//let updateConstraintFsSource = document.getElementById("update-constraint-fs").text.trim();
// Check for collision with ball
//let updateCollisionFsSource = document.getElementById("update-collision-fs").text.trim();
// Calculate normals
//let updateNormalFsSource = document.getElementById("update-normal-fs").text.trim();

// Generic phong shader used for drawing
let phongShader = app.createShader(PicoGL.FRAGMENT_SHADER, phong_fs);


// Draw cloth
//let clothVsSource = document.getElementById("cloth-vs").text.trim();


////////////////////
// FRAME BUFFERS
////////////////////
// Store results of force update
let forceTarget1 = app.createTexture2D(DATA_TEXTURE_DIM, DATA_TEXTURE_DIM, { 
    internalFormat: PicoGL.RGBA32F
});

let forceTarget2 = app.createTexture2D(DATA_TEXTURE_DIM, DATA_TEXTURE_DIM, { 
    internalFormat: PicoGL.RGBA32F
});

let updateForceFramebuffer = app.createFramebuffer(DATA_TEXTURE_DIM, DATA_TEXTURE_DIM)
.colorTarget(0, forceTarget1)
.colorTarget(1, forceTarget2);

// Results of constraint satisfaction passes
let updateTarget = app.createTexture2D(DATA_TEXTURE_DIM, DATA_TEXTURE_DIM, { 
    internalFormat: PicoGL.RGBA32F
});

let updateFramebuffer = app.createFramebuffer(DATA_TEXTURE_DIM, DATA_TEXTURE_DIM)
.colorTarget(0, updateTarget);


///////////////////////////
// CLOTH GEOMETRY DATA
///////////////////////////
let clothPositionData = new Float32Array(NUM_PARTICLES * 4);
let clothNormalData = new Float32Array(NUM_PARTICLES * 4);
let uvData = new Float32Array(NUM_PARTICLES * 2);
let dataTextureIndex = new Int16Array(NUM_PARTICLES * 2);
let indexData = new Uint16Array((DATA_TEXTURE_DIM - 1) * (DATA_TEXTURE_DIM - 1) * 6);
let indexI = 0;

for (let i = 0; i < NUM_PARTICLES; ++i) {
    
    let vec4i = i * 4;
    let vec2i = i * 2;

    let x = (i % DATA_TEXTURE_DIM);
    let y = Math.floor(i / DATA_TEXTURE_DIM);

    let u = x / DATA_TEXTURE_DIM;
    let v = y / DATA_TEXTURE_DIM;
    
    clothPositionData[vec4i] = u - 0.5;
    clothPositionData[vec4i + 1] = v + 0.8;

    clothNormalData[vec4i + 2] = 1;

    //UV data, obvious
    uvData[vec2i] = u;
    uvData[vec2i + 1] = v;

    dataTextureIndex[vec2i] = (i % DATA_TEXTURE_DIM);
    dataTextureIndex[vec2i + 1] = Math.floor(i / DATA_TEXTURE_DIM);
    

    if (x < DATA_TEXTURE_DIM - 1 && y < DATA_TEXTURE_DIM - 1) {
        indexData[indexI]     = i;
        indexData[indexI + 1] = i + DATA_TEXTURE_DIM;
        indexData[indexI + 2] = i + DATA_TEXTURE_DIM + 1;
        indexData[indexI + 3] = i;
        indexData[indexI + 4] = i + DATA_TEXTURE_DIM + 1;
        indexData[indexI + 5] = i + 1;
        indexI += 6;
    }
}


///////////////////////////
// SIM DATA TEXTURES
///////////////////////////
let positionTextureA = app.createTexture2D(clothPositionData, DATA_TEXTURE_DIM, DATA_TEXTURE_DIM, {
    internalFormat: PicoGL.RGBA32F,
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.CLAMP_TO_EDGE,
    wrapT: PicoGL.CLAMP_TO_EDGE
});

let oldPositionTextureA = app.createTexture2D(clothPositionData, DATA_TEXTURE_DIM, DATA_TEXTURE_DIM, {
    internalFormat: PicoGL.RGBA32F,
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.CLAMP_TO_EDGE,
    wrapT: PicoGL.CLAMP_TO_EDGE
});

let positionTextureB = updateForceFramebuffer.colorAttachments[0];
let oldPositionTextureB = updateForceFramebuffer.colorAttachments[1];

let normalTexture = app.createTexture2D(clothNormalData, DATA_TEXTURE_DIM, DATA_TEXTURE_DIM, {
    internalFormat: PicoGL.RGBA32F,
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.CLAMP_TO_EDGE,
    wrapT: PicoGL.CLAMP_TO_EDGE
});



/////////////////////////
// GEOMETRY FOR DRAWING
/////////////////////////

// Quad for simulation passes
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


// Cloth geometry for drawing
let dataIndex = app.createVertexBuffer(PicoGL.SHORT, 2, dataTextureIndex);
let uv = app.createVertexBuffer(PicoGL.FLOAT, 2, uvData);
let indices = app.createIndexBuffer(PicoGL.UNSIGNED_SHORT, 3, indexData);

console.log(indexData);

console.log(dataTextureIndex);

console.log(indices);



let clothArray = app.createVertexArray()
.vertexAttributeBuffer(0, dataIndex)
.vertexAttributeBuffer(1, uv)
.indexBuffer(indices);




////////////////
// UNIFORMS
////////////////
// Constraint uniforms
let updateHorizontal1Uniforms = app.createUniformBuffer([
    PicoGL.INT_VEC2,
    PicoGL.INT,
    PicoGL.FLOAT
])
.set(0, new Int32Array([1, 0]))
.set(1, 0)
.set(2, STRUCTURAL_REST)
.update();

let updateHorizontal2Uniforms = app.createUniformBuffer([
    PicoGL.INT_VEC2,
    PicoGL.INT,
    PicoGL.FLOAT
])
.set(0, new Int32Array([1, 0]))
.set(1, 1)
.set(2, STRUCTURAL_REST)
.update();

let updateVertical1Uniforms = app.createUniformBuffer([
    PicoGL.INT_VEC2,
    PicoGL.INT,
    PicoGL.FLOAT
])
.set(0, new Int32Array([0, 1]))
.set(1, 0)
.set(2, STRUCTURAL_REST)
.update();

let updateVertical2Uniforms = app.createUniformBuffer([
    PicoGL.INT_VEC2,
    PicoGL.INT,
    PicoGL.FLOAT
])
.set(0, new Int32Array([0, 1]))
.set(1, 1)
.set(2, STRUCTURAL_REST)
.update();

let updateShear1Uniforms = app.createUniformBuffer([
    PicoGL.INT_VEC2,
    PicoGL.INT,
    PicoGL.FLOAT
])
.set(0, new Int32Array([1, 1]))
.set(1, 0)
.set(2, SHEAR_REST)
.update();

let updateShear2Uniforms = app.createUniformBuffer([
    PicoGL.INT_VEC2,
    PicoGL.INT,
    PicoGL.FLOAT
])
.set(0, new Int32Array([1, 1]))
.set(1, 1)
.set(2, SHEAR_REST)
.update();

let updateShear3Uniforms = app.createUniformBuffer([
    PicoGL.INT_VEC2,
    PicoGL.INT,
    PicoGL.FLOAT
])
.set(0, new Int32Array([1, -1]))
.set(1, 0)
.set(2, SHEAR_REST)
.update();

let updateShear4Uniforms = app.createUniformBuffer([
    PicoGL.INT_VEC2,
    PicoGL.INT,
    PicoGL.FLOAT
])
.set(0, new Int32Array([1, -1]))
.set(1, 1)
.set(2, SHEAR_REST)
.update();



let projMatrix = mat4.create();
mat4.perspective(projMatrix, Math.PI / 2, canvas.width / canvas.height, 0.1, 3.0);

let viewMatrix = mat4.create();

let eyePosition = vec3.fromValues(0.5, 0.7, 1.2);
mat4.lookAt(viewMatrix, eyePosition, vec3.fromValues(0, 1.0, 0), vec3.fromValues(0, 1, 0));

let viewProjMatrix = mat4.create();
mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);

let lightPosition = vec3.fromValues(1, 1, 1);


let sceneUniformBuffer = app.createUniformBuffer([
    PicoGL.FLOAT_MAT4,
    PicoGL.FLOAT_VEC4
])
.set(0, viewProjMatrix)
.set(1, lightPosition)
.update();


let targetZ = null;
let targetY = null;

var cut = -1.0;

Promise.all([

    app.createPrograms(
        [quadShader, forceShader],
        [quadShader, constraintShader],
        [quadShader, normalShader],
        [cloth_vs, phongShader]
    ),

    utils.loadImages(["./models/dune.jpg"])

]).then(([

    [updateForceProgram, updateConstraintProgram, updateNormalProgram, clothProgram],
    [image]

]) => {

    let texture = app.createTexture2D(image, { 
        maxAnisotropy: PicoGL.WEBGL_INFO.MAX_TEXTURE_ANISOTROPY 
    });

    
    ///////////////
    // DRAW CALLS
    ///////////////
    // Update forces
    let updateForceDrawCall = app.createDrawCall(updateForceProgram, quadArray)
    .texture("uPositionBuffer", positionTextureA)
    .texture("uNormalBuffer", normalTexture);


    // Structural constraints
    let updateHorizontal1DrawCall = app.createDrawCall(updateConstraintProgram, quadArray)
    .uniformBlock("ConstraintUniforms", updateHorizontal1Uniforms);
    
    let updateHorizontal2DrawCall  = app.createDrawCall(updateConstraintProgram, quadArray)
    .uniformBlock("ConstraintUniforms", updateHorizontal2Uniforms);
    
    let updateVertical1DrawCall = app.createDrawCall(updateConstraintProgram, quadArray)
    .uniformBlock("ConstraintUniforms", updateVertical1Uniforms);
    
    let updateVertical2DrawCall = app.createDrawCall(updateConstraintProgram, quadArray)
    .uniformBlock("ConstraintUniforms", updateVertical2Uniforms);



    // Shear constraints
    let updateShear1DrawCall = app.createDrawCall(updateConstraintProgram, quadArray)
    .uniformBlock("ConstraintUniforms", updateShear1Uniforms);
    
    let updateShear2DrawCall = app.createDrawCall(updateConstraintProgram, quadArray)
    .uniformBlock("ConstraintUniforms", updateShear2Uniforms);
    
    let updateShear3DrawCall = app.createDrawCall(updateConstraintProgram, quadArray)
    .uniformBlock("ConstraintUniforms", updateShear3Uniforms);
    
    let updateShear4DrawCall = app.createDrawCall(updateConstraintProgram, quadArray)
    .uniformBlock("ConstraintUniforms", updateShear4Uniforms);
    
    
    
    let updateNormalDrawCall = app.createDrawCall(updateNormalProgram, quadArray);
    

    let clothDrawCall = app.createDrawCall(clothProgram, clothArray)
    .uniformBlock("SceneUniforms", sceneUniformBuffer)
    .texture("uDiffuse", texture)
    .texture("uNormalBuffer", normalTexture);
    
   


    /////////
    // DRAW
    /////////
    function draw() {
        
        if (timer.ready()) {
            
            utils.updateTimerElement(timer.cpuTime, timer.gpuTime);
        }
        
        timer.start();


        updateForceDrawCall.texture("uPositionBuffer", positionTextureA);
        updateForceDrawCall.texture("uOldPositionBuffer", oldPositionTextureA);
        
        updateForceFramebuffer.colorTarget(0, positionTextureB);
        updateForceFramebuffer.colorTarget(1, oldPositionTextureB);
        
        app.viewport(0, 0, DATA_TEXTURE_DIM, DATA_TEXTURE_DIM);
        app.drawFramebuffer(updateForceFramebuffer);
        
        updateForceDrawCall.draw();
        
        for (let i = 0; i < CONSTRAINT_ITERATIONS; ++i) {
            
            app.drawFramebuffer(updateFramebuffer);
            
            updateFramebuffer.colorTarget(0, positionTextureA);
            updateHorizontal1DrawCall.texture("uPositionBuffer", positionTextureB)
            .uniform("slice",1.0)
            .draw();
            
            updateFramebuffer.colorTarget(0, positionTextureB);
            updateHorizontal2DrawCall.texture("uPositionBuffer", positionTextureA)
            .uniform("slice",cut)
            .draw();
            
            updateFramebuffer.colorTarget(0, positionTextureA);
            updateVertical1DrawCall.texture("uPositionBuffer", positionTextureB)
            .uniform("slice",cut)
            .draw();
            
            updateFramebuffer.colorTarget(0, positionTextureB);
            updateVertical2DrawCall.texture("uPositionBuffer", positionTextureA)
            .uniform("slice",cut)
            .draw();
            
            updateFramebuffer.colorTarget(0, positionTextureA);
            updateShear1DrawCall.texture("uPositionBuffer", positionTextureB)
            .uniform("slice",cut)
            .draw();
            
            updateFramebuffer.colorTarget(0, positionTextureB);
            updateShear2DrawCall.texture("uPositionBuffer", positionTextureA)
            .uniform("slice",cut)
            .draw();
            
            updateFramebuffer.colorTarget(0, positionTextureA);
            updateShear3DrawCall.texture("uPositionBuffer", positionTextureB)
            .uniform("slice",cut)
            .draw();
            
            updateFramebuffer.colorTarget(0, positionTextureB);
            updateShear4DrawCall.texture("uPositionBuffer", positionTextureA)
            .uniform("slice",cut)
            .draw();   
        }


        
        updateFramebuffer.colorTarget(0, normalTexture);
        updateNormalDrawCall.texture("uPositionBuffer", positionTextureA).draw();
        
        clothDrawCall.texture("uPositionBuffer", positionTextureA)
        .uniform("slice",cut);

        app.defaultViewport().defaultDrawFramebuffer().clear();
        
        clothDrawCall.draw();
        
        let temp = oldPositionTextureA;
        oldPositionTextureA = oldPositionTextureB;
        oldPositionTextureB = temp;
        
        timer.end();
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw); 
});