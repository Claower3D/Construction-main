package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"reflect"
	"strings"

	"qazgost-ai/backend/pkg/services"
)

// SmetaHandler — расчёт сметы по технологическим картам и реальным ценам.
type SmetaHandler struct {
	priceDB *services.PriceDBService
}

func NewSmetaHandler() *SmetaHandler {
	h := &SmetaHandler{priceDB: services.GetPriceDBService()}
	go services.WarmSmetaAudit(h.priceDB) // аналоги в базе для «Детального» режима — заранее, в фоне
	return h
}

// TechMaps — GET /api/v1/estimate/techmaps: категории, их параметры, комплексы и регионы.
func (h *SmetaHandler) TechMaps(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	maps, complexes := services.SmetaTechMapList()
	w.Header().Set("Cache-Control", "public, max-age=300")
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"techmaps":  maps,
		"complexes": complexes,
		"regions":   services.SmetaRegions(h.priceDB),
		"priceDate": services.SmetaPriceDate,
	})
}

// Calc — POST /api/v1/estimate/calc
func (h *SmetaHandler) Calc(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	var req services.SmetaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, decodeErrorText(err))
		return
	}
	res, err := services.CalcSmeta(req, h.priceDB)
	if err != nil {
		var se services.SmetaError
		if errors.As(err, &se) {
			writeError(w, http.StatusBadRequest, se.Msg)
			return
		}
		log.Printf("smeta: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось рассчитать смету")
		return
	}
	writeJSON(w, http.StatusOK, res)
}

// Названия полей запроса для сообщений об ошибках — без внутренних имён структур Go.
var smetaFieldNames = map[string]string{
	"area": "площадь", "perimeter": "периметр", "height": "высота стен", "doors": "число дверей",
	"windows": "число окон", "category": "вид работ", "complex": "комплекс работ", "mode": "режим",
	"city": "город", "params": "параметры", "geometry": "размеры",
}

// decodeErrorText — понятная причина, почему тело запроса не разобрано.
func decodeErrorText(err error) string {
	var typeErr *json.UnmarshalTypeError
	var syntaxErr *json.SyntaxError
	var tooBig *http.MaxBytesError
	switch {
	case errors.As(err, &tooBig):
		return "Запрос слишком большой (больше 64 КБ)"
	case errors.As(err, &typeErr):
		field := typeErr.Field
		if i := strings.LastIndex(field, "."); i >= 0 {
			field = field[i+1:]
		}
		name, ok := smetaFieldNames[field]
		if !ok {
			name = "«" + field + "»"
		}
		want := "числом"
		switch typeErr.Type.Kind() {
		case reflect.String:
			want = "строкой"
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			want = "целым числом"
		case reflect.Map, reflect.Struct:
			want = "объектом"
		}
		return "Некорректный запрос: поле " + name + " должно быть " + want
	case errors.As(err, &syntaxErr), errors.Is(err, io.ErrUnexpectedEOF):
		return "Некорректный запрос: тело не является корректным JSON"
	case errors.Is(err, io.EOF):
		return "Некорректный запрос: пустое тело"
	}
	return "Некорректный запрос"
}
