import { IonFabButton, IonIcon } from '@ionic/react';
import { useEffect, useState } from 'react';
import { swapHorizontalOutline, arrowForward } from 'ionicons/icons';
import CodeMirror from '@uiw/react-codemirror';
import './ExploreContainer.css';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/eclipse.css';
const beautify = require("beautify");

interface ContainerProps { }

let timeout: any;

const ExploreContainer: React.FC<ContainerProps> = () => {
  const [output, setOutput] = useState<string>("Generating Output..");
  const [input, setInput] = useState<string>("");
  const [isTsToDart, setIsTsToDart] = useState<boolean>(true);

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
                console.log("VALUES X", values[x])
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
      console.log("RUNNING...")
      const result = generateClass(input[x][0], input[x][1]);
      output += result.class;
      console.log("CHILD CLASSES:", result.childClasses)
      result.childClasses.forEach(childClass => input.push(childClass));
    }
    return output;
  }

  const typescriptToDart = (inputTypescriptCode: string) => {
    inputTypescriptCode = beautify(inputTypescriptCode, {format: 'js'});
    const className: string = "";
    const parsedClasses = inputTypescriptCode.match(new RegExp(/class {0,}[A-Z|1-9]{0,} *{([^;]*)}/i)) ?? [];
    const resultingClasses: Array<string> = []; 
    for(let x = 0; x < parsedClasses.length; x++){
      const currentClass = parsedClasses[x];
      const className = currentClass.split("class ")[1].split(" ")[0];
      const constructorContents = currentClass.match(/constructor *\(([^;]*) *\)/g);


      const constructorAttributeParameters = constructorContents == null ? [] : constructorContents[0].match(/(public|private|protected) *[A-Za-z]*: *[A-Za-z]*/g);
      const stringConstructorAttrs = constructorContents == null ? [] : constructorContents[0].match(/(public|private|protected) *[A-Za-z]*(: string)*[A-Za-z]* *=* *("|')[A-Za-z]*("|')/g);
      const numberConstructorAttrs = constructorContents == null ? [] : constructorContents[0].match(/(public|private|protected) *[A-Za-z]*(: number)[A-Za-z]* *=* *([1-9][1-9]*)*/g);
      const arrayConstructorAttrs = constructorContents == null ? [] : constructorContents[0].match(/(public|private|protected) *[A-Za-z]*(: Array<[A-Za-z]{1,}>)[A-Za-z]* *=* *(\[([^;]*)\])*/g);
      const booleanConstructorAttrs = constructorContents == null ? [] : constructorContents[0].match(/(public|private|protected) *[A-Za-z]*(: boolean)( *=* *(\[([^;]*)\])*(true|false))*/g);
      // const objectConstructorAttrs = constructorContents == null ? [] : constructorContents[0].match();
    
      resultingClasses.push(
        currentClass
          .replaceAll(/constructor {0,}\(/gm, `${className} (`)
          .replaceAll(/public */i, "")
          .replaceAll(/private */i, "_")
      );
    }
    // inputTypescriptCode.replaceAll(new RegExp(/constructor.{0,}\(/gm), "")

  }

  // const dartToTypescript = (inputDartCode: string) => {
  //   inputDartCode = beautify(inputDartCode, {format: 'js'});
  // }

  const generateOutput = (event: any): void => {
    clearTimeout(timeout);
    setInput(event.getValue());
    const jsonInput = event.getValue();
    if(jsonInput === ""){
      return;
    }
    const parsedInput: Record<string, any> = JSON.parse(jsonInput);
    timeout = setTimeout(() => {
      if(typeof(parsedInput) != "object" || Array.isArray(parsedInput)){
        setOutput("invalid json input");
        return;
      }
      setOutput(beautify(jsonToDart("RootObject", parsedInput), {format: 'js'}));
    }, 3000);
  }

  return (
    <div className="container">
      <div className="ad-container"></div>

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
        {/* <IonFabButton onClick={() => {console.log(isTsToDart); setIsTsToDart(!isTsToDart);}}>
          <IonIcon icon={arrowForward}></IonIcon>
        </IonFabButton> */}
      </div>

      <div className="output-box">
        <CodeMirror
            value={input === "" ? `// Waiting for ${isTsToDart ? "Typescript" : "Dart"} input` : output}
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


