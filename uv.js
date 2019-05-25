var vert_shader = `

precision mediump float;

attribute vec3 vertpos;
attribute vec3 vertcolor;

uniform mat4 viewmat;
uniform mat4 viewrotatemat;
uniform float timevar;


varying vec3 fragcolor;


void main(){

	//gl_Position = vec4(vertpos.x, sin(timevar+vertpos.x)*vertpos.y, 1.0, 1.0 + abs(cos(timevar)));
	//fragcolor = vec3(abs(sin(timevar + vertcolor.x)), abs(sin(timevar + .5 + vertpos.y)), abs(sin(timevar + 1.0)));

	//fragcolor = vertcolor;
	//gl_Position = vec4(vertpos, 1.0);



	fragcolor = vec3(abs(sin(timevar + vertcolor.x)), abs(sin(timevar + .5 + vertpos.y)), abs(sin(timevar + 1.0)));
	gl_Position = viewmat * vec4(vertpos, 1.0);
}`;


var frag_shader = `

precision mediump float;

varying vec3 fragcolor;


void main(){

	gl_FragColor = vec4(fragcolor, 1.0);
}`;




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




var demoinit = function () {

	var canvas = document.getElementById("view");

	var gl = canvas.getContext("webgl");

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


  	var verts = new Float32Array([
    // Vertex coordinates and color(RGBA)
     0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
    -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
     0.5, -0.5,  -0.4,  1.0,  0.4,  0.4, 
   
     0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
    -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
     0.0, -0.6,  -0.2,  1.0,  1.0,  0.4, 

     0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  // The front blue one 
    -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
     0.5, -0.5,   0.0,  1.0,  0.4,  0.4 
  	]);

  	var vertBuf = gl.createBuffer();

  	gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
  	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  	var elSize = Float32Array.BYTES_PER_ELEMENT;

  	var posMem = gl.getAttribLocation(prog, 'vertpos');
	var colorMem = gl.getAttribLocation(prog, 'vertcolor');

  	gl.vertexAttribPointer(posMem, 3, gl.FLOAT, gl.FALSE, elSize * 6, 0);
  	gl.vertexAttribPointer(colorMem, 3, gl.FLOAT, gl.FALSE, elSize * 6, 3 * elSize);

  	gl.enableVertexAttribArray(posMem);
	gl.enableVertexAttribArray(colorMem);


	var viewmat = gl.getUniformLocation(prog, 'viewmat');
	var viewmatrix = new Matrix4();

	viewmatrix.setLookAt(.2,.2,.2, 0, 0, -1, 0, 1, 0);
	gl.uniformMatrix4fv(viewmat,false, viewmatrix.elements);


	var rotmat = gl.getUniformLocation(prog, 'rotateviewmat');
	var rotateviewmat = new Matrix4();

	rotateviewmat.setRotate(0, 0, 0, -1);
	gl.uniformMatrix4fv(rotmat, false, rotateviewmat.elements);



	var timeMem = gl.getUniformLocation(prog, 'timevar');


	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, 9);





	
	var render = function () {

		if (gl === null){
			console.error("wrong!");
		}

		rotateviewmat.setRotate(0, 0, 0, -1);
		gl.uniformMatrix4fv(rotmat, false, rotateviewmat.elements);




		gl.uniformMatrix4fv(viewmat,false, viewmatrix.elements);

		gl.uniform1f(timeMem, performance.now()/2000);

		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 9);
		requestAnimationFrame(render);
	};

	requestAnimationFrame(render);
};