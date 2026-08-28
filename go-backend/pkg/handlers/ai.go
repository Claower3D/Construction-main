package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/services"
)

type AiHandler struct {
	Config    *config.Config
	estimator *services.EstimatorService
}

func NewAiHandler(cfg *config.Config) *AiHandler {
	return &AiHandler{
		Config:    cfg,
		estimator: services.NewEstimatorService(services.GetPriceDBService()),
	}
}

type UnifiedEstimateRequest struct {
	Category    string             `json:"category"`
	Subtype     string             `json:"subtype"`
	Dimensions  map[string]float64 `json:"dimensions"`
	City        string             `json:"city"`
	Scenario    string             `json:"scenario"`
	Description string             `json:"description"`
	Mode        string             `json:"mode"`
}

type openAIRequest struct {
	Model          string            `json:"model"`
	ResponseFormat map[string]string `json:"response_format"`
	Messages       []openAIMessage   `json:"messages"`
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// EstimateCost handles POST /api/v1/ai/estimate
func (h *AiHandler) EstimateCost(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req UnifiedEstimateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Category == "" && req.Description != "" {
		req.Category = "Общестроительные работы"
	}
	if req.City == "" {
		req.City = "Алматы"
	}

	// 1. High-speed native Go calculation with SNiP RK 16 formulas
	qtoResult := h.estimator.CalculateEstimate(services.QTOFormulaRequest{
		Category:    req.Category,
		Subtype:     req.Subtype,
		Dimensions:  req.Dimensions,
		City:        req.City,
		Scenario:    req.Scenario,
		Description: req.Description,
	})

	// Check for custom user OpenAI API Key from header or fallback to server config
	apiKey := r.Header.Get("X-OpenAI-Key")
	if apiKey == "" {
		apiKey = h.Config.OpenAIKey
	}
	model := r.Header.Get("X-OpenAI-Model")
	if model == "" {
		model = "gpt-4o-mini"
	}

	// If API key is present and user provided an unstructured text description, optionally enhance insights with LLM
	if apiKey != "" && req.Description != "" {
		goInsights := h.fetchLLMInsightsWithKey(req.Description, req.Category, req.City, apiKey, model)
		if len(goInsights) > 0 {
			qtoResult.AiInsights = append(goInsights, qtoResult.AiInsights...)
		}
	}

	_ = json.NewEncoder(w).Encode(qtoResult)
}

func (h *AiHandler) fetchLLMInsights(desc, category, city string) []string {
	return h.fetchLLMInsightsWithKey(desc, category, city, h.Config.OpenAIKey, "gpt-4o-mini")
}

func (h *AiHandler) fetchLLMInsightsWithKey(desc, category, city, apiKey, model string) []string {
	if apiKey == "" {
		return nil
	}
	if model == "" {
		model = "gpt-4o-mini"
	}

	systemPrompt := `You are an expert civil engineer and construction estimator in Kazakhstan. 
Provide 3 brief professional recommendations in Russian concerning SNiP RK standards, material quality control, or potential hidden works. Output as raw JSON array of strings: ["insight 1", "insight 2", "insight 3"]`

	userPrompt := fmt.Sprintf("Category: %s, City: %s. Project Description: %s", category, city, desc)

	openaiReqBody := openAIRequest{
		Model: model,
		ResponseFormat: map[string]string{
			"type": "json_object",
		},
		Messages: []openAIMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	}

	jsonBytes, err := json.Marshal(openaiReqBody)
	if err != nil {
		return nil
	}

	client := &http.Client{Timeout: 6 * time.Second}
	httpReq, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(httpReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		return nil
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	var openAIResp openAIResponse
	if err := json.Unmarshal(respBody, &openAIResp); err == nil && len(openAIResp.Choices) > 0 {
		var structResult struct {
			Insights []string `json:"insights"`
		}
		_ = json.Unmarshal([]byte(openAIResp.Choices[0].Message.Content), &structResult)
		return structResult.Insights
	}

	return nil
}

// InspectDefect handles defect inspection with OpenAI LLM or native Go SNiP expert
func (h *AiHandler) InspectDefect(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Description string `json:"description"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	if h.Config.OpenAIKey != "" && req.Description != "" {
		systemPrompt := `You are a certified construction defect inspector and technical supervisor in Kazakhstan according to SNiP RK and SP RK standards.
Analyze the defect description provided and output a valid JSON object strictly matching this schema:
{
  "defectType": "Название дефекта (на русском)",
  "severity": "Класс риска (например: '2 класс — Допустимый', '3 класс — Требует устранения', '4 класс — Аварийный')",
  "snipCode": "Нормативный СНиП (например: 'СНиП РК 3.02-04-2019 / СП РК 1.03-106-2012')",
  "fixMethod": "Подробная пошаговая технологическая карта устранения дефекта (на русском)",
  "estimatedCost": "Ориентировочная стоимость ремонта в ₸ (например: '45 000 – 75 000 ₸')",
  "workDays": 3
}`

		openaiReqBody := openAIRequest{
			Model: "gpt-4o-mini",
			ResponseFormat: map[string]string{
				"type": "json_object",
			},
			Messages: []openAIMessage{
				{Role: "system", Content: systemPrompt},
				{Role: "user", Content: "Описание дефекта объекта: " + req.Description},
			},
		}

		jsonBytes, err := json.Marshal(openaiReqBody)
		if err == nil {
			client := &http.Client{Timeout: 8 * time.Second}
			httpReq, errReq := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBytes))
			if errReq == nil {
				httpReq.Header.Set("Content-Type", "application/json")
				httpReq.Header.Set("Authorization", "Bearer "+h.Config.OpenAIKey)

				resp, errResp := client.Do(httpReq)
				if errResp == nil && resp.StatusCode == http.StatusOK {
					defer resp.Body.Close()
					respBody, errRead := io.ReadAll(resp.Body)
					if errRead == nil {
						var openAIResp openAIResponse
						if errUnmarshal := json.Unmarshal(respBody, &openAIResp); errUnmarshal == nil && len(openAIResp.Choices) > 0 {
							w.Write([]byte(openAIResp.Choices[0].Message.Content))
							return
						}
					}
				}
			}
		}
	}

	// Fallback expert technical conclusion based on SNiP RK
	descLower := strings.ToLower(req.Description)
	defectType := "Усадочная трещина штукатурного слоя"
	severity := "3 класс — Требует устранения"
	snipCode := "СНиП РК 3.02-04-2019 / СП РК 1.03-106-2012"
	fixMethod := "Расшивка шва на глубину 10 мм, обеспыливание, грунтовка глубокого проникновения, армирование серпянкой и шпатлевание полимерцементным составом."
	estimatedCost := "35 000 – 65 000 ₸"
	workDays := 2

	if strings.Contains(descLower, "протечк") || strings.Contains(descLower, "сырост") || strings.Contains(descLower, "вод") {
		defectType = "Нарушение гидроизоляционного слоя (протечка / сырость)"
		severity = "4 класс — Высокий риск биопоражения"
		snipCode = "СНиП РК 2.04-09-2018 «Гидроизоляция зданий»"
		fixMethod = "Локализация источника протечки, сушка тепловой пушкой, обработка фунгицидом, нанесение двухкомпонентной полимерной гидроизоляции."
		estimatedCost = "55 000 – 120 000 ₸"
		workDays = 3
	} else if strings.Contains(descLower, "перепад") || strings.Contains(descLower, "пол") || strings.Contains(descLower, "потол") {
		defectType = "Отклонение плоскости от горизонтали / вертикали"
		severity = "2 класс — Допустимое отклонение"
		snipCode = "СП РК 3.02-107-2014 «Полы и перекрытия»"
		fixMethod = "Лазерное нивелирование, шлифовка неровностей, заливка самовыравнивающейся нивелир-массой толщиной до 15 мм."
		estimatedCost = "40 000 – 85 000 ₸"
		workDays = 2
	} else if strings.Contains(descLower, "штукатур") || strings.Contains(descLower, "отсло") {
		defectType = "Отслоение и бухтение штукатурного слоя"
		severity = "3 класс — Дефект сцепления"
		snipCode = "СНиП РК 3.02-04-2019 «Отделочные покрытия»"
		fixMethod = "Отбивка бухтящих участков, обеспыливание, обработка бетоноконтактом, повторное оштукатуривание по маякам."
		estimatedCost = "28 000 – 50 000 ₸"
		workDays = 2
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"defectType":    defectType,
		"severity":      severity,
		"snipCode":      snipCode,
		"fixMethod":     fixMethod,
		"estimatedCost": estimatedCost,
		"workDays":      workDays,
	})
}

// VisionProxy handles POST /api/v1/ai/vision — proxies photo analysis to OpenAI server-side
func (h *AiHandler) VisionProxy(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Photos      []string `json:"photos"`
		Description string   `json:"description"`
		Category    string   `json:"category"`
		City        string   `json:"city"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	apiKey := r.Header.Get("X-OpenAI-Key")
	if apiKey == "" {
		apiKey = h.Config.OpenAIKey
	}
	model := r.Header.Get("X-OpenAI-Model")
	if model == "" {
		model = "gpt-4o"
	}

	if apiKey == "" {
		// No API key — fallback to local Go estimator
		qtoResult := h.estimator.CalculateEstimate(services.QTOFormulaRequest{
			Category:    req.Category,
			Description: req.Description,
			City:        req.City,
		})
		_ = json.NewEncoder(w).Encode(qtoResult)
		return
	}

	// Build OpenAI multi-modal request server-side
	contentParts := []map[string]interface{}{
		{
			"type": "text",
			"text": fmt.Sprintf(`Ты — профессиональный строительный сметчик Казахстана. Проанализируй приложенные фотографии/чертежи строительного объекта.
ЗАДАЧА: Определи из изображения: тип работ, размеры и объёмы (м², м³), материалы и количество, стоимость по ценам Казахстана 2026.
%s %s
ОТВЕТЬ СТРОГО в формате JSON:
{"detected_type":"...","dimensions":{"area_m2":0,"volume_m3":0,"length_m":0},"items":[{"name":"...","volume":0,"unit":"...","unit_price":0,"total":0}],"works_cost":0,"materials_cost":0,"total_cost":0,"timeline_days":0,"insights":["...","...","..."]}`,
				func() string {
					if req.Description != "" {
						return "Описание: " + req.Description
					}
					return ""
				}(),
				func() string {
					if req.Category != "" {
						return "Категория: " + req.Category
					}
					return ""
				}()),
		},
	}

	for _, photo := range req.Photos {
		if photo != "" {
			contentParts = append(contentParts, map[string]interface{}{
				"type":      "image_url",
				"image_url": map[string]string{"url": photo, "detail": "high"},
			})
		}
	}

	openaiBody := map[string]interface{}{
		"model":      model,
		"max_tokens": 4096,
		"messages": []map[string]interface{}{
			{"role": "user", "content": contentParts},
		},
	}

	jsonBytes, _ := json.Marshal(openaiBody)
	client := &http.Client{Timeout: 60 * time.Second}
	httpReq, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBytes))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(httpReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		// Fallback to local estimator
		qtoResult := h.estimator.CalculateEstimate(services.QTOFormulaRequest{
			Category: req.Category, Description: req.Description, City: req.City,
		})
		_ = json.NewEncoder(w).Encode(qtoResult)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var openAIResp openAIResponse
	if err := json.Unmarshal(respBody, &openAIResp); err == nil && len(openAIResp.Choices) > 0 {
		raw := openAIResp.Choices[0].Message.Content
		// Extract JSON from response
		start := strings.Index(raw, "{")
		end := strings.LastIndex(raw, "}")
		if start >= 0 && end > start {
			w.Write([]byte(raw[start : end+1]))
			return
		}
	}

	// Final fallback
	qtoResult := h.estimator.CalculateEstimate(services.QTOFormulaRequest{
		Category: req.Category, Description: req.Description, City: req.City,
	})
	_ = json.NewEncoder(w).Encode(qtoResult)
}

// DefectVisionProxy handles POST /api/v1/ai/defect-vision — proxies defect photo analysis
func (h *AiHandler) DefectVisionProxy(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Photos      []string `json:"photos"`
		Description string   `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	apiKey := h.Config.OpenAIKey
	if apiKey == "" {
		// No key — use existing SNiP fallback from InspectDefect
		h.InspectDefect(w, r)
		return
	}

	contentParts := []map[string]interface{}{
		{
			"type": "text",
			"text": fmt.Sprintf(`Ты — эксперт по строительной дефектоскопии и технадзору в Казахстане.
Проанализируй фотографии строительного дефекта.
%s
ОТВЕТЬ СТРОГО В JSON:
{"defectType":"Название дефекта","severity":"Класс риска","snipCode":"СНиП РК / СП РК","fixMethod":"Технологическая карта устранения","estimatedCost":"Стоимость в ₸","workDays":0}`,
				func() string {
					if req.Description != "" {
						return "Описание: " + req.Description
					}
					return ""
				}()),
		},
	}

	for _, photo := range req.Photos {
		if photo != "" {
			contentParts = append(contentParts, map[string]interface{}{
				"type":      "image_url",
				"image_url": map[string]string{"url": photo, "detail": "high"},
			})
		}
	}

	openaiBody := map[string]interface{}{
		"model":      "gpt-4o",
		"max_tokens": 1500,
		"messages": []map[string]interface{}{
			{"role": "user", "content": contentParts},
		},
	}

	jsonBytes, _ := json.Marshal(openaiBody)
	client := &http.Client{Timeout: 30 * time.Second}
	httpReq, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBytes))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(httpReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		// Fallback to SNiP rules
		fallbackReq, _ := http.NewRequest("POST", "", strings.NewReader(fmt.Sprintf(`{"description":"%s"}`, req.Description)))
		h.InspectDefect(w, fallbackReq)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var openAIResp openAIResponse
	if err := json.Unmarshal(respBody, &openAIResp); err == nil && len(openAIResp.Choices) > 0 {
		raw := openAIResp.Choices[0].Message.Content
		start := strings.Index(raw, "{")
		end := strings.LastIndex(raw, "}")
		if start >= 0 && end > start {
			w.Write([]byte(raw[start : end+1]))
			return
		}
	}

	// Fallback
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"defectType": "Не удалось определить", "severity": "Требует осмотра",
	})
}

// ValidateKey handles POST /api/v1/ai/validate-key — checks if server has a valid OpenAI key configured
// SECURITY: Does NOT accept arbitrary keys from clients (prevents SSRF/abuse)
func (h *AiHandler) ValidateKey(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Only validate the server's own configured key
	serverKey := h.Config.OpenAIKey
	if serverKey == "" {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"valid": false, "message": "No API key configured on server"})
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	httpReq, _ := http.NewRequest("GET", "https://api.openai.com/v1/models", nil)
	httpReq.Header.Set("Authorization", "Bearer "+serverKey)

	resp, err := client.Do(httpReq)
	if err != nil {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"valid": false, "message": "Network error"})
		return
	}
	defer resp.Body.Close()

	valid := resp.StatusCode == http.StatusOK
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"valid": valid, "message": "Server key status checked"})
}

// allowedProxyPrefixes — whitelist of paths allowed to be proxied to AI service
var allowedProxyPrefixes = []string{
	"/api/v1/engineering/",
	"/api/v1/lidar/",
	"/api/v1/defects/",
	"/api/v1/metrics",
	"/health",
}

// ProxyToAIService forwards requests to the Python AI service (FastAPI)
// SECURITY: path sanitization + whitelist to prevent path traversal
func (h *AiHandler) ProxyToAIService(w http.ResponseWriter, r *http.Request) {
	aiServiceURL := "http://localhost:8001"
	if v, ok := getEnvOr("AI_SERVICE_URL", ""); ok {
		aiServiceURL = v
	}

	// SECURITY: sanitize path to prevent traversal (../ attacks)
	cleanPath := strings.ReplaceAll(r.URL.Path, "..", "")
	cleanPath = strings.ReplaceAll(cleanPath, "//", "/")

	// SECURITY: whitelist check — only allow known prefixes
	allowed := false
	for _, prefix := range allowedProxyPrefixes {
		if strings.HasPrefix(cleanPath, prefix) {
			allowed = true
			break
		}
	}
	if !allowed {
		http.Error(w, `{"error":"Proxy path not allowed"}`, http.StatusForbidden)
		return
	}

	targetURL := aiServiceURL + cleanPath
	if r.URL.RawQuery != "" {
		targetURL += "?" + r.URL.RawQuery
	}

	// Read original body
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	// Create proxy request
	proxyReq, err := http.NewRequest(r.Method, targetURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		http.Error(w, "Failed to create proxy request", http.StatusInternalServerError)
		return
	}

	// SECURITY: copy only safe headers (not all)
	safeHeaders := []string{"Content-Type", "Accept", "Accept-Language"}
	for _, h := range safeHeaders {
		if v := r.Header.Get(h); v != "" {
			proxyReq.Header.Set(h, v)
		}
	}

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(proxyReq)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"AI service unavailable: %s"}`, err.Error()), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// getEnvOr returns env value or default
func getEnvOr(key, fallback string) (string, bool) {
	if v := strings.TrimSpace(getEnv(key)); v != "" {
		return v, true
	}
	return fallback, false
}

func getEnv(key string) string {
	return os.Getenv(key)
}

