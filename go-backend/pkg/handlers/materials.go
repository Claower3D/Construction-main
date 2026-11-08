package handlers

import (
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"regexp"
	"strings"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
	"qazgost-ai/backend/pkg/services"
)

// MaterialsHandler serves supplier offers of the materials marketplace.
// The reference catalogue (сметные цены) stays in /api/v1/prices.
type MaterialsHandler struct {
	priceDB *services.PriceDBService
}

func NewMaterialsHandler() *MaterialsHandler {
	return &MaterialsHandler{priceDB: services.GetPriceDBService()}
}

var packRe = regexp.MustCompile(`(\d+(?:[.,]\d+)?)\s*(кг|л)(?:[^а-яёa-z]|$)`)

// samePack: «мешок 25 кг» нельзя сравнивать с «мешок 50 кг» — фасовка в названиях должна совпадать, если указана в обоих
func samePack(a, b string) bool {
	ma, mb := packRe.FindStringSubmatch(strings.ToLower(a)), packRe.FindStringSubmatch(strings.ToLower(b))
	if ma == nil || mb == nil {
		return true
	}
	return strings.ReplaceAll(ma[1], ",", ".") == strings.ReplaceAll(mb[1], ",", ".") && ma[2] == mb[2]
}

// Roles that may publish material offers
func canSellMaterials(role string) bool {
	return isStaff(role) || role == "company" || role == "executor" || role == "supplier"
}

type offerInput struct {
	Name           *string  `json:"name"`
	Category       *string  `json:"category"`
	Unit           *string  `json:"unit"`
	Price          *float64 `json:"price"`
	WholesalePrice *float64 `json:"wholesalePrice"`
	WholesaleFrom  *float64 `json:"wholesaleFrom"`
	City           *string  `json:"city"`
	Stock          *float64 `json:"stock"`
	Gost           *string  `json:"gost"`
	Delivery       *bool    `json:"delivery"`
	Pickup         *bool    `json:"pickup"`
	PriceCode      *string  `json:"priceCode"`
	Image          *string  `json:"image"`
	Description    *string  `json:"description"`
	SupplierName   *string  `json:"supplierName"`
	SupplierPhone  *string  `json:"supplierPhone"`
	Status         *string  `json:"status"`
}

func (in *offerInput) apply(o *models.MaterialOffer) string {
	s := func(p *string, max int) string { return truncate(strings.TrimSpace(*p), max) }
	if in.Name != nil {
		o.Name = s(in.Name, 200)
	}
	if in.Category != nil {
		o.Category = s(in.Category, 60)
	}
	if in.Unit != nil {
		o.Unit = s(in.Unit, 20)
	}
	if in.Price != nil {
		o.Price = math.Round(*in.Price*100) / 100
	}
	if in.WholesalePrice != nil {
		o.WholesalePrice = math.Round(*in.WholesalePrice*100) / 100
	}
	if in.WholesaleFrom != nil {
		o.WholesaleFrom = *in.WholesaleFrom
	}
	if in.City != nil {
		o.City = s(in.City, 60)
	}
	if in.Stock != nil {
		o.Stock = *in.Stock
	}
	if in.Gost != nil {
		o.Gost = s(in.Gost, 80)
	}
	if in.Delivery != nil {
		o.Delivery = *in.Delivery
	}
	if in.Pickup != nil {
		o.Pickup = *in.Pickup
	}
	if in.PriceCode != nil {
		o.PriceCode = s(in.PriceCode, 80)
	}
	if in.Image != nil {
		img := strings.TrimSpace(*in.Image)
		if img != "" && !strings.HasPrefix(img, "/uploads/") && !strings.HasPrefix(img, "/images/") && !strings.HasPrefix(img, "https://") {
			return "Фото: допускается ссылка https:// или загруженный файл"
		}
		o.Image = truncate(img, 500)
	}
	if in.Description != nil {
		o.Description = s(in.Description, 2000)
	}
	if in.SupplierName != nil {
		o.SupplierName = s(in.SupplierName, 160)
	}
	if in.SupplierPhone != nil {
		o.SupplierPhone = s(in.SupplierPhone, 40)
	}
	if in.Status != nil {
		o.Status = strings.TrimSpace(*in.Status)
	}
	switch {
	case o.Name == "":
		return "Укажите наименование материала"
	case o.Unit == "":
		return "Укажите единицу измерения"
	case o.Price <= 0:
		return "Укажите цену больше 0"
	case o.Price > 100_000_000:
		return "Проверьте цену: слишком большое значение"
	case o.WholesalePrice < 0 || o.WholesaleFrom < 0 || o.Stock < 0:
		return "Значения не могут быть отрицательными"
	case o.WholesalePrice > 0 && o.WholesalePrice >= o.Price:
		return "Оптовая цена должна быть ниже розничной"
	case o.WholesalePrice > 0 && o.WholesaleFrom <= 0:
		return "Укажите, от какого количества действует оптовая цена"
	case o.City == "":
		return "Укажите город склада"
	case !o.Delivery && !o.Pickup:
		return "Отметьте доставку или самовывоз"
	case o.Status != "active" && o.Status != "hidden":
		return "Недопустимый статус"
	}
	return ""
}

// enrich adds the reference (сметная) price of the linked price-base item, if any
func (h *MaterialsHandler) enrich(o *models.MaterialOffer) map[string]interface{} {
	out := map[string]interface{}{"offer": o}
	if o.PriceCode != "" {
		if ref, ok := h.priceDB.GetByCode(o.PriceCode, o.City); ok && ref.QA != "suspect" && strings.EqualFold(ref.Unit, o.Unit) && samePack(ref.Name, o.Name) {
			out["referencePrice"] = ref.Price
		}
	}
	return out
}

// Offers handles GET/POST /api/v1/materials and GET/PATCH/DELETE /api/v1/materials/{id}
func (h *MaterialsHandler) Offers(w http.ResponseWriter, r *http.Request) {
	id := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/materials"), "/")
	uid, role := currentUser(r)

	if id == "" {
		switch r.Method {
		case http.MethodGet:
			qs := r.URL.Query()
			f := database.OfferFilter{
				Query:    strings.TrimSpace(qs.Get("q")),
				Category: strings.TrimSpace(qs.Get("category")),
				City:     strings.TrimSpace(qs.Get("city")),
				InStock:  qs.Get("inStock") == "1",
			}
			if qs.Get("supplier") == "me" {
				if uid == "" {
					writeError(w, http.StatusUnauthorized, "Войдите, чтобы увидеть свои предложения")
					return
				}
				f.SupplierID = uid
			}
			list, err := database.ListMaterialOffers(f)
			if err != nil {
				writeError(w, http.StatusServiceUnavailable, "Каталог предложений временно недоступен")
				return
			}
			out := make([]map[string]interface{}, 0, len(list))
			for _, o := range list {
				if uid == "" {
					o.SupplierPhone = ""
				}
				out = append(out, h.enrich(o))
			}
			writeJSON(w, http.StatusOK, map[string]interface{}{"items": out, "total": len(out)})
		case http.MethodPost:
			if uid == "" {
				writeError(w, http.StatusUnauthorized, "Войдите, чтобы разместить предложение")
				return
			}
			if !canSellMaterials(role) {
				writeError(w, http.StatusForbidden, "Размещать материалы могут поставщики, компании и исполнители")
				return
			}
			var in offerInput
			if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
				writeError(w, http.StatusBadRequest, "Некорректные данные предложения")
				return
			}
			o := &models.MaterialOffer{Delivery: true, Pickup: true, Status: "active", SupplierID: uid}
			if msg := in.apply(o); msg != "" {
				writeError(w, http.StatusBadRequest, msg)
				return
			}
			if u, err := database.GetUserByID(uid); err == nil && u != nil {
				if o.SupplierName == "" {
					o.SupplierName = u.Name
				}
				if o.SupplierPhone == "" {
					o.SupplierPhone = u.Phone
				}
			}
			if err := database.SaveMaterialOffer(o); err != nil {
				writeError(w, http.StatusInternalServerError, "Не удалось сохранить предложение")
				return
			}
			writeJSON(w, http.StatusCreated, h.enrich(o))
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
		return
	}

	o, err := database.GetMaterialOffer(id)
	if errors.Is(err, database.ErrNotFound) {
		writeError(w, http.StatusNotFound, "Предложение не найдено")
		return
	} else if err != nil {
		writeError(w, http.StatusServiceUnavailable, "База данных недоступна")
		return
	}
	owner := uid != "" && (o.SupplierID == uid || isStaff(role))

	switch r.Method {
	case http.MethodGet:
		if o.Status != "active" && !owner {
			writeError(w, http.StatusNotFound, "Предложение не найдено")
			return
		}
		if uid == "" {
			o.SupplierPhone = ""
		}
		writeJSON(w, http.StatusOK, h.enrich(o))
	case http.MethodPatch, http.MethodPut:
		if !owner {
			writeError(w, http.StatusForbidden, "Изменять предложение может только поставщик")
			return
		}
		var in offerInput
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			writeError(w, http.StatusBadRequest, "Некорректные данные")
			return
		}
		if msg := in.apply(o); msg != "" {
			writeError(w, http.StatusBadRequest, msg)
			return
		}
		if err := database.SaveMaterialOffer(o); err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось сохранить изменения")
			return
		}
		writeJSON(w, http.StatusOK, h.enrich(o))
	case http.MethodDelete:
		if !owner {
			writeError(w, http.StatusForbidden, "Удалить предложение может только поставщик")
			return
		}
		if err := database.DeleteMaterialOffer(id); err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось удалить предложение")
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"message": "Предложение удалено"})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
