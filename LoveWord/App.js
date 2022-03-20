//this code is eniely based on the developmet made in youtube video https://www.youtube.com/watch?v=lx5k8oQHaJQ
//by "the Muratorium"
import React, {useState,useRef,useEffect} from 'react'
import {Viz} from './Viz'
import useInterval from "./useInterval";
import {csv} from 'd3';
import {CSV} from './CSV';

const socket = io()

const csvdata=io.connect("https://raw.githubusercontent.com/Jon83Carvalho/DataAndArt/main/")



const rawdata=[{"count":5000,"max":35},{"count":5000,"max":100}];


var csvUrl
var csvEmpty



const row=d=>{
  			d.count=+d.count
        d.max=+d.max
       return (d
         
       );
    };

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

//csvUrl='https://raw.githubusercontent.com/Jon83Carvalho/DataAndArt/main/LoveWord.csv?'+ Math.random()*100+makeid(Math.floor(Math.random()*10)*Math.floor(Math.random()*10))

export const App=()=>{
  const [iteration, setIteration] = useState(0);
  const [start, setStart] = useState(false);
  const [data, setData] = useState(rawdata);
  const [previousdata, setpData] = useState(rawdata[0].max);
  const svgRef = useRef();
  

  
  useInterval(() => {
    if (start) {
      
      
      setpData(data[0].max)
      //setData(iteration%2===0?rawdata[1]:rawdata[0]);

      csvUrl='https://raw.githubusercontent.com/Jon83Carvalho/DataAndArt/main/LoveWord.csv?v='+ Math.random()*100+makeid(Math.floor(Math.random()*10)*Math.floor(Math.random()*10))
          
   		//csv(csvUrl,row).then(setData);
      
      
    
      CSV.fetch({
    	url: 'https://raw.githubusercontent.com/Jon83Carvalho/DataAndArt/main/LoveWord.csv?'+ makeid(Math.floor(Math.random()*10)*Math.floor(Math.random()*10))
    	}
			).done(function(dataset) {
      setData([{"count":dataset.records[0][0],"max":dataset.records[0][1]}])    
		  });
      
      
      if(data) {
          console.log(data[0],csvUrl)
     
      }
      

      setIteration(iteration + 1);

    }
  }, 100);
  
  return (

  	<>
    <Viz x={data[0].max} svgRef={svgRef} previousx={previousdata}/>
      <button onClick={() => setStart(!start)}>
        {start ? "Start animation" : "End animation"}
      </button>
    </>
  );
}

//export const App=function(){
//  const [data,setData]=useState(initialdata);
//  return <Viz/>
//}
