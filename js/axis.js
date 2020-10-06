var panelOpen = {
  'X': false,
  'Y': false
};

axis = function (elem_id, vector, XorY, options) {
  var displayedAttr = [];
  var margin = {
      top: 30,
      right: 40,
      bottom: 10,
      left: 5
    },
    padding = options.padding,
    width = options.width - margin.left - margin.right,
    height = options.height - margin.top - margin.bottom;

  var data = vector;
  data.sort(function (a, b) { // sort attrs by weights in descending order
    if (a["value"] == b["value"]) {
      return d3.ascending(a["attr"], b["attr"])
    } else {
      return Math.abs(b["value"]) - Math.abs(a["value"]);
    }
  });
  data = data.slice(0, 12); // get top 12 attrs

  data.forEach(d => {
    if (d["value"] != 0 || panelOpen[XorY])
      displayedAttr.push(d);
  });

  height = displayedAttr.length * 15;

  var x;
  if (displayedAttr.length == 1) {
    if (displayedAttr[0]['value'] > 0)
      x = d3.scaleLinear() // x axis of bar chart, weights of attrs
      .domain([0, displayedAttr[0]['value']]).nice()
      .range([0, width]);
    else
      x = d3.scaleLinear() // x axis of bar chart, weights of attrs
      .domain([displayedAttr[0]['value'], 0]).nice()
      .range([0, width]);
  } else {
    let extent = d3.extent(displayedAttr, function (d) {
      return d["value"];
    });
    let max = Math.max(extent[extent.length - 1], 0);
    let min = Math.min(extent[0], 0) ;
    x = d3.scaleLinear() // x axis of bar chart, weights of attrs
      .domain([min, max]).nice()
      .range([0, width]); // extent: find the max and min value; nice: modify the range to avoid fraction
  }

  var y = d3.scaleBand() // y axis of bar chart, names of attrs
    .rangeRound([0, height], .2)
    .domain(displayedAttr.map(function (d) {
      return d["attr"]
    }));

  var xAxis = d3.axisTop(x);
  xAxis.ticks(5);

  var svg = d3.select(elem_id).select("svg").append("g")
    .attr("id", XorY)
    .attr("transform", "translate(" + (padding.left + margin.left) + "," + (padding.top + margin.top) + ")");

  var dragBar = svg.selectAll(".bar")
    .data(displayedAttr)
    // .data(data)
    .enter().append("rect")
    .attr("class", function (d) {
      return d["value"] < 0 ? "bar negative" : "bar positive";
    })
    .attr("x", function (d) {
      return x(Math.min(0, d["value"]));
    })
    .attr("y", function (d) {
      return y(d["attr"]);
    })
    .attr("width", function (d) {
      if (d["value"] == 0) {
        return 2;
      } else {
        return Math.abs(x(d["value"]) - x(0));
      }
    })
    .attr("height", y.bandwidth() - 5)
    .attr("fill-opacity", function (d) {
      return 1 - d["error"];
    });

  var dragBarTop = svg.selectAll(".dummy")
    .data(displayedAttr)
    // .data(data)
    .enter().append("circle")
    .attr("class", "dummy dragBarTop")
    // .attr('d', 'M-5.5,-5.5v10l6,5.5l6,-5.5v-10z')
    .attr("cx", function (d) {
      if (d["value"] > 0) {
        return x(d["value"]);
      } else {
        return x(Math.min(0, d["value"]));
      }
    })
    .attr("cy", function (d) {
      return y(d["attr"]) + 5;
    })
    // .attr("width", 2)
    .attr("r", y.bandwidth() / 3)
    .call(d3.drag().on('drag', function (d, i) {
      d3.select(this).attr("cx", d3.mouse(document.getElementById(XorY))[0]); // mouse position x

      d3.select("#" + XorY).selectAll('.bar[y="' + y(d["attr"]) + '"]')
        .attr("x", function (d) {
          return x.invert(d3.mouse(document.getElementById(XorY))[0]) < 0 ? d3.mouse(document.getElementById(XorY))[0] : x(0);
        })
        .attr("width", function (d) {
          if (x.invert(d3.mouse(document.getElementById(XorY))[0]) == 0) {
            return 2;
          } else if (x.invert(d3.mouse(document.getElementById(XorY))[0]) > 0) {
            return Math.abs(d3.mouse(document.getElementById(XorY))[0] - x(0) + 2);
          } else {
            return Math.abs(d3.mouse(document.getElementById(XorY))[0] - x(0));
          }
        });
      d["value"] = x.invert(d3.mouse(document.getElementById(XorY))[0]);
      if (graph.dropzone[XorY + "H"].length + graph.dropzone[XorY + "L"].length > 0) {
        // d["changed"] = 1;
      }
    }).on('end', function (d, i) {
      console.log("dragend");
      var V = {},
        Vchanged = {};
      for (var i = 0; i < attrLen; i++) {
        var tmp = data[i] || vector[i];
        V[vector[i]["attr"]] = tmp["value"];
        Vchanged[vector[i]["attr"]] = tmp["changed"];
      }
      // console.log(V);
      updategraph(XorY, V, Vchanged);
    }));

  svg.append('foreignObject')
    .attr('x', width / 2 - 150)
    .style('z-index', '10000000000')
    .attr('y', height)
    .attr('height', 300)
    .attr('width', 300)
    .append('xhtml:button')
    .attr('class', 'round_btn')
    .attr('id', 'btn' + XorY)
    .style('left', 150)
    .html(() => {
      if (!panelOpen[XorY]) {
        return '+';
      } else {
        return '&times;';
      }
    })
    .on('click', d => {
      panelOpen[XorY] = !panelOpen[XorY];

      var value = {},
        err = {};
      vector.forEach(datum => {
        value[datum['attr']] = datum['value'];
        err[datum['attr']] = datum['error'];
      });
      updateAxis(value, err, XorY, options);

      //   .append('xhtml:div')
      //   .attr("class", "attrPanel")
      //   .style("left", 80 + "px")
      //   .style("top", 20 + "px")
      //   .append('xhtml:div')
      //   .selectAll('div')
      //   .data(notdisplayedAttr).enter()
      //   .append('xhtml:div')

      // div.append('xhtml:p')
      //   .text(d => d.attr)
      //   .style('cursor', 'pointer')
      //   .on('click', d => {
      //     console.log('here');
      //   })

    })

  svg.append("g")
    .attr("class", "x axis")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y2", height);

  svg.append("g").selectAll("text")
    .data(displayedAttr)
    // .data(data)
    .enter().append("text")
    .text(function (d) {
      return d["attr"];
    })
    .attr("x", function (d) {
      if (d["value"] < 0) {
        return x(0) + 5;
      } else {
        return x(Math.max(0, d["value"])) + 5;
      }
    })
    .attr("text-anchor", function (d) {
      // if (d["value"] < 0) { return  "end";}
      if (d["value"] < 0) {
        return "start";
      } else {
        return "start";
      }
    })
    .attr("y", function (d) {
      return y(d["attr"]) + 0.5 * y.bandwidth();
    })
    .attr("dy", ".35em");
};