
/*
// ここからOverview
var overviewWidth = 150,
overviewHeight = 150,
overviewRadius = Math.min(overviewWidth, overviewHeight) / 2;

var overviewX = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var overviewY = d3.scale.linear()
    .range([0, overviewRadius]);

var overviewPartition = d3.layout.partition()
    .value(function(d) { return d.value; })
    .sort(null);

var overviewArc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, overviewX(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, overviewX(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, overviewY(d.y)); })
    .outerRadius(function(d) { return Math.max(0, overviewY(d.y + d.dy)); });

var overviewSvg = d3.select("#overview").append("svg")
    .attr("width", overviewWidth)
    .attr("height", overviewHeight)
    .append("g")
    .attr("transform", "translate(" + (overviewWidth / 2) + "," + (overviewHeight / 2) + ")");

var overviewNodes = overviewPartition.nodes(d3Data1);

overviewSvg.selectAll("path")
    .data(overviewNodes)
    .enter().append("path")
    .attr("d", overviewArc)
    .style("fill", fillColor)
    .on("click", click);
    */
function leaf() {
    return { name: "leaf", value: 1 };
}

function tree(...subtrees) {
    return { children: subtrees };
}

function binaryTree(level) {
    if (level === 0) return leaf();
    let t1 = binaryTree(level - 1);
    let t2 = binaryTree(level - 1); 
    return tree(t1, t2);
}

function randomBiTree(level) {
    let num = level / 2;
    let t1 = (Math.random() * level < num) ? randomBiTree(level + 1) : leaf();
    let t2 = (Math.random() * level < num) ? randomBiTree(level + 1) : leaf();
    return tree(t1, t2);
}

function gtree(level) {
    let ntree = Math.floor(Math.random() * 4);
    let num = level / 2;
    let subtrees = [];
    for (let i = 0; i < ntree; i++) {
        if (Math.random() * level < num) {
            subtrees.push(gtree(level + 1));
        } else {
            subtrees.push(leaf());
        }
    }
    return tree(...subtrees);
}
// Function to convert tree to D3 format
function convertToD3Format(node, depth = 0, counter = { count: 0 }) {
    let name = counter.count++;
    if (!node.children || node.children.length === 0) {
        return {
            name: name,
            value: 1
        };
    }

    return {
        name: name,// `node${name}`,
        children: node.children.map((child, index) => convertToD3Format(child, depth + 1, counter))
    };
}
    
let bi_level = 6;
let level = 6;
let t1 = binaryTree(bi_level);
let t2 = randomBiTree(level);
let t3 = gtree(level);
let d3Data1 = convertToD3Format(t2);
console.log(t2);

// Set up D3 layout and arc
var width = 900,
    height = 700,
    maxradius = Math.min(width, height) / 2;

var x = d3.scale.linear()
.range([0, 2 * Math.PI]);

var y = d3.scale.linear()
.range([0, maxradius]);

var partition = d3.layout.partition()
.value(function(d) { return d.value; })
.sort(null);

var arc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

var nodes = partition.nodes(d3Data1);

// Overview概観
var overviewWidth = 150,
overviewHeight = 150,
overviewRadius = Math.min(overviewWidth, overviewHeight) / 2;

var overviewX = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var overviewY = d3.scale.linear()
    .range([0, overviewRadius]);

var overviewPartition = d3.layout.partition()
    .value(function(d) { return d.value; })
    .sort(null);

var overviewArc = d3.svg.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, overviewX(d.x))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, overviewX(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, overviewY(d.y)); })
    .outerRadius(function(d) { return Math.max(0, overviewY(d.y + d.dy)); });

var overviewSvg = d3.select("#overview").append("svg")
    .attr("width", overviewWidth)
    .attr("height", overviewHeight)
    .append("g")
    .attr("transform", "translate(" + (overviewWidth / 2) + "," + (overviewHeight / 2) + ")");

var overviewNodes = overviewPartition.nodes(d3Data1);

overviewSvg.selectAll("path")
    .data(overviewNodes)
    .enter().append("path")
    .attr("d", overviewArc)
    .style("fill", fillColor)
    .on("click", click);

function polarToCIELab(distance, angle, maxDistance) {
    let L = 100 * (1 - 3 * distance / (4 * maxDistance));
    let a = 160 * distance / maxDistance * Math.cos(angle);
    let b = 160 * distance / maxDistance * Math.sin(angle);
    return [L, a, b];
}

function LabToHex(L, a, b) {
    let labColor = d3.lab(L, a, b);
    let rgbColor = labColor.rgb();
    return rgbColor.formatHex();
}
function adjustBrightness(color, factor) {
    let labColor = d3.lab(color);
    let L = Math.min(100, labColor.l * factor)
    labColor.l = Math.max(L, 25);
    return labColor.toString();
}

var path = svg.selectAll("path")
            .data(nodes)
            .enter().append("path")
            .attr("d", arc)
            .style("fill", fillColor)
            .on("click", click)
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);


// Add a container for the tooltip.
var tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("font-size", "12px");


    // Add labels
var text = svg.selectAll("text")
    .data(nodes)
    .enter().append("text")
    .attr("transform", function(d) {
        return "translate(" + arc.centroid(d) + ")";
    })
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text(function(d) {
        return d.name;
});

function fillColor(d) {
    let distance = y(d.y); // R_dict[n]
    let angle = Math.PI / 2 - x(d.x); // Theta_dict2[n]
    let [L, a, b] = polarToCIELab(distance, angle, maxradius);
    return LabToHex(L, a, b);
}

function click(d) {

    text.style("visibility", "hidden"); // Hide labels during transition

    svg.transition()
        .duration(5000)
        .tween("scale", function() {
            let xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                yd = d3.interpolate(y.domain(), [d.y, 1]),
                yr = d3.interpolate(y.range(), [d.y ? 20 : 0, maxradius]);
            return function(t) {
                if (t < 0.4) { // 0.4* 5000 ms = 2000 ms
                    x.domain(xd(2.5 * t));
                    y.domain(yd(2.5 * t)).range(yr(2.5 * t));
                } else {
                    x.domain(xd(1));
                    y.domain(yd(1)).range(yr(1));
                }
            };
        })
        .selectAll("path")
        .attrTween("d", function(d) { return function() { return arc(d); }; })
        .styleTween("fill", function(d) {
            let initialColor = d3.select(this).style("fill");
            return function(t) {
                return d3.interpolateLab(initialColor, fillColor(d))(t);
            };
        })
        .each("end", function(e, i) {
            if (i === 0) {
                // Update labels after the layout transition
                svg.selectAll("text")
                    .attr("transform", function(d) {
                        return "translate(" + arc.centroid(d) + ")";
                    })
                    .style("visibility", function(d) {
                        return isNodeVisible(d, x.domain(), y.domain()) ? "visible" : "hidden";
                    });
            }
        });
    // Update overview
    overviewSvg.selectAll("path")
    .classed("dimmed", true)
    .filter(function(node) {
        return isDescendantOrSelf(node, d);
    })
    .classed("dimmed", false)
    .attrTween("d", function(d) { return function() { return overviewArc(d); }; })
    .styleTween("fill", function(d) {
        let initialColor = d3.select(this).style("fill");
        return function(t) {
            return d3.interpolateLab(initialColor, fillColor(d))(t);
        };
    });
}
function isDescendantOrSelf(node, ancestor) {
    if (node === ancestor) return true;
    while (node.parent) {
        node = node.parent;
        if (node === ancestor) return true;
    }
    return false;
}

function isNodeVisible(d, xDomain, yDomain) {
    return d.x >= xDomain[0] && (d.x + d.dx) <= xDomain[1] && d.y >= yDomain[0] && (d.y + d.dy) <= yDomain[1];
}

// Add mouseover and mouseout events
function mouseover(d) {
    let nodeColor = d3.select(this).style("fill");
    let parentInfo = d.parent ? `Parent: ${d.parent.name}` : "Root";
    let labColor = d3.lab(nodeColor);

    tooltip.style("visibility", "visible")
        //.html(`Node: ${d.name}<br>Color (CIELab): L=${labColor.l.toFixed(2)}, a=${labColor.a.toFixed(2)}, b=${labColor.b.toFixed(2)}<br>${parentInfo}`);
        .html(`Node: ${d.name}<br>Color (CIELab):${labColor.formatHex()}`);
    }

function mouseout() {
    tooltip.style("visibility", "hidden");
}

// Update tooltip position
svg.on("mousemove", function() {
    tooltip.style("top", (d3.event.pageY + 10) + "px")
           .style("left", (d3.event.pageX + 10) + "px");
});