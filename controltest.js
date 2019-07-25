var mat4 = glMatrix.mat4;
var vec3 = glMatrix.vec3;
var quat = glMatrix.quat;

var current_time = 0;


//var gl, prog;


class Player {

    constructor(){

        this.eyePt = vec3.fromValues(-4.0,0.0,0.0);
        this.focusVec = vec3.fromValues(0.0,0.0,40.0);
        this.upVec = vec3.fromValues(0.0,1.0,0.0);
        this.focusCoord = vec3.create();
        
        this.lookMat = mat4.create();

        this.rot = mat4.create();
        this.tran = mat4.create();
    }

    rotate(axis, deg){

        mat4.fromRotation(this.rot, deg, axis);

        vec3.transformMat4(this.upVec, this.upVec, this.rot);
        vec3.transformMat4(this.focusVec, this.focusVec, this.rot); //probably wrong...
    }

    move(x,y,z){

        console.log("b4: " + this.eyePt);
        vec3.add(this.eyePt, this.eyePt, vec3.fromValues(x,y,z));
        console.log("af: " + this.eyePt);
    }

    getView(){

        vec3.add(this.focusCoord, this.eyePt, this.focusVec);
        mat4.lookAt(this.lookMat, this.eyePt, this.focusCoord, this.upVec);

        return this.lookMat;
    }

    getUp(){
        return this.upVec;
    }
}


/*

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
}*/


var eyeCoord = vec3.fromValues(0,0,0);
var focusPt = vec3.fromValues(0,0,-40);
var upDir = vec3.fromValues(0,1,0);
var recv = vec3.create();
var rotationQuat = quat.create(); 
quat.fromEuler(rotationQuat, 0,0,0);

var player = new Player();


var toOrg = vec3.create();
vec3.sub(toOrg, focusPt, vec3.create());
var scale = vec3.fromValues(1,1,1);
var dummyTransl = vec3.create();
var angle = 0;
var frust = mat4.create();
mat4.perspective(frust, Math.PI/2, 4/3, .1, null);

var viewmatrix =  mat4.create();
var viewmat, frustmat, rotmat = mat4.create();
var timemem, time;
var samplermem;
var colormem;
var clickposmem;
var clicktimemem;
var flagmem;
var mouseposmem;

var cont = 0;
var dir = 0;

var n = 0;

var currTime, timePassed;

var clicktime = 0;
var clickpos = vec3.fromValues(0.0,0.0,6.7);

var updatefps = 0;


var mouseInitialized = false;
var mouseX, mouseY;
var deltamX = 0, delatmY = 0;
var mouseRead = false;



function updateClick(){

    clicktime = performance.now()/1000;
    vec3.add(clickpos, player.focusVec, player.eyePt);

    clickData.set(0, clicktime)
	.set(1, clickpos)
	.update()

    console.log("Click coords: " + clickpos + " Length: " + vec3.length(clickpos));
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
        console.log("pressed g...");

        window.requestAnimationFrame(updateWorld);
    }
    else if (event.keyCode == 84){
        cont = 0;
        keyMap.set(71, false);
    }
    else if (event.keyCode == 87){
        updatefps = 1;
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
window.addEventListener("mousemove", mouseHandler, false);
window.addEventListener("click", updateClick, false);






function readOBJFile(fileName, gl, scale, reverse, gobPtr) {
  
  var request = new XMLHttpRequest();

  request.onreadystatechange = function(gobPtr) {
    
    if (request.readyState === 4 && request.status !== 404) {
      gobPtr.data = onReadOBJFile(request.responseText, fileName, gl, scale, reverse);
    }
  }

  request.open('GET', fileName, false); // Create a request to acquire the file
  request.send();                      // Send the request
}