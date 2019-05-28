var vert_shader = `

precision mediump float;

attribute vec3 vertpos;
attribute vec3 vertcolor;

uniform mat4 viewmat;
uniform float timevar;
uniform mat4 frust;


varying vec3 fragcolor;


void main(){

    //gl_Position = vec4(vertpos.x, sin(timevar+vertpos.x)*vertpos.y, 1.0, 1.0 + abs(cos(timevar)));
    //fragcolor = vec3(abs(sin(timevar + vertcolor.x)), abs(sin(timevar + .5 + vertpos.y)), abs(sin(timevar + 1.0)));

    //fragcolor = vertcolor;
    //gl_Position = vec4(vertpos, 1.0);

    fragcolor = vec3(abs(sin(timevar + vertcolor.x)), abs(sin(timevar + .5 + vertpos.y)), abs(sin(timevar + 1.0)));
    gl_Position = frust * viewmat * vec4(vertpos, 1.0);
}`;


var frag_shader = `

precision mediump float;

varying vec3 fragcolor;


void main(){

    gl_FragColor = vec4(fragcolor, 1.0);
}`;


class Vert {

    x,y,z,r,g,b,s,t;

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








var mat4 = glMatrix.mat4;
var vec3 = glMatrix.vec3;
var quat = glMatrix.quat;

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

var eyeCoord = vec3.fromValues(0,0,1);
var focusPt = vec3.fromValues(0,0,-.2);
var upDir = vec3.fromValues(0,1,0);
var recv = vec3.create();
var rotationQuat = quat.create(); 
quat.fromEuler(rotationQuat, 0,0,0);

var toOrg = vec3.create();
vec3.sub(toOrg, focusPt, vec3.create());
var scale = vec3.fromValues(1,1,1);
var dummyTransl = vec3.create();
var gl;
var angle = 0;
var frust = mat4.create();
mat4.perspective(frust, Math.PI/2, 4/3, .1, 4);

var viewmatrix =  mat4.create();

var cont = 1;


var cubedemo = function () {

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


    var verticesColors = new Float32Array([
    // Vertex coordinates and color
         1.0,  1.0,  1.0,     1.0,  1.0,  1.0,  // v0 White
        -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,  // v1 Magenta
        -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,  // v2 Red
         1.0, -1.0,  1.0,     1.0,  1.0,  0.0,  // v3 Yellow
         1.0, -1.0, -1.0,     0.0,  1.0,  0.0,  // v4 Green
         1.0,  1.0, -1.0,     0.0,  1.0,  1.0,  // v5 Cyan
        -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,  // v6 Blue
        -1.0, -1.0, -1.0,     0.0,  0.0,  0.0   // v7 Black
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        0, 3, 4,   0, 4, 5,    // right
        0, 5, 6,   0, 6, 1,    // up
        1, 6, 7,   1, 7, 2,    // left
        7, 4, 3,   7, 3, 2,    // down
        4, 7, 6,   4, 6, 5     // back
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
    var frustmat = gl.getUniformLocation(prog, 'frust');



    
    mat4.lookAt(viewmatrix, eyeCoord, focusPt, upDir);

    gl.uniformMatrix4fv(viewmat,false, viewmatrix);
    gl.uniformMatrix4fv(frustmat, false, frust);


    var rotmat = mat4.create();
    mat4.fromRotationTranslationScaleOrigin(rotmat, rotationQuat, dummyTransl, scale, toOrg);

    //mat4.fromRotation(rotateviewmat,Math.PI/4,upDir);








    console.log(rotmat);

    console.log(eyeCoord);

    recv = vec3.transformMat4(recv, eyeCoord, rotmat);

    console.log(recv);


    var timeMem = gl.getUniformLocation(prog, 'timevar');

    var time;

    document.onkeydown = function(ev){ trigger(ev); };
    
    function trigger(ev) {

        if (ev.keyCode == 39){
            console.log("angle: " + angle);
            angle += 5;
        }
        else if (ev.keyCode == 37){
            console.log("angle: " + angle);
            angle -= 5;
        }
        else {return;}

        if (gl === null){
            console.error("wrong!");
        }

        time = performance.now();

        quat.fromEuler(rotationQuat, 0, angle, 0);

        mat4.fromRotationTranslationScaleOrigin(rotmat, rotationQuat, dummyTransl, scale, toOrg);
        vec3.transformMat4(recv, eyeCoord, rotmat);

        console.log("looking at " + focusPt + " from " + recv);


        mat4.lookAt(viewmatrix, recv, focusPt, upDir);


        gl.uniformMatrix4fv(viewmat,false, viewmatrix);

        gl.uniform1f(timeMem, time);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 9);
    };


};



