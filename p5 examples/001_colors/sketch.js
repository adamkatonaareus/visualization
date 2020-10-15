
var size = 20;
var distance = 10;

function setup () 
{
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  noLoop();
}

function windowResized () 
{
  resizeCanvas(windowWidth, windowHeight);
}

function draw()
{
  background(255);
  noStroke();

  for (var x=0; x<25; x++)
  {
    for (var y=0; y<25; y++)
    {
      for (var z=0; z<25; z++)
      {
        fill(x*10, y*10, z*10);
        rect(10 + x * (size + distance) + z, 10 + y * (size + distance) + z, size, size);
      }
    }
  }
}
