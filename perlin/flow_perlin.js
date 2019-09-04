var pointVert =
`#version 300 es

precision highp float;
//precision highp sampler3D;
precision highp sampler2D;


uniform sampler2D dataTex;
//uniform sampler3D flowField;  

layout(location=0) in vec2 dataIndex;

out vec4 color;


void main(){

    vec4 pos = texture(dataTex, dataIndex/16.0);

    gl_Position = pos;
    gl_PointSize = 20.0;
    color = vec4(1.0,1.0,1.0,1.0);
} 
`;


var pointVelFrag = 
`



`;




var pointFrag = 
`#version 300 es

precision highp float;


in vec4 color;

out vec4 fragColor;

void main(){

    fragColor = color;

} `;











utils.addTimerElement();
let canvas = document.getElementById("view");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let app = PicoGL.createApp(canvas)
.clearColor(0.0, 0.0, 0.0, 1.0)
.depthTest();


let timer = app.createTimer();


const dim = 16;

var NUM_PARTICLES = 256;

let posData = new Float32Array(NUM_PARTICLES * 4);
let texIndex = 0;


let posIndicies = new Float32Array(NUM_PARTICLES * 2);



for (let i = 0; i < NUM_PARTICLES * 4; i+=4){

    posIndicies[i/2] = Math.floor((i/4)/dim);
    posIndicies[i/2 + 1] = (i/4) % dim;


    posData[i] = 1.0 - Math.random() * 2.0 
    posData[i + 1] = 1.0 - Math.random() * 2.0
    posData[i + 2] = 1.0 - Math.random() * 2.0
    posData[i + 3] = 1.0;
}



/*
const TEXTURE_DIMENSIONS = 16;

let textureData = new Float32Array(TEXTURE_DIMENSIONS * TEXTURE_DIMENSIONS * TEXTURE_DIMENSIONS * 3);
let textureIndex = 0;

for (let i = 0; i < TEXTURE_DIMENSIONS; ++i) {
    for (let j = 0; j < TEXTURE_DIMENSIONS; ++j) {
        for (let k = 0; k < TEXTURE_DIMENSIONS; ++k) {
            
            let x = noise.perlin2(j,k)
            let y = noise.perlin2(i,k)
            let z = noise.perlin2(i,j)

            textureData[textureIndex++] = x;
            textureData[textureIndex++] = y
            textureData[textureIndex++] = z
        }
    }
}


let texture = app.createTexture3D(textureData, TEXTURE_DIMENSIONS, TEXTURE_DIMENSIONS, TEXTURE_DIMENSIONS, { 
    internalFormat: PicoGL.RGB32F, 
    maxAnisotropy: PicoGL.WEBGL_INFO.MAX_TEXTURE_ANISOTROPY 
});*/

let dataTex = app.createTexture2D(posData, dim, dim, {
    internalFormat: PicoGL.RGBA32F
});


let indices = app.createVertexBuffer(PicoGL.FLOAT, 2, posIndicies)
let points = app.createVertexArray()
.vertexAttributeBuffer(0, indices);




// UNIFORM DATA
let projMatrix = mat4.create();
mat4.perspective(projMatrix, Math.PI / 2, canvas.width / canvas.height, 0.1, 30.0);
let viewMatrix = mat4.create();

let eyePosition = vec3.fromValues(-10, -10, -10);
mat4.lookAt(viewMatrix, eyePosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
let mvpMatrix = mat4.create();
mat4.multiply(mvpMatrix, projMatrix, viewMatrix);




window.onresize = function() {
    app.resize(window.innerWidth, window.innerHeight);
    mat4.perspective(projMatrix, Math.PI / 2, app.width / app.height, 0.1, 10.0);
    mat4.multiply(mvpMatrix, projMatrix, viewMatrix);            
}




app.createPrograms([pointVert, pointFrag]).then(([program]) => {
    
    let drawCall = app.createDrawCall(program, points)
    .primitive(PicoGL.POINTS)
    .texture("dataTex", dataTex)

    //let startTime = performance.now();


    function draw() {
        
        if (timer.ready()) {
           
            utils.updateTimerElement(timer.cpuTime, timer.gpuTime);
        }
        
        //timer.start();

        //drawCall.uniform("uTime", (performance.now() - startTime) / 1000);

        app.clear();
        drawCall.draw();
        
        //timer.end();

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
});





