



class Player {

	//var eyePt = 1;

	constructor(){

		this.eyePt = vec3.fromValues(0.0,1.0,0.0);
		this.focusVec = vec3.fromValues(0.0,0.0,100.0);
		this.upVec = vec3.fromValues(0.0,1.0,0.0);
		this.focusCoord = vec3.create();
		
		this.lookMat = mat4.create();
		this.frustMat = mat4.create();
		mat4.perspective(frustMat, Math.PI/2, 4/3, .1, 20);

		this.rot = mat4.create();
		this.tran = mat4.create();
	}

	rotate(axis, deg){

		mat4.fromRotation(this.rot, deg, axis);

		//vec3.transformMat4(this.upVec, this.upVec, this.rot);
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

var mouseInitialized = false;
var mouseX, mouseY;
var deltamX = 0, delatmY = 0;
var mouseRead = false;


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




function processInput(player_obj){

	if (keyMap.get(65)){
		console.log("to the left...");
		player.move(0.1,0.0,0.0);
	}

	if (keyMap.get(68)){
		player.move(-0.1,0.0,0.0);
	}

	
	if (!mouseRead){

		player.rotate(vec3.fromValues(1.0,0.0,0.0), deltamY/100);
		player.rotate(vec3.fromValues(0.0,1.0,0.0), -deltamX/100);

		mouseRead = true;
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

    var normBuf = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.bufferData(gl.ARRAY_BUFFER, gobData.normals, gl.STATIC_DRAW);

    var normMem = gl.getAttribLocation(prog, "normal");

    gl.vertexAttribPointer(normMem, 3, gl.FLOAT, gl.FALSE, elSize * 3, 0);
    gl.enableVertexAttribArray(normMem);


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

    lightDir = gl.getUniformLocation(prog, 'lightdir');
    gl.uniform3f(lightDir, 1.0, 1.0, 1.0);

    lightCol = gl.getUniformLocation(prog, 'lightcolor');
    gl.uniform3f(lightCol, 1.0, 1.0, 1.0)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.LINE_LOOP, n, gl.UNSIGNED_SHORT ,0);

    console.log("drew");
};
