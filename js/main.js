var graph;

var x0 = null,
	x0old = null,
	x1 = null,
	dims = [];
var attrLen = null,
	attr = null,
	attr2 = [],
	attr3 = [],
	index = 0;
var X = [],
	Y = [];
var loadData = [];
var currData, prevData;

// Gets called when the page is loaded.
function init() {
	// Get input data
	d3.csv('data/cars.csv').then(data => {
		// preprocessing
		var i = 0;
		data.forEach(datum => {
			var curr = {
				"id": i,
				"Name": datum["Vehicle Name"],
				"value": datum,
				"coord": {}
			};

			delete curr["value"]["Vehicle Name"];
			delete curr["value"]["Pickup"];

			loadData.push(curr);
			i++;
		});

		attr = Object.keys(loadData[0]["value"]);
		attrLen = attr.length;

		getCoordInfo(attr);

		// draw visualization
		draw(loadData);

		for (var i = 0; i < attrLen; i++) {
			dims[i] = attr[i];
		}
	});
}

function getCoordInfo(attr) {
	//calculate corrd
	attr.forEach(att => {
		var currMax = d3.max(loadData, d => {
			return +d["value"][att];
		}); // max value of attr[i]

		var currMin = d3.min(loadData, d => {
			return +d["value"][att];
		}); // min value of attr[i]

		loadData.forEach(d => {
			d["coord"][att] = (+d["value"][att] - currMin) / (currMax - currMin); // calc coord of each attr, in [0,1]
		});
	});
}

// function getCoordInfo(attr) {
//   let res = {}

//   //calculate corrd
//   var currMax = d3.max(loadData, d => {
//     return +d["value"][attr];
//   }); // max value of attr[i]

//   var currMin = d3.min(loadData, d => {
//     return +d["value"][attr];
//   }); // min value of attr[i]

//   loadData.forEach(d => {
//     res[attr] = (+d["value"][attr] - currMin) / (currMax - currMin); // calc coord of each attr, in [0,1]
//   });

//   return res;
// }

function draw(data) {
	// heterogeneous data
	initdim1 = 11, initdim2 = 7; // 11:HP 7:Retail Price

	data.forEach(d => {
		d.x = d["coord"][attr[initdim1]];
		d.y = d["coord"][attr[initdim2]];
	}); // update x, y with coords of HP and Retail Price
	graph = new InterAxis("scplot", data, {
		"xlabel": attr[initdim1],
		"ylabel": attr[initdim2],
		"init": true
	});

	for (var i = 0; i < attrLen; i++) {
		X[i] = {
			"attr": attr[i],
			"value": 0,
			"changed": 0,
			"error": 0
		};
		Y[i] = {
			"attr": attr[i],
			"value": 0,
			"changed": 0,
			"error": 0
		};
	}
	X[initdim1]["value"] = 1; // at initial stage HP counts 100% for x axis 
	Y[initdim2]["value"] = 1; // Retail Price count 100% for y axis
	document.getElementById("cbX").selectedIndex = initdim1; // update initdim with index in comboBox
	document.getElementById("cbY").selectedIndex = initdim2;

	xaxis = new axis("#scplot", X, "X", {
		"width": graph.padding.left - 250,
		"height": graph.size.height / 2 - 50,
		"padding": {
			top: graph.padding.top + graph.size.height / 2 + 100,
			right: 0,
			left: 80,
			bottom: 0
		}
	});
	yaxis = new axis("#scplot", Y, "Y", {
		"width": graph.padding.left - 250,
		"height": graph.size.height / 2 - 50,
		"padding": {
			top: graph.padding.top,
			right: 0,
			left: 80,
			bottom: 0
		}
	});
}

var prevSearchLen = 0;

function searchList() {
	var input, filter;
	input = document.getElementById('searchContent');
	filter = input.value.toUpperCase();
	currData = loadData;

	if (prevSearchLen == 0) {
		prevData = currData;
	}

	// remove navigation highlight
	// d3.selectAll('.curr').attr('class', '')
	// d3.selectAll('#curr').attr('id', '')

	if (prevSearchLen > filter.length) { // deleting words
		currData = prevData;
		// remove old content
		if (filter.length == 0) {
			d3.select('#svgplot').remove();
			draw(loadData);
		}
	}
	if (filter.length > 1) {
		// remove old content
		// d3.select('#plot').remove();
		d3.selectAll('.searchRes').attr('class', '');

		// get all matched data
		currData = currData.filter(d => d.Name.toUpperCase().includes(filter));

		if (currData.length == 0) // no matched data
			d3.select('#error_info').text('No result.')
		else {
			currData.forEach(data => {
				d3.select("#circle" + data.id).attr('class', 'searchRes').attr('z', '1000');
			});
		}
	}
	prevSearchLen = filter.length;
}

clearDropzone = function (axistobeupdated) {
	data = graph.data_points;
	graph.dropzone[axistobeupdated + "L"] = [];
	graph.dropzone[axistobeupdated + "H"] = [];
	var inotherpositivedropzone = graph.dropzone.XH.concat(graph.dropzone.YH);
	var inothernegativedropzone = graph.dropzone.XL.concat(graph.dropzone.YL);
	data.forEach(d => {
		d.indropzone = 0;
		inotherpositivedropzone.forEach(function (c) {
			if (c == d) {
				d.indropzone = 1;
				return;
			}
		});
		inothernegativedropzone.forEach(function (c) {
			if (c == d) {
				d.indropzone = -1;
				return;
			}
		});
	});
	d3.select("#" + axistobeupdated + "L").selectAll("circle").remove();
	d3.select("#" + axistobeupdated + "H").selectAll("circle").remove();

	document.getElementById("cb" + axistobeupdated).selectedIndex = axistobeupdated == "X" ? initdim1 : initdim2;
	updatebycb(axistobeupdated, axistobeupdated == "X" ? attr[initdim1] : attr[initdim2]);
}

updatebycb = function (axistobeupdated, selectedattr) {
	data = graph.data_points;
	var V = [],
		newxname = selectedattr;
	for (var i = 0; i < attrLen; i++) {
		V[i] = {
			"attr": attr[i],
			"value": attr[i] == selectedattr ? 1 : 0,
			"error": 0
		};
	}
	for (var i = 0; i < attr2.length; i++) {
		if (attr2[i]["attr"] == selectedattr) {
			V = attr2[i]["vector"];
		}
	}

	d3.select("#SC").remove();
	d3.select("#" + axistobeupdated).remove();
	data.forEach(d => {
		d[axistobeupdated == "X" ? "x" : "y"] = d["coord"][newxname];
	});
	graph = new InterAxis('scplot', data, {
		"xlabel": axistobeupdated == "X" ? newxname : graph.options.xlabel,
		"ylabel": axistobeupdated == "X" ? graph.options.ylabel : newxname,
		"init": axistobeupdated,
		"dropzone": graph.dropzone
	});
	if (axistobeupdated == "X") {
		X = V;
		xaxis = new axis("#scplot", V, axistobeupdated, axis_options[axistobeupdated]);
	} else {
		Y = V;
		yaxis = new axis("#scplot", V, axistobeupdated, axis_options[axistobeupdated]);
	}
}

/**
 * Creates an infolabel on mouseover.
 *
 * @handle: the currently selected cell
 */
function hoverOnCell(handle) {
	// var descrip = "There are " + handle.Name + " " + "(s) in the year of " + handle.time + " are ranked as " + handle.rank +
	// //   ".<br/>Click the grid to see all of them.";
	// var descrip = "<table>" + "</table>"

	var labelText = "<h1><i><strong>" + handle.Name + "</strong></i></h1>";

	var tbody = d3.select('#scplot')
		.append('div')
		.attr("class", "infolabel")
		.html(labelText) //add text
		.append('tbody')

	var data = [];
	var columns = ["key", "value"];
	for (var i = 0; i < attrLen; i++) {
		var curr = {
			"key": null,
			"value": null
		};
		curr["key"] = attr[i];
		curr["value"] = handle["value"][attr[i]];
		data[i] = curr;
	}

	// create a row for each object in the data
	var rows = tbody.selectAll("tr")
		.data(data)
		.enter()
		.append("tr");

	// create a cell in each row for each column
	var cells = rows.selectAll("td")
		.data(function (row) {
			return columns.map(function (column) {
				return {
					column: column,
					value: row[column]
				};
			});
		})
		.enter()
		.append("td")
		.html(d => {
			return d.value;
		});
}

/**
 * Destroys infolabel on mouseout
 */
function hoverOutCell() {
	d3.select(".infolabel").remove(); //remove info label
}

function moveTruliaLabel() {
	var x = d3.event.clientX;
	var y = d3.event.clientY;

	//at center coordinates of div, switch side of mouse on which infolabel appears
	var switchY;

	if (y < 300) switchY = 50;
	else switchY = 300;

	d3.select(".infolabel")
		.style("left", (x - 260) + "px")
		.style("top", (y - switchY) + "px");
}