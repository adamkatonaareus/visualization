/**
	Neko script
	(C): Adam Katona, 2019
*/
class Neko
{
    //--- Settings
	chartWidth = window.innerWidth - 30;
    chartHeight = window.innerHeight - 50;
    scrollDuration = 4000;
    blurSpeed = 0.05;
    pawAddSpeed = 1000;
    maxPawCount = 5;
    pawDistance = 10;
    pawSize = 200;
    randomX = d3.randomUniform(85, 90);
    randomY = d3.randomUniform(-10, 10);

    //--- Data
    svg;
    defs;
    pawsData = [];
    pawScaleX;
    pawScaleY;
    pawScaleBlur;
    filters = [];
    timer;
    pawId = 0;

    /**
        Constructor
    */
    constructor(chartId, width, height)
    {
      	if (width)  { this.chartWidth = width; }
      	if (height) { this.chartHeight = height; }
		console.log("Chart size: " + this.chartWidth + "x" + this.chartHeight);

      	this.svg = d3.select("#" + chartId)
          	.attr("width", this.chartWidth)
          	.attr("height", this.chartHeight);

 		this.pawScaleX = d3.scaleLinear()
            .domain([0, 100])
            .range([0, this.chartWidth]);

		this.pawScaleY = d3.scaleLinear()
            .domain([0, 100])
            .range([0, this.chartHeight]);         

   		this.pawScaleBlur = d3.scaleLinear()
            .domain([this.chartWidth, -200])
            .range([0, 100]);   

        this.defs = this.svg.append("defs");

		this.timer = d3.interval(this.draw.bind(this), this.pawAddSpeed);
    }

    /**
    	Draw paws
    */
    draw()
    {
    	//--- Add new paws
		this.pawId++;
		this.pawsData.push([
			this.randomX(), 
			50 + this.randomY() + (this.pawId % 2 == 0 ? 1 : -1) * this.pawDistance,
			2, this.pawId]);

		if (this.pawsData.length > this.maxPawCount)
		{
			this.pawsData.shift();
		}

    	//--- Draw new paws
    	this.svg.selectAll("image")
    		.data(this.pawsData, d => d[3])
    		.join(
    			enter => enter.append("image")
    				.attr("id", (d, i) => "paw" + d[3])
	    			.attr("href", "images/paw.svg")
	         		.attr("viewBox", "0 0 " + this.pawSize + " " + this.pawSize)
	          		.attr("x", d => this.pawScaleX(d[0]))
	      			.attr("y", d => this.pawScaleY(d[1]) - this.pawSize / 2)
	      			.attr("width", this.pawSize)
	      			.attr("height", this.pawSize)
	          		.attr("preserveAspectRatio", "xMinYMin meet")
                    .style("opacity", 0.8)
	          		.attr("filter", (d, i) => "url(#blur" + d[3] + ")")
				 	.call(enter => enter.transition()
							.ease(d3.easeLinear)
						 	.duration(this.scrollDuration)
							.style("opacity", 0)
							.attr("x", d => this.pawScaleX(d[0]) - this.chartWidth))
					,

				update => update,

				exit => exit.remove()
			)
          	;

        //--- Change blur filters
        this.defs.selectAll("filter")
        	.data(this.pawsData, d => d[3])
        	.join(
        		enter => enter.append("filter")
        			.attr("id", d => "blur" + d[3])
					.append("feGaussianBlur")
					    .attr("stdDeviation", d => d[2])     
				 		.call(enter => enter.transition()
							.ease(d3.easeLinear)
						 	.duration(this.scrollDuration)
					 		.delay(10)
							.attr("stdDeviation", 20))
        			,

        		update => update, 

        		exit => exit.remove()
        	)
    		;
    }

}
