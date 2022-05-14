import * as XLSX from './xlsx.mjs'

let START_ROW: number;
let END_ROW: number;
let FIRST_COLUMN: number;
let SECOND_COLUMN: number;

let DEFAULT: 'ignore' | 'zero' | 'remain';
let OMEGA: "delete" | "remain";
let FORMAT: 'json' | 'hktrpg';

type HashMap = { [key: string]: number };
type StateValue = { now: number, max?: number };

function isMergedStart(sheet: XLSX.Sheet, cell: XLSX.CellAddress): boolean {
  return sheet['!merges'].find((i: XLSX.Range) => JSON.stringify(i.s) === JSON.stringify(cell)) != null;
}

function getCell(sheet: XLSX.Sheet, ref: XLSX.CellAddress): XLSX.CellObject | undefined {
  return sheet[XLSX.utils.encode_cell(ref)];
}

function getValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value;
}

function getCellByGlobalRef(workbook: XLSX.WorkBook, ref: string): XLSX.CellObject | undefined {
  let refa = ref.split("!")
  return workbook.Sheets[refa[0]][refa[1]?.replace(/\$/g, "")];
}

function extractSkills(workbook: XLSX.WorkBook): HashMap {
  const sheet = workbook.Sheets['人物卡'];

  const skills: { [key: string]: number } = {};

  let j = FIRST_COLUMN;
  for (let i = START_ROW; i <= END_ROW || j == FIRST_COLUMN; ++i) {
    if (i > END_ROW) { throw "iterate out of table" }

    const name = isMergedStart(sheet, { c: j + 2, r: i }) ?
      getCell(sheet, { c: j + 2, r: i }) :
      getCell(sheet, { c: j, r: i })
    const init = getCell(sheet, { c: j + 4, r: i })
    const value = getCell(sheet, { c: j + 12, r: i })

    if (i == END_ROW && j == FIRST_COLUMN) {
      j = SECOND_COLUMN; i = START_ROW;
    }

    if (name?.w == undefined) { continue; }
    if (init == undefined) { continue; }
    if (value == undefined) { continue; }
    const init_v = init.v as number;
    const value_v = value.v as number;

    let name_v = name.w;
    if (name_v.endsWith("Ω")) {
      if (OMEGA == 'delete') { continue; }
      name_v = name_v.slice(0, -1)
    }
    name_v = name_v.trim();

    if (init_v == value_v && DEFAULT != 'remain') {
      switch (DEFAULT) {
        case 'ignore': continue;
        case 'zero':
          skills[name_v] = -1;
          break;
        default:
          const _check: never = DEFAULT;
      }
    } else {
      skills[name_v] = value_v;
    }
  }

  return skills;
}

function extractCharacteristics(workbook: XLSX.WorkBook): HashMap | undefined {
  if (workbook.Workbook?.Names == undefined) { return undefined; }

  const characteristics: { [key: string]: number } = {};
  const characteristics_names = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'EDU', 'INT', 'POW', 'Luck'];
  for (const name of workbook.Workbook.Names) {
    if (!characteristics_names.includes(name.Name)) { continue }
    if (name.Name == 'Luck') {
      characteristics['LUK'] = getCellByGlobalRef(workbook, name.Ref)!.v as number;
    } else {
      characteristics[name.Name] = getCellByGlobalRef(workbook, name.Ref)!.v as number;
    }
  }

  if (characteristics == {}) { return undefined; }
  return characteristics;
}

function extractStates(workbook: XLSX.WorkBook): { [key: string]: StateValue } | undefined {
  if (workbook.Workbook?.Names == undefined) { return undefined; }

  const states: { [key: string]: StateValue } = {};
  const states_names = ['HP', 'MP', 'SAN'];
  for (const name of states_names) {
    let s = workbook.Workbook.Names.find((r) => r.Name == name)
    let sm = workbook.Workbook.Names.find((r) => r.Name == name + "_MAX")
    if (s == undefined) { continue; }

    states[name] = { now: getCellByGlobalRef(workbook, s.Ref)!.v as number }

    if (sm != undefined) {
      states[name].max = getCellByGlobalRef(workbook, sm.Ref)!.v as number
    }

  }

  if (states == {}) { return undefined; }
  return states;
}

function process(workbook: XLSX.WorkBook): string {
  let result: {
    name: string,
    skills: HashMap,
    characteristics?: HashMap,
    states?: { [key: string]: StateValue }
  } = { name: workbook.Sheets['人物卡']['E3']!.w!, skills: extractSkills(workbook) };

  result.characteristics = extractCharacteristics(workbook);
  result.states = extractStates(workbook);
  let result_str = '';

  switch (FORMAT) {
    case 'json':
      return JSON.stringify(result, null, 2);
    case 'hktrpg':
      result_str = `.char edit name[${result.name}]~\n`
      if (result.states != undefined) {
        result_str += 'state['
        for (const st of Object.keys(result.states)) {
          result_str += `${st}:${result.states[st].now}`
          if (result.states[st].max != undefined) {
            result_str += `/${result.states[st].max}`
          }
          result_str += ';'
        }
        result_str += ']~\n'
      }
      result_str += 'roll['
      result_str += 'sc:cc {san} SanCheck;'
      for (const st of Object.keys(result.skills)) {
        result_str += `${st}:cc ${result.skills[st]} ${st};`
      }
      if (result.characteristics != undefined) {
        for (const st of Object.keys(result.characteristics)) {
          result_str += `${st}:cc ${result.characteristics[st]} ${st};`
        }
      }
      result_str += ']~\n'
      break;
    default:
      result_str = 'unsupported'
  }
  return result_str;
}

async function handleFileAsync(_e: Event) {
  document.getElementById("submit")!.setAttribute("aria-busy", "true")

  const out = document.getElementById("result") as HTMLElement;
  out.style.display = "block";
  const files = (document.getElementById("input_xlsx") as HTMLInputElement).files;
  if (files == null || files.length == 0) {
    out.innerText = '未上传文件';
    document.getElementById("submit")!.setAttribute("aria-busy", "false")
    return;
  }
  const file = files[0];
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);

  START_ROW = XLSX.utils.decode_row(getValue("start_row"));
  END_ROW = XLSX.utils.decode_row(getValue("end_row"));
  FIRST_COLUMN = XLSX.utils.decode_col(getValue("first_column"));
  SECOND_COLUMN = XLSX.utils.decode_col(getValue("second_column"));

  DEFAULT = (document.getElementById("ignore_default") as HTMLInputElement).checked ?
    'ignore' :
    (document.getElementById("zero_default") as HTMLInputElement).checked ?
      'zero' :
      'remain';
  OMEGA = (document.getElementById("delete_omega") as HTMLInputElement).checked ?
    'delete' : 'remain';

  FORMAT = getValue("format") as 'json' | 'hktrpg'

  out.innerText = process(workbook);

  document.getElementById("submit")!.setAttribute("aria-busy", "false")
}

(document.getElementById("submit") as HTMLElement).addEventListener("click", handleFileAsync, false);
