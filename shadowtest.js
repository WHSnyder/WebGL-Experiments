class Light {

	constructor(col){

		this.eyePt = vec3.fromValues(0.0,1.0,0.0);
		this.focusVec = vec3.fromValues(0.0,0.0,100.0);
		this.upVec = vec3.fromValues(0.0,1.0,0.0);
		this.focusCoord = vec3.create();
		
		this.lookMat = mat4.create();

		this.rot = mat4.create();
		this.tran = mat4.create();
		this.color = col;
	}

	constructor(location, aim, col){

		this.eyePt = location;
		this.focusVec = aim;
		this.upVec = vec3.fromValues(1.0,0.0,0.0);
		this.focusCoord = vec3.create();
		
		this.lookMat = mat4.create();

		this.rot = mat4.create();
		this.tran = mat4.create();

		this.color = col;
	}

	move(x,y,z){

		console.log("b4: " + this.loc);
		vec3.add(this.loc, this.loc, vec3.fromValues(x,y,z));
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




class LitObject {

	constructor(data, base_color){

		this.drawData = data;
		this.color = base_color;
		this.name = data.name
	}
}









var timemem, time;
var samplermem;

var cont = 0;
var dir = 0;

var n = 0;

var currTime, timePassed;


var objects = [];
var light;

var player = new Player()



function startWorld(){

	initGl();
	initShaders();

	var ground_obj = readOBJFile("./models/ground.obj", gl, 2, 0);
	var obstacle_obj = readOBJFile("./models/obstacle.obj", gl, 2, 0);

	objects.push(ground_obj);
	objects.push(obstacle_obj);

	light = new Light(vec3.fromValues(0.0,8.0,0.0), vec3.fromValues(0.0,0.0,0.0), vec4.fromValues(1.0,0.0,0.0));

	updateWorld();
}



function updateWorld(){

	//console.log("updating world");

	if (cont == 0){
		return;
	}	

	processInput(player);

	render(player.getView());
	window.requestAnimationFrame(updateWorld)	
}



function render(){








}









