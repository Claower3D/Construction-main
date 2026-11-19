package handlers

// Выгрузка сметы инженерных систем в Excel и PDF — без Python-сервиса.
// Excel собирается вручную (xlsx — это zip с XML), PDF — библиотекой fpdf со встроенным шрифтом
// DejaVu Sans (кириллица и знак тенге).

import (
	"archive/zip"
	"bytes"
	_ "embed"
	"encoding/xml"
	"fmt"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/go-pdf/fpdf"
)

//go:embed fonts/DejaVuSans.ttf
var engFontRegular []byte

//go:embed fonts/DejaVuSans-Bold.ttf
var engFontBold []byte

// engNow — время в Казахстане (сервер работает в UTC)
func engNow() time.Time {
	loc, err := time.LoadLocation("Asia/Almaty")
	if err != nil {
		loc = time.FixedZone("UTC+5", 5*3600)
	}
	return time.Now().In(loc)
}

// engTitle — «усть-каменогорск» → «Усть-Каменогорск»
func engTitle(s string) string {
	out := []rune(s)
	up := true
	for i, r := range out {
		if unicode.IsLetter(r) {
			if up {
				out[i] = unicode.ToUpper(r)
			}
			up = false
		} else {
			up = true
		}
	}
	return string(out)
}

// engMoney — 1234567 → «1 234 567»
func engMoney(v int64) string {
	s := strconv.FormatInt(v, 10)
	neg := strings.HasPrefix(s, "-")
	if neg {
		s = s[1:]
	}
	var b strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte(' ')
		}
		b.WriteRune(c)
	}
	if neg {
		return "-" + b.String()
	}
	return b.String()
}

func engVolumeText(v interface{}) string {
	switch x := v.(type) {
	case int64:
		return strconv.FormatInt(x, 10)
	case float64:
		return strconv.FormatFloat(x, 'f', 1, 64)
	}
	return fmt.Sprint(v)
}

func engVATLabel(rate float64) string {
	return fmt.Sprintf("НДС (%s%%)", strconv.FormatFloat(rate*100, 'g', -1, 64))
}

func engAreaText(a float64) string {
	return strconv.FormatFloat(a, 'f', -1, 64) + " м²"
}

// ───────────────────────── Excel ─────────────────────────

const (
	xsDefault   = 0
	xsTitle     = 1  // жирный 14
	xsSub       = 2  // жирный 11
	xsHead      = 3  // шапка таблицы
	xsCell      = 4  // ячейка с рамкой
	xsMoneyCell = 5  // деньги с рамкой
	xsSubLabel  = 6  // подытог: подпись
	xsSubMoney  = 7  // подытог: сумма
	xsBold12    = 8  // «Итого без НДС»
	xsBold12Mon = 9  //
	xsMoney     = 10 // деньги без рамки
	xsGreen14   = 11 // «ИТОГО С НДС»
	xsGreen14M  = 12 //
)

const engXlsxStyles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts>
<fonts count="7">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="12"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><color rgb="FF006400"/><name val="Calibri"/></font>
<font><sz val="11"/><name val="Calibri"/></font>
</fonts>
<fills count="4">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1A2744"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE8F5E9"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="13">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="164" fontId="4" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="164" fontId="5" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
</cellXfs>
</styleSheet>`

type xlsxSheet struct {
	rows   map[int][]string // номер строки → ячейки в порядке столбцов
	order  []int
	merges []string
}

func (s *xlsxSheet) add(row int, cell string) {
	if s.rows == nil {
		s.rows = map[int][]string{}
	}
	if _, ok := s.rows[row]; !ok {
		s.order = append(s.order, row)
	}
	s.rows[row] = append(s.rows[row], cell)
}

func xmlText(v string) string {
	var b bytes.Buffer
	_ = xml.EscapeText(&b, []byte(v))
	return b.String()
}

func (s *xlsxSheet) text(col string, row, style int, v string) {
	s.add(row, fmt.Sprintf(`<c r="%s%d" s="%d" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>`, col, row, style, xmlText(v)))
}

func (s *xlsxSheet) num(col string, row, style int, v string) {
	s.add(row, fmt.Sprintf(`<c r="%s%d" s="%d"><v>%s</v></c>`, col, row, style, v))
}

// формула вместе с посчитанным значением — чтобы число было видно и в программах, которые формулы не пересчитывают
func (s *xlsxSheet) formula(col string, row, style int, f string, v int64) {
	s.add(row, fmt.Sprintf(`<c r="%s%d" s="%d"><f>%s</f><v>%d</v></c>`, col, row, style, xmlText(f), v))
}

func (s *xlsxSheet) blank(col string, row, style int) {
	s.add(row, fmt.Sprintf(`<c r="%s%d" s="%d"/>`, col, row, style))
}

func (s *xlsxSheet) xml() string {
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` + "\n")
	b.WriteString(`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`)
	b.WriteString(`<cols><col min="1" max="1" width="5" customWidth="1"/><col min="2" max="2" width="40" customWidth="1"/>` +
		`<col min="3" max="3" width="10" customWidth="1"/><col min="4" max="4" width="8" customWidth="1"/>` +
		`<col min="5" max="5" width="15" customWidth="1"/><col min="6" max="6" width="18" customWidth="1"/></cols>`)
	b.WriteString(`<sheetData>`)
	for _, r := range s.order {
		fmt.Fprintf(&b, `<row r="%d">%s</row>`, r, strings.Join(s.rows[r], ""))
	}
	b.WriteString(`</sheetData>`)
	if len(s.merges) > 0 {
		fmt.Fprintf(&b, `<mergeCells count="%d">`, len(s.merges))
		for _, m := range s.merges {
			fmt.Fprintf(&b, `<mergeCell ref="%s"/>`, m)
		}
		b.WriteString(`</mergeCells>`)
	}
	b.WriteString(`</worksheet>`)
	return b.String()
}

func engExcelReport(e *engFull, vat float64) ([]byte, error) {
	sh := &xlsxSheet{}
	sh.text("A", 1, xsTitle, "СМЕТА — QazGost AI")
	sh.merges = append(sh.merges, "A1:F1")
	sh.text("A", 2, xsDefault, "Дата:")
	sh.text("B", 2, xsDefault, engNow().Format("02.01.2006"))
	sh.text("A", 3, xsDefault, "Город:")
	sh.text("B", 3, xsDefault, engTitle(e.City))
	sh.text("A", 4, xsDefault, "Площадь:")
	sh.text("B", 4, xsDefault, engAreaText(e.AreaM2))

	row := 6
	var subtotals []string
	for _, sys := range e.Systems {
		sh.text("A", row, xsSub, fmt.Sprintf("%s (%s)", sys.System, sys.SnipCode))
		sh.merges = append(sh.merges, fmt.Sprintf("A%d:F%d", row, row))
		row++
		for i, h := range []string{"№", "Наименование", "Объём", "Ед.", "Цена за ед.", "Сумма"} {
			sh.text(string(rune('A'+i)), row, xsHead, h)
		}
		row++
		first := row
		for i, it := range sys.Items {
			sh.num("A", row, xsCell, strconv.Itoa(i+1))
			sh.text("B", row, xsCell, it.Name)
			sh.num("C", row, xsCell, engVolumeText(it.Volume))
			sh.text("D", row, xsCell, it.Unit)
			sh.num("E", row, xsMoneyCell, strconv.FormatInt(it.UnitPrice, 10))
			sh.formula("F", row, xsMoneyCell, fmt.Sprintf("ROUND(C%d*E%d,0)", row, row), it.Total)
			row++
		}
		sh.text("A", row, xsSubLabel, fmt.Sprintf("Итого %s:", sys.System))
		for _, c := range []string{"B", "C", "D", "E"} {
			sh.blank(c, row, xsSubLabel)
		}
		sh.merges = append(sh.merges, fmt.Sprintf("A%d:E%d", row, row))
		if len(sys.Items) > 0 {
			sh.formula("F", row, xsSubMoney, fmt.Sprintf("SUM(F%d:F%d)", first, row-1), sys.TotalCost)
		} else {
			sh.num("F", row, xsSubMoney, strconv.FormatInt(sys.TotalCost, 10))
		}
		subtotals = append(subtotals, fmt.Sprintf("F%d", row))
		row += 2
	}

	nds := engRound(float64(e.GrandTotal) * vat)
	sh.text("A", row, xsBold12, "Итого без НДС:")
	if len(subtotals) > 0 {
		sh.formula("F", row, xsBold12Mon, fmt.Sprintf("SUM(%s)", strings.Join(subtotals, ",")), e.GrandTotal)
	} else {
		sh.num("F", row, xsBold12Mon, strconv.FormatInt(e.GrandTotal, 10))
	}
	grandRow := row
	row++
	sh.text("A", row, xsDefault, engVATLabel(vat)+":")
	sh.formula("F", row, xsMoney, fmt.Sprintf("ROUND(F%d*%s,0)", grandRow, strconv.FormatFloat(vat, 'g', -1, 64)), nds)
	ndsRow := row
	row++
	sh.text("A", row, xsGreen14, "ИТОГО С НДС:")
	sh.formula("F", row, xsGreen14M, fmt.Sprintf("F%d+F%d", grandRow, ndsRow), e.GrandTotal+nds)

	files := []struct{ name, body string }{
		{"[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`},
		{"_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
		{"xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Сводная смета" sheetId="1" r:id="rId1"/></sheets><calcPr fullCalcOnLoad="1"/></workbook>`},
		{"xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
		{"xl/styles.xml", engXlsxStyles},
		{"xl/worksheets/sheet1.xml", sh.xml()},
	}
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for _, f := range files {
		w, err := zw.Create(f.name)
		if err != nil {
			return nil, err
		}
		if _, err := w.Write([]byte(f.body)); err != nil {
			return nil, err
		}
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ───────────────────────── PDF ─────────────────────────

func engPDFReport(e *engFull, vat float64) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.AddUTF8FontFromBytes("dejavu", "", engFontRegular)
	pdf.AddUTF8FontFromBytes("dejavu", "B", engFontBold)
	pdf.SetMargins(18, 16, 18)
	pdf.SetAutoPageBreak(true, 16)
	pdf.AddPage()
	now := engNow()
	const width = 174.0 // ширина листа без полей

	pdf.SetFont("dejavu", "B", 18)
	pdf.CellFormat(width, 10, "СМЕТА № QG-"+now.Format("200601021504"), "", 1, "C", false, 0, "")
	pdf.SetFont("dejavu", "", 10)
	pdf.CellFormat(width, 6, "QazGost AI — автоматический расчёт", "", 1, "L", false, 0, "")
	pdf.CellFormat(width, 6, "Дата: "+now.Format("02.01.2006 15:04"), "", 1, "L", false, 0, "")
	pdf.Ln(1)
	pdf.SetDrawColor(128, 128, 128)
	pdf.Line(18, pdf.GetY(), 18+width, pdf.GetY())
	pdf.Ln(5)

	pdf.SetFont("dejavu", "B", 14)
	pdf.CellFormat(width, 8, "Информация об объекте", "", 1, "L", false, 0, "")
	pdf.Ln(1)
	pdf.SetFont("dejavu", "", 10)
	for _, r := range [][2]string{{"Город", engTitle(e.City)}, {"Площадь", engAreaText(e.AreaM2)}, {"Тип расчёта", "Полная смета"}} {
		pdf.SetFillColor(242, 242, 242)
		pdf.CellFormat(60, 8, r[0], "1", 0, "L", true, 0, "")
		pdf.CellFormat(100, 8, r[1], "1", 1, "L", false, 0, "")
	}
	pdf.Ln(8)

	cols := []float64{10, 74, 20, 16, 24, 30}
	aligns := []string{"C", "L", "R", "C", "R", "R"}
	for _, sys := range e.Systems {
		// заголовок системы не должен остаться внизу страницы без таблицы
		if pdf.GetY() > 240 {
			pdf.AddPage()
		}
		pdf.SetFont("dejavu", "B", 12)
		pdf.MultiCell(width, 7, fmt.Sprintf("%s (%s)", sys.System, sys.SnipCode), "", "L", false)
		pdf.Ln(1)
		pdf.SetFont("dejavu", "B", 9)
		pdf.SetFillColor(26, 39, 68)
		pdf.SetTextColor(255, 255, 255)
		for i, h := range []string{"№", "Наименование", "Объём", "Ед.", "Цена", "Сумма"} {
			pdf.CellFormat(cols[i], 7, h, "1", 0, "C", true, 0, "")
		}
		pdf.Ln(-1)
		pdf.SetTextColor(0, 0, 0)
		pdf.SetFont("dejavu", "", 9)
		for i, it := range sys.Items {
			row := []string{strconv.Itoa(i + 1), it.Name, engVolumeText(it.Volume), it.Unit, engMoney(it.UnitPrice), engMoney(it.Total) + " ₸"}
			for c, v := range row {
				pdf.CellFormat(cols[c], 7, v, "1", 0, aligns[c], false, 0, "")
			}
			pdf.Ln(-1)
		}
		pdf.SetFont("dejavu", "B", 9)
		pdf.SetFillColor(232, 245, 233)
		pdf.CellFormat(cols[0]+cols[1]+cols[2]+cols[3]+cols[4], 7, "ИТОГО:", "1", 0, "R", true, 0, "")
		pdf.CellFormat(cols[5], 7, engMoney(sys.TotalCost)+" ₸", "1", 1, "R", true, 0, "")
		pdf.Ln(6)
	}

	if pdf.GetY() > 245 {
		pdf.AddPage()
	}
	pdf.SetDrawColor(0, 0, 0)
	pdf.SetLineWidth(0.6)
	pdf.Line(18, pdf.GetY(), 18+width, pdf.GetY())
	pdf.SetLineWidth(0.2)
	pdf.Ln(3)
	nds := engRound(float64(e.GrandTotal) * vat)
	pdf.SetFont("dejavu", "", 11)
	pdf.CellFormat(124, 7, "Итого без НДС:", "", 0, "L", false, 0, "")
	pdf.CellFormat(50, 7, engMoney(e.GrandTotal)+" ₸", "", 1, "R", false, 0, "")
	pdf.CellFormat(124, 7, engVATLabel(vat)+":", "", 0, "L", false, 0, "")
	pdf.CellFormat(50, 7, engMoney(nds)+" ₸", "", 1, "R", false, 0, "")
	pdf.SetFont("dejavu", "B", 14)
	pdf.CellFormat(124, 9, "ИТОГО с НДС:", "", 0, "L", false, 0, "")
	pdf.CellFormat(50, 9, engMoney(e.GrandTotal+nds)+" ₸", "", 1, "R", false, 0, "")
	pdf.Ln(8)
	pdf.SetFont("dejavu", "", 9)
	pdf.MultiCell(width, 5, "Расчёт выполнен системой QazGost AI на основании действующих нормативов РК.", "", "L", false)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
