var mat4 = glMatrix.mat4;
var vec3 = glMatrix.vec3;
var quat = glMatrix.quat;

var gl, prog;


var vert_shader = `

precision mediump float;

attribute vec3 vertpos;
uniform vec3 vertcolor;

uniform mat4 viewmat;
uniform mat4 frustmat;
uniform float timevar;

varying vec3 color;

void main(){

    color = vertcolor;
    gl_Position = frustmat * viewmat * vec4(vertpos, 1.0);
    gl_PointSize = 20.0;
}`;



var frag_shader = `

precision mediump float;

varying vec3 color;

void main(){

    gl_FragColor = vec4(color, 1.0);
}`;





class Player {

	constructor(){

		this.eyePt = vec3.fromValues(0.0,1.0,0.0);
		this.focusVec = vec3.fromValues(0.0,0.0,10.0);
		this.upVec = vec3.fromValues(0.0,1.0,0.0);
		this.focusCoord = vec3.create();
		
		this.lookMat = mat4.create();

		this.rot = mat4.create();
		this.tran = mat4.create();
	}



	rotate(axis, deg){

		mat4.fromRotation(rot, deg ,axis);

		//vec3.transformMat4(eyeCoord, ); eye coord wouldnt change right?
		vec3.transformMat4(upVec, upVec, rot);
		vec3.transformMat4(focusVec, focusVec, rot); //probably wrong...
	}


	move(x,y,z){

		//mat4.fromTranslation(tran, direction);
		vec3.add(this.eyePt, this.eyePt, vec3.fromValues(x,y,z));
	}


	getView(){

		vec3.add(this.focusCoord, this.eyePt, this.focusVec);

		mat4.lookAt(this.lookMat, this.eyePt, this.focusCoord, this.upVec);

		return this.lookMat;
	}
}






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


var player = new Player();



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

var cont = 0;
var dir = 0;

var n = 0;

var currTime, timePassed;


function render(viewmatrix){

    gl.uniformMatrix4fv(viewmat,false, viewmatrix);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform3f(colorMem, 1.0, 1.0, 1.0);
    gl.drawElements(gl.POINTS, n, gl.UNSIGNED_SHORT, 0);

    gl.uniform3f(colorMem, 0.0, 0.0, 1.0);
    gl.drawElements(gl.LINES, n, gl.UNSIGNED_SHORT, 0);
}




document.onkeydown = function(ev){ trigger(ev); };
    
function trigger(ev) {

	console.log("keypressed");

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
        updateWorld();
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

	console.log("updating world");

	while (cont){

		if (dir > 0){

			console.log("right");

			dir = 0;
			player.move(0.1,0.0,0.0);
		}

		else if (dir < 0){

			console.log("left");

			dir = 0;
			player.move(-0.1,0.0,0.0);
		}
		else {
			//nada for now
		}

		render(player.getView());
	}
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

    timeMem = gl.getUniformLocation(prog, 'timevar');
    gl.uniform1f(timeMem, performance.now());

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.LINE_LOOP, n, gl.UNSIGNED_SHORT ,0);

    console.log("drew");

    updateWorld();
};
