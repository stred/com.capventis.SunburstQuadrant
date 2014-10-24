
define( ["jquery", "qlik", "./raphael-min"], function ( $, qlik, Raphael ) {
	

	return {
		initialProperties: {
			version: 1.0,
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 6,
					qHeight: 1000
				}]
			}
		},
		//property panel 
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimensions: {
					uses: "dimensions",
					min: 1,
					max: 4
				},
				measures: {
					uses: "measures",
					min: 1,
					max: 1
				},
				sorting: {
					uses: "sorting"
				},
				settings: {
					uses: "settings",
					items: {
						customStringProp : {
							ref : "myproperties.colorlist",
							label : "Color List",
							type : "string",
							defaultValue : ""
						},
						customSliderProp: {
							type: "integer",
							label: "Opacity Percentage",
							ref: "myproperties.opacitypercentage",
							defaultValue: 80,
							component: "slider",
							min: 20,
							max: 100,
							step: 1
						}
					}
				}
			}
		},
		snapshot: {
			canTakeSnapshot: true
		},

		paint: function ( $element, layout ) {
			var app = qlik.currApp();
			
			// Assign the extension object to a local variable
			var _this = this;

			// Get the chart ID from the QlikView document for this control - will be something like "CH2340091" or "CH01"
			var divName = layout.qInfo.qId;

			// Calculate the height and width that user has drawn the extension object
            var vw = $element.width();
            var vh = $element.height();
			
			var html = '<div id="canvas'
				  + divName
				  + '" style="width:' + vw + 'px;'
				  + 'height:' + vh + 'px;'
				  + 'left: 0; position: absolute;'
				  + 'top: 0;z-index:999;"></div>';
			
			$element.html( html );
			
			var paper = Raphael("canvas" + divName, vw, vh);
			
            // Generate the hoverBox if it doesn't exist already
            // This will hold the popup text
            if ($('#hoverBox').length == 0)
                $("body").append('<div id="hoverBox" style="z-index:99; display:none;font-size:12px;background-color: #fff;color:#333;font-family:Arial, Helvetica, sans-serif;position:absolute;top:0px;left:0px;background-repeat:no-repeat;overflow:hidden;z-index:999999999 !important;padding:0px 10px;border:1px solid #439400;line-height:14px;"><p></p></div>');
             
			sbq_drawChart(app, _this, layout, divName, vw, vh);
						
			if ( this.selectionsEnabled ) {
				$element.find( '.selectable' ).on( 'qv-activate', function () {
					if ( this.hasAttribute( "data-value" ) ) {
						var value = parseInt( this.getAttribute( "data-value" ), 10 ), dim = parseInt( this.getAttribute( "column-number" ), 10 );
						//var value = this.getAttribute( "data-value" ), dim = 0;
						_this.selectValues( dim, [value], true );
						$( this ).toggleClass( "selected" );
					}
				} );
			}

		}
	};

} );

/// function arrSort
/// 2014-05-28 SR
/// Takes an array of key, value pairs (as opposed to an index based array) and sorts by dictionary value on the key
///
function sbq_arrSort(arr) {

    // temp array to store values
    var temp = new Array();

    // array to return
    var rVal = new Array();

    // Grab all the key values from the passed array into the temp array
    for (var o in arr) {
        temp.push(o);
    }
    // sort the temp array by text
    temp.sort();

    // cycle through the sorted array and push the values from the input array into the return array
    for (var i = 0; i < temp.length; i++) {
        rVal[temp[i]] = arr[temp[i]];
    }

    return rVal;
}


/// function sector
/// 2014-05-27 SR
/// This function takes several parameters and actually draws the segments
/// Parameters:
///     _this       -   the QlikView extension object
///     paper       -   the Raphael canvas object
///     cx          -   the x coordinate of the centre of the circle for which the sector will be drawn
///     cy          -   the y coordinate of the centre
///     r           -   the inside radius of the sector
///     rin         -   the outside radius of the sector
///     startAngle  -   the initial angle for the sector
///     endAngle    -   the end angle for the sector
///     popupText   -   the text to be displayed in a popup. Can be html markup. If blank, no popup will be rendered
///     searchText  -   the text to be displayed in the sector as well as that passed to the QlikView search function
///     columnNumber-   the column number is used to specify which column in the _this results to search on. 
///                     If the columnNumber == -1, then the click will perform a clear instead of select
///     params      -   drawing parameters for the sector. E.g. { fill: vColor, stroke: linecolor, "stroke-width": "1px" }
///
/// Note that the hoverbox object must have been already generated in script.js - for example:
///             $("body").append('<div class="arrowDown" id="hoverBox"><p></p></div>');
///
function sbq_sector(app, qElemNumber, _this, paper, cx, cy, r, rin, startAngle, endAngle, popupText, searchText, columnNumber, params) {
    // Used to caculate radians (used by angle functions) from degrees.  Rad=Deg*pi/180.
    var rad = Math.PI / 180;

    // calculate the start and end positions.  
    // In right angle triangle, (r=hypotenuse) r*cos(angle) = connected side, r*sin(angle) = opposite side
    var x1 = cx + r * Math.cos(-startAngle * rad),
        x2 = cx + r * Math.cos(-endAngle * rad),
        y1 = cy + r * Math.sin(-startAngle * rad),
        y2 = cy + r * Math.sin(-endAngle * rad),
        xx1 = cx + rin * Math.cos(-startAngle * rad),
        xx2 = cx + rin * Math.cos(-endAngle * rad),
        yy1 = cy + rin * Math.sin(-startAngle * rad),
        yy2 = cy + rin * Math.sin(-endAngle * rad);

    // using Raphael, we create a SVG path object that describes the sector we want
    // M = start position, L = line to, A = arc.
    var arc =
     paper.path(["M", xx1, yy1,
                       "L", x1, y1,
                       "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2,
                       "L", xx2, yy2,
                       "A", rin, rin, 0, +(endAngle - startAngle > 180), 1, xx1, yy1, "z"]
                     ).attr(params);

    // If the popupText contains anything, generate a hoverbox that contains the text on mouseover/move
    // popS is a helper function defined below.
    if (popupText.length != 0) {
        arc.mousemove(sbq_popS).hover(function () {
            $("#hoverBox p").html(popupText)
        }, function () {
            $("#hoverBox").hide()
        })
    }
    // if the columnNumber is greater than -1 (the normal column starts at 0), create a click select event
    if (columnNumber > -1) {
		// Make it selectable
		(arc.node.className ? arc.node.className.baseVal = 'selectable' : arc.node.setAttribute('class',  'selectable'));
		arc.node.setAttribute("data-value", qElemNumber);
		arc.node.setAttribute("column-number", columnNumber);
    }
    // if it is -1, create a clear event
    else if (columnNumber = -1) {
        arc.click(function () {
            app.clearAll(); 
        });
    }

    // Create the text object to display the text name in the sector.
    // Only generate if the angle of the sector is > 2.5 - otherwise text is bigger than sector
    if (((endAngle - startAngle) > 2.5) && searchText.length > 0) 
    {
        // The angle that the text should be tilted at is half way between the start and end angles
        var textAngle = startAngle + ((endAngle - startAngle) / 2);
        // The centre position for the text is half way betweent the two radii
        var textRadius = r + ((rin - r) / 2);
        // Now we know the radius and angle, we can use Trig to calculate the x, y centre for the text object
        var textX = Math.round(Math.cos(textAngle * rad) * textRadius);
        var textY = paper.canvas.height.baseVal.value - Math.round(Math.sin(textAngle * rad) * textRadius);

        // Use Raphael to generate the SVG text object
        var txt = paper.text(textX, textY, searchText);
        // set the font size relative to the size of the sector
        txt.attr({ "font-size": (Math.round((rin - r) / 10)), "font-family": "Arial, sans-serif", "-webkit-font-smoothing": "antialiased" });  //, Helvetica, sans-serif" });
        // rotate the text to the correct angle
        txt.transform("r-" + textAngle);

        // Calculate what % of the sector is occupied by the text
        var percOfBox = Math.sqrt(Math.pow(txt.getBBox().width, 2) + Math.pow(txt.getBBox().height, 2)) / (rin - r);

        // If the text is bigger than the sector, reduce the size and add "..." until it is within bounds
        var iW = 4;
        while (percOfBox > 0.95) {
            iW++;
            var newText = searchText.substring(0, searchText.length - iW) + '...';
            txt.attr({ "text": newText })
            percOfBox = Math.sqrt(Math.pow(txt.getBBox().width, 2) + Math.pow(txt.getBBox().height, 2)) / (rin - r);
        }

        // The text object also needs the hoverover function - same as above
        if (popupText.length != 0) {
            txt.mousemove(sbq_popS).hover(function () {
                $("#hoverBox p").html(popupText)
            }, function () {
                $("#hoverBox").hide()
            })
        }

		// Make it selectable
		if(columnNumber!=-1)
		{
			(txt.node.className ? txt.node.className.baseVal = 'selectable' : txt.node.setAttribute('class',  'selectable'));
			txt.node.setAttribute("data-value", qElemNumber);
			txt.node.setAttribute("column-number", columnNumber);
		}
		else
		{
			txt.click(function() { app.clearAll(); });
		}
		

    }

    // That't it, the sector is now created
    return arc;

}

/// function drawChart
/// 2014-05-27 SR
/// This function takes the extension object as a parameter, calculates all the segments and calls the sector function to draw them
/// Parameters:
///     divName        -    the name of the DIV containing the QlikView extension object - should have been created in the script.js
///                         as:
///                                _this.Element.innerHTML = '<div id="canvas'
///                                                 + divName
///                                                 + '" style="width:' + vw + 'px;'
///                                                 + 'height:' + vh + 'px;'
///                                                 + 'left: 0; position: absolute;'
///                                                 + 'top: 0;z-index:999;"></div>'; 
function sbq_drawChart(app, _this, layout, divName, frameX, frameY) {

	var dimensions = layout.qHyperCube.qDimensionInfo,
		qData = layout.qHyperCube.qDataPages[0].qMatrix;

	var vColumnCount=layout.qHyperCube.qSize.qcx;
	
    // Assuming up to 4 levels of hierarchy
    // Each segment will have a start and end radius - the width of the segment
    var level0 = { start: 0, end: 0 };
    var level1 = { start: 0, end: 0 };
    var level2 = { start: 0, end: 0 };
    var level3 = { start: 0, end: 0 };
    var level4 = { start: 0, end: 0 };

    // What is the max radius - the lower of the width or height of the frame
    var maxRad = Math.min.apply(Math, [frameX, frameY]);

    // Calculate the size for each segment, the 2.5 is a factor to allow for lines in between each segment
    var segSize = Math.round((maxRad - (vColumnCount * 2.5)) / vColumnCount / 1.618);
	var sizeForData=Math.round(maxRad-segSize);
	
	var proRata=[
		1,
		vColumnCount > 2 ? 1/1.618 : 0,
		vColumnCount > 3 ? (1/1.618)/1.618 : 0,
		vColumnCount > 4 ? ((1/1.618)/1.618)/1.618 : 0 
		];
	
	proRataTotal=proRata[0]+proRata[1]+proRata[2]+proRata[3];
	
	proRata[0]=Math.round(sizeForData*proRata[0]/proRataTotal);
	proRata[1]=Math.round(sizeForData*proRata[1]/proRataTotal);
	proRata[2]=Math.round(sizeForData*proRata[2]/proRataTotal);
	proRata[3]=Math.round(sizeForData*proRata[3]/proRataTotal);
	
	
    // Use the segSize calculated above to calculate the start and end position for each segment
    // Note that it doesn't matter if we have less than 4 levels, as they won't be used later
    level0.end = segSize;
    level1.start = segSize + 1;
    level1.end = (segSize + proRata[0]) + 1;
    level2.start = (segSize + proRata[0]) + 2;
    level2.end = (segSize + proRata[0] + proRata[1]) + 1;
    level3.start = (segSize + proRata[0] + proRata[1]) + 2;
    level3.end = (segSize + proRata[0] + proRata[1] + proRata[2]) + 1;
    level4.start = (segSize + proRata[0] + proRata[1] + proRata[2]) + 2;
    level4.end = (segSize + proRata[0] + proRata[1] + proRata[2] + proRata[3]) + 1

	
    // Each level will have one or more dimension values.
    // Because dimension values will probably be duplicated in lower levels (think Country-City, Country will be duped for each City),
    // we need to aggregate all the values here.
    // We need an Array to hold the dimension values for each level in the chart
    // We will also need an Array to hold the colour for each dimension
    var level1arr = new Array();
    var level2arr = new Array();
    var level3arr = new Array();
    var level4arr = new Array();
    var level1qElemNumber = new Array();
    var level2qElemNumber = new Array();
    var level3qElemNumber = new Array();
    var level4qElemNumber = new Array();

    // Variable to hold the overall Total
    // Note that we only need to calculate this on one level (in this case, Level 1)
    // because it will be the same on all levels - we are just summing the same value repeatedly
    var overallTotal = 0;

    // Variables to hold the min and max in each dimension
    var level1max = 1;
    var level1min = 999999;
    var level2max = 1;
    var level2min = 999999;
    var level3max = 1;
    var level3min = 999999;
    var level4max = 1;
    var level4min = 999999;


    // We are going to store the level arrays by name rather than index (so Level1arr['Germany'] rather than Level1arr[0])
    // because that makes it easier to add up all the values.
    // Cycle Through the data from the extension - _this.Data.Rows
	$.each( qData, function ( key, value ) 
	{
		// get the row
        var rowvalue = 0;
		
		if(value[vColumnCount - 1].qNum === undefined)
			rowvalue = parseFloat(value[vColumnCount - 1].qText.split(',').join(''));
		else
			rowvalue = value[vColumnCount - 1].qNum;
		
        if (rowvalue === null) rowvalue = 0;

        // Level 1
        // These are stored in row[0]
        if (level1arr[value[0].qText] == null)
        {
            level1arr[value[0].qText] = rowvalue;
        }
        else
            level1arr[value[0].qText] += rowvalue;
        
		level1qElemNumber[value[0].qText] = value[0].qElemNumber;

		// Add rowValue to overall total	
		overallTotal += rowvalue;
		
        // Level 2
        // Only if the column count is > 2
        // These are stored in row[1]
        if (vColumnCount > 2) {
            if (level2arr[value[0].qText + '~~' + value[1].qText] == null)
            {
                level2arr[value[0].qText + '~~' + value[1].qText] = rowvalue;
            }
            else
                level2arr[value[0].qText + '~~' + value[1].qText] += rowvalue;
			
			level2qElemNumber[value[0].qText + '~~' + value[1].qText] = value[1].qElemNumber;

		}

        // Level 3
        // Only if the column count is > 3
        // These are stored in row[2]
        if (vColumnCount > 3) {
            if (level3arr[value[0].qText + '~~' + value[1].qText + '~~' + value[2].qText] == null)
            {
                level3arr[value[0].qText + '~~' + value[1].qText + '~~' + value[2].qText] = rowvalue;
            }
            else
                level3arr[value[0].qText + '~~' + value[1].qText + '~~' + value[2].qText] += rowvalue;

			level3qElemNumber[value[0].qText + '~~' + value[1].qText + '~~' + value[2].qText] = value[2].qElemNumber;
        }

        // Level 4
        // Only if the column count is > 4
        // These are stored in row[3]
        if (vColumnCount > 4) {
            if (level4arr[value[0].qText + '~~' + value[1].qText + '~~' + value[2].qText + '~~' + value[3].qText] == null)
            {
                level4arr[value[0].qText + '~~' + value[1].qText + '~~' + value[2].qText + '~~' + value[3].qText] = rowvalue;
            }
            else
                level4arr[value[0].qText + '~~' + value[1].qText + '~~' + value[2].qText + '~~' + value[3].qText] += rowvalue;

			level4qElemNumber[value[0].qText + '~~' + value[1].qText + '~~' + value[2].qText + '~~' + value[3].qText] = value[3].qElemNumber;
		}
		
    } );

    // Sort the arrays.
    // We need our own sort function for this as they are not simple value arrays
    // and we want to sort by the index name (e.g. Germany, UK, etc.) rather than the value
    
	level1arr = sbq_arrSort(level1arr);
	level2arr = sbq_arrSort(level2arr);
    level3arr = sbq_arrSort(level3arr);
    level4arr = sbq_arrSort(level4arr);

    // Create the arcs - we use the divName here because we may have several in the same window
    // Each canvas object should have been generated in the script.js
    var paper = Raphael("canvas" + divName, frameX, frameY);

    // Variable to define the default line colour.
    var linecolor = "#F0F0FA";  // default to light grey for now

    // establish min/max values by looping through the arrays and compare
    for (var o in level1arr) {
        if (level1arr[o] < level1min) level1min = level1arr[o];
        if (level1arr[o] > level1max) level1max = level1arr[o];
    }
    for (var o in level2arr) {
        if (level2arr[o] < level2min) level2min = level2arr[o];
        if (level2arr[o] > level2max) level2max = level2arr[o];
    }
    for (var o in level3arr) {
        if (level3arr[o] < level3min) level3min = level3arr[o];
        if (level3arr[o] > level3max) level3max = level3arr[o];
    }
    for (var o in level4arr) {
        if (level4arr[o] < level4min) level4min = level4arr[o];
        if (level4arr[o] > level4max) level4max = level4arr[o];
    }

    // just reduce the min by a small amount so no value will hit it (and get white color)
    level1min = level1min * 0.95;
    level2min = level2min * 0.95;
    level3min = level3min * 0.95;
    level4min = level4min * 0.95;

    // Draw level 0 - this is the "sun"
    sbq_sector(app, null, _this, paper, 0, frameY, level0.start, level0.end, 0, 90, "", "", -1, { fill: "#b0afae", stroke: linecolor, "stroke-width": "1px" });

    // central text for level 0
    var txt = paper.text(segSize / 2, frameY - (segSize / 3), 'Total :\n' + sbq_addCommas(overallTotal.toFixed(2)));
    txt.attr({ "font-size": (Math.round(segSize / 10)), "font-family": "Arial, sans-serif" });
    txt.click(function () {
        //_this.backendApi.clearSelections();
		app.clearAll();
    });

	var popupText = '<table><tr><th>Overall Total</th></tr><tr><td align="center">' + sbq_addCommas(overallTotal.toFixed(2)) + '</td></tr><tr><td>&nbsp;</td></tr><tr><th>Click to clear selections.</th></tr></table>';
	// The text object needs a hoverover function
	txt.mousemove(sbq_popS).hover(function () {
		$("#hoverBox p").html(popupText)
	}, function () {
		$("#hoverBox").hide()
	})
	
    // call the drawLevel function to draw each level that we require
 
    // Draw level 1
    sbq_drawLevel(app, layout, 0, level1arr, level1qElemNumber, divName, paper, frameY, level1.start, level1.end, level1min, level1max, overallTotal, linecolor);

    // Draw level 2
    if (vColumnCount > 2)
        sbq_drawLevel(app, layout, 1, level2arr, level2qElemNumber, divName, paper, frameY, level2.start, level2.end, level2min, level2max, overallTotal, linecolor);

    // Draw level 3
    if (vColumnCount > 3)
        sbq_drawLevel(app, layout, 2, level3arr, level3qElemNumber, divName, paper, frameY, level3.start, level3.end, level3min, level3max, overallTotal, linecolor);

    // Draw level 4
    if (vColumnCount > 4)
        sbq_drawLevel(app, layout, 3, level4arr, level4qElemNumber, divName, paper, frameY, level4.start, level4.end, level4min, level4max, overallTotal, linecolor);

}

/// function drawLevel
/// 2014-05-29 SR
/// To draw the segments, we run through the arrays and calculate the value for each dimension.
/// The size of the segment is 90 (degrees in a quadrant) * the value for that dimension / the overall value.
/// The colour is calculated based on the value as a % of the max value.
/// Parameters:
///     columnNumber    -    matches the underlying straight table column number - 0 based index
///     level_arr       -    the array of dimensions and values
///     divName         -    the name of the DIV containing the QlikView extension object - should have been created in the script.js
///     paper           -    the Raphael paper canvas
///     frameY          -    the height of the frame - needed to calculate the x/y of the circle
///     start_radius    -    inner radius of the segment
///     end_radius      -    outer radius of the segment
///     level_min       -    the minimum value in the range of dimension values - used to calculate the colour
///     level_max       -    the maximum value in the range of dimension values - used to calculate the colour
///     overallTotal    -    the grand total of all values - used to calculate the colour
///     linecolor       -    the colour of the line between segments
///
function sbq_drawLevel(app, layout, columnNumber, level_arr, level_qElemNumber, divName, paper, frameY, start_radius, end_radius, level_min, level_max, overallTotal, linecolor) {

    var _this = window[divName];
    var startAngle = 0;

    for (var o in level_arr) {

        // We have stored the names earlier in a hierarchical manner to facilitate sorting.
        // Now, we parse out the last element of the array which is the dimension value
        var arr = o.split("~~");
        var vName = arr[arr.length - 1];

        // get the value and format it with commas for thousands
        var vValue = sbq_addCommas(level_arr[o].toFixed(2));

        // create a html table to appear in the popup
        var vTable = '<table><tr><th>' + vName + '</th></tr><tr><td>' + vValue + '</td></tr></table>';

        // calculate the angle that this segment will span
        var angle = 90 * level_arr[o] / overallTotal;

		var palette = [
			 '#4477aa',
			 '#117733',
			 '#ddcc77',
			 '#cc6677',
			 '#7db8da',
			 '#b6d7ea',
			 '#b0afae',
			 '#7b7a78',
			 '#545352',
			 '#46c646',
			 '#f93f17',
			 '#ffcf02',
			 '#276e27'
			];						
		
        // calculate the colour for this segment
        var vColor = sbq_colormix(((level_arr[o] - level_min) / (level_max - level_min)), '#ffffff', palette[columnNumber]); //'#4477aa');

        var vOpacity=layout.myproperties.opacitypercentage/100;
		
        // call the sector function to draw the segment
        sbq_sector(app, level_qElemNumber[o], _this, paper, 0, frameY, start_radius, end_radius, startAngle, startAngle + angle, vTable, vName, columnNumber, { fill: vColor, stroke: linecolor, "stroke-width": "1px", "opacity" : vOpacity });

        // update the start angle for the next segment
        startAngle += angle;

    }
}

/// function addCommas
/// 2014-05-28 SR
/// Formats a number by adding commas for the thousand values
/// Parameters:
///     str    -    a string containing a numeric value
///
function sbq_addCommas(str) {
    var parts = (str + "").split("."),
    main = parts[0],
    len = main.length,
    output = "",
    i = len - 1;

    while (i >= 0) {
        output = main.charAt(i) + output;
        if ((len - i) % 3 === 0 && i > 0) {
            output = "," + output;
        }
        --i;
    }
    // put decimal part back
    if (parts.length > 1) {
        output += "." + parts[1];
    }
    return output;
}

/// function popS
/// 2014-05-28 SR
/// Shows the popup.  Called by the mouse events over the segments
/// Parameters:
///     e    -    page parameters
///
function sbq_popS(e) {
    $("#hoverBox").show();
    var t, n;
    if (e.pageY) {
        t = e.pageY - ($("#hoverBox").height() - 20);
        n = e.pageX + 20
    } else {
        t = e.clientY - ($("#hoverBox").height() - 20);
        n = e.clientX + 20
    }
    $("#hoverBox").offset({
        top: t,
        left: n
    })
}

/// function colormix
/// 2014-05-28 SR
/// Calculates a colour, based on a percentage, between two other colours
/// Parameters:
///     perc        -   percentage value - between 0 and 1.
///     startcolor  -   the color if percentage is 0, text value in format #rrggbb
///     endcolor    -   the colour if the percentage is 1, text value in format #rrggbb
///
function sbq_colormix(perc, startcolor, endcolor) {
    // grab out the r, g, b values for the colours
    var r1 = sbq_h2d(startcolor.substring(1, 3));
    var g1 = sbq_h2d(startcolor.substring(3, 5));
    var b1 = sbq_h2d(startcolor.substring(5, 7));
    var r2 = sbq_h2d(endcolor.substring(1, 3));
    var g2 = sbq_h2d(endcolor.substring(3, 5));
    var b2 = sbq_h2d(endcolor.substring(5, 7));

    // calculate the in-between values based on the pecentage
    var r3 = sbq_d2h(Math.round(r1 > r2 ? r1 - ((r1 - r2) * perc) : r1 + ((r2 - r1) * perc)));
    var g3 = sbq_d2h(Math.round(g1 > g2 ? g1 - ((g1 - g2) * perc) : g1 + ((g2 - g1) * perc)));
    var b3 = sbq_d2h(Math.round(b1 > r2 ? b1 - ((b1 - b2) * perc) : b1 + ((b2 - b1) * perc)));

    // if the result is single character, add a preceeding 0.
    r3 = r3.length == 1 ? '0' + r3 : r3;
    g3 = g3.length == 1 ? '0' + g3 : g3;
    b3 = b3.length == 1 ? '0' + b3 : b3;

    // recombine and return
    return ('#' + r3 + g3 + b3);

}

/// function d2h
/// 2014-05-28 SR
/// Helper function. Takes a decimal value and returns hex
///
function sbq_d2h(d) { return d.toString(16); }

/// function h2d
/// 2014-05-28 SR
/// Helper function.  Takes a hex value and returns a decimal
///
function sbq_h2d(h) { return parseInt(h, 16); }

