
var mData;
var mFont;

let data = [];

var dataLength = 1000;
var gridLengthX = 50;
var gridLengthY = 1000/50;
var gridSize = 20;
var minRank = 0;
var maxRank = 0;
var margin = 10;

function preload() 
{
  mData = loadJSON("data/imdb-top1000.json");
  myFont = loadFont('data/DinBold.ttf');
}

function setup () 
{
  createCanvas(windowWidth, windowHeight);
  textFont(myFont);
  textSize(26);
  console.log();
  
  colorMode(HSB);

  var ranks = [];
  for(var i = 0; i < dataLength; i++)
  {
    ranks.push(mData[i]["imdb_rating"]);
  }

  minRank = getMinOfArray(ranks);
  maxRank = getMaxOfArray(ranks);
  console.log("Min: " + minRank + ", max: " + maxRank);
}

function windowResized () 
{
  resizeCanvas(windowWidth, windowHeight);
}

function draw() 
{
  background(255);
  stroke("white");

  var index = 0;
  for (var x = 0; x<gridLengthX; x++)
  {
    for (var y = 0; y<gridLengthY; y++)
    {
        var fillColor = map(mData[index]["imdb_rating"], minRank, maxRank, 60, 0);
        fill(fillColor, 255, 255);

        var xPos = margin + x * gridSize;
        var yPos = margin + y * gridSize; 
        rect(xPos, yPos, gridSize, gridSize);
        index++;
    }
  }

  if (mouseX > margin && mouseY > margin && mouseX < margin + gridLengthX * gridSize && mouseY < margin + gridLengthY * gridSize)
  {
    stroke("black");
    fill("black");
    var xIndex = (mouseX - margin)/gridSize;
    var yIndex = (mouseY - margin)/gridSize;
    var mIndex = Math.trunc(yIndex) * gridLengthX + Math.trunc(xIndex);
    
    if (mIndex >= 0 && mIndex < dataLength)
    {
      var textLength = textWidth(mData[mIndex]["title_eng"]);
      var m1x = mouseX > margin + gridLengthX/2 * gridSize ? -textLength : 0;
      var m1y = mouseY > 60 ? -30 : 30;
      var m2y = mouseY > 60 ? -0 : 60;

      text(mData[mIndex]["title_eng"], mouseX + m1x, mouseY + m1y);
      text(mData[mIndex]["imdb_rating"], mouseX + m1x, mouseY + m2y);
    }
  }
}


function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
  return Math.min.apply(null, numArray);
}
