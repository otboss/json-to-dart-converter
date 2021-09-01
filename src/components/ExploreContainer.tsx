import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import './ExploreContainer.css';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/eclipse.css';
import GoogleAdsense from 'react-adsense-google';
import createDOMPurify from 'dompurify';
const beautify = require("beautify");

interface ContainerProps { }

const ExploreContainer: React.FC<ContainerProps> = () => {
  const [output, setOutput] = useState<string>("Generating Output..");
  const [input, setInput] = useState<string>("");
  const [ad, setAd] = useState<any>();
  const [adHor, setAdHor] = useState<any>();

  const toTitleCase = (str: string) =>  {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

  const generateClass = (className: string, attributes: Record<string, any>): {class: string, childClasses: Array<{0: string, 1: Record<string, any>}>} => {
    const childClasses: Array<{0: string, 1: Record<string, any>}> = [];
    return {
      class: `class ${toTitleCase(className)} {
      ${((): string => {
          let res: string = "";
          const keys = Object.keys(attributes);
          const values = Object.values(attributes);
          for (let x = 0; x < keys.length; x++) {
            switch (typeof (values[x])) {
              case "string":
                res += `String ${keys[x]};\n`;
                break;
              case "boolean":
                res += `bool ${keys[x]};\n`;
                break;
              case "number":
                res += `String ${keys[x]};\n`;
                break;
              case "object":
                if(values[x] == null){
                  res += `dynamic ${keys[x]};\n`;
                }
                else if (!Array.isArray(values[x])) {
                  res += `${toTitleCase(keys[x])} ${keys[x]};\n`;
                  childClasses.push([keys[x], values[x]]);
                } else {
                  res += `List ${keys[x]};\n`;
                }
                break;
              default:
                res += `dynamic ${keys[x]};\n`;
                break;
            }
          }
          return res;
        })()}
      ${toTitleCase(className)}(
        ${((): string => {
          let res: string = "";
          const keys = Object.keys(attributes);        
          for (let x = 0; x < keys.length; x++) {
            res += `this.${keys[x]},\n`;
          }
          return res;
        })()});

        factory ${toTitleCase(className)}.fromJSON(Map<String, dynamic> json) => ${toTitleCase(className)}(
          ${(() => {
            let res: string = "";
            const keys = Object.keys(attributes);  
            for (let x = 0; x < keys.length; x++) {
              res += `json["${keys[x]}"],\n`;
            }
            return res;            
          })()});

        Map<String, dynamic> toJSON() => {
          ${(() => {
            let res: string = "";
            const keys = Object.keys(attributes);  
            for (let x = 0; x < keys.length; x++) {
              res += `"${keys[x]}": this.${keys[x]},\n`;
            }
            return res;              
          })()}};
    }\n\n`,
      childClasses
    };
  }

  const jsonToDart = (className: string, jsonInput: Record<string, any>): string => {
    let output = "";
    const input: Array<{0: string, 1: Record<string, any>}> = [[className, jsonInput]];
    for(let x = 0; x < input.length; x++){
      const result = generateClass(input[x][0], input[x][1]);
      output += result.class;
      result.childClasses.forEach(childClass => input.push(childClass));
    }
    return output;
  }

  const generateOutput = (event: any): void => {
    setInput(event.getValue());
    const jsonInput = event.getValue();
    if(jsonInput === ""){
      return;
    }
    try{
      const parsedInput: Record<string, any> = JSON.parse(jsonInput);
      if(typeof(parsedInput) != "object" || Array.isArray(parsedInput) || parsedInput == null){
        setOutput("// invalid json input");
        return;
      }
      setOutput(beautify(jsonToDart("RootObject", parsedInput), {format: 'js'}));
    }
    catch(err){
      setOutput("// invalid json input");
    }
  }

  const DOMPurify = createDOMPurify(window);

  const bannerVertical = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3393367941652401"
      crossorigin="anonymous"></script>
    <ins class="adsbygoogle"
      style="display:block; text-align:center;"
      data-ad-layout="in-article"
      data-ad-format="fluid"
      data-ad-client="ca-pub-3393367941652401"
      data-ad-slot="9859033054"></ins>
    <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
    </script>`;

  const bannerHorizontal = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3393367941652401"
      crossorigin="anonymous"></script>
    <ins class="adsbygoogle"
      style="display:block; text-align:center;"
      data-ad-layout="in-article"
      data-ad-format="fluid"
      data-ad-client="ca-pub-3393367941652401"
      data-ad-slot="5653012974"></ins>
    <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
    </script>` 

  const stringToHTML = function (str: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.body;
  };


  // useEffect(() => {
  //   setAd(<GoogleAdsense
  //     adClient='ca-pub-3393367941652401'
  //     adSlot='9859033054'
  //   />);
  //   setAdHor(<GoogleAdsense
  //     adClient='ca-pub-3393367941652401'
  //     adSlot='5653012974'
  //   />);
  // }, []);

  return (
    <div className="container">
      <div className="ad-container">
        <div className="ad-banner-vertical">
          {/* {ad} */}
        </div>
        <div className="ad-banner-horizontal">
          {/* {adHor} */}
        </div>
      </div>

      <div className="input-box">
        <CodeMirror
          onChange={generateOutput}
          options={{
            theme: "eclipse",
            tabSize: 2,
            lineNumbers: false,
            keyMap: 'sublime',
            mode: 'typescript',
          }}
        />
      </div>

      <div className="controls">

      </div>

      <div className="output-box">
        <CodeMirror
            value={input === "" ? `// Waiting for JSON input` : output}
            options={{
              readOnly: true,
              lineNumbers: false,
              theme: "eclipse",
              tabSize: 2,
              keyMap: 'sublime',
              mode: 'dart',
            }}
          />
      </div>
    </div>
  );
};

export default ExploreContainer;


