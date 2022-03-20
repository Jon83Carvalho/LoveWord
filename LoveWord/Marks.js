import React,{useState,useCallback} from 'react';
import {format} from 'd3';

const f = format(".1f");
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

export const Marks=({
  colorScale,
  colorValue,
  tooltipFormat,
  data,
  yScale,
  xScale,
  yValue,
  xValue,
  circleRadius,
  rScale,
  radialScale,
  centerX,
  centerY,
  onHover,
  hoveredValue,
  fadeOpacity,
  larr,
  rcircle,
  countryLegend,
  rfactor
})=>{
	const tempo = new Date();
  let seconds = tempo.getSeconds();	
  const maxc=Math.max.apply(Math, data.map(function(d) { return d.Corrup; }))
  const ming=Math.min.apply(Math, data.map(function(d) { return d.Gap; }))
	
  data=[{"Corrup":10,"Gap":10,"Country":"Brazil"},{"Corrup":10,"Gap":10,"Country":"Brazil"}]

  
  
  return (
        data.map(function(d,i){
           				  
  								const rad=((radialScale((maxc-xValue(d)+30)))/2.7)
              		sleep(400)
          				return (
              <>
               <g 
        				opacity={hoveredValue&&d!=hoveredValue?fadeOpacity:1}
        				onMouseEnter={()=>{onHover(d)}}
        				onMouseOut={()=>{onHover(null)}}
        				>
                	<circle 
                   className="mark"
                   cx={rad*Math.sin(Math.floor(100*larr[i+43]*360/180)/100)+centerX} 
                   cy={rad*Math.cos(Math.floor(100*larr[i+43]*360/180)/100)+centerY} 
                   r={rScale((yValue(d)-ming))/100*rfactor}
                   opacity="0.8"
                   fill={colorScale(colorValue(d))}
                     
                  >
                   
                </circle>

                   </g>

                <g opacity={hoveredValue&&d==hoveredValue?1:0}>
								 <rect rx="20" ry="20" width="240" height="120"
                  opacity={0.5}
                  x={50}
                  y={180}
                  color="black"
                  fill="white"
                  
                  >
              		
                  </rect><text
                 font-size="15" 
                  fill="black" 
                  x={70}
                  y={240}
                  dy=".32em"
 							   >Internet Gender Gap: {f(d.Gap)}</text>
                 <text
                  font-size="15" 
                  fill="black" 
                  x={70}
                  y={270}
                  dy=".32em"
 							   >Corruption Perception: {d.Corrup}</text>
                <text
                  font-size="25" 
                  fill="black" 
                  x={70}
                  y={210}
                  dy=".32em"
 							   >Country: {d.Country}</text>
                 </g>
 
              </>
                      );
                 })
          )

}
