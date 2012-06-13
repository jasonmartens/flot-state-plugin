/*
flot plugin for displaying bars along the x-axis indicating a particular
state for that section of the graph.

This plugin takes several options. The state option is required, and must be
true or the plugin will ignore the series. It also takes a stateLabel option
for the series, which should be short since it must fit in the left y-axis
label area. For colors, it takes a states object with a map of values to RGB
colors. A typical options example with two states, Yes and No would look like
this:
series: {
    title:"StateExample", state:true, stateLabel:"Y/N",
    states:{
        "Yes":"rgba(125,185,71,0.8)", "No":"rgba(255,255,255,0)"
    }
}

The plugin takes a dataseries of different states, and will remove adjacent
entries with the same state, since it is only concerned with the transition
from one state to another.

NOTE: You should assign an unusued x-axis to this series, since it will hide
that x-axis from the graph and re-use the area the x-axis occupied.

*/

(function ($) {
    var options = {
        series: { state: { show: false } // true or false
        }
    }

    function init(plot) {
        plot.hooks.processDatapoints.push(
            function(plot, series, datapoints) {
                if (series.state != true)
                    return;

                // Eliminate redundant entries
                datapoints.points = [];
                if (series.data.length > 0) {
                    // The state plugin relies on the data being sorted in ascending order
                    var data = series.data.sort(function(a,b){return a[0]-b[0]});
                    for (i = 0; i < data.length; i++) {
                        if (i == 0)
                            datapoints.points.push(data[i]);
                        else if (data[i-1][1] != data[i][1])
                            datapoints.points.push(data[i]);
                    }
                }
                datapoints.pointsize = datapoints.points.length;
                series.data = datapoints.points;

                datapoints.format = [ {x:false, number:false, required:true},
                                      {y:false, number:false, required:true} ];

                // Just using the axis to reserve space for the bars
                series.xaxis.options.ticks = [];
            });
        plot.hooks.drawSeries.push(
            function(plot, ctx, series) {
                if (series.state != true)
                    return;

                var xaxis = plot.getAxes().xaxis;
                var box = series.xaxis.box;
                var i, x, width, state;
                var xmin = xaxis.min;
                var xmax = xaxis.max;
                var textMargin = 2;
                ctx.save();
                ctx.fillStyle = "rgba(0,0,0,1)";
                ctx.textAlign = "right";
                ctx.fillText(series.stateLabel, box.left - 5, box.top + box.height - textMargin);
                ctx.textAlign = "left";
                for (i = 0; i < series.data.length; i++) {
                    x = series.data[i][0];
                    // If the last entry, draw to the edge of the graph
                    if (i == series.data.length - 1)
                        width = xmax - x;
                    // Otherwise, draw up to the next entry in the array
                    else
                        width = series.data[i+1][0] - x;

                    // only plot ranges that have at least one point on the graph
                    if (!((x > xmax) || ((x + width) < xmin))) {
                        // If X is off the plot, but stretches into the left edge
                        if ((x < xmin) && ((x + width) > xmin)) {
                            //console.log(x, xmin, x + width);
                            var xright = x + width;
                            x = xmin;
                            width = xright - xmin;
                        }
                        // if x is in the plot, but stretches off the right edge
                        if ((x < xmax) && ((x + width) > xmax)) {
                            width = xmax - x;
                        }
                        // only graph points in the range
                        if (width > 0) {
                            var offset = plot.getPlotOffset();
                            var xleft = xaxis.p2c(x);
                            var boxWidth = xaxis.p2c(x + width) - xleft;
                            // Assign a color from states, or use the default
                            state = series.data[i][1];
                            if (state in series.states)
                                ctx.fillStyle = series.states[state];
                            else
                                ctx.fillStyle = "rgba(255,255,255,0)";
                            ctx.fillRect(xleft + offset.left,
                                         box.top - textMargin,
                                         boxWidth,
                                         box.height + textMargin);
                            if (ctx.measureText(series.data[i][1]).width < boxWidth) {
                                ctx.fillStyle = "rgba(0,0,0,1)";
                                ctx.fillText(series.data[i][1],
                                             xleft + offset.left + textMargin,
                                             box.top + box.height - textMargin);
                            }
                        }
                    }
                }
                ctx.restore();
            }
        );
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'state',
        version: '0.2'
    });
})(jQuery);
