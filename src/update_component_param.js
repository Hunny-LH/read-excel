'use strict';
let fs = require('fs');
let XLSX = require('xlsx');

let workbooks = XLSX.readFile("./input4.xlsm");
let json = XLSX.utils.sheet_to_json(workbooks.Sheets["FUNCTION LIST"]);

// 判断文件是否存在
fs.exists('update_component_param.sql', function (exists) {
    console.log(exists);
    fs.unlink('update_component_param.sql', function () {
        console.log('del update_component_param.sql success');
        buildDDL(json);
    });
});

function buildDDL(json) {
    json.map((value) => {
        let cid = value["COMP_ID"];
        let pcode = value["PARAMS_NAME_EN"];
        let pname = value["PARAMS_NAME_CH"];
        let pdesc = value["PARAMS_DESCRIPTION"];

        let sets = [];
        let conditions = [];

        if (cid) {
            conditions.push(` COMP_ID = ${cid} `)
        }
        if (pcode) {
            conditions.push(` PARAM_NAME = '${pcode}'`);
        }
        if (pname) {
            sets.push(` PARAM_SNAME = '${pname}' `);
        }
        if (pdesc) {
            sets.push(` DESCRIPTION = '${pdesc}' `);
        }

        if (sets.length == 0 && conditions.length == 0) {
            return;
        } else {
            outSQLDLL(sets, conditions)
        }
    });
}


function outSQLDLL(sets, conditions) {
    let sql = ` UPDATE ml_web.ml_component_param \n SET `;
    sets.forEach((v, i) => {
        if (i == sets.length - 1) {
            sql += ` \n\t ${v}`
        } else {
            sql += ` \n\t ${v} ,`;
        }
    });
    sql += '\n WHERE ';
    conditions.forEach((v, i) => {
        if (i == 0) {
            sql += ` \n\t ${v} `
        } else {
            sql += ` \n AND\t ${v}`
        }
    });
    sql += ' ;\n\n';
    console.log(sql);
    fs.appendFile("update_component_param.sql", sql, 'utf8', function (err) {
        if (err) {
            console.log(err);
        }
    });
}