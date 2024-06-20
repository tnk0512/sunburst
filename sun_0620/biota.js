// Set up D3 layout and arc
var width = 900,
    height = 760,
    maxradius = Math.min(width, height) / 2;

var x = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var y = d3.scale.linear()
    .range([0, maxradius]);

var partition = d3.layout.partition()
    .value(function(d) { return d.n; })
    .sort(null);

var arc = d3.svg.arc()
    .startAngle(function(d) { return Math.PI/2 - Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
    .endAngle(function(d) { return Math.PI/2 - Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

// Load the external JSON file
d3.json("viruses.json", function(error, root) {
    if (error) throw error;

    var nodes = partition.nodes(root);
    // Calculate maxdepth from the dataset
    var maxdepth = d3.max(nodes, function(d) { return d.depth; });
    /*
    var totalDepth = d3.sum(nodes, function(d) { return d.depth; });
    var averageDepth = totalDepth / nodes.length;

    // Log maxdepth
    console.log("Max Depth:", maxdepth, "Average Depth:", averageDepth.toFixed(2));

    // Find the node at maxdepth
    var maxDepthNode = nodes.find(function(d) { return d.depth === maxdepth; });

    // Log the path from root to the node at maxdepth
    var pathToMaxDepthNode = [];
    var currentNode = maxDepthNode;
    while (currentNode) {
        pathToMaxDepthNode.unshift(currentNode.name); // Add to the beginning of the array
        currentNode = currentNode.parent;
    }

    console.log("Path to Max Depth Node:", pathToMaxDepthNode.join(" -> "));*/

    // Define the number of levels to display initially
    var levels = 5;

    // Adjust y-scale for initial nodes
    y.domain([0, levels / maxdepth]).range([0, maxradius]);

    // Filter initial nodes based on the specified number of levels
    var initialNodes = nodes.filter(function(d) { return d.depth < levels; });

    // Draw the overview on canvas
    var overviewWidth = 250,
        overviewHeight = 250,
        overviewRadius = Math.min(overviewWidth, overviewHeight) / 2;

    var overviewCanvas = d3.select("#overview").append("canvas")
        .attr("width", overviewWidth)
        .attr("height", overviewHeight)
        .node();

    var context = overviewCanvas.getContext("2d");
    context.translate(overviewWidth / 2, overviewHeight / 2);  // Translate to the center

    var overviewX = d3.scale.linear()
        .range([0, 2 * Math.PI]);

    var overviewY = d3.scale.linear()
        .range([0, overviewRadius]);

    var overviewPartition = d3.layout.partition()
        .value(function(d) { return d.value; })
        .sort(null);

    var overviewArc = d3.svg.arc()
        .startAngle(function(d) { return Math.PI/2 - Math.max(0, Math.min(2 * Math.PI, overviewX(d.x))); })
        .endAngle(function(d) { return Math.PI/2 - Math.max(0, Math.min(2 * Math.PI, overviewX(d.x + d.dx))); })
        .innerRadius(function(d) { return Math.max(0, overviewY(d.y)); })
        .outerRadius(function(d) { return Math.max(0, overviewY(d.y + d.dy)); });

    var overviewNodes = overviewPartition.nodes(root);

    overviewNodes.forEach(function(d) {
        context.beginPath();
        var path = new Path2D(overviewArc(d));
        context.fillStyle = "gray";
        context.fill(path);
        context.closePath();
    });

    // Create the SVG element on top of the canvas
    var overviewSvg = d3.select("#overview").append("svg")
        .attr("width", overviewWidth)
        .attr("height", overviewHeight)
        .style("position", "absolute")
        .style("top", "0px")
        .style("left", "0px")
        .append("g")
        .attr("transform", "translate(" + (overviewWidth / 2) + "," + (overviewHeight / 2) + ")");

    // Initialize overviewSvg with initialNodes
    overviewSvg.selectAll("path")
        .data(initialNodes)
        .enter().append("path")
        .attr("d", overviewArc)
        .style("fill", function(d) {
            d.overviewColor = fillColor(d); // Save the original color
            return d.overviewColor;
        })
        .on("click", click);

    var path = svg.selectAll("path")
        .data(initialNodes)
        .enter().append("path")
        .attr("d", arc)
        .style("fill", fillColor);
        /*
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);*/

    // 基準
    var sizeCriterion = 12; // クリック可能なノード
    var labelCriterion = 50; // ラベルを表示するノード

    // Non-clickable paths
var nonClickablePaths = path.filter(function(d) {
    var r = y(d.y + d.dy / 2); // Average radius of the arc
    var theta = x(d.x + d.dx) - x(d.x); // Angle in radians
    return r * theta < sizeCriterion;
});

// Clickable paths
var clickablePaths = path.filter(function(d) {
    return !nonClickablePaths.data().includes(d);
});

clickablePaths.on("click", click)
    .on("mouseover", mouseover)
    .on("mouseout", mouseout);


    // Initial label rendering
    var text = svg.selectAll("text")
    .data(initialNodes.filter(function(d) {
        var r = y(d.y + d.dy / 2); // Average radius of the arc
        var theta = x(d.x + d.dx) - x(d.x); // Angle in radians
        return r * theta >= labelCriterion;
    }))
    .enter().append("text")
    .attr("transform", function(d) {
        return "translate(" + arc.centroid(d) + ")";
    })
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text(function(d) {
        return d.name;
    });

    updateNodeCount(initialNodes);

    function fillColor(d) {
        let distance = y(d.y);
        let angle = x(d.x);
        let [L, a, b] = polarToCIELab(distance, angle, maxradius);
        return LabToHex(L, a, b);
    }

    function click(d) {
        // Hide the labels at the start of the transition
        svg.selectAll("text").style("visibility", "hidden");
    
        // Assign the parent node of the clicked node
        var clickedNodeParent = d.parent;
        var newNodes = partition.nodes(root).filter(function(n) {
            return n.depth < d.depth + levels;
        });
        svg.selectAll("path").remove();
        svg.selectAll("text").remove(); 
    
        path = svg.selectAll("path")
        .data(newNodes)
        .enter().append("path")
        .attr("d", arc)
        .style("fill", fillColor)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

        // Ensure the parent node is clickable
        var clickablePaths = path.filter(function(d) {
            var r = y(d.y + d.dy / 2); 
            var theta = x(d.x + d.dx) - x(d.x); 
            return r * theta >= sizeCriterion ||  d === clickedNodeParent; // クリックノードの親ノードはrが負の値のため
        });
    
        clickablePaths.on("click", click)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    
        svg.transition()
            .duration(5000)
            .tween("scale", function() {
                let targetDepth = Math.min(d.y + 5 * d.dy, 1);
                let xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                    yd = d3.interpolate(y.domain(), [d.y, targetDepth]),
                    yr = d3.interpolate(y.range(), [d.y ? 20 : 0, maxradius]);
                return function(t) {
                    let adjustedT = t < 0.4 ? 2.5 * t : 1;
                    x.domain(xd(adjustedT));
                    y.domain(yd(adjustedT)).range(yr(adjustedT));
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
                    updateNodeCount(newNodes);
    
                    // Show the new labels after the transition ends
                    svg.selectAll("text").remove(); // Clear any remaining labels
                    text = svg.selectAll("text")
                        .data(newNodes.filter(function(d) {
                            var r = y(d.y + d.dy / 2); // Average radius of the arc
                            var theta = x(d.x + d.dx) - x(d.x); // Angle in radians
                            return r * theta >= labelCriterion;
                        }))
                        .enter().append("text")
                        .attr("transform", function(d) {
                            return "translate(" + arc.centroid(d) + ")";
                        })
                        .attr("text-anchor", "middle")
                        .attr("font-size", "10px")
                        .text(function(d) {
                            return d.name;
                        })
                        .style("visibility", function(d) {
                            return isNodeVisible(d, x.domain(), y.domain()) ? "visible" : "hidden";
                        });
                }
            });
    
        // Update overview with newNodes, filtering by isDescendantOrSelf
        var filteredNodes = newNodes.filter(function(node) {
            return isDescendantOrSelf(node, d);
        });
    
        overviewSvg.selectAll("path").remove();
    
        overviewSvg.selectAll("path")
            .data(filteredNodes)
            .enter().append("path")
            .attr("d", overviewArc)
            .style("fill", function(d) {
                d.overviewColor = fillColor(d); // Save the original color
                return d.overviewColor;
            });
            /*
            .attr("d", overviewArc)
            .style("fill", function(d) {
                d.overviewColor = fillColor(d); // Save the original color
                return d.overviewColor;
            });*/
    }     

    function updateNodeCount(nodes) {
        var visibleNodes = nodes.filter(function(d) {
            return isNodeVisible(d, x.domain(), y.domain());
        });
        d3.select("#nodeCount").text("Number of visible nodes: " + visibleNodes.length);
    }

    function isDescendantOrSelf(node, ancestor) {
        if (node === ancestor) return true;
        while (node.parent) {
            node = node.parent;
            if (node === ancestor) return true;
        }
        return false;
    }

    function mouseover(d) {
        let nodeColor = d3.select(this).style("fill");
        let labColor = d3.lab(nodeColor);

        // Calculate r and theta
    var r = y(d.y + d.dy / 2); // Average radius of the arc
    var theta = x(d.x + d.dx) - x(d.x); // Angle in radians
    var rTheta = r * theta;

    tooltip.style("visibility", "visible")
        .html(`Node: ${d.name}<br>r: ${r.toFixed(2)}, θ: ${theta.toFixed(2)}<br>r * θ: ${rTheta.toFixed(2)}<br>Color (CIELab): ${labColor.toString()}`);

        // Highlight the corresponding node on the overview if it satisfies the size criterion
    var r = y(d.y + d.dy / 2); // Average radius of the arc
    var theta = x(d.x + d.dx) - x(d.x); // Angle in radians
    if (r * theta >= sizeCriterion) {
        overviewSvg.selectAll("path")
            .filter(function(node) { return node === d; })
            .style("fill", "white");
        }
    }

    function mouseout(d) {
        tooltip.style("visibility", "hidden");

        // Restore the color of the corresponding node on the overview
    var r = y(d.y + d.dy / 2); // Average radius of the arc
    var theta = x(d.x + d.dx) - x(d.x); // Angle in radians
    if (r * theta >= sizeCriterion) {
        overviewSvg.selectAll("path")
            .filter(function(od) { return od === d; })
            .style("fill", function(d) { return d.overviewColor; });
        }
    }

    svg.on("mousemove", function() {
        tooltip.style("top", (d3.event.pageY + 10) + "px")
               .style("left", (d3.event.pageX + 10) + "px");
    });
});

function polarToCIELab(distance, angle, maxDistance) {
    let L = 100 * (1 - 3 * distance / (4 * maxDistance));
    let a = 160 * distance / maxDistance * Math.cos(angle);
    let b = 160 * distance / maxDistance * Math.sin(angle);
    return [L, a, b];
}

function LabToHex(L, a, b) {
    let labColor = d3.lab(L, a, b);
    let rgbColor = labColor.rgb();
    return rgbColor.toString();
}

function isNodeVisible(d, xDomain, yDomain) {
    return d.x >= xDomain[0] && (d.x + d.dx) <= xDomain[1] && d.y >= yDomain[0] && (d.y + d.dy) <= yDomain[1];
}
