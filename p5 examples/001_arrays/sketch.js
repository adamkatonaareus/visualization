

var jsonData;
var img

//--- Preload JSON data from file. Preload an image too.
function preload()
{
  jsonData = loadJSON("imdb-top1000.json");
  img = loadImage("cat.png"); 
}

//--- Set up the animation.
function setup () 
{
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  
  frameRate(15);
  //noLoop();

  console.log(jsonData);
}

//--- React to window resizing.
function windowResized () 
{
  resizeCanvas(windowWidth, windowHeight);
}

//--- Draw the charts.
function draw()
{
  background(255);
  strokeWeight(0);
  textSize(20);

  for (var i=0; i<25; i++)
  {
    var col = map(jsonData[i].imdb_rating, 7.7, 9, 00, 70);
    fill(col, 100, 100, col/70 + 0.5);
    text(jsonData[i].director.replace(/\r?\n/g, "") + ": " + jsonData[i].imdb_rating, 200, 50 + i*35);

    var rectWidth = map(jsonData[i].imdb_rating, 4, 9, 10, 100);
    rect(180, 57 + i*35, -rectWidth, -30);
  }

  image(img, mouseX, mouseY);
}
