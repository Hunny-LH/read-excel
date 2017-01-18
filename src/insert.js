'use strict';
let fs = require('fs');
let XLSX = require('xlsx');

let workbooks = XLSX.readFile("./input2.xlsx");
let json = XLSX.utils.sheet_to_json(workbooks.Sheets["FUNCTION LIST"]);
// console.log(json[0]);
const nu = ['None', 'N/A', 'undefined'];
const TYPE = {
    单选列表: "select",
    文本框: "input"
}
//遍历行
let cursor = 39;
let paramId = 1;
let part;
let data = [];
json.map(function(value, index, arr){
    let isRowStart;
  
    if (value["TYPE_CODE"]) {
        isRowStart = true;
        cursor++;
        paramId = 1;
    } else {
        isRowStart = false;
        paramId++;
    }
    if (isRowStart) {
        
        data[cursor] = {
            ID: cursor,
            TYPE_CODE: value["TYPE_CODE"],
            TYPE_NAME: value["TYPE_NAME"],
            COMPONENT_CODE: value["COMPONENT_CODE"],
            COMPONENT_NAME: value["COMPONENT_NAME"],
            INPUT: replaceNone(replaceLine(value["INPUT"])),
            OUTPUT: replaceNone(replaceLine(value["OUTPUT"])),
            HAS_MODEL_PATH: /MODEL/ig.test(value["OUTPUT"])
        }
        if (nu.indexOf(value["PARAM_NAME"]) < 0) {
            if (value["PART"]) {
                part = value["PART"];
            }

            data[cursor]["PARAMS"] = [{
                    COMP_ID: cursor,
                    PARAM_ID: paramId,
                    PARAM_NAME: value["PARAM_NAME"],
                    PARAM_TYPE: replaceType(value["PARAM_TYPE"]),
                    PART: part,
                    FROM_TABLE: replaceGou(value["FROM_TABLE"]),
                    PLACEHOLDER: replaceNone(replaceLine(value["PLACEHOLDER"])),
                    DESCRIPTION: replaceNone(replaceLine(value["DESCRIPTION"])),
            }];
        }
    } else {
        if  (nu.indexOf(value["PARAM_NAME"] < 0 )) {
            if (value["PART"]) {
                part = value["PART"];
            }

            data[cursor]["PARAMS"].push({
                        COMP_ID: cursor,
                        PARAM_ID: paramId,
                        PARAM_NAME: value["PARAM_NAME"],
                        PARAM_TYPE: replaceType(value["PARAM_TYPE"]),
                        PART: part,
                        FROM_TABLE: replaceGou(value["FROM_TABLE"]),
                        PLACEHOLDER: replaceNone(replaceLine(value["PLACEHOLDER"])),
                        DESCRIPTION: replaceNone(replaceLine(value["DESCRIPTION"])),
            });
        }
    }
});

// console.log(nu.indexOf("N/A"));


data.map(function(value, index, arr){
    console.log("#############  保存组件 #############\n");
    // console.log(JSON.stringify(value));
    // console.log("========== row end ============\n");
    insertComponent(value);
    if (value.PARAMS) {
        value.PARAMS.map(function(v, i, a){
            console.log("#############  保存组件参数 ###############\n")
            insertParam(v);
        })
    }
});

function replaceLine(value) {
    return `${value}`.replace(/\r\n|&#10;/ig, ',');
}
function replaceGou(value) {
    return /√/ig.test(value);
}
function replaceNone(value) {
    return nu.indexOf(value) > 0 ? null : value;
}
function replaceType(value){
    return TYPE[value];
}
function insertComponent(value) {
    const insert_into_component = 
    `
    INSERT INTO ml_web.ml_component (
        ID, 
        TYPE_CODE, 
        TYPE_NAME, 
        COMPONENT_CODE, 
        COMPONENT_NAME,  
        INPUT, 
        OUTPUT, 
        HAS_MODEL_PATH, 
        CREATE_TIME, 
        CREATE_USER
    ) VALUES (
        ${value.ID}, 
        '${value.TYPE_CODE}', 
        '${value.TYPE_NAME}', 
        '${value.COMPONENT_CODE}', 
        '${value.COMPONENT_NAME}', 
        '${value.INPUT}',
        '${value.OUTPUT}', 
        ${value.HAS_MODEL_PATH},
        now(), 
        0
    );\n`
    console.log(insert_into_component);
    writeSQL('./insert_into_component.sql', insert_into_component);
}
function insertParam(value) {
    const insert_into_param = 
    `
    INSERT INTO ml_web.ml_component_param (
        COMP_ID,
        PARAM_ID,
        PARAM_NAME,
        PARAM_TYPE,
        PART,
        FROM_TABLE,
        PLACEHOLDER,
        DESCRIPTION,
        CREATE_TIME,
        CREATE_USER
    ) VALUES (
        ${value.COMP_ID}, 
        ${value.PARAM_ID}, 
        '${value.PARAM_NAME}', 
        '${value.PARAM_TYPE}', 
        '${value.PART}', 
        ${value.FROM_TABLE},
        '${value.PLACEHOLDER}',
        '${value.DESCRIPTION}',
        now(),
        0
    );\n`
     console.log(insert_into_param);
     writeSQL('./insert_into_param.sql', insert_into_param);
}

function writeSQL(path, data) {
    fs.appendFile(path, data,'utf8',function(err){
    if(err)  
    {  
        console.log(err);  
    }  
});  
}