function createTextureFromImage(gl,image) {

	console.log("width: " + image.width);

    if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height)) {
        
        var cnvs = document.createElement("canvas");
        cnvs.width = nextHighestPowerOfTwo(image.width);
        cnvs.height = nextHighestPowerOfTwo(image.height);
        var ctx = cnvs.getContext("2d");
        ctx.drawImage(image, 0, 0, image.width, image.height);
        image = cnvs;
    }
    return image;
}

function isPowerOfTwo(x) {
    return (x & (x - 1)) == 0;
}

function nextHighestPowerOfTwo(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
}
