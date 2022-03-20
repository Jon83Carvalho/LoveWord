(function (React, ReactDOM, d3) {
  'use strict';

  var React__default = 'default' in React ? React['default'] : React;
  ReactDOM = ReactDOM && Object.prototype.hasOwnProperty.call(ReactDOM, 'default') ? ReactDOM['default'] : ReactDOM;

  //import {useData} from './useData'

  const Viz=({x,svgRef,previousx})=>{
    
    const wrapperRef = React.useRef();

    React.useEffect(()=>{
    	const svg=d3.select(svgRef.current);
   
        svg
        .selectAll(".teste")
        .data([x], (d,i) => d)
        .join(enter=>
              enter
              .append("text",(d,i)=>d)
              .attr("x", previousx),
              update=>
              update
              .append("text",(d,i)=>d)
              .attr("x", d=>d)
             )
                          
        .attr("class", "teste")
        
        .attr("y", 100)
      	.text((d,i)=>d)
        .transition()
        .attr("x", (d,i)=>d);
      
    },[x]);
    

    return (
      React__default.createElement( React__default.Fragment, null,
        React__default.createElement( 'div', { ref: wrapperRef },
        React__default.createElement( 'svg', { ref: svgRef })
        )
        )
     
    )
    
    
    //<svg><text x={x} y="100">teste</text></svg>
   
   
    
    
  };

  function useInterval(callback, delay) {
    const savedCallback = React.useRef();

    // Remember the latest callback.
    React.useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    React.useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }

  /* global jQuery, _ */
  var CSV = {};

  // Note that provision of jQuery is optional (it is **only** needed if you use fetch on a remote file)
  (function(my) {
    my.__type__ = "csv";

    // use either jQuery or Underscore Deferred depending on what is available
    var Deferred =
      (typeof jQuery !== "undefined" && jQuery.Deferred) ||
      (typeof _ !== "undefined" && _.Deferred) ||
      function() {
        var resolve, reject;
        var promise = new Promise(function(res, rej) {
          resolve = res;
          reject = rej;
        });
        return {
          resolve: resolve,
          reject: reject,
          promise: function() {
            return promise;
          }
        };
      };

    my.fetch = function(dataset) {
      var dfd = new Deferred();
      if (dataset.file) {
        var reader = new FileReader();
        var encoding = dataset.encoding || "UTF-8";
        reader.onload = function(e) {
          var out = my.extractFields(my.parse(e.target.result, dataset), dataset);
          out.useMemoryStore = true;
          out.metadata = {
            filename: dataset.file.name
          };
          dfd.resolve(out);
        };
        reader.onerror = function(e) {
          dfd.reject({
            error: {
              message: "Failed to load file. Code: " + e.target.error.code
            }
          });
        };
        reader.readAsText(dataset.file, encoding);
      } else if (dataset.data) {
        var out = my.extractFields(my.parse(dataset.data, dataset), dataset);
        out.useMemoryStore = false;
        dfd.resolve(out);
      } else if (dataset.url) {
        var fetch =
          window.fetch ||
          function(url) {
            var jq = jQuery.get(url);

            var promiseResult = {
              then: function(res) {
                jq.done(res);
                return promiseResult;
              },
              catch: function(rej) {
                jq.fail(rej);
                return promiseResult;
              }
            };
            return promiseResult;
          };
        fetch(dataset.url)
          .then(function(response) {
            if (response.text) {
              return response.text();
            } else {
              return response;
            }
          })
          .then(function(data) {
            var out = my.extractFields(my.parse(data, dataset), dataset);
            out.useMemoryStore = true;
            dfd.resolve(out);
          })
          .catch(function(req, status) {
            dfd.reject({
              error: {
                message: "Failed to load file. " +
                  req.statusText +
                  ". Code: " +
                  req.status,
                request: req
              }
            });
          });
      }
      return dfd.promise();
    };

    // Convert array of rows in { records: [ ...] , fields: [ ... ] }
    // @param {Boolean} noHeaderRow If true assume that first row is not a header (i.e. list of fields but is data.
    my.extractFields = function(rows, noFields) {
      if (noFields.noHeaderRow !== true && rows.length > 0) {
        return {
          fields: rows[0],
          records: rows.slice(1)
        };
      } else {
        return {
          records: rows
        };
      }
    };

    my.normalizeDialectOptions = function(options) {
      // note lower case compared to CSV DDF
      var out = {
        delimiter: ",",
        doublequote: true,
        lineterminator: "\n",
        quotechar: '"',
        skipinitialspace: true,
        skipinitialrows: 0
      };
      for (var key in options) {
        if (key === "trim") {
          out["skipinitialspace"] = options.trim;
        } else {
          out[key.toLowerCase()] = options[key];
        }
      }
      return out;
    };

    // ## parse
    //
    // For docs see the README
    //
    // Heavily based on uselesscode's JS CSV parser (MIT Licensed):
    // http://www.uselesscode.org/javascript/csv/
    my.parse = function(s, dialect) {
      // When line terminator is not provided then we try to guess it
      // and normalize it across the file.
      if (!dialect || (dialect && !dialect.lineterminator)) {
        s = my.normalizeLineTerminator(s, dialect);
      }

      // Get rid of any trailing \n
      var options = my.normalizeDialectOptions(dialect);
      s = chomp(s, options.lineterminator);

      var cur = "", // The character we are currently processing.
        inQuote = false,
        fieldQuoted = false,
        field = "", // Buffer for building up the current field
        row = [],
        out = [],
        i,
        processField;

      processField = function(field) {
        if (fieldQuoted !== true) {
          // If field is empty set to null
          if (field === "") {
            field = null;
            // If the field was not quoted and we are trimming fields, trim it
          } else if (options.skipinitialspace === true) {
            field = trim(field);
          }

          // Convert unquoted numbers to their appropriate types
          if (rxIsInt.test(field)) {
            field = parseInt(field, 10);
          } else if (rxIsFloat.test(field)) {
            field = parseFloat(field, 10);
          }
        }
        return field;
      };

      for (i = 0; i < s.length; i += 1) {
        cur = s.charAt(i);

        // If we are at a EOF or EOR
        if (
          inQuote === false &&
          (cur === options.delimiter || cur === options.lineterminator)
        ) {
          field = processField(field);
          // Add the current field to the current row
          row.push(field);
          // If this is EOR append row to output and flush row
          if (cur === options.lineterminator) {
            out.push(row);
            row = [];
          }
          // Flush the field buffer
          field = "";
          fieldQuoted = false;
        } else {
          // If it's not a quotechar, add it to the field buffer
          if (cur !== options.quotechar) {
            field += cur;
          } else {
            if (!inQuote) {
              // We are not in a quote, start a quote
              inQuote = true;
              fieldQuoted = true;
            } else {
              // Next char is quotechar, this is an escaped quotechar
              if (s.charAt(i + 1) === options.quotechar) {
                field += options.quotechar;
                // Skip the next char
                i += 1;
              } else {
                // It's not escaping, so end quote
                inQuote = false;
              }
            }
          }
        }
      }

      // Add the last field
      field = processField(field);
      row.push(field);
      out.push(row);

      // Expose the ability to discard initial rows
      if (options.skipinitialrows) out = out.slice(options.skipinitialrows);

      return out;
    };

    my.normalizeLineTerminator = function(csvString, dialect) {
      dialect = dialect || {};

      // Try to guess line terminator if it's not provided.
      if (!dialect.lineterminator) {
        return csvString.replace(/(\r\n|\n|\r)/gm, "\n");
      }
      // if not return the string untouched.
      return csvString;
    };

    my.objectToArray = function(dataToSerialize) {
      var a = [];
      var fieldNames = [];
      var fieldIds = [];
      for (var ii = 0; ii < dataToSerialize.fields.length; ii++) {
        var id = dataToSerialize.fields[ii].id;
        fieldIds.push(id);
        var label = dataToSerialize.fields[ii].label ? dataToSerialize.fields[ii].label : id;
        fieldNames.push(label);
      }
      a.push(fieldNames);
      for (var ii = 0; ii < dataToSerialize.records.length; ii++) {
        var tmp = [];
        var record = dataToSerialize.records[ii];
        for (var jj = 0; jj < fieldIds.length; jj++) {
          tmp.push(record[fieldIds[jj]]);
        }
        a.push(tmp);
      }
      return a;
    };

    // ## serialize
    //
    // See README for docs
    //
    // Heavily based on uselesscode's JS CSV serializer (MIT Licensed):
    // http://www.uselesscode.org/javascript/csv/
    my.serialize = function(dataToSerialize, dialect) {
      var a = null;
      if (dataToSerialize instanceof Array) {
        a = dataToSerialize;
      } else {
        a = my.objectToArray(dataToSerialize);
      }
      var options = my.normalizeDialectOptions(dialect);

      var cur = "", // The character we are currently processing.
        field = "", // Buffer for building up the current field
        row = "",
        out = "",
        i,
        j,
        processField;

      processField = function(field) {
        if (field === null) {
          // If field is null set to empty string
          field = "";
        } else if (typeof field === "string" && rxNeedsQuoting.test(field)) {
          if (options.doublequote) {
            field = field.replace(/"/g, '""');
          }
          // Convert string to delimited string
          field = options.quotechar + field + options.quotechar;
        } else if (typeof field === "number") {
          // Convert number to string
          field = field.toString(10);
        }

        return field;
      };

      for (i = 0; i < a.length; i += 1) {
        cur = a[i];

        for (j = 0; j < cur.length; j += 1) {
          field = processField(cur[j]);
          // If this is EOR append row to output and flush row
          if (j === cur.length - 1) {
            row += field;
            out += row + options.lineterminator;
            row = "";
          } else {
            // Add the current field to the current row
            row += field + options.delimiter;
          }
          // Flush the field buffer
          field = "";
        }
      }

      return out;
    };

    var rxIsInt = /^\d+$/,
      rxIsFloat = /^\d*\.\d+$|^\d+\.\d*$/,
      // If a string has leading or trailing space,
      // contains a comma double quote or a newline
      // it needs to be quoted in CSV output
      rxNeedsQuoting = /^\s|\s$|,|"|\n/,
      trim = (function() {
        // Fx 3.1 has a native trim function, it's about 10x faster, use it if it exists
        if (String.prototype.trim) {
          return function(s) {
            return s.trim();
          };
        } else {
          return function(s) {
            return s.replace(/^\s*/, "").replace(/\s*$/, "");
          };
        }
      })();

    function chomp(s, lineterminator) {
      if (s.charAt(s.length - lineterminator.length) !== lineterminator) {
        // Does not end with \n, just return string
        return s;
      } else {
        // Remove the \n
        return s.substring(0, s.length - lineterminator.length);
      }
    }
  })(CSV);

  // backwards compatability for use in Recline
  var recline = recline || {};
  recline.Backend = recline.Backend || {};
  recline.Backend.CSV = CSV;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSV;
  }

  //this code is eniely based on the developmet made in youtube video https://www.youtube.com/watch?v=lx5k8oQHaJQ

  const socket = io();

  const csvdata=io.connect("https://raw.githubusercontent.com/Jon83Carvalho/DataAndArt/main/");



  const rawdata=[{"count":5000,"max":35},{"count":5000,"max":100}];


  var csvUrl;

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

  const App=()=>{
    const [iteration, setIteration] = React.useState(0);
    const [start, setStart] = React.useState(false);
    const [data, setData] = React.useState(rawdata);
    const [previousdata, setpData] = React.useState(rawdata[0].max);
    const svgRef = React.useRef();
    

    
    useInterval(() => {
      if (start) {
        
        
        setpData(data[0].max);
        //setData(iteration%2===0?rawdata[1]:rawdata[0]);

        csvUrl='https://raw.githubusercontent.com/Jon83Carvalho/DataAndArt/main/LoveWord.csv?v='+ Math.random()*100+makeid(Math.floor(Math.random()*10)*Math.floor(Math.random()*10));
            
     		//csv(csvUrl,row).then(setData);
        
        
      
        CSV.fetch({
      	url: 'https://raw.githubusercontent.com/Jon83Carvalho/DataAndArt/main/LoveWord.csv?'+ makeid(Math.floor(Math.random()*10)*Math.floor(Math.random()*10))
      	}
  			).done(function(dataset) {
        setData([{"count":dataset.records[0][0],"max":dataset.records[0][1]}]);    
  		  });
        
        
        if(data) {
            console.log(data[0],csvUrl);
       
        }
        

        setIteration(iteration + 1);

      }
    }, 100);
    
    return (

    	React__default.createElement( React__default.Fragment, null,
      React__default.createElement( Viz, { x: data[0].max, svgRef: svgRef, previousx: previousdata }),
        React__default.createElement( 'button', { onClick: () => setStart(!start) },
          start ? "Start animation" : "End animation"
        )
      )
    );
  };

  //export const App=function(){
  //  const [data,setData]=useState(initialdata);
  //  return <Viz/>
  //}

  const rootElement = document.getElementById('root');


  ReactDOM.render(React__default.createElement( App, null ),rootElement);

}(React, ReactDOM, d3));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIlZpei5qcyIsInVzZUludGVydmFsLmpzIiwiQ1NWLmpzIiwiQXBwLmpzIiwiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVJlZiwgdXNlRWZmZWN0IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJztcbmltcG9ydCB7c2VsZWN0fSBmcm9tIFwiZDNcIjtcblxuXG5cbi8vaW1wb3J0IHt1c2VEYXRhfSBmcm9tICcuL3VzZURhdGEnXG5cbmV4cG9ydCBjb25zdCBWaXo9KHt4LHN2Z1JlZixwcmV2aW91c3h9KT0+e1xuICBcbiAgY29uc3Qgd3JhcHBlclJlZiA9IHVzZVJlZigpO1xuXG4gIHVzZUVmZmVjdCgoKT0+e1xuICBcdGNvbnN0IHN2Zz1zZWxlY3Qoc3ZnUmVmLmN1cnJlbnQpXG4gXG4gICAgICBzdmdcbiAgICAgIC5zZWxlY3RBbGwoXCIudGVzdGVcIilcbiAgICAgIC5kYXRhKFt4XSwgKGQsaSkgPT4gZClcbiAgICAgIC5qb2luKGVudGVyPT5cbiAgICAgICAgICAgIGVudGVyXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiLChkLGkpPT5kKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIHByZXZpb3VzeCksXG4gICAgICAgICAgICB1cGRhdGU9PlxuICAgICAgICAgICAgdXBkYXRlXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiLChkLGkpPT5kKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGQ9PmQpXG4gICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRlc3RlXCIpXG4gICAgICBcbiAgICAgIC5hdHRyKFwieVwiLCAxMDApXG4gICAgXHQudGV4dCgoZCxpKT0+ZClcbiAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgIC5hdHRyKFwieFwiLCAoZCxpKT0+ZCk7XG4gICAgXG4gIH0sW3hdKVxuICBcblxuICByZXR1cm4gKFxuICAgIDxSZWFjdC5GcmFnbWVudD5cbiAgICAgIDxkaXYgcmVmPXt3cmFwcGVyUmVmfT5cbiAgICAgIDxzdmcgcmVmPXtzdmdSZWZ9Pjwvc3ZnPlxuICAgICAgPC9kaXY+XG4gICAgICA8L1JlYWN0LkZyYWdtZW50PlxuICAgXG4gIClcbiAgXG4gIFxuICAvLzxzdmc+PHRleHQgeD17eH0geT1cIjEwMFwiPnRlc3RlPC90ZXh0Pjwvc3ZnPlxuIFxuIFxuICBcbiAgXG59OyAgXG4iLCJpbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gXCJyZWFjdFwiO1xuXG5mdW5jdGlvbiB1c2VJbnRlcnZhbChjYWxsYmFjaywgZGVsYXkpIHtcbiAgY29uc3Qgc2F2ZWRDYWxsYmFjayA9IHVzZVJlZigpO1xuXG4gIC8vIFJlbWVtYmVyIHRoZSBsYXRlc3QgY2FsbGJhY2suXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgc2F2ZWRDYWxsYmFjay5jdXJyZW50ID0gY2FsbGJhY2s7XG4gIH0sIFtjYWxsYmFja10pO1xuXG4gIC8vIFNldCB1cCB0aGUgaW50ZXJ2YWwuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZnVuY3Rpb24gdGljaygpIHtcbiAgICAgIHNhdmVkQ2FsbGJhY2suY3VycmVudCgpO1xuICAgIH1cbiAgICBpZiAoZGVsYXkgIT09IG51bGwpIHtcbiAgICAgIGxldCBpZCA9IHNldEludGVydmFsKHRpY2ssIGRlbGF5KTtcbiAgICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKGlkKTtcbiAgICB9XG4gIH0sIFtkZWxheV0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCB1c2VJbnRlcnZhbDsiLCIvKiBnbG9iYWwgalF1ZXJ5LCBfICovXG5leHBvcnQgdmFyIENTViA9IHt9O1xuXG4vLyBOb3RlIHRoYXQgcHJvdmlzaW9uIG9mIGpRdWVyeSBpcyBvcHRpb25hbCAoaXQgaXMgKipvbmx5KiogbmVlZGVkIGlmIHlvdSB1c2UgZmV0Y2ggb24gYSByZW1vdGUgZmlsZSlcbihmdW5jdGlvbihteSkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgbXkuX190eXBlX18gPSBcImNzdlwiO1xuXG4gIC8vIHVzZSBlaXRoZXIgalF1ZXJ5IG9yIFVuZGVyc2NvcmUgRGVmZXJyZWQgZGVwZW5kaW5nIG9uIHdoYXQgaXMgYXZhaWxhYmxlXG4gIHZhciBEZWZlcnJlZCA9XG4gICAgKHR5cGVvZiBqUXVlcnkgIT09IFwidW5kZWZpbmVkXCIgJiYgalF1ZXJ5LkRlZmVycmVkKSB8fFxuICAgICh0eXBlb2YgXyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBfLkRlZmVycmVkKSB8fFxuICAgIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlc29sdmUsIHJlamVjdDtcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzLCByZWopIHtcbiAgICAgICAgcmVzb2x2ZSA9IHJlcztcbiAgICAgICAgcmVqZWN0ID0gcmVqO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXNvbHZlOiByZXNvbHZlLFxuICAgICAgICByZWplY3Q6IHJlamVjdCxcbiAgICAgICAgcHJvbWlzZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfTtcblxuICBteS5mZXRjaCA9IGZ1bmN0aW9uKGRhdGFzZXQpIHtcbiAgICB2YXIgZGZkID0gbmV3IERlZmVycmVkKCk7XG4gICAgaWYgKGRhdGFzZXQuZmlsZSkge1xuICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICB2YXIgZW5jb2RpbmcgPSBkYXRhc2V0LmVuY29kaW5nIHx8IFwiVVRGLThcIjtcbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBvdXQgPSBteS5leHRyYWN0RmllbGRzKG15LnBhcnNlKGUudGFyZ2V0LnJlc3VsdCwgZGF0YXNldCksIGRhdGFzZXQpO1xuICAgICAgICBvdXQudXNlTWVtb3J5U3RvcmUgPSB0cnVlO1xuICAgICAgICBvdXQubWV0YWRhdGEgPSB7XG4gICAgICAgICAgZmlsZW5hbWU6IGRhdGFzZXQuZmlsZS5uYW1lXG4gICAgICAgIH07XG4gICAgICAgIGRmZC5yZXNvbHZlKG91dCk7XG4gICAgICB9O1xuICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGRmZC5yZWplY3Qoe1xuICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICBtZXNzYWdlOiBcIkZhaWxlZCB0byBsb2FkIGZpbGUuIENvZGU6IFwiICsgZS50YXJnZXQuZXJyb3IuY29kZVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZGF0YXNldC5maWxlLCBlbmNvZGluZyk7XG4gICAgfSBlbHNlIGlmIChkYXRhc2V0LmRhdGEpIHtcbiAgICAgIHZhciBvdXQgPSBteS5leHRyYWN0RmllbGRzKG15LnBhcnNlKGRhdGFzZXQuZGF0YSwgZGF0YXNldCksIGRhdGFzZXQpO1xuICAgICAgb3V0LnVzZU1lbW9yeVN0b3JlID0gZmFsc2U7XG4gICAgICBkZmQucmVzb2x2ZShvdXQpO1xuICAgIH0gZWxzZSBpZiAoZGF0YXNldC51cmwpIHtcbiAgICAgIHZhciBmZXRjaCA9XG4gICAgICAgIHdpbmRvdy5mZXRjaCB8fFxuICAgICAgICBmdW5jdGlvbih1cmwpIHtcbiAgICAgICAgICB2YXIganEgPSBqUXVlcnkuZ2V0KHVybCk7XG5cbiAgICAgICAgICB2YXIgcHJvbWlzZVJlc3VsdCA9IHtcbiAgICAgICAgICAgIHRoZW46IGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgICBqcS5kb25lKHJlcyk7XG4gICAgICAgICAgICAgIHJldHVybiBwcm9taXNlUmVzdWx0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhdGNoOiBmdW5jdGlvbihyZWopIHtcbiAgICAgICAgICAgICAganEuZmFpbChyZWopO1xuICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZVJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIHJldHVybiBwcm9taXNlUmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgZmV0Y2goZGF0YXNldC51cmwpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgaWYgKHJlc3BvbnNlLnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICB2YXIgb3V0ID0gbXkuZXh0cmFjdEZpZWxkcyhteS5wYXJzZShkYXRhLCBkYXRhc2V0KSwgZGF0YXNldCk7XG4gICAgICAgICAgb3V0LnVzZU1lbW9yeVN0b3JlID0gdHJ1ZTtcbiAgICAgICAgICBkZmQucmVzb2x2ZShvdXQpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24ocmVxLCBzdGF0dXMpIHtcbiAgICAgICAgICBkZmQucmVqZWN0KHtcbiAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IFwiRmFpbGVkIHRvIGxvYWQgZmlsZS4gXCIgK1xuICAgICAgICAgICAgICAgIHJlcS5zdGF0dXNUZXh0ICtcbiAgICAgICAgICAgICAgICBcIi4gQ29kZTogXCIgK1xuICAgICAgICAgICAgICAgIHJlcS5zdGF0dXMsXG4gICAgICAgICAgICAgIHJlcXVlc3Q6IHJlcVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGRmZC5wcm9taXNlKCk7XG4gIH07XG5cbiAgLy8gQ29udmVydCBhcnJheSBvZiByb3dzIGluIHsgcmVjb3JkczogWyAuLi5dICwgZmllbGRzOiBbIC4uLiBdIH1cbiAgLy8gQHBhcmFtIHtCb29sZWFufSBub0hlYWRlclJvdyBJZiB0cnVlIGFzc3VtZSB0aGF0IGZpcnN0IHJvdyBpcyBub3QgYSBoZWFkZXIgKGkuZS4gbGlzdCBvZiBmaWVsZHMgYnV0IGlzIGRhdGEuXG4gIG15LmV4dHJhY3RGaWVsZHMgPSBmdW5jdGlvbihyb3dzLCBub0ZpZWxkcykge1xuICAgIGlmIChub0ZpZWxkcy5ub0hlYWRlclJvdyAhPT0gdHJ1ZSAmJiByb3dzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZpZWxkczogcm93c1swXSxcbiAgICAgICAgcmVjb3Jkczogcm93cy5zbGljZSgxKVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb3Jkczogcm93c1xuICAgICAgfTtcbiAgICB9XG4gIH07XG5cbiAgbXkubm9ybWFsaXplRGlhbGVjdE9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgLy8gbm90ZSBsb3dlciBjYXNlIGNvbXBhcmVkIHRvIENTViBEREZcbiAgICB2YXIgb3V0ID0ge1xuICAgICAgZGVsaW1pdGVyOiBcIixcIixcbiAgICAgIGRvdWJsZXF1b3RlOiB0cnVlLFxuICAgICAgbGluZXRlcm1pbmF0b3I6IFwiXFxuXCIsXG4gICAgICBxdW90ZWNoYXI6ICdcIicsXG4gICAgICBza2lwaW5pdGlhbHNwYWNlOiB0cnVlLFxuICAgICAgc2tpcGluaXRpYWxyb3dzOiAwXG4gICAgfTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuICAgICAgaWYgKGtleSA9PT0gXCJ0cmltXCIpIHtcbiAgICAgICAgb3V0W1wic2tpcGluaXRpYWxzcGFjZVwiXSA9IG9wdGlvbnMudHJpbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dFtrZXkudG9Mb3dlckNhc2UoKV0gPSBvcHRpb25zW2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgLy8gIyMgcGFyc2VcbiAgLy9cbiAgLy8gRm9yIGRvY3Mgc2VlIHRoZSBSRUFETUVcbiAgLy9cbiAgLy8gSGVhdmlseSBiYXNlZCBvbiB1c2VsZXNzY29kZSdzIEpTIENTViBwYXJzZXIgKE1JVCBMaWNlbnNlZCk6XG4gIC8vIGh0dHA6Ly93d3cudXNlbGVzc2NvZGUub3JnL2phdmFzY3JpcHQvY3N2L1xuICBteS5wYXJzZSA9IGZ1bmN0aW9uKHMsIGRpYWxlY3QpIHtcbiAgICAvLyBXaGVuIGxpbmUgdGVybWluYXRvciBpcyBub3QgcHJvdmlkZWQgdGhlbiB3ZSB0cnkgdG8gZ3Vlc3MgaXRcbiAgICAvLyBhbmQgbm9ybWFsaXplIGl0IGFjcm9zcyB0aGUgZmlsZS5cbiAgICBpZiAoIWRpYWxlY3QgfHwgKGRpYWxlY3QgJiYgIWRpYWxlY3QubGluZXRlcm1pbmF0b3IpKSB7XG4gICAgICBzID0gbXkubm9ybWFsaXplTGluZVRlcm1pbmF0b3IocywgZGlhbGVjdCk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHJpZCBvZiBhbnkgdHJhaWxpbmcgXFxuXG4gICAgdmFyIG9wdGlvbnMgPSBteS5ub3JtYWxpemVEaWFsZWN0T3B0aW9ucyhkaWFsZWN0KTtcbiAgICBzID0gY2hvbXAocywgb3B0aW9ucy5saW5ldGVybWluYXRvcik7XG5cbiAgICB2YXIgY3VyID0gXCJcIiwgLy8gVGhlIGNoYXJhY3RlciB3ZSBhcmUgY3VycmVudGx5IHByb2Nlc3NpbmcuXG4gICAgICBpblF1b3RlID0gZmFsc2UsXG4gICAgICBmaWVsZFF1b3RlZCA9IGZhbHNlLFxuICAgICAgZmllbGQgPSBcIlwiLCAvLyBCdWZmZXIgZm9yIGJ1aWxkaW5nIHVwIHRoZSBjdXJyZW50IGZpZWxkXG4gICAgICByb3cgPSBbXSxcbiAgICAgIG91dCA9IFtdLFxuICAgICAgaSxcbiAgICAgIHByb2Nlc3NGaWVsZDtcblxuICAgIHByb2Nlc3NGaWVsZCA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICBpZiAoZmllbGRRdW90ZWQgIT09IHRydWUpIHtcbiAgICAgICAgLy8gSWYgZmllbGQgaXMgZW1wdHkgc2V0IHRvIG51bGxcbiAgICAgICAgaWYgKGZpZWxkID09PSBcIlwiKSB7XG4gICAgICAgICAgZmllbGQgPSBudWxsO1xuICAgICAgICAgIC8vIElmIHRoZSBmaWVsZCB3YXMgbm90IHF1b3RlZCBhbmQgd2UgYXJlIHRyaW1taW5nIGZpZWxkcywgdHJpbSBpdFxuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuc2tpcGluaXRpYWxzcGFjZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGZpZWxkID0gdHJpbShmaWVsZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb252ZXJ0IHVucXVvdGVkIG51bWJlcnMgdG8gdGhlaXIgYXBwcm9wcmlhdGUgdHlwZXNcbiAgICAgICAgaWYgKHJ4SXNJbnQudGVzdChmaWVsZCkpIHtcbiAgICAgICAgICBmaWVsZCA9IHBhcnNlSW50KGZpZWxkLCAxMCk7XG4gICAgICAgIH0gZWxzZSBpZiAocnhJc0Zsb2F0LnRlc3QoZmllbGQpKSB7XG4gICAgICAgICAgZmllbGQgPSBwYXJzZUZsb2F0KGZpZWxkLCAxMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9O1xuXG4gICAgZm9yIChpID0gMDsgaSA8IHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGN1ciA9IHMuY2hhckF0KGkpO1xuXG4gICAgICAvLyBJZiB3ZSBhcmUgYXQgYSBFT0Ygb3IgRU9SXG4gICAgICBpZiAoXG4gICAgICAgIGluUXVvdGUgPT09IGZhbHNlICYmXG4gICAgICAgIChjdXIgPT09IG9wdGlvbnMuZGVsaW1pdGVyIHx8IGN1ciA9PT0gb3B0aW9ucy5saW5ldGVybWluYXRvcilcbiAgICAgICkge1xuICAgICAgICBmaWVsZCA9IHByb2Nlc3NGaWVsZChmaWVsZCk7XG4gICAgICAgIC8vIEFkZCB0aGUgY3VycmVudCBmaWVsZCB0byB0aGUgY3VycmVudCByb3dcbiAgICAgICAgcm93LnB1c2goZmllbGQpO1xuICAgICAgICAvLyBJZiB0aGlzIGlzIEVPUiBhcHBlbmQgcm93IHRvIG91dHB1dCBhbmQgZmx1c2ggcm93XG4gICAgICAgIGlmIChjdXIgPT09IG9wdGlvbnMubGluZXRlcm1pbmF0b3IpIHtcbiAgICAgICAgICBvdXQucHVzaChyb3cpO1xuICAgICAgICAgIHJvdyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZsdXNoIHRoZSBmaWVsZCBidWZmZXJcbiAgICAgICAgZmllbGQgPSBcIlwiO1xuICAgICAgICBmaWVsZFF1b3RlZCA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgaXQncyBub3QgYSBxdW90ZWNoYXIsIGFkZCBpdCB0byB0aGUgZmllbGQgYnVmZmVyXG4gICAgICAgIGlmIChjdXIgIT09IG9wdGlvbnMucXVvdGVjaGFyKSB7XG4gICAgICAgICAgZmllbGQgKz0gY3VyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghaW5RdW90ZSkge1xuICAgICAgICAgICAgLy8gV2UgYXJlIG5vdCBpbiBhIHF1b3RlLCBzdGFydCBhIHF1b3RlXG4gICAgICAgICAgICBpblF1b3RlID0gdHJ1ZTtcbiAgICAgICAgICAgIGZpZWxkUXVvdGVkID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTmV4dCBjaGFyIGlzIHF1b3RlY2hhciwgdGhpcyBpcyBhbiBlc2NhcGVkIHF1b3RlY2hhclxuICAgICAgICAgICAgaWYgKHMuY2hhckF0KGkgKyAxKSA9PT0gb3B0aW9ucy5xdW90ZWNoYXIpIHtcbiAgICAgICAgICAgICAgZmllbGQgKz0gb3B0aW9ucy5xdW90ZWNoYXI7XG4gICAgICAgICAgICAgIC8vIFNraXAgdGhlIG5leHQgY2hhclxuICAgICAgICAgICAgICBpICs9IDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBJdCdzIG5vdCBlc2NhcGluZywgc28gZW5kIHF1b3RlXG4gICAgICAgICAgICAgIGluUXVvdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIGxhc3QgZmllbGRcbiAgICBmaWVsZCA9IHByb2Nlc3NGaWVsZChmaWVsZCk7XG4gICAgcm93LnB1c2goZmllbGQpO1xuICAgIG91dC5wdXNoKHJvdyk7XG5cbiAgICAvLyBFeHBvc2UgdGhlIGFiaWxpdHkgdG8gZGlzY2FyZCBpbml0aWFsIHJvd3NcbiAgICBpZiAob3B0aW9ucy5za2lwaW5pdGlhbHJvd3MpIG91dCA9IG91dC5zbGljZShvcHRpb25zLnNraXBpbml0aWFscm93cyk7XG5cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIG15Lm5vcm1hbGl6ZUxpbmVUZXJtaW5hdG9yID0gZnVuY3Rpb24oY3N2U3RyaW5nLCBkaWFsZWN0KSB7XG4gICAgZGlhbGVjdCA9IGRpYWxlY3QgfHwge307XG5cbiAgICAvLyBUcnkgdG8gZ3Vlc3MgbGluZSB0ZXJtaW5hdG9yIGlmIGl0J3Mgbm90IHByb3ZpZGVkLlxuICAgIGlmICghZGlhbGVjdC5saW5ldGVybWluYXRvcikge1xuICAgICAgcmV0dXJuIGNzdlN0cmluZy5yZXBsYWNlKC8oXFxyXFxufFxcbnxcXHIpL2dtLCBcIlxcblwiKTtcbiAgICB9XG4gICAgLy8gaWYgbm90IHJldHVybiB0aGUgc3RyaW5nIHVudG91Y2hlZC5cbiAgICByZXR1cm4gY3N2U3RyaW5nO1xuICB9O1xuXG4gIG15Lm9iamVjdFRvQXJyYXkgPSBmdW5jdGlvbihkYXRhVG9TZXJpYWxpemUpIHtcbiAgICB2YXIgYSA9IFtdO1xuICAgIHZhciBmaWVsZE5hbWVzID0gW107XG4gICAgdmFyIGZpZWxkSWRzID0gW107XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGRhdGFUb1NlcmlhbGl6ZS5maWVsZHMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICB2YXIgaWQgPSBkYXRhVG9TZXJpYWxpemUuZmllbGRzW2lpXS5pZDtcbiAgICAgIGZpZWxkSWRzLnB1c2goaWQpO1xuICAgICAgdmFyIGxhYmVsID0gZGF0YVRvU2VyaWFsaXplLmZpZWxkc1tpaV0ubGFiZWwgPyBkYXRhVG9TZXJpYWxpemUuZmllbGRzW2lpXS5sYWJlbCA6IGlkO1xuICAgICAgZmllbGROYW1lcy5wdXNoKGxhYmVsKTtcbiAgICB9XG4gICAgYS5wdXNoKGZpZWxkTmFtZXMpO1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBkYXRhVG9TZXJpYWxpemUucmVjb3Jkcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIHZhciB0bXAgPSBbXTtcbiAgICAgIHZhciByZWNvcmQgPSBkYXRhVG9TZXJpYWxpemUucmVjb3Jkc1tpaV07XG4gICAgICBmb3IgKHZhciBqaiA9IDA7IGpqIDwgZmllbGRJZHMubGVuZ3RoOyBqaisrKSB7XG4gICAgICAgIHRtcC5wdXNoKHJlY29yZFtmaWVsZElkc1tqal1dKTtcbiAgICAgIH1cbiAgICAgIGEucHVzaCh0bXApO1xuICAgIH1cbiAgICByZXR1cm4gYTtcbiAgfTtcblxuICAvLyAjIyBzZXJpYWxpemVcbiAgLy9cbiAgLy8gU2VlIFJFQURNRSBmb3IgZG9jc1xuICAvL1xuICAvLyBIZWF2aWx5IGJhc2VkIG9uIHVzZWxlc3Njb2RlJ3MgSlMgQ1NWIHNlcmlhbGl6ZXIgKE1JVCBMaWNlbnNlZCk6XG4gIC8vIGh0dHA6Ly93d3cudXNlbGVzc2NvZGUub3JnL2phdmFzY3JpcHQvY3N2L1xuICBteS5zZXJpYWxpemUgPSBmdW5jdGlvbihkYXRhVG9TZXJpYWxpemUsIGRpYWxlY3QpIHtcbiAgICB2YXIgYSA9IG51bGw7XG4gICAgaWYgKGRhdGFUb1NlcmlhbGl6ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBhID0gZGF0YVRvU2VyaWFsaXplO1xuICAgIH0gZWxzZSB7XG4gICAgICBhID0gbXkub2JqZWN0VG9BcnJheShkYXRhVG9TZXJpYWxpemUpO1xuICAgIH1cbiAgICB2YXIgb3B0aW9ucyA9IG15Lm5vcm1hbGl6ZURpYWxlY3RPcHRpb25zKGRpYWxlY3QpO1xuXG4gICAgdmFyIGN1ciA9IFwiXCIsIC8vIFRoZSBjaGFyYWN0ZXIgd2UgYXJlIGN1cnJlbnRseSBwcm9jZXNzaW5nLlxuICAgICAgZmllbGQgPSBcIlwiLCAvLyBCdWZmZXIgZm9yIGJ1aWxkaW5nIHVwIHRoZSBjdXJyZW50IGZpZWxkXG4gICAgICByb3cgPSBcIlwiLFxuICAgICAgb3V0ID0gXCJcIixcbiAgICAgIGksXG4gICAgICBqLFxuICAgICAgcHJvY2Vzc0ZpZWxkO1xuXG4gICAgcHJvY2Vzc0ZpZWxkID0gZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgIGlmIChmaWVsZCA9PT0gbnVsbCkge1xuICAgICAgICAvLyBJZiBmaWVsZCBpcyBudWxsIHNldCB0byBlbXB0eSBzdHJpbmdcbiAgICAgICAgZmllbGQgPSBcIlwiO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZmllbGQgPT09IFwic3RyaW5nXCIgJiYgcnhOZWVkc1F1b3RpbmcudGVzdChmaWVsZCkpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuZG91YmxlcXVvdGUpIHtcbiAgICAgICAgICBmaWVsZCA9IGZpZWxkLnJlcGxhY2UoL1wiL2csICdcIlwiJyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ29udmVydCBzdHJpbmcgdG8gZGVsaW1pdGVkIHN0cmluZ1xuICAgICAgICBmaWVsZCA9IG9wdGlvbnMucXVvdGVjaGFyICsgZmllbGQgKyBvcHRpb25zLnF1b3RlY2hhcjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGZpZWxkID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIC8vIENvbnZlcnQgbnVtYmVyIHRvIHN0cmluZ1xuICAgICAgICBmaWVsZCA9IGZpZWxkLnRvU3RyaW5nKDEwKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH07XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgY3VyID0gYVtpXTtcblxuICAgICAgZm9yIChqID0gMDsgaiA8IGN1ci5sZW5ndGg7IGogKz0gMSkge1xuICAgICAgICBmaWVsZCA9IHByb2Nlc3NGaWVsZChjdXJbal0pO1xuICAgICAgICAvLyBJZiB0aGlzIGlzIEVPUiBhcHBlbmQgcm93IHRvIG91dHB1dCBhbmQgZmx1c2ggcm93XG4gICAgICAgIGlmIChqID09PSBjdXIubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIHJvdyArPSBmaWVsZDtcbiAgICAgICAgICBvdXQgKz0gcm93ICsgb3B0aW9ucy5saW5ldGVybWluYXRvcjtcbiAgICAgICAgICByb3cgPSBcIlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEFkZCB0aGUgY3VycmVudCBmaWVsZCB0byB0aGUgY3VycmVudCByb3dcbiAgICAgICAgICByb3cgKz0gZmllbGQgKyBvcHRpb25zLmRlbGltaXRlcjtcbiAgICAgICAgfVxuICAgICAgICAvLyBGbHVzaCB0aGUgZmllbGQgYnVmZmVyXG4gICAgICAgIGZpZWxkID0gXCJcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIHZhciByeElzSW50ID0gL15cXGQrJC8sXG4gICAgcnhJc0Zsb2F0ID0gL15cXGQqXFwuXFxkKyR8XlxcZCtcXC5cXGQqJC8sXG4gICAgLy8gSWYgYSBzdHJpbmcgaGFzIGxlYWRpbmcgb3IgdHJhaWxpbmcgc3BhY2UsXG4gICAgLy8gY29udGFpbnMgYSBjb21tYSBkb3VibGUgcXVvdGUgb3IgYSBuZXdsaW5lXG4gICAgLy8gaXQgbmVlZHMgdG8gYmUgcXVvdGVkIGluIENTViBvdXRwdXRcbiAgICByeE5lZWRzUXVvdGluZyA9IC9eXFxzfFxccyR8LHxcInxcXG4vLFxuICAgIHRyaW0gPSAoZnVuY3Rpb24oKSB7XG4gICAgICAvLyBGeCAzLjEgaGFzIGEgbmF0aXZlIHRyaW0gZnVuY3Rpb24sIGl0J3MgYWJvdXQgMTB4IGZhc3RlciwgdXNlIGl0IGlmIGl0IGV4aXN0c1xuICAgICAgaWYgKFN0cmluZy5wcm90b3R5cGUudHJpbSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocykge1xuICAgICAgICAgIHJldHVybiBzLnRyaW0oKTtcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXlxccyovLCBcIlwiKS5yZXBsYWNlKC9cXHMqJC8sIFwiXCIpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pKCk7XG5cbiAgZnVuY3Rpb24gY2hvbXAocywgbGluZXRlcm1pbmF0b3IpIHtcbiAgICBpZiAocy5jaGFyQXQocy5sZW5ndGggLSBsaW5ldGVybWluYXRvci5sZW5ndGgpICE9PSBsaW5ldGVybWluYXRvcikge1xuICAgICAgLy8gRG9lcyBub3QgZW5kIHdpdGggXFxuLCBqdXN0IHJldHVybiBzdHJpbmdcbiAgICAgIHJldHVybiBzO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZW1vdmUgdGhlIFxcblxuICAgICAgcmV0dXJuIHMuc3Vic3RyaW5nKDAsIHMubGVuZ3RoIC0gbGluZXRlcm1pbmF0b3IubGVuZ3RoKTtcbiAgICB9XG4gIH1cbn0pKENTVik7XG5cbi8vIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5IGZvciB1c2UgaW4gUmVjbGluZVxudmFyIHJlY2xpbmUgPSByZWNsaW5lIHx8IHt9O1xucmVjbGluZS5CYWNrZW5kID0gcmVjbGluZS5CYWNrZW5kIHx8IHt9O1xucmVjbGluZS5CYWNrZW5kLkNTViA9IENTVjtcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gQ1NWO1xufSIsIi8vdGhpcyBjb2RlIGlzIGVuaWVseSBiYXNlZCBvbiB0aGUgZGV2ZWxvcG1ldCBtYWRlIGluIHlvdXR1YmUgdmlkZW8gaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1seDVrOG9RSGFKUVxuLy9ieSBcInRoZSBNdXJhdG9yaXVtXCJcbmltcG9ydCBSZWFjdCwge3VzZVN0YXRlLHVzZVJlZix1c2VFZmZlY3R9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtWaXp9IGZyb20gJy4vVml6J1xuaW1wb3J0IHVzZUludGVydmFsIGZyb20gXCIuL3VzZUludGVydmFsXCI7XG5pbXBvcnQge2Nzdn0gZnJvbSAnZDMnO1xuaW1wb3J0IHtDU1Z9IGZyb20gJy4vQ1NWJztcblxuY29uc3Qgc29ja2V0ID0gaW8oKVxuXG5jb25zdCBjc3ZkYXRhPWlvLmNvbm5lY3QoXCJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vSm9uODNDYXJ2YWxoby9EYXRhQW5kQXJ0L21haW4vXCIpXG5cblxuXG5jb25zdCByYXdkYXRhPVt7XCJjb3VudFwiOjUwMDAsXCJtYXhcIjozNX0se1wiY291bnRcIjo1MDAwLFwibWF4XCI6MTAwfV07XG5cblxudmFyIGNzdlVybFxudmFyIGNzdkVtcHR5XG5cblxuXG5jb25zdCByb3c9ZD0+e1xuICBcdFx0XHRkLmNvdW50PStkLmNvdW50XG4gICAgICAgIGQubWF4PStkLm1heFxuICAgICAgIHJldHVybiAoZFxuICAgICAgICAgXG4gICAgICAgKTtcbiAgICB9O1xuXG5mdW5jdGlvbiBtYWtlaWQobGVuZ3RoKSB7XG4gICAgdmFyIHJlc3VsdCAgICAgICAgICAgPSAnJztcbiAgICB2YXIgY2hhcmFjdGVycyAgICAgICA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSc7XG4gICAgdmFyIGNoYXJhY3RlcnNMZW5ndGggPSBjaGFyYWN0ZXJzLmxlbmd0aDtcbiAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKyApIHtcbiAgICAgIHJlc3VsdCArPSBjaGFyYWN0ZXJzLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBcbiBjaGFyYWN0ZXJzTGVuZ3RoKSk7XG4gICB9XG4gICByZXR1cm4gcmVzdWx0O1xufVxuXG4vL2NzdlVybD0naHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0pvbjgzQ2FydmFsaG8vRGF0YUFuZEFydC9tYWluL0xvdmVXb3JkLmNzdj8nKyBNYXRoLnJhbmRvbSgpKjEwMCttYWtlaWQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwKSpNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTApKVxuXG5leHBvcnQgY29uc3QgQXBwPSgpPT57XG4gIGNvbnN0IFtpdGVyYXRpb24sIHNldEl0ZXJhdGlvbl0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW3N0YXJ0LCBzZXRTdGFydF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtkYXRhLCBzZXREYXRhXSA9IHVzZVN0YXRlKHJhd2RhdGEpO1xuICBjb25zdCBbcHJldmlvdXNkYXRhLCBzZXRwRGF0YV0gPSB1c2VTdGF0ZShyYXdkYXRhWzBdLm1heCk7XG4gIGNvbnN0IHN2Z1JlZiA9IHVzZVJlZigpO1xuICBcblxuICBcbiAgdXNlSW50ZXJ2YWwoKCkgPT4ge1xuICAgIGlmIChzdGFydCkge1xuICAgICAgXG4gICAgICBcbiAgICAgIHNldHBEYXRhKGRhdGFbMF0ubWF4KVxuICAgICAgLy9zZXREYXRhKGl0ZXJhdGlvbiUyPT09MD9yYXdkYXRhWzFdOnJhd2RhdGFbMF0pO1xuXG4gICAgICBjc3ZVcmw9J2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9Kb244M0NhcnZhbGhvL0RhdGFBbmRBcnQvbWFpbi9Mb3ZlV29yZC5jc3Y/dj0nKyBNYXRoLnJhbmRvbSgpKjEwMCttYWtlaWQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwKSpNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTApKVxuICAgICAgICAgIFxuICAgXHRcdC8vY3N2KGNzdlVybCxyb3cpLnRoZW4oc2V0RGF0YSk7XG4gICAgICBcbiAgICAgIFxuICAgIFxuICAgICAgQ1NWLmZldGNoKHtcbiAgICBcdHVybDogJ2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9Kb244M0NhcnZhbGhvL0RhdGFBbmRBcnQvbWFpbi9Mb3ZlV29yZC5jc3Y/JysgbWFrZWlkKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSoxMCkqTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwKSlcbiAgICBcdH1cblx0XHRcdCkuZG9uZShmdW5jdGlvbihkYXRhc2V0KSB7XG4gICAgICBzZXREYXRhKFt7XCJjb3VudFwiOmRhdGFzZXQucmVjb3Jkc1swXVswXSxcIm1heFwiOmRhdGFzZXQucmVjb3Jkc1swXVsxXX1dKSAgICBcblx0XHQgIH0pO1xuICAgICAgXG4gICAgICBcbiAgICAgIGlmKGRhdGEpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhWzBdLGNzdlVybClcbiAgICAgXG4gICAgICB9XG4gICAgICBcblxuICAgICAgc2V0SXRlcmF0aW9uKGl0ZXJhdGlvbiArIDEpO1xuXG4gICAgfVxuICB9LCAxMDApO1xuICBcbiAgcmV0dXJuIChcblxuICBcdDw+XG4gICAgPFZpeiB4PXtkYXRhWzBdLm1heH0gc3ZnUmVmPXtzdmdSZWZ9IHByZXZpb3VzeD17cHJldmlvdXNkYXRhfS8+XG4gICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFN0YXJ0KCFzdGFydCl9PlxuICAgICAgICB7c3RhcnQgPyBcIlN0YXJ0IGFuaW1hdGlvblwiIDogXCJFbmQgYW5pbWF0aW9uXCJ9XG4gICAgICA8L2J1dHRvbj5cbiAgICA8Lz5cbiAgKTtcbn1cblxuLy9leHBvcnQgY29uc3QgQXBwPWZ1bmN0aW9uKCl7XG4vLyAgY29uc3QgW2RhdGEsc2V0RGF0YV09dXNlU3RhdGUoaW5pdGlhbGRhdGEpO1xuLy8gIHJldHVybiA8Vml6Lz5cbi8vfVxuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IHtBcHB9IGZyb20gJy4vQXBwJztcblxuXG5cblxuY29uc3Qgd2lkdGg9OTYwOyBcbmNvbnN0IGhlaWdodD01MDA7XG5jb25zdCBtYXJnaW49e1xuICB0b3A6MCxcbiAgcmlnaHQ6MCxcbiAgYm90dG9tOjAsXG4gIGxlZnQ6MFxufTtcblxuY29uc3Qgcm9vdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9vdCcpO1xuXG5cblJlYWN0RE9NLnJlbmRlcig8QXBwLz4scm9vdEVsZW1lbnQpO1xuIl0sIm5hbWVzIjpbInVzZVJlZiIsInVzZUVmZmVjdCIsInNlbGVjdCIsIlJlYWN0IiwidXNlU3RhdGUiXSwibWFwcGluZ3MiOiI7Ozs7OztFQU1BO0FBQ0E7RUFDTyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRztFQUN6QztFQUNBLEVBQUUsTUFBTSxVQUFVLEdBQUdBLFlBQU0sRUFBRSxDQUFDO0FBQzlCO0VBQ0EsRUFBRUMsZUFBUyxDQUFDLElBQUk7RUFDaEIsR0FBRyxNQUFNLEdBQUcsQ0FBQ0MsU0FBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUM7RUFDbkM7RUFDQSxNQUFNLEdBQUc7RUFDVCxPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUM7RUFDMUIsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQzVCLE9BQU8sSUFBSSxDQUFDLEtBQUs7RUFDakIsWUFBWSxLQUFLO0VBQ2pCLGFBQWEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ3BDLGFBQWEsSUFBSSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUM7RUFDakMsWUFBWSxNQUFNO0VBQ2xCLFlBQVksTUFBTTtFQUNsQixhQUFhLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNwQyxhQUFhLElBQUksQ0FBQyxHQUFHLEVBQUUs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