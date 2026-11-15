package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// Распознавание дефектов на фото большой моделью зрения (GPT-4o).
//
// Маленькая нейросеть в браузере знает только трещины и путает их со швами, краями и тенями.
// Большая модель понимает, что изображено (кладка, кольцо колодца, плита), и различает виды
// дефектов. Точные координаты она называет плохо, поэтому сайт присылает фото с наложенной
// сеткой (столбцы A…, строки 1…), а модель перечисляет ячейки, где виден дефект.
// Длину и раскрытие трещины потом измеряет сам сайт по пикселям внутри этих ячеек.
//
//	POST /api/v1/ai/defect-vision
//	← {photo:"data:image/jpeg;base64,…" (с сеткой), cols, rows, description}
//	→ {source:"vision-llm", model, object, defects:[…], overall:{…}, photo_quality}
//	503 {error:"no_key"} — ключ модели не задан: сайт переходит на анализ на устройстве.

const defectVisionMaxPhoto = 6 << 20 // base64-строка фото, байт

var (
	defectVisionHTTP   = &http.Client{Timeout: 75 * time.Second}
	defectVisionCellRe = regexp.MustCompile(`^([A-L])(1[0-2]|[1-9])$`)
	defectVisionTypes  = map[string]bool{
		"crack": true, "spall": true, "exposed_rebar": true, "corrosion": true, "leak": true,
		"mold": true, "delamination": true, "deformation": true, "other": true,
	}
	defectVisionSeverity = map[string]bool{"low": true, "medium": true, "high": true, "critical": true}
)

type visionDefect struct {
	Type        string   `json:"type"`
	Title       string   `json:"title"`
	Cells       []string `json:"cells"`
	Severity    string   `json:"severity"`
	Through     bool     `json:"through"`
	Description string   `json:"description"`
	Cause       string   `json:"cause"`
	Fix         string   `json:"fix"`
}

type visionOverall struct {
	Severity string `json:"severity"`
	State    string `json:"state"`
	Summary  string `json:"summary"`
	Actions  string `json:"actions"`
}

type visionResult struct {
	Object       string         `json:"object"`
	Defects      []visionDefect `json:"defects"`
	Overall      visionOverall  `json:"overall"`
	PhotoQuality string         `json:"photo_quality"`
}

func defectVisionPrompt(cols, rows int, description string) string {
	lastCol := string(rune('A' + cols - 1))
	desc := ""
	if d := strings.TrimSpace(description); d != "" {
		desc = "\nПояснение заказчика (может быть неточным, верь фото): " + clip(d, 600) + "\n"
	}
	return fmt.Sprintf(`Ты — инженер технического надзора с опытом обследования зданий и сооружений (ГОСТ 31937).
На фото наложена сетка: столбцы A–%s слева направо, строки 1–%d сверху вниз. В углу каждой ячейки её подпись (например C2).
%s
Задача: найти на фото ВСЕ видимые строительные дефекты и для каждого перечислить ячейки сетки, в которых он виден.

Виды дефектов (поле type):
- crack — трещина (в бетоне, кладке, штукатурке; в кладке часто идёт «лесенкой» по швам);
- spall — скол, выкрашивание, разрушение бетона или кирпича, выпадение кладки;
- exposed_rebar — оголённая арматура;
- corrosion — ржавчина, коррозия металла;
- leak — следы протечки, намокание, высолы;
- mold — плесень, грибок, биопоражение;
- delamination — отслоение штукатурки, облицовки, краски;
- deformation — прогиб, крен, смещение, просадка элемента;
- other — иной дефект.

НЕ считай дефектом: ровные швы кладки и облицовки, стыки элементов, края и рёбра конструкций, тени, границу с грунтом,
провода, доски, ставни, двери, надписи, грязь, естественную фактуру материала, саму сетку и её подписи.
Если уверенности, что это дефект, нет — не включай. Если дефектов нет — верни пустой список defects. Ничего не выдумывай.

Для каждого дефекта:
- cells: только ячейки, где дефект действительно виден (трещина — все ячейки вдоль неё, по порядку);
- severity: low (косметический), medium (нужен ремонт), high (влияет на несущую способность или быстро развивается),
  critical (сквозная или широко раскрытая трещина, разрушение, оголённая арматура с потерей сечения, угроза обрушения);
- through: true, если трещина сквозная или раскрыта так, что виден зазор;
- title: короткое название по-русски; description: что именно видно (1–2 предложения);
- cause: вероятная причина; fix: как устранять (1–2 предложения, без номеров нормативов).

overall: severity (наибольшая), state — одна из категорий: «нормативное», «работоспособное», «ограниченно-работоспособное», «аварийное»;
summary — вывод одним-двумя предложениями; actions — что делать в первую очередь.
object — что изображено (например «кирпичная стена над аркой ворот», «бетонное кольцо колодца»).
photo_quality: ok | blurry | dark | far | not_construction.

Ответ — строго один JSON-объект:
{"object":"","defects":[{"type":"crack","title":"","cells":["C2","C3"],"severity":"high","through":false,"description":"","cause":"","fix":""}],"overall":{"severity":"","state":"","summary":"","actions":""},"photo_quality":"ok"}`,
		lastCol, rows, desc)
}

func clip(s string, n int) string {
	s = strings.TrimSpace(s)
	r := []rune(s)
	if len(r) > n {
		return string(r[:n]) + "…"
	}
	return s
}

// sanitizeVision keeps only well-formed defects that point at real grid cells
func sanitizeVision(res *visionResult, cols, rows int) {
	out := make([]visionDefect, 0, len(res.Defects))
	for _, d := range res.Defects {
		d.Type = strings.ToLower(strings.TrimSpace(d.Type))
		if !defectVisionTypes[d.Type] {
			d.Type = "other"
		}
		d.Severity = strings.ToLower(strings.TrimSpace(d.Severity))
		if !defectVisionSeverity[d.Severity] {
			d.Severity = "medium"
		}
		seen := map[string]bool{}
		cells := make([]string, 0, len(d.Cells))
		for _, c := range d.Cells {
			c = strings.ToUpper(strings.TrimSpace(c))
			m := defectVisionCellRe.FindStringSubmatch(c)
			if m == nil || seen[c] {
				continue
			}
			col := int(m[1][0]-'A') + 1
			row := 0
			fmt.Sscanf(m[2], "%d", &row)
			if col > cols || row < 1 || row > rows {
				continue
			}
			seen[c] = true
			cells = append(cells, c)
		}
		if len(cells) == 0 {
			continue
		}
		d.Cells = cells
		d.Title = clip(d.Title, 120)
		if d.Title == "" {
			d.Title = "Дефект"
		}
		d.Description = clip(d.Description, 400)
		d.Cause = clip(d.Cause, 300)
		d.Fix = clip(d.Fix, 400)
		out = append(out, d)
		if len(out) >= 12 {
			break
		}
	}
	res.Defects = out
	res.Object = clip(res.Object, 160)
	res.Overall.Severity = strings.ToLower(strings.TrimSpace(res.Overall.Severity))
	if !defectVisionSeverity[res.Overall.Severity] {
		res.Overall.Severity = ""
	}
	res.Overall.State = clip(res.Overall.State, 60)
	res.Overall.Summary = clip(res.Overall.Summary, 500)
	res.Overall.Actions = clip(res.Overall.Actions, 600)
	res.PhotoQuality = clip(strings.ToLower(res.PhotoQuality), 20)
}

// DefectVisionProxy handles POST /api/v1/ai/defect-vision
func (h *AiHandler) DefectVisionProxy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Photo       string `json:"photo"`
		Cols        int    `json:"cols"`
		Rows        int    `json:"rows"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	if !strings.HasPrefix(req.Photo, "data:image/") || !strings.Contains(req.Photo, ";base64,") {
		writeError(w, http.StatusBadRequest, "Нужно фото в формате изображения")
		return
	}
	if len(req.Photo) > defectVisionMaxPhoto {
		writeError(w, http.StatusRequestEntityTooLarge, "Фото слишком большое")
		return
	}
	if req.Cols < 2 || req.Cols > 12 || req.Rows < 2 || req.Rows > 12 {
		writeError(w, http.StatusBadRequest, "Некорректная сетка")
		return
	}

	apiKey := r.Header.Get("X-OpenAI-Key")
	userKey := apiKey != ""
	if apiKey == "" {
		apiKey = h.Config.OpenAIKey
	}
	if apiKey == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{
			"error": "no_key", "message": "Ключ ИИ-модели на сервере не задан",
		})
		return
	}
	model := pickModel(r, userKey, "gpt-4o")

	body := map[string]interface{}{
		"model":           model,
		"temperature":     0,
		"max_tokens":      1800,
		"response_format": map[string]string{"type": "json_object"},
		"messages": []map[string]interface{}{
			{"role": "user", "content": []map[string]interface{}{
				{"type": "text", "text": defectVisionPrompt(req.Cols, req.Rows, req.Description)},
				{"type": "image_url", "image_url": map[string]string{"url": req.Photo, "detail": "high"}},
			}},
		},
	}
	payload, _ := json.Marshal(body)
	httpReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost, openAIBaseURL()+"/chat/completions", bytes.NewReader(payload))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось подготовить запрос")
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := defectVisionHTTP.Do(httpReq)
	if err != nil {
		log.Printf("defect-vision: upstream error: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"error": "upstream", "message": "ИИ-модель не ответила"})
		return
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode != http.StatusOK {
		log.Printf("defect-vision: upstream status %d", resp.StatusCode)
		code := "upstream"
		if resp.StatusCode == http.StatusUnauthorized {
			code = "bad_key"
		} else if resp.StatusCode == http.StatusTooManyRequests {
			code = "quota"
		}
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"error": code, "message": "ИИ-модель отклонила запрос"})
		return
	}
	var oa openAIResponse
	if err := json.Unmarshal(raw, &oa); err != nil || len(oa.Choices) == 0 {
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"error": "upstream", "message": "Пустой ответ ИИ-модели"})
		return
	}
	content := oa.Choices[0].Message.Content
	start, end := strings.Index(content, "{"), strings.LastIndex(content, "}")
	var res visionResult
	if start < 0 || end <= start || json.Unmarshal([]byte(content[start:end+1]), &res) != nil {
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"error": "parse", "message": "ИИ-модель ответила не по форме"})
		return
	}
	sanitizeVision(&res, req.Cols, req.Rows)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"source": "vision-llm", "model": model,
		"object": res.Object, "defects": res.Defects, "overall": res.Overall, "photo_quality": res.PhotoQuality,
	})
}
