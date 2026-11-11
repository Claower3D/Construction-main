package handlers

import (
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"strings"

	"qazgost-ai/backend/pkg/database"
)

// PlanModelsHandler stores «План → 3D» projects so that a model built on a desktop
// can be opened on a phone on site. A model is visible only to its owner (and staff).
type PlanModelsHandler struct{}

func NewPlanModelsHandler() *PlanModelsHandler { return &PlanModelsHandler{} }

const (
	planMaxBody      = 2 << 20
	planMaxFloors    = 60
	planMaxWalls     = 4000
	planMaxPerUser   = 100
	planMaxNameRunes = 120
)

type planWall struct {
	ID string  `json:"id"`
	AX float64 `json:"ax"`
	AY float64 `json:"ay"`
	BX float64 `json:"bx"`
	BY float64 `json:"by"`
	T  float64 `json:"t"`
}

type planOpening struct {
	ID     string  `json:"id"`
	WallID string  `json:"wallId"`
	Type   string  `json:"type"`
	At     float64 `json:"at"`
	W      float64 `json:"w"`
	H      float64 `json:"h"`
	Sill   float64 `json:"sill"`
}

type planFloor struct {
	ID       string        `json:"id"`
	Name     string        `json:"name"`
	Walls    []planWall    `json:"walls"`
	Openings []planOpening `json:"openings"`
}

// planProject mirrors the client format. Decoding into it drops everything unknown,
// so the stored JSON never carries fields the server does not understand.
type planProject struct {
	V           int         `json:"v"`
	Name        string      `json:"name"`
	FloorHeight float64     `json:"floorHeight"`
	Slab        float64     `json:"slab"`
	GroundSlab  bool        `json:"groundSlab"`
	Floors      []planFloor `json:"floors"`
}

func inRange(v, min, max float64) bool { return !math.IsNaN(v) && v >= min && v <= max }

// validate returns a user-facing message, or "" when the project is acceptable
func (p *planProject) validate() string {
	p.Name = strings.TrimSpace(p.Name)
	if p.Name == "" {
		return "Укажите название модели"
	}
	if len([]rune(p.Name)) > planMaxNameRunes {
		return "Название слишком длинное"
	}
	if !inRange(p.FloorHeight, 2, 12) || !inRange(p.Slab, 0.05, 1) {
		return "Проверьте высоту этажа и толщину перекрытия"
	}
	if len(p.Floors) == 0 || len(p.Floors) > planMaxFloors {
		return "В модели должно быть от 1 до 60 этажей"
	}
	for i := range p.Floors {
		f := &p.Floors[i]
		f.Name = truncate(strings.TrimSpace(f.Name), 40)
		f.ID = truncate(f.ID, 40)
		if len(f.Walls) > planMaxWalls || len(f.Openings) > planMaxWalls {
			return "Слишком много стен или проёмов на этаже"
		}
		ids := make(map[string]bool, len(f.Walls))
		for _, w := range f.Walls {
			if w.ID == "" || len(w.ID) > 40 || ids[w.ID] {
				return "Повреждены данные стен"
			}
			ids[w.ID] = true
			if !inRange(w.AX, -5000, 5000) || !inRange(w.AY, -5000, 5000) || !inRange(w.BX, -5000, 5000) || !inRange(w.BY, -5000, 5000) || !inRange(w.T, 0.03, 2) {
				return "Повреждены данные стен"
			}
		}
		for _, o := range f.Openings {
			if !ids[o.WallID] || len(o.ID) > 40 || (o.Type != "door" && o.Type != "window") {
				return "Повреждены данные проёмов"
			}
			if !inRange(o.At, 0, 10000) || !inRange(o.W, 0.3, 10000) || !inRange(o.H, 0.3, 6) || !inRange(o.Sill, 0, 4) {
				return "Повреждены данные проёмов"
			}
		}
		if f.Walls == nil {
			f.Walls = []planWall{}
		}
		if f.Openings == nil {
			f.Openings = []planOpening{}
		}
	}
	p.V = 1
	return ""
}

func (p *planProject) wallCount() int {
	n := 0
	for _, f := range p.Floors {
		n += len(f.Walls)
	}
	return n
}

func planResponse(m *database.PlanModel, withData bool) map[string]interface{} {
	out := map[string]interface{}{"id": m.ID, "name": m.Name, "floors": m.Floors, "walls": m.Walls, "area": m.Area, "updatedAt": m.UpdatedAt}
	if withData {
		out["data"] = json.RawMessage(m.Data)
	}
	return out
}

type planInput struct {
	Data planProject `json:"data"`
	Area float64     `json:"area"`
}

func (h *PlanModelsHandler) read(w http.ResponseWriter, r *http.Request) (*database.PlanModel, bool) {
	var in planInput
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, planMaxBody)).Decode(&in); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			writeError(w, http.StatusRequestEntityTooLarge, "Модель слишком большая для сохранения")
		} else {
			writeError(w, http.StatusBadRequest, "Не удалось прочитать модель")
		}
		return nil, false
	}
	if msg := in.Data.validate(); msg != "" {
		writeError(w, http.StatusBadRequest, msg)
		return nil, false
	}
	data, err := json.Marshal(in.Data)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Не удалось прочитать модель")
		return nil, false
	}
	area := in.Area
	if !inRange(area, 0, 10_000_000) {
		area = 0
	}
	return &database.PlanModel{Name: in.Data.Name, Floors: len(in.Data.Floors), Walls: in.Data.wallCount(), Area: math.Round(area*100) / 100, Data: data}, true
}

// Models handles GET/POST /api/v1/plan-models and GET/PUT/DELETE /api/v1/plan-models/{id}
func (h *PlanModelsHandler) Models(w http.ResponseWriter, r *http.Request) {
	uid, role := currentUser(r)
	if uid == "" {
		writeError(w, http.StatusUnauthorized, "Войдите, чтобы хранить модели")
		return
	}
	id := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/plan-models"), "/")

	if id == "" {
		switch r.Method {
		case http.MethodGet:
			list, err := database.ListPlanModels(uid)
			if err != nil {
				writeError(w, http.StatusServiceUnavailable, "Список моделей временно недоступен")
				return
			}
			items := make([]map[string]interface{}, 0, len(list))
			for _, m := range list {
				items = append(items, planResponse(m, false))
			}
			writeJSON(w, http.StatusOK, map[string]interface{}{"items": items})
		case http.MethodPost:
			m, ok := h.read(w, r)
			if !ok {
				return
			}
			if n, err := database.CountPlanModels(uid); err != nil {
				writeError(w, http.StatusServiceUnavailable, "Не удалось сохранить модель, попробуйте позже")
				return
			} else if n >= planMaxPerUser {
				writeError(w, http.StatusConflict, "Сохранено уже 100 моделей — удалите ненужные")
				return
			}
			m.OwnerID = uid
			if err := database.CreatePlanModel(m); err != nil {
				writeError(w, http.StatusServiceUnavailable, "Не удалось сохранить модель, попробуйте позже")
				return
			}
			writeJSON(w, http.StatusCreated, planResponse(m, false))
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
		return
	}

	existing, err := database.GetPlanModel(id)
	if errors.Is(err, database.ErrNotFound) || (err == nil && existing.OwnerID != uid && !isStaff(role)) {
		// чужую модель не отличаем от несуществующей
		writeError(w, http.StatusNotFound, "Модель не найдена")
		return
	}
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, "Модель временно недоступна")
		return
	}

	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, planResponse(existing, true))
	case http.MethodPut:
		if existing.OwnerID != uid {
			writeError(w, http.StatusForbidden, "Изменять модель может только её автор")
			return
		}
		m, ok := h.read(w, r)
		if !ok {
			return
		}
		m.ID, m.OwnerID = existing.ID, uid
		if err := database.UpdatePlanModel(m); err != nil {
			writeError(w, http.StatusServiceUnavailable, "Не удалось сохранить модель, попробуйте позже")
			return
		}
		writeJSON(w, http.StatusOK, planResponse(m, false))
	case http.MethodDelete:
		if err := database.DeletePlanModel(id); err != nil {
			writeError(w, http.StatusServiceUnavailable, "Не удалось удалить модель")
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
