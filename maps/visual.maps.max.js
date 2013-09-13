/*
colors, legend
Copyright (c) 2013 Institut d'Estadistica de Catalunya (Idescat)
http://www.idescat.cat (https://github.com/idescat/visual)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

VisualJS.func.colors=function (cHexa, rang, atribut, clas){
	var 
		d=document,
		HueToRgb=function (m1, m2, hue) {
			var v;
			if (hue<0) {hue += 1;}
			else if (hue > 1) {	hue -= 1;}
			if (6 * hue < 1) {v=m1 + (m2 - m1) * hue * 6;}
			else if (2 * hue < 1) {v=m2;}
			else if (3 * hue < 2){v=m1 + (m2 - m1) * (2/3 - hue) * 6;}
			else {v=m1;}
			return 255 * v;
		},
		hsl2rgb=function (hsl) {
			var h=hsl.h,
				s=hsl.s/100,
				l=hsl.l/100,
				m1, m2, hue, r, g, b
			;
			if (s == 0) {r=g=b=(l * 255);}
			else {
				if (l <= 0.5) {m2=l * (s + 1);}
				else {m2=l + s - l * s;}
				m1=l * 2 - m2;
				hue=h / 360;
				r=HueToRgb(m1, m2, hue + 1/3);
				g=HueToRgb(m1, m2, hue);
				b=HueToRgb(m1, m2, hue - 1/3);
			}
			return {r: Math.round(r), g: Math.round(g), b: Math.round(b)};
		},
		hex2Dec=function (h){
			return parseInt(h,16);
		},
		hex2rgb=function (c){
			c=c.replace("#","");
			return {r:hex2Dec(c.substr(0,2)), g:hex2Dec(c.substr(2,2)) ,b:hex2Dec(c.substr(4,2))};
		},
		rgb2hsl=function (rgb){
			var r=rgb.r/255,
				g=rgb.g/255,
				b=rgb.b/255,
				max=Math.max(r, g, b), min=Math.min(r, g, b),
				h, s, l=(max + min) / 2
			;

			if(max == min){
				h=s=0; // achromatic
			}else{
				var df=max - min;
				s=l > 0.5 ? df / (2 - max - min) : df / (max + min);
				switch(max){
					case r: h=(g - b) / df + (g < b ? 6 : 0); break;
					case g: h=(b - r) / df + 2; break;
					case b: h=(r - g) / df + 4; break;
				}
				h /= 6;
			}
			return {h:Math.floor(h * 360), s:Math.floor(s * 100), l:Math.floor(l * 100)};
		},
		inserirRegla=function (regla, mystylesheet){
			if (mystylesheet.insertRule){
				mystylesheet.insertRule(regla, 0);
			}else{ //IE
				mystylesheet.addRule(regla, 0);
			}
		},
		stylesheet=d.createElement("style"),
		colors=new Array(),
		hsl=rgb2hsl(hex2rgb(cHexa));
	;

	//Security: must be run in same domain as page in some browsers (FF)
	stylesheet.setAttribute("type", "text/css");
	d.getElementsByTagName('head')[0].appendChild(stylesheet);
	var mystylesheet=d.styleSheets[0];

	var incr=(97-hsl.l)/--rang;
	var i=0;
	while(i <= rang){
		rgb=hsl2rgb (hsl);
		colors[i]={r:rgb.r, g:rgb.g, b:rgb.b};
		inserirRegla('.'+clas+(rang-i)+'{' + atribut + ': rgb('+rgb.r+','+rgb.g+','+rgb.b+')}',
			mystylesheet);
		i++;
		hsl.l += incr;
	}
	return colors;
};

VisualJS.func.legend=function(sup, inf, colorSup, colorInf, vis, tooltip, hwmin) {
	var 
		showValLimit=250, // height/width less than this value -> don't show text legend
		minLimit=170, // height/width less than this value -> don't show legend
		incr=15, //square size (15x15)
		offsetY=4, //space between squares
		leg= vis.append("svg:g").attr("class", "llegenda"),
		info=[ // Colors and values in the legend
				{	//greater than
					color: "fill:rgb(" + colorInf.r + "," + colorInf.g + "," + colorInf.b + ")", 
					text: "\u2265 " + sup
				},
				/*{ //mean (not currently passed nor used
					color: "fill:rgb(" + colorMean.r + "," + colorMean.g + "," + colorMean.b + ")", 
					text: format(Mean)
				},*/ 
				{  //less than
					color: "fill:rgb(" + colorSup.r + "," + colorSup.g + "," + colorSup.b + "); ", 
					text: "\u2264 " + inf
				}
			],
		getBB=function(html){ // returns width/height of the text (Bounding Box)
			var 
				d=document,
				s=d.createElement("span")
			;
			s.visibility="hidden";
			s.innerHTML=html;
			d.body.appendChild(s);
			var bb=s.getBoundingClientRect();
			s.parentNode.removeChild(s);
			return bb;	
		}, 
		bbHigherVal=getBB(VisualJS.tooltipText(null, info[0].text)),
		//xIni (horitzontal starting position of the legend: locate at 85% of the visual width, move to left considering legend's max width (to a certain point)
		xIni=Math.max(( vis.attr("width") * 0.9 - Math.max( bbHigherVal.width, getBB(VisualJS.tooltipText(null, info[1].text)).width ) ), vis.attr("width") * 0.4),
		yIni=vis.attr("height") * 0.65, // vertical starting position of the legend (South-West)
		posX=xIni-incr,
		posY=yIni
	;
	if(hwmin>minLimit){  //Show legend
		//squares
		leg.selectAll("rect")
			.data(info)
			.enter()
			.append("svg:rect")
			.attr("x", xIni)
			.attr("y", function(d){posY+=incr+offsetY; return posY;})
			.attr("width", incr)
			.attr("height", incr)
			.attr("style", function(d){return d.color})
		;
		if(hwmin>showValLimit){ //case 1: show values
			//Align text to square horizontally
			posY=yIni+(incr/2)+(bbHigherVal.height/4); 
			//text
			leg.selectAll("text")
				.data(info)
				.enter()
				.append("svg:text")
				.attr("x",xIni+incr+5) //Horizontal space of 5px between square and text
				.attr("y",function(){posY+=incr+offsetY; return posY;}) 
				.text(function(d){return VisualJS.tooltipText(null, d.text);})
			;								
		}else{ //case 2: show tooltip
			// Attach tooltip
			leg.selectAll("rect")
				.on("mousemove", function(d){
					VisualJS.showTooltip(VisualJS.tooltipText(null, d.text), d3.event.pageX, d3.event.pageY);
				})
				.on("mouseout", function(){tooltip.style("display", "none");})	 
		}
	} //case 3: no legend	
};