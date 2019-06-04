var vs_shell = `

#define M_PI 3.1415926535897932384626433832795

precision mediump float;

attribute vec3 vertpos;
attribute vec3 normal;
uniform vec3 vertcolor;


uniform vec3 lightcolor;
uniform vec3 lightdir;

uniform mat4 viewmat;
uniform mat4 frustmat;

uniform float timevar;

varying vec3 color;

void main(){

	vec3 sined = vec3(cos(timevar),0.0,sin(timevar));

	vec3 norm = normalize(normal);

	vec3 lcolor = lightcolor * .3;

	float dotprod = max(dot(sined, norm), 0.0);

	color = vec3(abs(sin(timevar)) * vertcolor.r, vertcolor.g, abs(cos(timevar)) * vertcolor.b) * lcolor * dotprod;

    gl_Position = frustmat * viewmat * vec4(vertpos + vec3(0.2 * sin(timevar + vertpos.x * vertpos.y)), 1.0);
    gl_PointSize = 20.0;
}`;


var fs_shell = `

precision mediump float;

varying vec3 color;

void main(){

    gl_FragColor = vec4(color, 1.0);
}`;



var vs_shadow = `

precision mediump float;

attribute vec3 position;

uniform mat4 lightView;
uniform mat4 lightProj;

void main(){

    gl_Position = lightProj * lightView * vec4(position, 1.0);
}`;


var fs_shadow = `

precision mediump float;

void main(){

    gl_FragColor = vec4(gl_FragCoord.z,0.0,0.0,1.0);
}`;



var vs_lit = `

precision mediump float;

attribute vec3 position;
attribute vec3 color;

uniform mat4 playerview;
uniform mat4 playerfrust;

uniform mat4 lightview;
uniform mat4 lightfrust;

uniform vec3 lightcolor;

varying vec4 posfromlight;
varying vec3 fragcolor;


void main(){

    fragcolor = lightcolor * color;
    gl_Position = vec4(position, 1.0);   
    posfromlight = lightfrust * lightview * vec4(position, 1.0); 
}`;



var fs_lit = `

precision mediump float;

uniform sampler2D shadowmap;

varying vec4 posfromlight;
varying vec3 fragcolor;

void main(){

    vec3 shadowcoord = vec3(posfromlight.xyz/posfromlight.w)/2.0 + 0.5; //cant grasp why the /2 + .5 but is prolly just unimportant tex map index thing..
    float depthtosun = texture2D(shadowmap, shadowcoord.xy);

    float vismult = (shadowcoord.z > depthtosun + 0.005) ? 0.7 : 1.0;
    gl_FragColor = vec4(fragcolor.rgb * vismult, 1.0);
}`;







function initShader(gl, shaderVar, shaderText){

    gl.shaderSource(shaderVar, shaderText);
    gl.compileShader(shaderVar);

    if (!gl.getShaderParameter(shaderVar, gl.COMPILE_STATUS)){
        console.error("shader compilation failed", gl.getShaderInfoLog(shaderVar));
        return -1;
    }
    return 0;
}



function generateProgram(gl, vs, fs){

	var vshader = gl.createShader(gl.VERTEX_SHADER);
    var fshader = gl.createShader(gl.FRAGMENT_SHADER);

    initShader(gl, vshader, vs);
    initShader(gl, fshader, fs);

    var prog = gl.createProgram();

    gl.attachShader(prog, vshader);
    gl.attachShader(prog, fshader);

    gl.linkProgram(prog);

    return prog;
}



var snormal_data = {

    program: generateProgram(gl, vs_shell, fs_shell),
    vertex_mem: gl.getAttribLocation(this.program, "vertpos"),
    vertex_normal_mem: gl.getAttribLocation(this.program, "normal"),

    vertex_color_mem: gl.getUniformLocation(this.program, "vertcolor"),

    time_mem: gl.getUniformLocation(this.program, "timevar"),

    light_dir_mem: gl.getUniformLocation(this.program, "lightdir"),
    light_color_mem: gl.getUniformLocation(this.program, "lightcolor"),

    player_view_mem: gl.getUniformLocation(this.program, "frustmat"),
    player_frust_mem: gl.getUniformLocation(this.program, "viewmat")
};



function setNormalShaderData(player, object, shader, light){

    var buffers = object.getDrawingInfo();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
    gl.vertexAttribPointer(shader.vertex_mem, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(shader.vertex_mem); 

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
    gl.vertexAttribPointer(shader.vertex_normal_mem, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(shader.vertex_normal_mem);

    gl.uniform1f(shader.time_mem, performance.now()/1000); 

    gl.uniform3f(light_dir_mem, 0.0, -1.0, 0.0);
    gl.uniform3f(light_color_mem, light.color);

    gl.uniform4fv(player_view_mem, player.getView());
    gl.uniform4fv(player_frust_mem, player.frustMat);

    gl.useProgram(shader.program);
}









//buffer stuff


function offscreenBuffer(gl){

    var framebuffer = gl.createFramebuffer();

    var texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNISGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    frambuffer.texture = texture;

    depthbuffer = gl.createRenderbuffer();

    gl.bindRenderbuffer(gl.RENDERBUFFER, depthbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthbuffer);


    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (gl.FRAMEBUFFER_COMPLETE !== e) {
        console.log('Frame buffer object is incomplete: ' + e.toString());
        return error();
    }

    return framebuffer;
}




function initShadowData(object, light, shadowbuffer){

    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowBuffer);

    var lightviewmat = gl.getUniformLocation(shader_shadow_cast, "lightView");
    var lightprojmat = gl.getUniformLocation(shader_shadow_cast, "lightProj");
    var vertpos = gl.getAttribLocation(shader_shadow_cast, "position");

    gl.uniformMatrix4fv(lightviewmat, false, light.lookMat);
    gl.uniformMatrix4fv(lightprojmat, false, frust);

    var vertBuf = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, object.vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(vertpos, 3, gl.FLOAT, gl.FALSE, elSize * 3, 0);
    gl.enableVertexAttrivArray(vertpos);

    gl.useProgram(shader_shadow_cast);
    console.log("shadow shader inited..");
}