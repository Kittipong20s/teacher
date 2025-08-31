// src/utils/file.js

// ---------- CSV ----------
export function downloadCsv(rows = [], filename = 'export.csv') {
  // rows: Array<Array<string|number|null|undefined>>
  const toCell = (v) => {
    const s = String(v ?? '');
    // escape " -> ""
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = rows.map(r => r.map(toCell).join(',')).join('\r\n');
  // ใส่ BOM เพื่อกันภาษาไทยเพี้ยนใน Excel
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, ensureExt(filename, '.csv'));
}

// ---------- XLS (Excel XML; เปิดด้วย Excel ได้) ----------
/**
 * exportToXlsx(sheets, filename)
 * sheets: [{ name: 'Sheet1', rows: Array<Object> | Array<Array>> }]
 * - ถ้าเป็น Array<Object> จะใช้ union ของ keys เป็นหัวตาราง
 * - ถ้าเป็น Array<Array> แถวแรกถือเป็น header
 * หมายเหตุ: ไฟล์ที่สร้างเป็น SpreadsheetML (.xls) เพื่อเลี่ยงการพึ่งพาไลบรารี zip/OOXML
 */
export async function exportToXlsx(sheets = [], filename = 'export.xlsx') {
  if (!Array.isArray(sheets) || sheets.length === 0) {
    console.warn('exportToXlsx: empty sheets');
    return;
  }

  const escXml = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const renderCell = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) {
      return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
    }
    // force string (รองรับไทย)
    return `<Cell><Data ss:Type="String">${escXml(String(v ?? ''))}</Data></Cell>`;
  };

  const renderSheet = ({ name = 'Sheet1', rows = [] }) => {
    let header = [];
    let body = [];

    if (rows.length === 0) {
      // แผ่นเปล่า
      return `
      <Worksheet ss:Name="${escXml(name)}">
        <Table>
        </Table>
      </Worksheet>`;
    }

    if (Array.isArray(rows[0]) && !isPlainObject(rows[0])) {
      // โหมด Array<Array> — ใช้แถวแรกเป็น header
      header = rows[0];
      body = rows.slice(1);
    } else {
      // โหมด Array<Object> — รวม keys เป็นหัวตาราง
      const keySet = new Set();
      rows.forEach(r => Object.keys(r || {}).forEach(k => keySet.add(k)));
      header = Array.from(keySet);
      body = rows.map(r => header.map(h => r?.[h]));
    }

    const headerXml = `<Row>${header.map(h => renderCell(h)).join('')}</Row>`;
    const bodyXml = body.map(r => `<Row>${r.map(c => renderCell(c)).join('')}</Row>`).join('');

    return `
      <Worksheet ss:Name="${escXml(name)}">
        <Table>
          ${headerXml}
          ${bodyXml}
        </Table>
        <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
          <DisplayGridlines/>
        </WorksheetOptions>
      </Worksheet>`;
  };

  const workbookXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
 xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Kanit" ss:Size="11"/>
    </Style>
  </Styles>
  ${sheets.map(renderSheet).join('')}
</Workbook>`;

  const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel' });
  // บังคับนามสกุลให้เป็น .xls เพื่อเลี่ยง warning ของ Excel
  const safeName = ensureExt(filename.replace(/\.xlsx$/i, '.xls'), '.xls');
  triggerDownload(blob, safeName);
}

// ---------- helpers ----------
function triggerDownload(blob, filename = 'download') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ensureExt(name, ext) {
  if (!ext) return name;
  return name.toLowerCase().endsWith(ext.toLowerCase()) ? name : name + ext;
}

function isPlainObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}