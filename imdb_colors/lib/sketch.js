/*

  Counting colors in the IMDB top 1000 database.
  (C) Adam Katona, 2019

*/


var mData;
var hueData = [];
var angleStep;
var minRadius;
var maxRadius;
var maxCount = 0;

//--- Constants
var margin = 10;
var fontSize = 12;
var movieCount = 1000;
var precision = 10.0;


function preload() 
{
	//--- Let's load the latest json data file.
	mData = loadJSON("data/imdb-poster-colors.json");
}

function setup () 
{
  	createCanvas(windowWidth, windowHeight);
  	textSize(fontSize);
  	colorMode(HSB);
  	frameRate(1);

  	calculateRadius();
  	angleStep = 1 / precision;
  	console.log("Max radius: " + maxRadius);
  	console.log("Angle step: " + angleStep);

  	//--- We need to create key-value pairs for hue keys and count values
  	//calculateHueFromDominantColor();
  	calculateHueFromPalette();
  	maxCount = log(maxCount);

    console.log("Max count: " + maxCount);
    console.log("Hue count: " + hueData.length);
}

function windowResized () 
{
  	resizeCanvas(windowWidth, windowHeight);
  	calculateRadius();
}

function draw() 
{
  	background(0);
  	noStroke(); 

  	//--- Draw triangles from a common base point
  	beginShape(TRIANGLE_FAN);
    vertex(width/2, height/2);

    for(var angle = 0; angle <= 360; angle += angleStep)
    {
    	var hueData = findHueData(roundToPrecision(angle));

    	// if (frameCount == 1)
    	// {
    	// 	console.log("Angle: " + roundToPrecision(angle) + ", Hue data: " + hueData);
    	// }

    	//--- Use the Hue of the dominant color.
    	var radius = hueData === null ? minRadius : map(log(hueData.count), 0, maxCount, minRadius, maxRadius);
    	var brightness = radius == minRadius ? 10 : 100;

      	var vx = width/2 + cos(radians(angle))* radius;
      	var vy = height/2 + sin(radians(angle))* radius;
      	vertex(vx, vy);
      	
      	fill(angle, 100, brightness);
      	stroke(angle, 100, brightness);
    }
 	
 	endShape();
}


function calculateRadius()
{
	//maxRadius = width / 2 - margin; 
	maxRadius = ((width > height) ? height / 2 : width / 2) - margin;
	minRadius = 10; //maxRadius / 10;
}

function roundToPrecision(value)
{
	return round(value * precision) / precision;
}

function calculateHueFromDominantColor()
{
  	for(var i = 0; i < movieCount; i++)
    {
    	var hue = roundToPrecision(mData[i]["dominantColor"][0]);
    	console.log("Hue: " + hue);

    	var existing = findHueData(hue);
    	if (existing === null) 
	    {
	        hueData.push({ hue: hue, count: 1 });
	    }
	    else
	    {
	        existing.count++;
	    	console.log("Found: " + existing.hue + ", count: " + existing.count);

	        if (maxCount < existing.count)
	        {
	        	maxCount = existing.count;
	        }
	    }
    }
}

function calculateHueFromPalette()
{
  	for(var i = 0; i < movieCount; i++)
    {
    	for (var j = 0; j < 10; j++)
    	{
	    	var hue = roundToPrecision(mData[i]["palette"][j][0]);
	    	//console.log("Hue: " + hue);

	    	var existing = findHueData(hue);
	    	if (existing === null) 
		    {
		        hueData.push({ hue: hue, count: 1 });
		    }
		    else
		    {
		        existing.count++;
		    	//console.log("Found: " + existing.hue + ", count: " + existing.count);

		        if (maxCount < existing.count)
		        {
		        	maxCount = existing.count;
		        }
		    }
		}
    }
}

//--- Shit thats slow...
function findHueData(hue)
{
	for(var i=0; i<hueData.length; i++)
	{
	    if (hueData[i].hue == hue)
	    {
	      return hueData[i];
	    }
	}

  	return null;
}
