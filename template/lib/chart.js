
        var chartWidth = window.innerWidth - 30;
        var chartHeight = window.innerHeight - 50;

        var svg = d3.select("#chart")
          .attr("width", chartWidth)
          .attr("height", chartHeight)

      //--- Load data
      d3.dsv(";", "data/data.csv")
        .then(init);

      /**
       	Init data and diagram
      */
      function init(csvData)
      {
          //--- Init stuff
          var data = csvData;
          console.log("loaded:");
          console.log(data);

               
            //--- Draw the tree
            draw(data);
      }

      /**
        Draw the tree
      */
      function draw(data)
      {

            svg.selectAll('g')
                .data(data)
                .join(
                    function (enter) 
                    {
                        var n = enter.append('g');

                        n.append('text')
                          .text(d => d.col1)
                          .classed('title', true)
                          .attr('x', d => 10)
                          .attr('y', (d,i) => 20 * i + 10)
                          ;

                        return n;                    
                    },

                    update => update,
                    exit => exit.remove()
                 );
      }
