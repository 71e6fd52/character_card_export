import * as XLSX from './xlsx.mjs'
// import * as XLSX from 'xlsx'
// import 'xlsx';

function isMergedStart(sheet: XLSX.Sheet, cell: XLSX.CellAddress): boolean {
  return sheet['!merges'].find((i: XLSX.Range) => JSON.stringify(i.s) === JSON.stringify(cell)) != null;
}

function getCell(sheet: XLSX.Sheet, ref: XLSX.CellAddress): XLSX.CellObject | undefined {
  return sheet[XLSX.utils.encode_cell(ref)];
}

function getValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value;
}

async function handleFileAsync(e: Event) {
  const out = document.getElementById("result") as HTMLElement;
  const files = (document.getElementById("input_xlsx") as HTMLInputElement).files;
  if (files == null || files.length == 0) {
    out.innerText = '未上传文件';
    return;
  }

  const START_ROW = XLSX.utils.decode_row(getValue("start_row"));
  const END_ROW = XLSX.utils.decode_row(getValue("end_row"));
  const FIRST_COLUMN = XLSX.utils.decode_col(getValue("first_column"));
  const SECOND_COLUMN = XLSX.utils.decode_col(getValue("second_column"));

  const DEFAULT = (document.getElementById("ignore_default") as HTMLInputElement).checked ?
    'ignore' :
    (document.getElementById("zero_default") as HTMLInputElement).checked ?
      'zero' :
      'remain';
  const OMEGA = (document.getElementById("delete_omega") as HTMLInputElement).checked ?
    'delete' : 'remain';

  const FORMAT = getValue("format") as 'json' | 'hktrpg'

  out.innerText = '';
  const file = files[0];
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets['人物卡'];

  const result: { [key: string]: number } = {};

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

    if (name == undefined) { continue; }
    if (init == undefined) { continue; }
    if (value == undefined) { continue; }
    const init_v = init.v as number;
    const value_v = value.v as number;

    let name_v = name.w!;
    if (name_v.endsWith("Ω")) {
      if (OMEGA == 'delete') { continue; }
      name_v = name_v.slice(0, -1)
    }
    name_v = name_v.trim();

    if (init_v == value_v && DEFAULT != 'remain') {
      switch (DEFAULT) {
        case 'ignore': continue;
        case 'zero':
          result[name_v] = -1;
          break;
        default:
          const _check: never = DEFAULT;
      }
    } else {
      result[name_v] = value_v;
    }
  }

  switch (FORMAT) {
    case 'json':
      out.innerText = JSON.stringify(result);
      break;
    case 'hktrpg':
    default:
      out.innerText = 'unsupported'
  }
}

(document.getElementById("submit") as HTMLElement).addEventListener("click", handleFileAsync, false);

// collapsible
(document.getElementsByClassName("collapsible")[0] as HTMLElement).addEventListener("click", function () {
  this.classList.toggle("active");
  var content = this.nextElementSibling as HTMLElement;
  if (content.style.display === "flex") {
    content.style.display = "none";
  } else {
    content.style.display = "flex";
  }
});
