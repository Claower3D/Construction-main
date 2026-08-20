package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"qazgost-ai/backend/pkg/services"
)

type ExportHandler struct {
	estimator *services.EstimatorService
	priceDB   *services.PriceDBService
}

func NewExportHandler() *ExportHandler {
	pdb := services.GetPriceDBService()
	return &ExportHandler{
		priceDB:   pdb,
		estimator: services.NewEstimatorService(pdb),
	}
}

// ExportEstimateCSV exports an estimate breakdown in standardized Kazakh KS-2 style CSV
func (h *ExportHandler) ExportEstimateCSV(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	if category == "" {
		category = "Фундаменты"
	}
	city := r.URL.Query().Get("city")
	if city == "" {
		city = "Алматы"
	}

	result := h.estimator.CalculateEstimate(services.QTOFormulaRequest{
		Category: category,
		City:     city,
	})

	filename := fmt.Sprintf("estimate_%s_%s.csv", category, time.Now().Format("20060102"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	// UTF-8 BOM for Excel compatibility
	_, _ = w.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Header Info
	_ = writer.Write([]string{"СМЕТНЫЙ РАСЧЁТ СТОИМОСТИ СТРОИТЕЛЬСТВА (Форма КС-2 / СНиП РК)"})
	_ = writer.Write([]string{"Категория:", result.Category})
	_ = writer.Write([]string{"Регион:", result.Region, "Коэффициент:", fmt.Sprintf("%.2f", result.RegionalCoeff)})
	_ = writer.Write([]string{"Нормативная база:", result.Normative})
	_ = writer.Write([]string{"Дата расчёта:", result.CalculatedAt.Format("02.01.2006 15:04")})
	_ = writer.Write([]string{""})

	// Table Header
	_ = writer.Write([]string{"№", "Обоснование (ГЭСН)", "Наименование работ и затрат", "Ед. изм.", "Кол-во", "Цена за ед. (KZT)", "Всего (KZT)", "Тип", "СНиП Ссылка"})

	rec := result.Recommended
	for idx, item := range rec.Items {
		_ = writer.Write([]string{
			fmt.Sprintf("%d", idx+1),
			item.Code,
			item.Name,
			item.Unit,
			fmt.Sprintf("%.2f", item.Quantity),
			fmt.Sprintf("%.0f", item.UnitPrice),
			fmt.Sprintf("%.0f", item.Total),
			item.Type,
			item.SnipRef,
		})
	}

	_ = writer.Write([]string{""})
	_ = writer.Write([]string{"", "", "ИТОГО РАБОТЫ:", "", "", "", fmt.Sprintf("%.0f", rec.WorksCost)})
	_ = writer.Write([]string{"", "", "ИТОГО МАТЕРИАЛЫ:", "", "", "", fmt.Sprintf("%.0f", rec.MaterialsCost)})
	_ = writer.Write([]string{"", "", "ИТОГО СПЕЦТЕХНИКА:", "", "", "", fmt.Sprintf("%.0f", rec.EquipmentCost)})
	_ = writer.Write([]string{"", "", "НЕПРЕДВИДЕННЫЕ ЗАТРАТЫ (5%):", "", "", "", fmt.Sprintf("%.0f", rec.Contingency)})
	_ = writer.Write([]string{"", "", "ВСЕГО ПО СМЕТЕ (KZT):", "", "", "", fmt.Sprintf("%.0f", rec.TotalCost)})
	_ = writer.Write([]string{"", "", "ПРИМЕРНЫЙ СРОК (ДНЕЙ):", "", "", "", fmt.Sprintf("%d", rec.TimelineDays)})
}
