var loaddata = []

function init() {
    // Get input data
    d3.csv('data/cars.csv').then(data => {
        for (var i = 0; i < data.length; i++) {
            var item = {
                "id": i,
                "Name": null,
                "raw": null,
                "coord": null
            };
            item["Name"] = data[i]["Vehicle Name"];
            // item["id"] = item["Name"].replace(new RegExp(" ", 'g'), "");
            item["Name"] = data[i]["Vehicle Name"];
            item["raw"] = data[i];
            delete item["raw"]["Vehicle Name"];
            delete item["raw"]["Pickup"];
            item["coord"] = {};
            loaddata[i] = item;
        }
        attr = Object.keys(loaddata[0]["raw"]); // ["Small/Sporty/ Compact/Large Sedan", "Sports Car", "SUV", ...]
        attrNo = attr.length; // 18
        for (var i = 0; i < attrNo; i++) {
            var tmpmax = d3.max(loaddata, function (d) {
                return +d["raw"][attr[i]];
            }); // max value of attr[i]
            var tmpmin = d3.min(loaddata, function (d) {
                return +d["raw"][attr[i]];
            }); // min value of attr[i]
            loaddata.forEach(function (d) {
                d["coord"][attr[i]] = (+d["raw"][attr[i]] - tmpmin) / (tmpmax - tmpmin); // calc coord of each attr, in [0,1]
            });
        }
        populateList(loaddata);
    });
}

function populateList(data) {
    if (data == undefined || data.length == 0)
        d3.select('#error_info').text('Oops! No cars information available.');
    else {
        var list = d3.select('#carlist');

        var listdiv = list.selectAll('.listitem')
            .data(data)
            .enter().append('div')
            .attr('class', 'text')
            .attr('class', 'listdiv')
            .style('overflow', 'auto')
            .style('margin', '5%')
            .style('margin-left', '0%')

        listdiv.append('img')
            .attr('src', 'img/car.png')
            .attr('height', 120)
            .attr('width', 120)
            .style('margin-left', '10%')
            .style('margin-right', '10%')
            .style('margin-top', '10%')
            .style('float', 'left')
            .attr('id', d => 'img' + d.id)
            .attr('alt', 'car image')

        var ld = listdiv.append('div')
            // .style('margin-left', '5%')
            .attr('class', 'text')
            .style('display', 'inline-block')
        // .style('cursor', 'pointer')
        // .on('click', function (d) {
        //     var coverUrl = encodeURI(d3.select('#img' + d.id).attr('src'));
        //     var url = "album.html?artist=" + d.artist.replace(/&/g, 'AndSign') + "&album=" + d.album.replace(/&/g, 'AndSign') + "&rank=" + d.rank + "&cover=" + coverUrl;
        //     window.location.href = url;
        // })
        ld.append('h3')
            .text(d => d.Name)

        var data = [];
        var tbody = ld.append('div')
            // .attr("class", "infolabel")
            // .html(labelText) //add text
            .append('tbody')

        var rows = tbody.selectAll("tr")
            .data(d => {
                let data = d['raw'];
                let res = [];
                Object.keys(data).forEach(item => {
                    let curr = {};
                    curr[item] = data[item];
                    res.push(curr);
                })
                return res;
            })
            .enter()
            .append("tr");

        rows.selectAll('td')
            .data(d => {
                let res = [];
                Object.keys(d).forEach(key => {
                    if (key == "Compact Car" || key == "Sports Car" || key == "SUV" || key == "Wagon" || key == "Minivan")
                        if (d[key] == 1) return res[0] = key;
                        else return;
                    res[0] = key;
                    res[1] = "\t ..... \t";
                    res[2] = d[key];
                })
                return res;
            }).enter().append('td')
            .html(d => '<p>' + d + '</p>');
    }
}

var searchLen = 0;
var currData = []

function searchList() {
    window.scrollTo(0, 0);
    d3.select('#error_info').text('')

    var input = document.getElementById('searchContent'),
        filter = input.value.toUpperCase();

    if (searchLen == 0) {
        currData = loaddata;
    }

    if (searchLen > filter.length) { // deleting words
        // currData = prevData;
        // remove old content
        if (filter.length == 0) {
            d3.select('#carlist').selectAll('.listdiv').remove();
            populateList(loaddata);
        }
    }
    if (filter.length > 1) {
        // remove old content
        d3.select('#carlist').selectAll('.listdiv').remove();

        // get all matched data
        currData = currData.filter(d => d.Name.toUpperCase().includes(filter));

        if (currData.length == 0) // no matched data
            d3.select('#error_info').text('No result.')
        else {
            populateList(currData);
        }
    }
    searchLen = filter.length;
}