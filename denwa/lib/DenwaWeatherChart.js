/**
      Denwa no mori weather and usage chart
      (C): Adam Katona, 2019

*/
class DenwaWeatherChart
{
    //--- Settings
    chartWidth = window.innerWidth - 30;
    chartHeight = window.innerHeight - 50;
    minRadius = 30;
    minAngle = 0;
    maxAngle = 359;
    angleSkew = 180;
    startDate = new Date(2019, 9, 5, 0);
    endDate = new Date(2019, 10, 5, 0);
    hackStartHour = 7;
    hackEndHour = 16;
    monthFormatter = d3.timeFormat("%B");
    dayFormatter = d3.timeFormat("%d");
    minMediaId = 1;
    maxMediaId = 18;

    precipHeight = [0, 0.09];
    tempHeight = [0.09, 0.35];
    mediaHeight = [0.4, 0.6];
    playsHeight = [0.65, 0.95];
    dateHeight = [0.96, 0.97];
    pubHeight = [0.625, 0.655];

    //--- Class fields
    svg;
    maxRadius;
    weatherData;
    mediaData;
    playsData;
    publicityData;
    center;
    rTemp;
    rPrecip;
    rMedia;
    rPlays;
    timeScale;
    toolTip;
    iconSize;

    /**
        Constructor
    */
    constructor(chartId)
    {
        this.init(chartId);
    }

    /**
      Call this to init chart.
    */
    init(chartId, width, height)
    {
      if (width)  { this.chartWidth = width; }
      if (height) { this.chartHeight = height; }
      this.maxRadius = Math.min(this.chartWidth, this.chartHeight) / 2 - 30;
      console.log("Chart size: " + this.chartWidth + "x" + this.chartHeight + ", max radius: " + this.maxRadius);

      this.svg = d3.select("#" + chartId)
          .attr("width", this.chartWidth)
          .attr("height", this.chartHeight);

      //--- Create a tooltip
      this.tooltip = d3.select('body')
        .append('div')
        .classed('tooltip', true);

      //--- Load weater data
      d3.json("data/historical_lorinc.json")
        .then(this.processWeatherData.bind(this));
    }

    /**
      Process weather data, load media data.
    */
    processWeatherData(wData)
    {
        //--- Filter for the given range
        this.weatherData = wData.data
          .filter(d => new Date(d.date) >= this.startDate && new Date(d.date) <= this.addDays(this.endDate, 1));                     

        console.log("Weather data:");
        console.log(this.weatherData);

        d3.json("data/denwa_report.json")
            .then(this.processMediaData.bind(this));
    }
     
    /**
      Process media data.
    */
    processMediaData(mData)
    {
        console.log("Source play data:");
        console.log(mData);

        //--- For the hourly play count, we need to filter for plays only - and date
        const playData = mData
          .filter(d => d.entryType == 0)
          .filter(d => new Date(d.created) >= this.startDate && new Date(d.created) < this.addDays(this.endDate, 1));      
        console.log("Play data:");
        console.log(playData);

        //--- Create hourly play count.
        this.mediaData = d3.nest()
            .key(d => this.simplifyDate(d.created, true, 0))  //--- this stores key as string...
            .rollup(function(d) { return { count: d.length }; })
            .entries(playData);

        console.log("Sum play data:");
        console.log(this.mediaData);

        //--- Calculate play lengths from two event types.
        var lastPlayIndex = 0;
        for (var i = 0; i < mData.length; i++)
        {
          if (mData[i].entryType == 0)
          {
              lastPlayIndex = i;
              mData[i].playLength = mData[i].length;
          }

          if (mData[i].entryType == 2 && mData[i].mediaId == mData[lastPlayIndex].mediaId)
          {
              const l = new Date(mData[i].created).getTime() - new Date(mData[lastPlayIndex].created).getTime();
              mData[lastPlayIndex].playLength = l / 1000 > mData[lastPlayIndex].length ? mData[lastPlayIndex].length : l / 1000;

              // if (mData[lastPlayIndex].mediaId == 2)
              // {
              //     console.log("Length: " + mData[lastPlayIndex].length + ", play length: " + mData[lastPlayIndex].playLength);
              //     console.log("Start: " + mData[lastPlayIndex].created + ", end: " + mData[i].created);
              // }
          }

        }

        //--- Throw away any other records, throw away bad media ids, and filter for date range.
        this.playsData = mData
          .filter(d => d.entryType == 0)
          .filter(d => new Date(d.created) >= this.startDate && new Date(d.created) < this.addDays(this.endDate, 1))
          .filter(d => d.mediaId >= this.minMediaId && d.mediaId <= this.maxMediaId);         
        console.log("All play data:");
        console.log(this.playsData);

        d3.json("data/publicity.json")
            .then(this.processPublicityData.bind(this));
    }


    processPublicityData(pData)
    {
        this.publicityData = pData;

        //--- Draw axis and stuff.
        this.drawAxis();

        //--- Draw the diagram values.
        this.draw();

        //--- Draw title and legend
        this.drawLegend();
    }

    /**
    Draw axis etc.
    */
    drawAxis()
    {
        //--- Calculate min, max temp value
        var min = Math.floor(d3.min(this.weatherData, d => d.temperature_min) / 10) * 10;
        var max = d3.max(this.weatherData, d => d.temperature_max);
        console.log("Min, max temp: " + min + ", " + max);

        //--- Create a scale for temperature
        this.rTemp = d3.scaleLinear()
            .domain([min, max])
            .range([this.calculateScaleHeight(this.tempHeight[0]), this.calculateScaleHeight(this.tempHeight[1])]);

        //--- Calculate min, max precip value
        min = d3.min(this.weatherData, d => d.precipitation);
        max = d3.max(this.weatherData, d => d.precipitation);
        console.log("Min, max precipitation: " + min + ", " + max);

        //--- Create a scale for precip
        this.rPrecip = d3.scaleLinear()
            .domain([0, max])
            .range([this.calculateScaleHeight(this.precipHeight[0]), this.calculateScaleHeight(this.precipHeight[1])]);

        //--- Calculate max media value
        max = d3.max(this.mediaData, d => d.value.count);
        console.log("Max play count: " + max);

        //--- Create a scale for daily plays
        this.rMedia = d3.scaleLinear()
            .domain([0, max])
            .range([this.calculateScaleHeight(this.mediaHeight[0]), this.calculateScaleHeight(this.mediaHeight[1])]);

        //--- Create a scale for all plays
        this.rPlays = d3.scaleLinear()
            .domain([0, this.maxMediaId + 1])
            .range([this.calculateScaleHeight(this.playsHeight[0]), this.calculateScaleHeight(this.playsHeight[1])]);

        //--- Create a scale for time
        this.timeScale = d3.scaleTime()
            .domain([this.startDate, this.endDate])
            .range([this.minAngle, this.maxAngle]);

        //--- Translate 0,0 to bottom center
        this.center = this.svg.append("g")
            .attr("id", "mainCenter")
            .attr("transform", "translate(" + this.chartWidth / 2 + "," + this.chartHeight / 2 + ")");

        //--- Add a background.
        this.center
            .append("g")
              .attr("id", "background")
              .append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", this.maxRadius)
                .classed("background", true);     

        //--- Add axis for temperature
        this.addRadialAxis(this.rTemp, "tempAxis", 5, 0, "°", true, true); 

        //--- Add axis for precip
        this.addRadialAxis(this.rPrecip, "precipAxis", 4, 0, "", true, true);     

        //--- Add axis for media
        this.addRadialAxis(this.rMedia, "mediaAxis", 5, 0, "", true, true);       

        //--- Add axis for plays
        this.addRadialAxis(this.rPlays, "playsAxis", this.maxMediaId, 0, "", true, false);     

        //--- Add axis for dates
        this.center.append("g")
             .attr("id", "dayAxis")
             .selectAll("g")
               .data(this.timeScale.ticks(d3.timeDay.every(1)).slice(0, -1))
               .enter()
               .append("text")
                .classed("dateAxisText", true)
                .attr("style", d => d.getDay() == 0 || d.getDate() == 23 ? "fill: #ffa0a0" : "")   //--- CSS overrides fill, we need to add "style"
                .text(d => this.dayFormatter(d))
                .attr("x", d => this.angleToX(this.timeScale(d), this.calculateScaleHeight(this.dateHeight[0])))
                .attr("y", d => this.angleToY(this.timeScale(d), this.calculateScaleHeight(this.dateHeight[0])))
                .attr("transform", function(d, i) { return "rotate(" 
                    + (this.timeScale(d) - 90) + ", "
                    + this.angleToX(this.timeScale(d), this.calculateScaleHeight(this.dateHeight[0])) + ", "
                    + this.angleToY(this.timeScale(d), this.calculateScaleHeight(this.dateHeight[0]))
                    + ")"; }.bind(this))               
                ;

        // ga = center.append("g")
        //     .attr("id", "monthAxis")
        //     .selectAll("g")
        //         .data(timeScale.ticks(d3.timeMonth.every(1)))
        //         .enter().append("g")
        //             .attr("transform", function(d, i) { return "rotate(" + (timeScale(d) + angleSkew) + ")"; });

        // ga.append("text")
        //     .attr("x", maxRadius)
        //     //.attr("dy", ".35em")
        //     .classed("dateAxisText", true)
        //     .attr("transform", function(d) { return "rotate(90, " + (calculateScaleHeight(dateHeight[0]) + 10) + ", 10)"; })
        //     .text(d => monthFormatter(d));    

        //--- Append design
        this.center.append("image")
          .attr("href", "images/tree.svg")
          //.attr("viewBox", "0 0 700 700")
          .attr("x", this.angleToX(140, this.maxRadius) + 31)
          .attr("y", this.angleToY(140, this.maxRadius) - 75)
          .attr("preserveAspectRatio", "xMinYMin meet");
    }

    /**
    Draw the data
    */
    draw()
    {
        const lowTempLine = this.createCurve("date", "temperature_min", this.rTemp);
        const highTempLine = this.createCurve("date", "temperature_max", this.rTemp);
        const precipLine = this.createCurve("date", "precipitation", this.rPrecip);
        const mediaLine = this.createCurve("key", "value.count", this.rMedia, null, d => d.value.count);

        const g = this.center.append("g")
          .attr("id", "paths");

        g.append("path")
            .datum(this.weatherData)
            .attr("class", "highTemperature")
            .attr("d", highTempLine);

        g.append("path")
            .datum(this.weatherData)
            .attr("class", "lowTemperature")
            .attr("d", lowTempLine);

        g.append("path")
            .datum(this.weatherData)
            .attr("class", "precip")
            .attr("d", precipLine);     

        g.append("path")
            .datum(this.mediaData)
            .attr("class", "media")
            .attr("d", mediaLine)
              .on("mouseover", this.showMediaTooltip.bind(this)) //--- Mouse events
              .on("mouseout", this.hideTooltip.bind(this))
              .on("mousemove", this.updateTooltip.bind(this))   
              ;            

        //--- Draw radial lines for plays
        this.center.append("g")
          .attr("id", "length")
          .selectAll("path")
            .data(this.playsData)
            .enter()
              .append("path")
              .attr("class", "length")
              .attr("style", d => "opacity: " + (d.playLength / d.length))
              .attr("d", d => this.createPlayCurve(d, d.length))
              .on("mouseover", this.showPlayTooltip.bind(this)) //--- Mouse events
              .on("mouseout", this.hideTooltip.bind(this))
              .on("mousemove", this.updateTooltip.bind(this))            
              ;

        //--- Draw publicity
        this.iconSize = this.calculateScaleHeight(this.pubHeight[1]) - this.calculateScaleHeight(this.pubHeight[0]);

        g.append("g")
          .attr("id", "publicity")
          .selectAll("image")
            .data(this.publicityData)
            .enter()
              .append("image")
                .classed("publicity", true)
                .attr("href", d => "images/" + this.selectIcon(d))
                .attr("viewBox", "0 0 20 20")
                .attr("x", d => this.angleToX(this.timeScale(new Date(d.date)), this.calculateScaleHeight(this.pubHeight[0])) - this.iconSize/2)
                .attr("y", d => this.angleToY(this.timeScale(new Date(d.date)), this.calculateScaleHeight(this.pubHeight[0])) - this.iconSize/2)
                .attr("width", this.iconSize)
                .attr("height", this.iconSize)
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("transform", function(d, i) { return "rotate(" 
                    + (this.timeScale(new Date(d.date)) - 90) + ", "
                    + this.angleToX(this.timeScale(new Date(d.date)), this.calculateScaleHeight(this.pubHeight[0])) + ", "
                    + this.angleToY(this.timeScale(new Date(d.date)), this.calculateScaleHeight(this.pubHeight[0]))
                    + ")"; }.bind(this))
                .on("mouseover", this.showPublicityTooltip.bind(this)) //--- Mouse events
                .on("mouseout", this.hideTooltip.bind(this))
                .on("mousemove", this.updateTooltip.bind(this))                 
                ;       
    }

    selectIcon(d)
    {
      if (d.type === "w") return "web.svg";
      if (d.type === "r") return "radio.svg";
      if (d.type === "t") return "tv.svg";
    }

    /**
      Create the individual play curves.
    */
    createPlayCurve(d, length)
    {
      const startDate = new Date(d.created);
      const endDate = this.addSeconds(d.created, (length > d.length ? d.length : length) + 1000);

      //--- Hack scale
      const firstDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), this.hackStartHour, 0, 0);
      const lastDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), this.hackEndHour, 0, 0);
      const origFirstDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
      const origEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59, 59);

      const timeScale2 = d3.scaleTime()
            .domain([firstDate, lastDate])
            .range([this.timeScale(origFirstDate), this.timeScale(origEndDate)]);
      //console.log(origFirstDate + ", " + origEndDate);
      //console.log(timeScale(origFirstDate) + " " + timeScale(origEndDate));

      const startX = this.angleToX(timeScale2(startDate), this.rPlays(d.mediaId));
      const startY = this.angleToY(timeScale2(startDate), this.rPlays(d.mediaId));
      const endX = this.angleToX(timeScale2(endDate), this.rPlays(d.mediaId));
      const endY = this.angleToY(timeScale2(endDate), this.rPlays(d.mediaId));
      //console.log(startDate + ", " + endDate + ", " + d.mediaId + ", " + d.playLength);

      return "M "+ startX + " " + startY +
        " C " + startX + " " + startY +
        ", " + endX + " " + endY +
        ", " + endX + " " + endY;

      // console.log(result);
      // return result;
    }

    angleToX(angle, radius)
    {
      //console.log("Angle: " + angle + ", radius: " + radius);
      return Math.cos((angle + this.angleSkew) * 0.01745329252) * radius;
    }

    angleToY(angle, radius)
    {
      return Math.sin((angle + this.angleSkew) * 0.01745329252) * radius;
    }

    /**
    Add axis lines a texts
    */
    addRadialAxis(scale, groupId, ticks, angle, suffix, showTicks, showNumbers)
    {
        console.log("Appending " + groupId);

        const gr = this.center.append("g")
            .attr("id", groupId)
            .selectAll("g")
                .data(scale.ticks(ticks).slice(1))
                .enter().append("g");

        if (showTicks)
        {
            gr.append("circle")
                .classed("radialTick", true)
                .attr("r", scale);
        }

        if (showNumbers)
        {
            gr.append("text")
                .attr("y", function(d) { return -scale(d) - 2; })
                .attr("transform", "rotate(" + angle + ")")
                .classed("radialAxisText", true)
                .text(function(d) { return d + suffix; });      
        }
    }

    createCurve(dateName, valueName, scale, dateFunction, valueFunction)
    {
        return d3.lineRadial()
            .curve(d3.curveCatmullRom.alpha(0.5))
            .radius(function(d) 
                {
                    return scale(valueFunction ? valueFunction(d) : d[valueName]); 
                })
            .angle(function(d) 
                { 
                    //--- FUCK! Angle is in radians!
                    const date = dateFunction ? dateFunction(d) : new Date(d[dateName]);
                    //console.log("Angle: " + date + "->" + timeScale(date));
                    return (this.timeScale(date) - 270 + this.angleSkew) * 0.01745329252; 
                }.bind(this));
    }


    /**
    Draw the title and legend
    */
    drawLegend()
    {
      const title = this.svg.append("g")
        .attr("id", "title");

      //--- Append title
      const titleHeight = 28;
      const titleWidth = 200;
      const titleX = this.chartWidth / 2 - this.maxRadius - titleWidth;
      var titleY = this.chartHeight / 2 - this.maxRadius;
      title.append("text")
          .attr("x", titleX)
          .attr("y", titleY += titleHeight)
          .classed("title", true)
          .text("A telefon látogatottsága");
      title.append("text")
          .attr("x", titleX)
          .attr("y", titleY += titleHeight)
          .classed("title", true)
          .text("2019. október 5. és");
      title.append("text")
          .attr("x", titleX)
          .attr("y", titleY += titleHeight)
          .classed("title", true)
          .text("2019. november 5.");
      title.append("text")
          .attr("x", titleX)
          .attr("y", titleY += titleHeight)
          .classed("title", true)
          .text("között");

      //--- Append info
      const infoWidth = 25;
      const infoHeight = 20;
      var infoY = this.chartHeight /2 + this.maxRadius - 10;
      const legend = this.svg.append("g")
        .attr("id", "legend");

      legend.append("line")
        .attr("x1", titleX)
        .attr("y1", infoY)
        .attr("x2", titleX + infoWidth)
        .attr("y2", infoY)
        .classed("precip", true);
      legend.append("text")
          .attr("x", titleX + infoWidth + 5)
          .attr("y", infoY)
          .classed("legend", true)
          .text("csapadék [mm]");
      infoY -= infoHeight;

      legend.append("line")
        .attr("x1", titleX)
        .attr("y1", infoY)
        .attr("x2", titleX + infoWidth)
        .attr("y2", infoY)
        .classed("lowTemperature", true);
      legend.append("text")
          .attr("x", titleX + infoWidth + 5)
          .attr("y", infoY)
          .classed("legend", true)
          .text("minimum hőmérséklet [°C]");
      infoY -= infoHeight;

      legend.append("line")
        .attr("x1", titleX)
        .attr("y1", infoY)
        .attr("x2", titleX + infoWidth)
        .attr("y2", infoY)
        .classed("highTemperature", true);
      legend.append("text")
          .attr("x", titleX + infoWidth + 5)
          .attr("y", infoY)
          .classed("legend", true)
          .text("maximum hőmérséklet [°C]");
      infoY -= infoHeight;

      legend.append("line")
        .attr("x1", titleX)
        .attr("y1", infoY)
        .attr("x2", titleX + infoWidth)
        .attr("y2", infoY)
        .classed("media", true);
      legend.append("text")
          .attr("x", titleX + infoWidth + 5)
          .attr("y", infoY)
          .classed("legend", true)
          .text("látogatottság [db/h]");
      infoY -= infoHeight;

      const legendIconSize = 9;
      legend.append("image")
          .classed("publicity", true)
          .attr("href", "images/web.svg")
          .attr("viewBox", "0 0 20 20")
          .attr("x", titleX)
          .attr("y", infoY - 3)
          .attr("width", legendIconSize)
          .attr("height", legendIconSize)
          .attr("preserveAspectRatio", "xMinYMin meet");
      legend.append("image")
          .classed("publicity", true)
          .attr("href", "images/tv.svg")
          .attr("viewBox", "0 0 20 20")
          .attr("x", titleX + legendIconSize)
          .attr("y", infoY - 3)
          .attr("width", legendIconSize)
          .attr("height", legendIconSize)
          .attr("preserveAspectRatio", "xMinYMin meet");
      legend.append("image")
          .classed("publicity", true)
          .attr("href", "images/radio.svg")
          .attr("viewBox", "0 0 20 20")
          .attr("x", titleX + 2 * legendIconSize)
          .attr("y", infoY - 3)
          .attr("width", legendIconSize)
          .attr("height", legendIconSize)
          .attr("preserveAspectRatio", "xMinYMin meet")                    
      legend.append("text")
          .attr("x", titleX + infoWidth + 5)
          .attr("y", infoY)
          .classed("legend", true)
          .text("média megjelenések");

      //--- Append logo
      this.svg.append("image")
        .attr("href", "images/logo.svg")
        .attr("x", this.chartWidth / 2 + this.maxRadius + 30)
        .attr("y", this.chartHeight / 2 + this.maxRadius - 150)
        .attr("preserveAspectRatio", "xMinYMin meet");          
    }

    simplifyDate(s, clearHours, skew)
    {
        const date = new Date(s);

        if (clearHours)
        {
              date.setHours(date.getHours(),0,0,0);
        }

        if (skew)
        {
              date.setDate(date.getDate() + skew);
        }

        return date;
    }

    addDays(date, days)
    {
      var result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }

    addSeconds(date, seconds)
    {
      var result = new Date(date);
      result.setTime(result.getTime() + seconds * 1000);
      return result;
    }

    calculateScaleHeight(heightPrecent)
    {
      return this.minRadius + (this.maxRadius - this.minRadius) * heightPrecent;
    }

    //--- Show tooltip
    showPlayTooltip(d)
    {
      const date = new Date(d.created);
      this.tooltip
        .style('display', 'inline')
        .style('opacity', 0)
        .html(date.toLocaleDateString("hu-HU") + " " 
            + date.toLocaleTimeString("hu-HU") + "<br/>"
            + d.author + ": " + d.title + "<br/>Előadja: "
            + d.performedBy)
          .transition()
          .duration(200)
          .style('opacity', 0.95);

      this.updateTooltip();
    }

    //--- Show tooltip
    showPublicityTooltip(d)
    {
      this.tooltip
        .style('display', 'inline')
        .style('opacity', 0)
        .text(new Date(d.date).toLocaleDateString("hu-HU") + " " + d.media)
          .transition()
          .duration(200)
          .style('opacity', 0.95);

      this.updateTooltip();
    }

    //--- Show tooltip
    showMediaTooltip(d)
    {
      //TODO: dunno how to show current value
      // console.log(d);
      // this.tooltip
      //   .style('display', 'inline')
      //   .style('opacity', 0)
      //   .text(new Date(d.key).toLocaleDateString("hu-HU") + " " + d.value.count)
      //     .transition()
      //     .duration(200)
      //     .style('opacity', 0.95);

      // this.updateTooltip();
    }


    //--- Move tooltip when mouse moves
    updateTooltip()
    {
      this.tooltip
        .style('left', (event.pageX + 10) + "px")
        .style('top', (event.pageY - 50) + "px");
    }

    //--- Hide tooltip
    hideTooltip()
    {
      this.tooltip.style('display', 'none');
    }
}