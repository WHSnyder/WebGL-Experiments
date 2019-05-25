var vert_shader = `

precision mediump float;

attribute vec2 vertpos;
attribute vec3 vertcolor;
uniform float timevar;


varying vec3 fragcolor;


void main(){

	//gl_Position = vec4(vertpos.x, sin(timevar+vertpos.x)*vertpos.y, 1.0, 1.0 + abs(cos(timevar)));
	gl_Position = vec4(vertpos, 0.0, 1.0);
	//fragcolor = vec3(abs(sin(timevar + vertcolor.x)), abs(sin(timevar + .5 + vertpos.y)), abs(sin(timevar + 1.0)));
	fragcolor = vertcolor;
}`;


var frag_shader = `

precision mediump float;

varying vec3 fragcolor;


void main(){

	gl_FragColor = vec4(fragcolor, 1.0);
}`;






var gl = null;
var prog = null;





var demoinit = function () {

	console.log("Inited");

	var canvas = document.getElementById('view');
	gl = canvas.getContext('webgl');

	if (!gl){
		alert("Dude get hip");
	}

	gl.clearColor(.75,.85,.8,1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


	var vshader = gl.createShader(gl.VERTEX_SHADER);
	var fshader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vshader, vert_shader);
	gl.shaderSource(fshader, frag_shader);


	gl.compileShader(vshader);

	if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)){
		console.error("vert shader failed", gl.getShaderInfoLog(vshader));
		return;
	}

	gl.compileShader(fshader);

	if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)){
		console.error("frag shader failed", gl.getShaderInfoLog(fshader));
		return;
	}

	prog = gl.createProgram();
	gl.attachShader(prog, vshader);
	gl.attachShader(prog, fshader);

	gl.linkProgram(prog);

	var triverts = [

		-0.1,-0.5,		1.0,0.0,0.0,
		-0.1,0.5, 		0.0,0.0,1.0,        
		0.5,-0.5,		0.0,1.0,0.0,
		0.5,0.5,		0.0,1.0,0.0,
		0.7,-0.3,		1.0,0.0,0.0
	];


	var trivertsbuf = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, trivertsbuf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triverts), gl.STATIC_DRAW);


	var posMem = gl.getAttribLocation(prog, 'vertpos');
	var colorMem = gl.getAttribLocation(prog, 'vertcolor');
	var timeMem = gl.getUniformLocation(prog, 'timevar');

	gl.vertexAttribPointer(

		posMem,
		2,
		gl.FLOAT,
		gl.FALSE,
		5*Float32Array.BYTES_PER_ELEMENT,
		0
	);



	gl.vertexAttribPointer(

		colorMem,
		3,
		gl.FLOAT,
		gl.FALSE,
		5*Float32Array.BYTES_PER_ELEMENT,
		2*Float32Array.BYTES_PER_ELEMENT
	);

	gl.enableVertexAttribArray(posMem);
	gl.enableVertexAttribArray(colorMem);


	gl.useProgram(prog);


	var render = function () {

		if (gl === null){
			console.error("wrong!");
		}

		var timeMem = gl.getUniformLocation(prog, 'timevar');
		gl.uniform1f(timeMem, performance.now()/2000);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 5);

		requestAnimationFrame(render);

	};

	requestAnimationFrame(render);
};















