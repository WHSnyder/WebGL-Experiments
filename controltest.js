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

function trackMovement(e){

    if (down){
        if (reset){
            mouseData[0] = vec2.fromValues(e.pageX, e.pageY);
            mouseData[1] = vec2.fromValues(e.pageX, e.pageY);
            reset = false;
        }
        else if (mouseData[0] == null){
            mouseData[0] = vec2.clone(mouseData[1]);
            mouseData[1] = vec2.fromValues(e.pageX, e.pageY);
        }
        else {
            mouseData[1] = vec2.fromValues(e.pageX, e.pageY)
        }
    }
}













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


function updateRect(){
    rect = canvas.getBoundingClientRect();

    windowUniforms.set(0, rect.width)
    .set(1, rect.height)
    .set(2, rect.left)
    .set(3, rect.bottom)
    .update();
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
        //updatefps = 1;
        cut = true;
    }
    keyMap.set(event.keyCode, true);
}


function keyup(event) {

    if (event.keyCode != 71){
        keyMap.set(event.keyCode, false);
    }
}

window.addEventListener("mouseup", function(event) {

    mouseX = event.clientX;
    mouseY = event.clientY;
    picked = true;
});

window.addEventListener("keydown", keydown, false);
window.addEventListener("keyup", keyup, false);
window.addEventListener("mousemove", mouseHandler, false);
//window.addEventListener("mousedown", function(){down = true}, false);
//window.addEventListener("mouseup", function(){down = false; reset = true;}, false);
//window.onresize = updateRect;

window.addEventListener("click", updateClick, false);