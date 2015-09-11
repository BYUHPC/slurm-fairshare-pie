var data;
var original_data;
var total;

d3.json("FairsharePie.php", function(error, json) {
  if (error) {
    return console.warn(error);
  }
  data = json['rows'];
  if (data.length != 0) {
      original_data = {};
      for (i=0; i<data.length; ++i) {
          original_data[data[i]["user"]] = data[i]["shares"];
      }
      drawCharts();
  } else {
      $('#instructions').html("<p>Sorry, either you don&rsquo;t have an account to manage or we can&rsquo;t find any members in your group.</p>");
      $('#tip').html("");
  }
});

function drawCharts() {
  // sort the data
  data.sort(function (a, b) {
    return parseInt(b[1]) - parseInt(a[1]);
  });
  total = 0;
  for (i=0; i<data.length; ++i){
    total += parseInt(data[i][1]);
  }
  if (document.getElementById("datatable").hasChildNodes()) {
    // remove the previous table and piechart and recreate them. ugly i know.
    document.getElementById("datatable").removeChild(document.getElementById("datatable").children[0]);
    document.getElementById("piechart").removeChild(document.getElementById("piechart").children[1]);
  }
  fill_table("#datatable");
  fill_svg("#piechart");
  updateCommand("#commands");
}

function updateCommand(command_container) {
  // detect differences between the data and original data
  update_string = "";
  for (i=0; i<data.length; ++i) {
    if (original_data[data[i]["user"]] !== data[i]["shares"]) {
        update_string += "sacctmgr -i modify user "+data[i]["user"]+" set fairshare="+data[i]["shares"]+ "\n";
    }
  }
  if (update_string !== "") {
    $(command_container).html(update_string);
  }
}

function fill_table(table_container) {
  var table = d3.select(table_container).append("table"),
      thead = table.append("thead"),
      tbody = table.append("tbody");
  var columns = ["Users", "Shares (editable)", "% of Total"];
  thead.append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
        .text(function(column) { return column; })
        .attr("class", "shares");

  // create a row for each object in the data
  var rows = tbody.selectAll("tr")
      .data(data)
      .enter()
      .append("tr");

  // create a cell in each row for each column
  var cells = rows.selectAll("td")
      .data(function(row) {
          return columns.map(function(column) {
              var value;
              if (column == columns[0]) {
                value = row["user"];
              } else if (column == columns[1]) {
                value = row["shares"];
              } else {
                value = row["shares"] * 100 / total;
                value = value.toFixed(2) + "%";
              }
              return {column: column, value: value};
          });
      })
      .enter()
      .append("td")
          .text(function(d) { return d.value; })
          .attr("class", function(d) {
            if (d.column == columns[1]) {
              return "editable";
            } else if (d.column == columns[2]) {
              return "shares right";
            } else {
              return "shares";
            }
          })
          .attr("contenteditable", function(d) {
            return (d.column == columns[1]);
          });
  cells.on("blur", function(d) {
    numval = parseInt(this.innerHTML);
    if (isNaN(numval)) {
      numval = 0;
    }
    this.innerHTML = numval;
    user = this.previousSibling.innerHTML;
    for (i=0; i < data.length; ++i) {
      // find the data entry for this user to update their data value
      if (data[i][0] === user) {
        data[i][1] = ""+numval;
        data[i]["shares"] = ""+numval;
        break;
      }
    }
    drawCharts();
  });
  cells.on("keydown", function(d) {
    if (d3.event.which == 13) {
      d3.event.preventDefault();
      this.blur();
    }
  });
}

function fill_svg(svg_container) {
  var width = 400,
      height = 400,
      radius = Math.min(width, height) / 2;

  var color = d3.scale.category20();

  var pie = d3.layout.pie()
      .value(function(d) { return +d.shares; })
      .sort(null);

  var arc = d3.svg.arc()
      .innerRadius(radius - 120)
      .outerRadius(radius - 20);

  var svg = d3.select(svg_container).append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var tooltip = d3.select("body")
    .append("div")
    .attr("id", "piechart_hover")
    .text("");

  var path = svg.datum(data).selectAll("path")
      .data(pie)
    .enter().append("path")
      .attr("fill", function(d, i) { return color(i); })
      .attr("d", arc)
      .on("mouseover", function(d, i){
        var top  = window.pageYOffset || document.documentElement.scrollTop;
        box = this.getBoundingClientRect();
        tooltip.text("" + d.data[0] + " " + d.data[1]);
        tooltipbox = tooltip.node().getBoundingClientRect();
        tooltip.style("visibility", "visible")
          .style("top", (box.top + box.height / 3 + top) + "px")
          .style("left", box.left - tooltipbox.width + "px");
        })
      .on("mouseout", function(){tooltip.style("visibility", "hidden");});
}
