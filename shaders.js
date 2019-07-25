var ripple_vs = `
#define M_PI 3.1415926535897932384626433832795

precision mediump float;

layout(location=0) in vec3 vertpos;
layout(location=1) in vec3 normal;


uniform FrameUniforms {

	float flag;

	mat4 viewmat;
	mat4 frustmat;

	float timevar;
};


uniform ClickData {
	
	float clicktime;
	vec3 clickpos;
};


out vec3 color;



void main(){

    float speed = 4.0;
    float dietime = 10.0;

    float timediff = timevar - clicktime;

    float wavedist = speed * timediff;

    float between = abs(acos(dot(vertposnormed, normalize(clickpos))));

    float vertdist = (between / M_PI) * 6.7 * 2.0;

    float damp = clamp(1.0 - (timediff/dietime),0.0,1.0);

    float mag = damp * cos(1.3 * (vertdist - wavedist));


    float tst = 0.0;

    if (vertdist - wavedist > 1.5){
    	mag = 0.0;
    }

    if (timediff > dietime){
    	//mag = 0.0;
    }

    vec3 newvertpos = vec3(10.0 * mag * vec3(1.0,1.0,1.0) + 6.0*vertpos);

    vec3 lcolor = vec3(abs(cos(timevar/2.0)), 0.0, abs(sin(timevar/2.0)));


    color = mag * lcolor;

    
    if (flag < 0.0){
        color = clamp(mag, 0.0, 1.0) * vec3(1.0, 1.0, 1.0) + color;
    }
    

    gl_Position = frustmat * viewmat * vec4(newvertpos, 1.0);
    gl_PointSize = 20.0;
}`;




var ripple_fs = `
precision mediump float;


varying vec3 color;

void main(){

	/*vec2 adjusted = vec2(mousepos.x - 10.0, 700.0-1.0 * mousepos.y);

    float dist = length(gl_FragCoord.xy - adjusted);

    vec4 addit = vec4(0.0,0.0,0.0,0.0);

    if (dist < 50.0){
        addit = ((50.0 - dist)/50.0) * vec4(0.2,0.2,0.2,0.0);
    }*/

    gl_FragColor = vec4(color, 1.0);// + addit;
}`;


var picking_vs = `
    
#version 300 es

layout(location=0) in vec4 aPosition;
        
uniform mat4 viewmat;
uniform mat4 frustmat;
uniform mat4 modelmat;
    
void main() {
    gl_Position = frustmat * viewmat * modelmat * aPosition;
}`;


var picking_fs =  `

#version 300 es
precision highp float;

uniform vec3 uPickColor;
out vec4 fragColor;

void main() {
    fragColor = vec4(uPickColor, 1.0);
 }`;    


var main_vs = `

#version 300 es
        
layout(std140, column_major) uniform;
layout(location=0) in vec4 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aTexCoord;

uniform mat frustmat;

uniform FrameUniforms {

	mat4 viewmat;
	mat4 uModelMatrix;
	vec4 uHighlightColor;
};
        
out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {

	gl_Position = frustmat * viewmat * uModelMatrix * aPosition;
	vPosition = vec3(uModelMatrix * aPosition);
	vNormal = vec3(uModelMatrix * vec4(aNormal, 0.0));
	vTexCoord = aTexCoord;
}`;


var main_fs = `

#version 300 es

precision highp float;
layout(std140, column_major) uniform;

uniform SceneUniforms {
	vec4 uLightPosition;
	vec4 uEyePosition;
};

uniform FrameUniforms {

	mat4 viewmat;
	mat4 uModelMatrix;
	vec4 uHighlightColor;
};
        
uniform sampler2D uTextureMap;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;
out vec4 fragColor;

void main() {

	vec4 baseColor = vec3(1.0,1.0,0.0,1.0);//texture(uTextureMap, vTexCoord);
	vec3 normal = normalize(vNormal);
	vec3 eyeDirection = normalize(uEyePosition.xyz - vPosition);
	vec3 lightDirection = normalize(uLightPosition.xyz - vPosition);
	vec3 reflectionDirection = reflect(-lightDirection, normal);
	float nDotL = max(dot(lightDirection, normal), 0.0);
	float diffuse = nDotL;
	float ambient = 0.1;
	float specular = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 20.0);
	fragColor = vec4(uHighlightColor.rgb * (ambient + diffuse + specular) * baseColor.rgb, baseColor.a);
}`;



import { PicoGL } from "./picogl/picogl.min.js";

utils.addTimerElement();

let canvas = document.getElementById("view");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


let app = PicoGL.createApp(canvas)
.clearColor(0.0, 0.0, 0.0, 1.0)
.depthTest()
.cullBackfaces();


let timer = app.createTimer();



let pickColorTarget = app.createTexture2D(app.width, app.height);
let pickDepthTarget = app.createRenderbuffer(app.width, app.height, PicoGL.DEPTH_COMPONENT16);
let pickingBuffer = app.createFramebuffer().colorTarget(0, pickColorTarget).depthTarget(pickDepthTarget);




// GEOMETRY
let box = utils.createBox({dimensions: [1.0, 1.0, 1.0]});

let positions = app.createVertexBuffer(PicoGL.FLOAT, 3, box.positions);
let uv = app.createVertexBuffer(PicoGL.FLOAT, 2, box.uvs);
let normals = app.createVertexBuffer(PicoGL.FLOAT, 3, box.normals);

let boxArray = app.createVertexArray()
.vertexAttributeBuffer(0, positions)
.vertexAttributeBuffer(1, normals)
.vertexAttributeBuffer(2, uv);


var shell_verts, shell_norms;
var shell = {data: null};

readOBJFile("./models/sphereshell.obj", gl, 4, 0, shell)

var shelldata = shell.data.getDrawingInfo()

let shell_positions = app.createVertexBuffer(PicoGL.FLOAT, 3, shelldata.vertices);
let shell_normals = app.createVertexBuffer(PicoGL.FLOAT, 3, shelldata.normals);

let shellArray = app.createVertexArray()
.vertexAttributeBuffer(0, shell_positions)
.vertexAttributeBuffer(1, shell_normals)









let lightPosition = vec3.fromValues(1, 1, 0.5);  
let highlightColor = vec3.fromValues(1.5, 1.5, 0.5);
let unhighlightColor = vec3.fromValues(1.0, 1.0, 1.0);



// UNIFORM BUFFERS
let sceneUniforms = app.createUniformBuffer([
    PicoGL.FLOAT_VEC4,
    PicoGL.FLOAT_VEC4
]).set(0, lightPosition)
.set(1, eyePosition)
.update();



let clickData = app.createUniformBuffer([

	PicoGL.FLOAT,//clicktime
	PicoGL.FLOAT_VEC2 //clickpos
]).set(0, 0.0)
.set(1, vec2.create())
.update()



let shellFrameUniforms = app.createUniformBuffer([

	PicoGL.FLOAT, //flag
	PicoGL.FLOAT_MAT4, //viewmat
	PicoGL.FLOAT_MAT4, //frustmat

	PicoGL.FLOAT //timevar
]).set(0, 1.0)
.set(1, player.getView())
.set(2, frustmat)
.set(3, 0.0)
.update()




window.onresize = function() {

    app.resize(window.innerWidth, window.innerHeight);
    pickingBuffer.resize();
    mat4.perspective(frustmat, Math.PI / 2, app.width / app.height, 0.1, null);
    //mat4.multiply(viewProjMatrix, frustmat, viewMatrix);
};



// OBJECT DESCRIPTIONS
let box = 
    {
        translate: [0, 0, 0],
        rotate: [0, 0, 0],
        scale: [1, 1, 1],
        mvpMatrix: mat4.create(),
        modelMatrix: mat4.create(),
        pickColor: vec3.fromValues(1.0, 0.0, 0.0),
        frameUniforms: app.createUniformBuffer([
            PicoGL.FLOAT_MAT4,	//viewmat
            PicoGL.FLOAT_MAT4,	//modelmat
            PicoGL.FLOAT_VEC4	//highlight color
        ]).set(2, unhighlightColor),
        mainDrawCall: null,
        pickingDrawCall: null
    };









Promise.all([

    app.createPrograms([picking_vs, picking_fs], 
    				   [main_vs, main_fs], 
    				   [ripple_vs, ripple_fs])

]).then(([

    [pickingProgram, mainProgram, rippleProgram],
    //[image]

]) => {
	/*
    let texture = app.createTexture2D(image, { 
        flipY: true,
        maxAnisotropy: PicoGL.WEBGL_INFO.MAX_TEXTURE_ANISOTROPY 
    });
 	*/

 	//Update player

 	//Set click info if necessary

 	//run shell shader



    box.pickingDrawCall = app.createDrawCall(pickingProgram, boxArray)
    .uniform("uPickColor", boxes[i].pickColor);

    box.mainDrawCall = app.createDrawCall(mainProgram, boxArray)
    .uniformBlock("SceneUniforms", sceneUniforms)
    .uniformBlock("FrameUniforms", boxes[i].frameUniforms)
    .texture("uTextureMap", texture);




    rippleDrawCall = app.createDrawCall(rippleProgram, shellArray)
    .uniformBlock("ClickData", clickData)
    .uniformBlock("FrameUniforms", shellFrameUniforms)




    let picked = false;
    let pickedColor = new Uint8Array(4);

    window.addEventListener("mouseup", function(event) {

        mouseX = event.clientX;
        mouseY = event.clientY;
        picked = true;
    });


    var playerView;


    function updateWorld() {

    	if (cont == 0){
        	return;
    	}

    	if (keyMap.get(65)){
        	console.log("to the left...");
        	player.move(0.1,0.0,0.0);
    	}

    	if (keyMap.get(68)){
        	player.move(-0.1,0.0,0.0);
   		}

    
    	if (!mouseRead){

        	player.rotate(vec3.fromValues(1.0,0.0,0.0), deltamY/100);
        	player.rotate(player.getUp(), -deltamX/100);

        	mouseRead = true;
    	}
























    	playerView = player.getView()

        if (timer.ready()) {
            utils.updateTimerElement(timer.cpuTime, timer.gpuTime);
        }

        timer.start();

        for (let i = 0, len = boxes.length; i < len; ++i) {

            boxes[i].rotate[0] += 0.01;
            boxes[i].rotate[1] += 0.02;

            utils.xformMatrix(boxes[i].modelMatrix, boxes[i].translate, boxes[i].rotate, boxes[i].scale);
//            mat4.multiply(boxes[i].mvpMatrix, playerView, boxes[i].modelMatrix);
            
            boxes[i].pickingDrawCall.uniform("viewmat", playerView);
            boxes[i].pickingDrawCall.uniform("frustmat", frust);
            boxes[i].pickingDrawCall.uniform("modelmat", boxes[i].modelMatrix);

            
            boxes[i].frameUniforms.set(0, playerView)
            .set(1, boxes[i].modelMatrix)
            .update();
        }







        if (picked) {

            // DRAW TO PICKING BUFFER
            app.drawFramebuffer(pickingBuffer).clear();

            for (let i = 0, len = boxes.length; i < len; ++i) {

                boxes[i].pickingDrawCall.draw();
            }

            app.defaultDrawFramebuffer()
            .readFramebuffer(pickingBuffer)
            .readPixel(mouseX, canvas.height - mouseY, pickedColor);
            
            if (pickedColor[0] === 255) {

            	console.log("clicked box...")
                window.open('./thegoods/resume_ws.pdf');
            }
            else {
            	//ripple
            }
            
            picked = false;
        }

        boxes[0].frameUniforms.update();

        // MAIN DRAW
        app.clear();

        var time = performance.now()/1000;
        
        boxes[0].mainDrawCall.draw();

        shellFrameUniforms.set(0, 1.0)
        .set(1, playerView)
        .set(2, frust)
        .set(3, time)
        .update()


        rippleDrawCall.draw();      

        timer.end();

        requestAnimationFrame(updateWorld);
    }
    requestAnimationFrame(updateWorld);
});







