var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as XLSX from './xlsx.mjs';
let START_ROW;
let END_ROW;
let FIRST_COLUMN;
let SECOND_COLUMN;
let DEFAULT;
let OMEGA;
function isMergedStart(sheet, cell) {
    return sheet['!merges'].find((i) => JSON.stringify(i.s) === JSON.stringify(cell)) != null;
}
function getCell(sheet, ref) {
    return sheet[XLSX.utils.encode_cell(ref)];
}
function getValue(id) {
    return document.getElementById(id).value;
}
function getCellByGlobalRef(workbook, ref) {
    var _a;
    let refa = ref.split("!");
    return workbook.Sheets[refa[0]][(_a = refa[1]) === null || _a === void 0 ? void 0 : _a.replace(/\$/g, "")];
}
function extractSkills(workbook) {
    const sheet = workbook.Sheets['人物卡'];
    const skills = {};
    let j = FIRST_COLUMN;
    for (let i = START_ROW; i <= END_ROW || j == FIRST_COLUMN; ++i) {
        if (i > END_ROW) {
            throw "iterate out of table";
        }
        const name = isMergedStart(sheet, { c: j + 2, r: i }) ?
            getCell(sheet, { c: j + 2, r: i }) :
            getCell(sheet, { c: j, r: i });
        const init = getCell(sheet, { c: j + 4, r: i });
        const value = getCell(sheet, { c: j + 12, r: i });
        if (i == END_ROW && j == FIRST_COLUMN) {
            j = SECOND_COLUMN;
            i = START_ROW;
        }
        if ((name === null || name === void 0 ? void 0 : name.w) == undefined) {
            continue;
        }
        if (init == undefined) {
            continue;
        }
        if (value == undefined) {
            continue;
        }
        const init_v = init.v;
        const value_v = value.v;
        let name_v = name.w;
        if (name_v.endsWith("Ω")) {
            if (OMEGA == 'delete') {
                continue;
            }
            name_v = name_v.slice(0, -1);
        }
        name_v = name_v.trim();
        if (init_v == value_v && DEFAULT != 'remain') {
            switch (DEFAULT) {
                case 'ignore': continue;
                case 'zero':
                    skills[name_v] = -1;
                    break;
                default:
                    const _check = DEFAULT;
            }
        }
        else {
            skills[name_v] = value_v;
        }
    }
    return skills;
}
function extractCharacteristics(workbook) {
    var _a;
    if (((_a = workbook.Workbook) === null || _a === void 0 ? void 0 : _a.Names) == undefined) {
        return undefined;
    }
    const characteristics = {};
    const characteristics_names = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'EDU', 'INT', 'POW'];
    for (const name of workbook.Workbook.Names) {
        if (!characteristics_names.includes(name.Name)) {
            continue;
        }
        characteristics[name.Name] = getCellByGlobalRef(workbook, name.Ref).v;
    }
    if (characteristics == {}) {
        return undefined;
    }
    return characteristics;
}
function extractStates(workbook) {
    var _a;
    if (((_a = workbook.Workbook) === null || _a === void 0 ? void 0 : _a.Names) == undefined) {
        return undefined;
    }
    const states = {};
    const states_names = ['HP', 'MP', 'SAN'];
    for (const name of states_names) {
        let s = workbook.Workbook.Names.find((r) => r.Name == name);
        let sm = workbook.Workbook.Names.find((r) => r.Name == name + "_MAX");
        if (s == undefined) {
            continue;
        }
        states[name] = { now: getCellByGlobalRef(workbook, s.Ref).v };
        if (sm != undefined) {
            states[name].max = getCellByGlobalRef(workbook, sm.Ref).v;
        }
    }
    if (states == {}) {
        return undefined;
    }
    return states;
}
function handleFileAsync(e) {
    return __awaiter(this, void 0, void 0, function* () {
        const out = document.getElementById("result");
        const files = document.getElementById("input_xlsx").files;
        if (files == null || files.length == 0) {
            out.innerText = '未上传文件';
            return;
        }
        START_ROW = XLSX.utils.decode_row(getValue("start_row"));
        END_ROW = XLSX.utils.decode_row(getValue("end_row"));
        FIRST_COLUMN = XLSX.utils.decode_col(getValue("first_column"));
        SECOND_COLUMN = XLSX.utils.decode_col(getValue("second_column"));
        DEFAULT = document.getElementById("ignore_default").checked ?
            'ignore' :
            document.getElementById("zero_default").checked ?
                'zero' :
                'remain';
        OMEGA = document.getElementById("delete_omega").checked ?
            'delete' : 'remain';
        const FORMAT = getValue("format");
        out.innerText = '';
        const file = files[0];
        const data = yield file.arrayBuffer();
        const workbook = XLSX.read(data);
        let result = { name: workbook.Sheets['人物卡']['E3'].w, skills: extractSkills(workbook) };
        result.characteristics = extractCharacteristics(workbook);
        result.states = extractStates(workbook);
        switch (FORMAT) {
            case 'json':
                out.innerText = JSON.stringify(result, null, 2);
                break;
            case 'hktrpg':
                out.innerText = `.char edit name[${result.name}]~\n`;
                if (result.states != undefined) {
                    out.innerText += 'state[';
                    for (const st of Object.keys(result.states)) {
                        out.innerText += `${st}:${result.states[st].now}`;
                        if (result.states[st].max != undefined) {
                            out.innerText += `/${result.states[st].max}`;
                        }
                        out.innerText += ';';
                    }
                    out.innerText += ']~\n';
                }
                out.innerText += 'roll[';
                for (const st of Object.keys(result.skills)) {
                    out.innerText += `${st}:cc ${result.skills[st]} ${st};`;
                }
                if (result.characteristics != undefined) {
                    for (const st of Object.keys(result.characteristics)) {
                        out.innerText += `${st}:cc ${result.characteristics[st]} ${st};`;
                    }
                }
                out.innerText += ']~\n';
                break;
            default:
                out.innerText = 'unsupported';
        }
    });
}
document.getElementById("submit").addEventListener("click", handleFileAsync, false);
// collapsible
document.getElementsByClassName("collapsible")[0].addEventListener("click", function () {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "flex") {
        content.style.display = "none";
    }
    else {
        content.style.display = "flex";
    }
});
