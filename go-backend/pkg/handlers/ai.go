package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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

	// If API key is present and user provided an unstructured text description, optionally enhance insights with LLM
	if h.Config.OpenAIKey != "" && req.Description != "" {
		goInsights := h.fetchLLMInsights(req.Description, req.Category, req.City)
		if len(goInsights) > 0 {
			qtoResult.AiInsights = append(goInsights, qtoResult.AiInsights...)
		}
	}

	_ = json.NewEncoder(w).Encode(qtoResult)
}

func (h *AiHandler) fetchLLMInsights(desc, category, city string) []string {
	systemPrompt := `You are an expert civil engineer and construction estimator in Kazakhstan. 
Provide 3 brief professional recommendations in Russian concerning SNiP RK standards, material quality control, or potential hidden works. Output as raw JSON array of strings: ["insight 1", "insight 2", "insight 3"]`

	userPrompt := fmt.Sprintf("Category: %s, City: %s. Project Description: %s", category, city, desc)

	openaiReqBody := openAIRequest{
		Model: "gpt-4o-mini",
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
	httpReq.Header.Set("Authorization", "Bearer "+h.Config.OpenAIKey)

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
