var vert_shader = `

precision mediump float;

attribute vec3 vertpos;
uniform vec3 vertcolor;

uniform mat4 viewmat;
uniform mat4 frustmat;

varying vec3 color;

void main(){

    color = vertcolor;
    gl_Position = frustmat * viewmat * vec4(vertpos, 1.0);
    gl_PointSize = 10.0;
}`;



var frag_shader = `

precision mediump float;

varying vec3 color;

void main(){

    gl_FragColor = vec4(color, 1.0);
}`;



/*class Vert {

    coords;
    color;
    uv;

    constructor(xp, yp, zp, rp, gp, bp, sp, tp){

        this.x = xp;
        this.y = yp;
        this.z = zp;
        this.r = rp;
        this.g = gp;
        this.b = bp;
        this.s = sp;
        this.t = tp;
    }

    constructor(xp,yp,zp){
        this.x = xp;
        this.y = yp;
        this.z = zp;
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.s = 0;
        this.t = 0;
    }


    constructor(xp,yp,zp, rp, gp, bp){
        this.x = xp;
        this.y = yp;
        this.z = zp;
        this.r = rp;
        this.g = gp;
        this.b = bp;
        this.s = 0;
        this.t = 0;
    }

    toArray(){
        return [x, y, z, r, g, b, s, t];
    }
}


class Triangle {

    one, two, three;

    constructor(onep, twop, threep){

        this.one = onep;
        this.two = twop;
        this.three = threep;
    }
}


class Obj {

    tris = [];

    constructor(){
        tris = [];
    }

    addTri(tri){

        tris.push(tri);
    }

    toArray(){
        //
    }
}

*/


var mat4 = glMatrix.mat4;
var vec3 = glMatrix.vec3;
var quat = glMatrix.quat;

var gl, prog;

function initGL(gl, canvas){
    if (!gl){
        alert("Dude get hip");
        return -1;
    }
  	gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    return 0;
}


function initShader(gl, shaderVar, shaderText){

    gl.shaderSource(shaderVar, shaderText);
    gl.compileShader(shaderVar);

    if (!gl.getShaderParameter(shaderVar, gl.COMPILE_STATUS)){
        console.error("shader compilation failed", gl.getShaderInfoLog(shaderVar));
        return -1;
    }
    return 0;
}


var eyeCoord = vec3.fromValues(0,0,4);
var focusPt = vec3.fromValues(0,0,-2);
var upDir = vec3.fromValues(0,1,0);
var recv = vec3.create();
var rotationQuat = quat.create(); 
quat.fromEuler(rotationQuat, 0,0,0);

var toOrg = vec3.create();
vec3.sub(toOrg, focusPt, vec3.create());
var scale = vec3.fromValues(1,1,1);
var dummyTransl = vec3.create();
var angle = 0;
var frust = mat4.create();
mat4.perspective(frust, Math.PI/2, 4/3, .1, 20);

var viewmatrix =  mat4.create();
var viewmat, frustmat, rotmat = mat4.create();
var timemem, time;
var samplermem;

var cont = 1;
var dir = 0;

var n = 0;

var currTime, timePassed;


function render(){

	if (cont == 0){
		return;
	}

    timePassed = performance.now() - currTime;

    quat.fromEuler(rotationQuat, 0, timePassed/10000 * Math.PI/4 * dir, 0);

    mat4.fromRotationTranslationScaleOrigin(rotmat, rotationQuat, dummyTransl, scale, toOrg);
    vec3.transformMat4(eyeCoord, eyeCoord, rotmat);

    mat4.lookAt(viewmatrix, eyeCoord, focusPt, upDir);

    gl.uniformMatrix4fv(viewmat,false, viewmatrix);
    //gl.uniform1f(timeMem, (timePassed/1000) % 5000);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    gl.uniform3f(colorMem, 1.0, 1.0, 1.0);
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.POINTS, n, gl.UNSIGNED_SHORT, 0);

    gl.uniform3f(colorMem, 0.0, 0.0, 1.0);

    gl.drawElements(gl.LINE_LOOP, n, gl.UNSIGNED_SHORT, 0);



    window.requestAnimationFrame(render);
}




document.onkeydown = function(ev){ trigger(ev); };
    
function trigger(ev) {

    if (ev.keyCode == 39){
        dir += 1;
    }
    else if (ev.keyCode == 37){
        dir -= 1;
    }
    else if (ev.keyCode == 81){//q
        cont = 0;
    }
    else if (ev.keyCode == 87){//w
        cont = 1;
        currTime = performance.now();
        window.requestAnimationFrame(render);
    }

    else {return;}
};

function readOBJFile(fileName, gl, scale, reverse) {
  
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) {
      onReadOBJFile(request.responseText, fileName, gl, scale, reverse);
      proceedToDraw();
    }
  }
  request.open('GET', fileName, true); // Create a request to acquire the file
  request.send();                      // Send the request
}


/*function loadTexture(gl, img){

    console.log("up here width is: " + img.width);

    var texture = gl.createTexture();


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis

    //var image = createTextureFromImage(gl, img);
    //^^texImg2D called in that func


    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.uniform1i(samplermem, 0);
}



function initTexture(gl){

    var img = new Image();

    img.onload = function(){ loadTexture(gl, img);};

    img.crossOrigin = "anonymous"; 
    img.src = "./images/foam.jpg";
}*/




var initShellDemo = function(){

    var canvas = document.getElementById("view");    

    gl = canvas.getContext("webgl");

    initGL(gl, canvas);

    var vshader = gl.createShader(gl.VERTEX_SHADER);
    var fshader = gl.createShader(gl.FRAGMENT_SHADER);

    initShader(gl, vshader, vert_shader);
    initShader(gl, fshader, frag_shader);

    prog = gl.createProgram();
    gl.attachShader(prog, vshader);
    gl.attachShader(prog, fshader);

    gl.linkProgram(prog);

    gl.useProgram(prog);

    gl.enable(gl.DEPTH_TEST);

    readOBJFile("./models/shell.obj", gl, 4, 0);

    console.log("initialized");
};



function updateWorld(){

	//






}






function proceedToDraw() {

    gobData = gob.getDrawingInfo();
    
    var vertBuf = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, gobData.vertices, gl.STATIC_DRAW);

    console.log("vert buffer: " +  gob.vertices.map(v => "[" + v.x + ","+ v.y+ "," + v.z + "]"));

    var elSize = gobData.vertices.BYTES_PER_ELEMENT;

    posMem = gl.getAttribLocation(prog, "vertpos");

    gl.vertexAttribPointer(posMem, 3, gl.FLOAT, gl.FALSE, elSize * 3, 0);
    gl.enableVertexAttribArray(posMem);

    colorMem = gl.getUniformLocation(prog, "vertcolor");
    gl.uniform3f(colorMem, 1.0, 0.0, 1.0);

    var indBuf = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gobData.indices, gl.STATIC_DRAW);

    console.log("index buffer: " + gob.indices);

    n = gobData.indices.length;

    mat4.lookAt(viewmatrix, eyeCoord, focusPt, upDir);

    viewmat = gl.getUniformLocation(prog, 'viewmat');
    gl.uniformMatrix4fv(viewmat,false, viewmatrix);

    frustmat = gl.getUniformLocation(prog, 'frustmat');
    gl.uniformMatrix4fv(frustmat, false, frust);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.LINE_LOOP, n, gl.UNSIGNED_SHORT ,0);

    console.log("drew");

    updateWorld();
};
