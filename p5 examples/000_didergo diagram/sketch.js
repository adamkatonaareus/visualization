
//--- Some data to display.
var data = [100, 80, 120, 40, 100, 50, 90, 120, 150, 20, 70];
var divergence = 5;
var zoom = 3;

//--- Set up the animation.
function setup () 
{
  createCanvas(windowWidth, windowHeight);
  frameRate(15);
}

//--- React to window resizing.
function windowResized () 
{
  resizeCanvas(windowWidth, windowHeight);
}

//--- This will be called 15 times per second.
function draw()
{
  //--- Clear background
  background(255);
  
  strokeWeight(10);
  strokeJoin(ROUND);

  //--- Draw bars
  var x = 100;
  for (var i = 0; i < data.length; i++) 
  {
    var currentValue = data[i];

    if (frameCount < 30)
    {
      currentValue /= (31-frameCount);
    }

    var v = 10 * zoom + random(divergence);
    fill(currentValue*2, 200, 200);
    stroke(currentValue*2, 200, 200);
    rect(x, height-100, v, -currentValue * zoom + random(divergence));  
    x += v + 12;
  }

  //--- Shift data to the left, add new data at the end.
  if (frameCount % 5 == 1)
  {
    data.shift();
    data.push(data[data.length-1] + random(50) -25);

    if (data[data.length-1] > 150)
    {
      data[data.length-1] = 150;
    }

    if (data[data.length-1] < 10)
    {
      data[data.length-1] = 10;
    }
  }

}
