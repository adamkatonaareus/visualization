/*

  Counting words in the imdb top 1000 database.
  (C) Adam Katona, 2019`

*/


var mData;
var wordData = [];

//--- Constants
var margin = 10;
var fontSize = 12;
var movieCount = 1000;
var topCount = 100;

function preload() 
{
  //--- Let's load the latest json data file.
  mData = loadJSON("https://raw.githubusercontent.com/stc/mome-creative-coding-course-p5js/master/data/004-imdb/data/imdb-top1000.json");
}

function setup () 
{
  createCanvas(windowWidth, windowHeight);
  textSize(fontSize);
  colorMode(HSB);

  //--- RiTa setup
  var params = {
    ignoreStopWords: true,
    ignoreCase: true,
    ignorePunctuation: true
  };

  //--- Create word count for all plots
  for (var i = 0; i < movieCount; i++)
  {
    //console.log("Movie: " + mData[i]["title_eng"]);
    
    //--- Count words
    var count = RiTa.concordance(mData[i]["plot"], params);

    //--- Store words in json
    mData[i]["plot_word_count"] = count;

    //--- Add to full word count
    for (var word in count) 
    {
      var existing = findWord(word);
      if (existing === null) 
      {
        wordData.push({ word: word, count: count[word] });
      }
      else
      {
        existing.count += count[word];
      }
    }

    //--- Sort all words DESC
    wordData.sort((a, b) => b.count - a.count);
  }
}

function windowResized () 
{
  resizeCanvas(windowWidth, windowHeight);
}

function draw() 
{
  background(255);
  noStroke(); 
  fill("#808080");

  for(var i = 0; i < topCount; i++)
  {
      text(wordData[i].word + ": " + wordData[i].count, margin, fontSize + i * fontSize);
  }

  var index = Math.trunc((mouseY - margin) / fontSize);

  if (index >= 0 && index < topCount)
  {
    fill("#000000");
    text(wordData[index].word, margin, fontSize + index * fontSize); 
    text(findMoviesForWord(wordData[index].word), 100, fontSize + index * fontSize);
  }
}



//--- Shit thats slow...
function findWord(word)
{
  for(var i=0; i<wordData.length; i++)
  {
    if (wordData[i].word == word)
    {
      return wordData[i];
    }
  }

  return null;
}

//--- Find all movies for the given word
function findMoviesForWord(word)
{
  var result = [];

  for (var i = 0; i < movieCount; i++)
  {
      if (mData[i]["plot_word_count"].hasOwnProperty(word))
      {
        result.push(mData[i]["title_eng"]);
      }
  }

  return result;
}
