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
precision highp sampler3D;

uniform sampler2D dataTex;
uniform sampler3D velTex;

uniform mat4 view;
uniform mat4 frust;

layout(location=0) in vec2 dataIndex;

out vec4 color;


vec3 toWorld(vec3 texPosition){
    return (2.0 * texPosition) - 1.0;
}

vec3 toTex(vec3 worldPosition){
    return (worldPosition + 1.0)/2.0; 
}



void main(){

    vec4 pos = texture(dataTex, dataIndex/32.0);

    pos = vec4(toWorld(pos.xyz),1.0);

    gl_Position = frust * view * pos;
    gl_PointSize = 10.0;

    color = vec4(normalize(texture(velTex, toTex(pos.xyz)).rgb),1.0);
    //color = vec4(toTex(pos.xyz), 1.0);
} `;



var pointFrag = 
`#version 300 es

precision highp float;


in vec4 color;

out vec4 fragColor;

void main(){

    fragColor = color;

    if (length(2.0 * gl_PointCoord - 1.0) > 0.5){
        discard;
    }
} `;





var quad_vs = 
`#version 300 es  

layout(location=0) in vec2 aPosition;

out vec2 index;

void main() {

    index = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition,0.0,1.0);//not sure yet why this is necessary..
}`;



var pointVelFrag = 
`#version 300 es

precision highp float;
precision highp sampler3D;
precision highp sampler2D;

uniform sampler2D dataTex;
uniform sampler3D flowField;  

in vec2 index;

layout(location=0) out vec4 position;


vec3 toWorld(vec3 texPosition){
    return (2.0 * texPosition) - 1.0;
}

vec3 toTex(vec3 worldPosition){
    return (worldPosition + 1.0)/2.0; 
}


void main(){

    vec4 pos = texture(dataTex, index);
    pos = vec4(toWorld(pos.xyz),1.0);

    vec3 velocity = texture(flowField, toTex(pos.xyz)).xyz;

    velocity = toWorld(velocity); //keep

    vec3 worldPos = pos.xyz + .1 * velocity; //keep

    worldPos = toTex(worldPos); //this wasn't working because you didnt convert it in the first place!!!

    position = vec4(worldPos,1.0);
}`;




var noiseGen = new SimplexNoise(Math.random());


var deltamX = 0;
var deltamY = 0;

var g_up = vec3.fromValues(0.0,1.0,0.0);


utils.addTimerElement();


if (!testExtension("EXT_color_buffer_float")) {
    document.body.innerHTML = "This example requires extension <b>EXT_color_buffer_float</b> which is not supported on this system."
}

let canvas = document.getElementById("view");
//canvas.width = window.innerWidth;
//canvas.height = window.innerHeight;

let app = PicoGL.createApp(canvas)
.clearColor(0.0, 0.0, 0.0, 1.0)
.depthTest();


let timer = app.createTimer();


const dim = 32;

var NUM_PARTICLES = 1024;

let posData = new Float32Array(NUM_PARTICLES * 4);
let velData = new Float32Array(NUM_PARTICLES * 4);
let texIndex = 0;


let posIndicies = new Float32Array(NUM_PARTICLES * 2);



for (let i = 0; i < NUM_PARTICLES * 4; i+=4){

    posIndicies[i/2] = Math.floor((i/4)/dim);
    posIndicies[i/2 + 1] = (i/4) % dim;


    posData[i] =  Math.random()/2;
    posData[i + 1] = Math.random()/2;
    posData[i + 2] = Math.random()/2;
    posData[i + 3] = 1.0;
}




const dim3d = 32;

let textureData = new Float32Array(dim3d * dim3d * dim3d * 4);
let textureIndex = 0;

for (let i = 0; i < dim3d; ++i) {
    for (let j = 0; j < dim3d; ++j) {
        for (let k = 0; k < dim3d; ++k) {
                
            let iadj = 100*i;///dim3d;
            let jadj = 100*j;///dim3d;
            let kadj = 100*k;///dim3d;

            let x = (noiseGen.noise(jadj,kadj) + 1.0)/2.0;
            let y = (noiseGen.noise(iadj,kadj) + 1.0)/2.0;
            let z = (noiseGen.noise(iadj,jadj) + 1.0)/2.0;
            /*

            if (k < 1){
                z = 1.0;
            }
            if (k > dim3d - 2){
                z = 0.0;
            }

            if (j < 1){
                y = 1.0;
            }
            if (j > dim3d - 2){
                y = 0.0;
            }            

            if (i < 1){
                x = 1.0;
            }
            if (i > dim3d - 2){
                x = 0.0;
            }*/
            //let x = 0.5;
            //let y = 0.5;
            //let z = 0.5;


            textureData[textureIndex++] = x;
            textureData[textureIndex++] = y;
            textureData[textureIndex++] = z;
            textureData[textureIndex++] = 0.0;

            if (y > 1.0 || y < 0.0){
                console.log("yea...")
            }
        }
    }
}


let noiseTex = app.createTexture3D(textureData, dim3d, dim3d, dim3d, { 
    internalFormat: PicoGL.RGBA32F, 
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT,
    maxAnisotropy: PicoGL.WEBGL_INFO.MAX_TEXTURE_ANISOTROPY 
});

let dataTex = app.createTexture2D(posData, dim, dim, {
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.CLAMP_TO_EDGE,
    wrapT: PicoGL.CLAMP_TO_EDGE,
    internalFormat: PicoGL.RGBA32F
});

let updateTex = app.createTexture2D(posData, dim, dim, {
    minFilter: PicoGL.NEAREST,
    magFilter: PicoGL.NEAREST,
    wrapS: PicoGL.CLAMP_TO_EDGE,
    wrapT: PicoGL.CLAMP_TO_EDGE,
    internalFormat: PicoGL.RGBA32F
});


let velTexA  = app.createTexture2D(velData, dim, dim, { 
    internalFormat: PicoGL.RGBA32F, 
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT,
    maxAnisotropy: PicoGL.WEBGL_INFO.MAX_TEXTURE_ANISOTROPY 
});

let velTexB  = app.createTexture2D(velData, dim, dim, { 
    internalFormat: PicoGL.RGBA32F, 
    wrapS: PicoGL.REPEAT,
    wrapT: PicoGL.REPEAT,
    maxAnisotropy: PicoGL.WEBGL_INFO.MAX_TEXTURE_ANISOTROPY 
});


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


let updateFramebuffer = app.createFramebuffer(dim, dim)
.colorTarget(0, updateTex);




// UNIFORM DATA
let projMatrix = mat4.create();
mat4.perspective(projMatrix, Math.PI / 2, canvas.width / canvas.height, 0.1, 30.0);
let viewMatrix = mat4.create();

let eyePosition = vec3.fromValues(-4, 0, -4);
mat4.lookAt(viewMatrix, eyePosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
let mvpMatrix = mat4.create();
mat4.multiply(mvpMatrix, projMatrix, viewMatrix);




/*window.onresize = function() {
    app.resize(window.innerWidth, window.innerHeight);
    mat4.perspective(projMatrix, Math.PI / 2, app.width / app.height, 0.1, 10.0);
    mat4.multiply(mvpMatrix, projMatrix, viewMatrix);            
}*/

var flag = false;

var time = performance.now();

app.createPrograms([pointVert, pointFrag], [quad_vs, pointVelFrag]).then(([program, updateProgram]) => {
    
    let updatePositionCall = app.createDrawCall(updateProgram, quadArray)
    .primitive(PicoGL.TRIANGLES)
    .texture("dataTex", dataTex)
    .texture("flowField", noiseTex);


    let drawCall = app.createDrawCall(program, points)
    .primitive(PicoGL.POINTS)
    .texture("dataTex", dataTex)
    .uniform("view", player.getView())
    .uniform("frust", projMatrix)
    .texture("velTex", noiseTex);


    app.defaultViewport();
    app.defaultDrawFramebuffer();
    app.clear();


    //drawCall.uniform("time", 0.0);
    drawCall.draw();



    //let startTime = performance.now();


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


        let timeDiff = (performance.now() - time)/1000;
        
        if (timer.ready()) {
           
            utils.updateTimerElement(timer.cpuTime, timer.gpuTime);
        }

        timer.start();

        app.viewport(0, 0, dim, dim);


        if (!flag){
            updatePositionCall.texture("dataTex", dataTex)
            updateFramebuffer.colorTarget(0, updateTex);

        }
        else {
            updatePositionCall.texture("dataTex", updateTex)
            updateFramebuffer.colorTarget(0, dataTex);

        }

        app.drawFramebuffer(updateFramebuffer);
        updatePositionCall.draw();


        if (!flag){
            drawCall.texture("dataTex", updateTex);
        }
        else {
            drawCall.texture("dataTex", dataTex);
        }

        flag = !flag;

        app.defaultViewport();
        app.defaultDrawFramebuffer();
        app.clear();


        drawCall.uniform("view", player.getView());
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





