package handlers

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"qazgost-ai/backend/pkg/database"
)

// Учебные примеры для своей модели дефектов.
//
//	POST   /api/v1/defect-samples                 (вход обязателен) — сохранить фото и проверенные зоны
//	GET    /api/v1/admin/defect-samples           (админ) — сколько примеров и по каким классам
//	GET    /api/v1/admin/defect-samples/export    (админ) — ZIP: images/, labels/ (YOLO), classes.txt
//	DELETE /api/v1/admin/defect-samples?id=…      (админ)
//
// Архив распаковывается в ai-service/dataset/own — оттуда его берёт scripts/train_qazgost.py.

// Классы — как в ai-service/scripts/train_qazgost.py (CLASS_NAMES)
var defectSampleClasses = []string{"crack", "corrosion", "spalling", "efflorescence", "exposed_rebar", "stain"}

const (
	defectSampleMaxPhoto = 1536 << 10 // байт JPEG
	defectSampleMaxZones = 60
)

type defectSampleZone struct {
	Cls    int     `json:"cls"`
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	W      float64 `json:"w"`
	H      float64 `json:"h"`
	Origin string  `json:"origin,omitempty"`
}

type DefectSampleHandler struct{}

func NewDefectSampleHandler() *DefectSampleHandler { return &DefectSampleHandler{} }

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}

// Save handles POST /api/v1/defect-samples
func (h *DefectSampleHandler) Save(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	uid, _ := currentUser(r)
	if uid == "" {
		writeError(w, http.StatusUnauthorized, "Войдите в аккаунт, чтобы сохранять примеры")
		return
	}
	var req struct {
		Photo   string             `json:"photo"`
		Width   int                `json:"width"`
		Height  int                `json:"height"`
		Zones   []defectSampleZone `json:"zones"`
		Source  string             `json:"source"`
		Consent bool               `json:"consent"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	if !req.Consent {
		writeError(w, http.StatusBadRequest, "Нужно согласие на использование фото для обучения")
		return
	}
	const prefix = "data:image/jpeg;base64,"
	if !strings.HasPrefix(req.Photo, prefix) {
		writeError(w, http.StatusBadRequest, "Нужно фото в формате JPEG")
		return
	}
	photo, err := base64.StdEncoding.DecodeString(req.Photo[len(prefix):])
	if err != nil || len(photo) < 3 || photo[0] != 0xFF || photo[1] != 0xD8 {
		writeError(w, http.StatusBadRequest, "Файл не является изображением JPEG")
		return
	}
	if len(photo) > defectSampleMaxPhoto {
		writeError(w, http.StatusRequestEntityTooLarge, "Фото слишком большое")
		return
	}
	if req.Width < 32 || req.Height < 32 || req.Width > 8000 || req.Height > 8000 {
		writeError(w, http.StatusBadRequest, "Некорректный размер фото")
		return
	}
	if len(req.Zones) > defectSampleMaxZones {
		writeError(w, http.StatusBadRequest, "Слишком много зон")
		return
	}
	zones := make([]defectSampleZone, 0, len(req.Zones))
	for _, z := range req.Zones {
		if z.Cls < 0 || z.Cls >= len(defectSampleClasses) {
			continue
		}
		x0, y0 := clamp01(z.X), clamp01(z.Y)
		x1, y1 := clamp01(z.X+z.W), clamp01(z.Y+z.H)
		if x1-x0 < 0.003 || y1-y0 < 0.003 {
			continue
		}
		origin := z.Origin
		if origin != "manual" && origin != "vision" {
			origin = "model"
		}
		zones = append(zones, defectSampleZone{Cls: z.Cls, X: x0, Y: y0, W: x1 - x0, H: y1 - y0, Origin: origin})
	}
	zj, _ := json.Marshal(zones)
	// один пример на пару «пользователь + фото»: повторное сохранение после правки зон заменяет прежнее
	sum := sha256.Sum256(append([]byte(uid+"|"), photo...))
	source := req.Source
	if source != "vision" {
		source = "local"
	}
	sample := &database.DefectSample{
		ID: hex.EncodeToString(sum[:10]), UserID: uid, Width: req.Width, Height: req.Height,
		Photo: photo, Zones: string(zj), Source: source,
	}
	if err := database.SaveDefectSample(sample); err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось сохранить пример")
		return
	}
	mine, _ := database.CountDefectSamplesByUser(uid)
	writeJSON(w, http.StatusOK, map[string]interface{}{"id": sample.ID, "zones": len(zones), "mine": mine})
}

// Admin handles /api/v1/admin/defect-samples and /export
func (h *DefectSampleHandler) Admin(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(strings.TrimRight(r.URL.Path, "/"), "/export") {
		h.export(w, r)
		return
	}
	switch r.Method {
	case http.MethodGet:
		total, last, err := database.CountDefectSamples()
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось загрузить примеры")
			return
		}
		byClass := map[string]int{}
		for _, c := range defectSampleClasses {
			byClass[c] = 0
		}
		empty := 0
		all, _ := database.ListDefectSampleZones()
		for _, zj := range all {
			var zs []defectSampleZone
			_ = json.Unmarshal([]byte(zj), &zs)
			if len(zs) == 0 {
				empty++
			}
			for _, z := range zs {
				if z.Cls >= 0 && z.Cls < len(defectSampleClasses) {
					byClass[defectSampleClasses[z.Cls]]++
				}
			}
		}
		out := map[string]interface{}{"total": total, "zones_by_class": byClass, "without_defects": empty, "classes": defectSampleClasses}
		if last != nil {
			out["last"] = last.UTC().Format("2006-01-02T15:04:05Z")
		}
		writeJSON(w, http.StatusOK, out)
	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "Нужен id примера")
			return
		}
		n, err := database.DeleteDefectSample(id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось удалить пример")
			return
		}
		if n == 0 {
			writeError(w, http.StatusNotFound, "Пример не найден")
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"deleted": id})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *DefectSampleHandler) export(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	add := func(name string, data []byte, method uint16) error {
		f, err := zw.CreateHeader(&zip.FileHeader{Name: name, Method: method})
		if err != nil {
			return err
		}
		_, err = f.Write(data)
		return err
	}
	n := 0
	err := database.EachDefectSample(func(s *database.DefectSample) error {
		var zs []defectSampleZone
		_ = json.Unmarshal([]byte(s.Zones), &zs)
		var lb strings.Builder
		for _, z := range zs {
			fmt.Fprintf(&lb, "%d %.6f %.6f %.6f %.6f\n", z.Cls, z.X+z.W/2, z.Y+z.H/2, z.W, z.H)
		}
		if err := add("images/"+s.ID+".jpg", s.Photo, zip.Store); err != nil { // JPEG уже сжат
			return err
		}
		n++
		return add("labels/"+s.ID+".txt", []byte(lb.String()), zip.Deflate)
	})
	if err == nil {
		err = add("classes.txt", []byte(strings.Join(defectSampleClasses, "\n")+"\n"), zip.Deflate)
	}
	if err == nil {
		readme := "Учебные примеры QazGost: " + fmt.Sprint(n) + " фото.\r\n" +
			"Распакуйте папки images и labels в ai-service\\dataset\\own и запустите ai-service\\TRAIN_QAZGOST.bat.\r\n" +
			"Разметка в формате YOLO: класс cx cy w h (доли кадра). Классы по порядку — в classes.txt.\r\n"
		err = add("README.txt", []byte(readme), zip.Deflate)
	}
	if err == nil {
		err = zw.Close()
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось собрать архив")
		return
	}
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", `attachment; filename="qazgost-defect-samples.zip"`)
	w.Header().Set("Content-Length", fmt.Sprint(buf.Len()))
	_, _ = w.Write(buf.Bytes())
}
