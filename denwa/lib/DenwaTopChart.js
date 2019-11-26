/**
      Denwa no mori top chart
      (C): Adam Katona, 2019

*/
class DenwaTopChart
{
	//--- Settings
	animationDuration = 500;
	animationEase = d3.easePolyOut; //easeElastic;
	animationDelay = 50;
    minMediaId = 1;
    maxMediaId = 18;	

    chartWidth = window.innerWidth - 30;
    chartHeight = window.innerHeight - 80;
    svg;

	constructor(chartId, width, height)
	{
      	if (width)  { this.chartWidth = width; }
      	if (height) { this.chartHeight = height; }

		//--- Create SVG chart
		this.svg = d3.select("#" + chartId)
			.attr("width", this.chartWidth)
			.attr("height", this.chartHeight)
			.attr("class", "bubble");

		d3.json("data/denwa_report.json")
			.then(this.init.bind(this));
	}

	init(mData)
	{
		console.log("Record count: " + mData.length);

		//--- Filter for entry type
		const playData = mData
          .filter(d => d.entryType == 0)
          .filter(d => d.mediaId >= this.minMediaId && d.mediaId <= this.maxMediaId);      
        console.log("Play data:");
        console.log(playData);

        //--- Group for mediaId
        const topData = d3.nest()
            .key(d => d.mediaId)  
            .rollup(function(d) { return { 
             	count: d.length,
             	author: d[0].author,
             	title: d[0].title
             }; })
            .entries(playData);
        console.log("Top data:");
        console.log(topData);        

		//--- We need a single root node for hierarchy()
		const dataset = { "children": topData };

		//--- Define a color scale for the count
		const color = d3.scaleLinear()
			.domain([0, topData.length])
			.range(["#634e42", "#879377"]);

		//--- Add hierarchy information to the dataset: depth, height, parent, children...
		//--- Must be called before pack()
		const nodes = d3.hierarchy(dataset)
			.sum(function(d) { return d.value ? d.value.count : 0; });
		console.log("Nodes: ");
		console.log(nodes);

		//--- Pack data to the given size. This adds x and y coordinates and r radius.
		const bubble = d3.pack()
			.size([this.chartWidth, this.chartHeight - 20])
			.padding(1.5);
		const bubbleNodes = bubble(nodes).descendants();
		console.log("Bubble nodes: ");
		console.log(bubbleNodes);		

		//--- Add a group for all nodes, move them to position
		var node = this.svg.selectAll(".node")
			.data(bubbleNodes)			//--- Use first descendants of the root node
			.enter()
			.filter(function(d) { return !d.children })	//--- Remove the parent circle
			.append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			// .style("opacity", 0)
			// 	.transition()
			// 	.ease(this.animationEase)
			// 	.duration(this.animationDuration)
			// 	.delay(function(d, i) { return i * this.animationDelay; } )
			// 	.style("opacity", 1)
			;

		//--- Add a circle to all nodes, fill them with the color scale, using index
		node.append("circle")
			.style("overflow", "hidden")
			.style("fill", function(d,i) { return color(i); })
			.attr("r", d => d.r)
	         //    .transition()
	        	// .ease(this.animationEase)
	        	// .duration(this.animationDuration)
	        	// //.delay(function(d, i) { return i * this.animationDelay; }.bind(this) )
	        	// .attr('r', function(d) { return d.r; }) 
	        ;

		//--- Add author
		node.append("text")
			.attr("dy", "-0.3em")
			.style("text-anchor", "middle")
			.attr("fill", "white")
			.text(function(d) { return d.data.value.author; })
			.attr("font-family", "Calibri", "sans-serif")
			.attr("font-size", function(d) { return d.r/7; })
	        // .transition()
	        // 	.ease(this.animationEase)
	        // 	.duration(this.animationDuration)
	        // 	.delay(function(d, i) { return i * this.animationDelay; } )
	        // 	.attr('font-size', function(d) { return d.r/7; }) 
	        ;

		//--- Add title
		node.append("text")
			.attr("dy", "0.8em")
			.style("text-anchor", "middle")
			.attr("fill", "white")
			.text(function(d) { return d.data.value.title.substring(0, 20); })
			.attr("font-family",  "Calibri", "sans-serif")
			.attr("font-size", function(d) { return d.r/6; })
	        // .transition()
	        // 	.ease(this.animationEase)
	        // 	.duration(this.animationDuration)
	        // 	.delay(function(d, i) { return i * this.animationDelay; } )
	        // 	.attr('font-size', function(d) { return d.r/6; }) 
			;

		//--- Add count
		node.append("text")
			.attr("dy", "2em")
			.style("text-anchor", "middle")
			.attr("fill", "white")
			.text(function(d) { return d.data.value.count; })
			.attr("font-family",  "Calibri", "sans-serif")
			.attr("font-size", function(d) { return d.r/7; })
	        // .transition()
	        // 	.ease(this.animationEase)
	        // 	.duration(this.animationDuration)
	        // 	.delay(function(d, i) { return i * this.animationDelay; } )
	        // 	.attr('font-size', function(d) { return d.r/7; }) 
	        ;

      const title = this.svg.append("g")
        .attr("id", "title");

      //--- Append title
      const titleHeight = 28;
      const titleWidth = 450;
      const titleX = this.chartWidth / 2 - titleWidth;
      var titleY = 0;
      title.append("text")
          .attr("x", titleX)
          .attr("y", titleY += titleHeight)
          .classed("title", true)
          .text("Hív az erdő");
      title.append("text")
          .attr("x", titleX)
          .attr("y", titleY += titleHeight)
          .classed("title", true)
          .text("toplista");
	}

}