package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/middleware"
)

// Модуль «Строительство зданий и сооружений»: рабочие проекты с графиком работ, штатом, техникой,
// бригадами, фото и видео. Доступ — только администратор и менеджер (в проекте лежат ИИН работников
// и реквизиты сторон); роль проверяет маршрут, обработчик проверяет её ещё раз.

const (
	vipMaxBody     = 2 << 20 // документ проекта
	vipMaxProjects = 200
	vipMaxPhoto    = 20 << 20
	vipMaxVideo    = 200 << 20
	vipMaxDoc      = 30 << 20
	// VipMediaBodyLimit — предел тела запроса загрузки (видео + служебные поля формы)
	VipMediaBodyLimit = vipMaxVideo + (1 << 20)
)

type VipHandler struct {
	cfg *config.Config
}

func NewVipHandler(cfg *config.Config) *VipHandler {
	return &VipHandler{cfg: cfg}
}

type vipParty struct {
	Name    string `json:"name"`
	BIN     string `json:"bin"`
	IIN     string `json:"iin"`
	Address string `json:"address"`
	Bank    string `json:"bank"`
	BIK     string `json:"bik"`
	Account string `json:"account"`
	KBE     string `json:"kbe"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Signer  string `json:"signer"`
}

type vipPerson struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Role  string `json:"role"`
	IIN   string `json:"iin"`
	Phone string `json:"phone"`
	Note  string `json:"note"`
	Photo string `json:"photo"` // фото работника: ссылка на файл, загруженный через модуль
}

type vipMachine struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Plate    string `json:"plate"`
	DriverID string `json:"driverId"`
	Note     string `json:"note"`
	Group    string `json:"group"` // подгруппа: crane | manipulator | lift | truck | earth | other
	Photo    string `json:"photo"`
}

type vipBrigade struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Members   []string `json:"members"`
	Equipment []string `json:"equipment"`
	Note      string   `json:"note"`
}

type vipMedia struct {
	ID      string `json:"id"`
	Kind    string `json:"kind"` // photo | video
	URL     string `json:"url"`
	Name    string `json:"name"`
	Date    string `json:"date"`
	Caption string `json:"caption"`
	Size    int64  `json:"size"`
	AddedAt string `json:"addedAt"`
	AddedBy string `json:"addedBy"`
}

type vipWork struct {
	ID        string     `json:"id"`
	Title     string     `json:"title"`
	Place     string     `json:"place"`
	Volume    string     `json:"volume"`
	Start     string     `json:"start"`
	End       string     `json:"end"`
	Status    string     `json:"status"` // plan | progress | done | hold
	BrigadeID string     `json:"brigadeId"`
	Note      string     `json:"note"`
	Check     string     `json:"check"` // что уточнить (пусто — всё ясно)
	Media     []vipMedia `json:"media"`
	FactStart string     `json:"factStart"`      // когда работу начали на самом деле
	FactEnd   string     `json:"factEnd"`        // когда закончили на самом деле
	Kind      string     `json:"kind"`           // вид работ — для картинки на графике
	Zone      string     `json:"zone"`           // место на модели здания
	Cost      float64    `json:"cost"`           // стоимость работы по плану, ₸
	Paid      float64    `json:"paid"`           // оплачено, ₸
	Shape     string     `json:"shape"`          // что нарисовать на модели: stairs, storm, rails…
	Floor     int        `json:"floor"`          // этаж: 1, 2 или 0 — подобрать по названию
	Pos       *vipPos    `json:"pos,omitempty"`  // место на плане здания, м; пусто — подобрать автоматически
	Pos2      *vipPos    `json:"pos2,omitempty"` // место второй части работы (вторая лестница)
}

// vipPos — точка на плане: x от западного торца, z от северной стены (снаружи здания — за пределами 0…70 и 0…25)
type vipPos struct {
	X float64 `json:"x"`
	Z float64 `json:"z"`
}

type vipFile struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Kind    string `json:"kind"` // смета, акт, договор… — свободная подпись
	URL     string `json:"url"`
	Name    string `json:"name"`
	Size    int64  `json:"size"`
	Date    string `json:"date"`
	AddedAt string `json:"addedAt"`
	AddedBy string `json:"addedBy"`
}

type vipInvoice struct {
	Number string  `json:"number"`
	Date   string  `json:"date"`
	Amount float64 `json:"amount"`
}

type vipProject struct {
	Name       string       `json:"name"`
	Object     string       `json:"object"`
	Address    string       `json:"address"`
	StartDate  string       `json:"startDate"`
	EndDate    string       `json:"endDate"`
	Note       string       `json:"note"`
	Client     vipParty     `json:"client"`
	Contractor vipParty     `json:"contractor"`
	Invoice    vipInvoice   `json:"invoice"`
	Staff      []vipPerson  `json:"staff"`
	Equipment  []vipMachine `json:"equipment"`
	Brigades   []vipBrigade `json:"brigades"`
	Works      []vipWork    `json:"works"`
	RestDay    int          `json:"restDay"` // выходной день недели: 0 — воскресенье … 6 — суббота
	Budget     float64      `json:"budget"`  // бюджет на строительство, ₸
	Docs       []vipFile    `json:"docs"`
}

var (
	vipDateRe  = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	vipIDRe    = regexp.MustCompile(`^[A-Za-z0-9_-]{1,40}$`)
	vipMediaRe = regexp.MustCompile(`^/uploads/vip/[a-f0-9]{24}\.(jpg|jpeg|png|webp|heic|mp4|mov|m4v|webm)$`)
	vipStatus  = map[string]bool{"plan": true, "progress": true, "done": true, "hold": true}
	vipPhotoRe = regexp.MustCompile(`^/uploads/vip/[a-f0-9]{24}\.(jpg|jpeg|png|webp|heic)$`)
	vipDocRe   = regexp.MustCompile(`^/uploads/vip/[a-f0-9]{24}\.(pdf|xlsx|xls|docx|doc|jpg|jpeg|png|webp)$`)
	vipSlugRe  = regexp.MustCompile(`^[a-z0-9_-]{0,24}$`)
	vipGroups  = map[string]bool{"crane": true, "manipulator": true, "lift": true, "truck": true, "earth": true, "other": true}
)

// clean trims the text, drops control characters (PostgreSQL не хранит нулевой байт) and cuts to max runes
func vipClean(s string, max int) string {
	s = strings.Map(func(r rune) rune {
		if r == '\n' || r == '\t' {
			return r
		}
		if r < 0x20 || r == 0x7f {
			return -1
		}
		return r
	}, strings.ToValidUTF8(s, ""))
	s = strings.TrimSpace(s)
	if utf8.RuneCountInString(s) > max {
		s = string([]rune(s)[:max])
	}
	return s
}

func vipValidDate(s string) bool {
	if !vipDateRe.MatchString(s) {
		return false
	}
	_, err := time.Parse("2006-01-02", s)
	return err == nil
}

func (p *vipParty) clean() {
	p.Name, p.Address, p.Bank, p.Signer = vipClean(p.Name, 200), vipClean(p.Address, 300), vipClean(p.Bank, 200), vipClean(p.Signer, 300)
	p.BIN, p.IIN, p.BIK, p.Account, p.KBE = vipClean(p.BIN, 20), vipClean(p.IIN, 20), vipClean(p.BIK, 20), vipClean(p.Account, 40), vipClean(p.KBE, 10)
	p.Email, p.Phone = vipClean(p.Email, 120), vipClean(p.Phone, 40)
}

// validate normalises the document in place and returns a message for the user when it is not acceptable
func (p *vipProject) validate() string {
	p.Name = vipClean(p.Name, 200)
	if p.Name == "" {
		return "Укажите название проекта"
	}
	p.Object, p.Address, p.Note = vipClean(p.Object, 300), vipClean(p.Address, 300), vipClean(p.Note, 2000)
	if p.StartDate != "" && !vipValidDate(p.StartDate) {
		return "Дата начала проекта должна быть в формате ГГГГ-ММ-ДД"
	}
	if p.EndDate != "" && !vipValidDate(p.EndDate) {
		return "Дата окончания проекта должна быть в формате ГГГГ-ММ-ДД"
	}
	if p.StartDate != "" && p.EndDate != "" && p.EndDate < p.StartDate {
		return "Дата окончания проекта раньше даты начала"
	}
	p.Client.clean()
	p.Contractor.clean()
	p.Invoice.Number = vipClean(p.Invoice.Number, 40)
	if p.Invoice.Date != "" && !vipValidDate(p.Invoice.Date) {
		return "Дата счёта должна быть в формате ГГГГ-ММ-ДД"
	}
	if p.Invoice.Amount < 0 || p.Invoice.Amount > 1e13 {
		return "Некорректная сумма счёта"
	}
	if len(p.Staff) > 500 || len(p.Equipment) > 300 || len(p.Brigades) > 150 || len(p.Works) > 2000 {
		return "Слишком большой проект: до 500 человек, 300 единиц техники, 150 бригад и 2000 работ"
	}
	if p.Staff == nil {
		p.Staff = []vipPerson{}
	}
	if p.Equipment == nil {
		p.Equipment = []vipMachine{}
	}
	if p.Brigades == nil {
		p.Brigades = []vipBrigade{}
	}
	if p.Works == nil {
		p.Works = []vipWork{}
	}
	if p.RestDay < 0 || p.RestDay > 6 {
		p.RestDay = 0
	}
	if p.Budget < 0 || p.Budget > 1e13 {
		return "Некорректный бюджет проекта"
	}
	if len(p.Docs) > 500 {
		return "В проекте больше 500 документов — удалите лишние"
	}
	if p.Docs == nil {
		p.Docs = []vipFile{}
	}
	docs := map[string]bool{}
	for i := range p.Docs {
		d := &p.Docs[i]
		if !vipIDRe.MatchString(d.ID) || docs[d.ID] {
			return "У документов должны быть разные номера записей"
		}
		docs[d.ID] = true
		if !vipDocRe.MatchString(d.URL) {
			return "Документы добавляются только загрузкой через модуль"
		}
		d.Title, d.Kind, d.Name, d.AddedBy, d.AddedAt = vipClean(d.Title, 200), vipClean(d.Kind, 60), vipClean(d.Name, 150), vipClean(d.AddedBy, 120), vipClean(d.AddedAt, 30)
		if d.Title == "" {
			d.Title = d.Name
		}
		if d.Date != "" && !vipValidDate(d.Date) {
			d.Date = ""
		}
		if d.Size < 0 {
			d.Size = 0
		}
	}

	people := map[string]bool{}
	for i := range p.Staff {
		s := &p.Staff[i]
		if !vipIDRe.MatchString(s.ID) || people[s.ID] {
			return "У работников должны быть разные номера записей"
		}
		people[s.ID] = true
		s.Name, s.Role, s.IIN, s.Phone, s.Note = vipClean(s.Name, 150), vipClean(s.Role, 100), vipClean(s.IIN, 12), vipClean(s.Phone, 40), vipClean(s.Note, 500)
		if s.Name == "" {
			return "У работника не указано имя"
		}
		if !vipPhotoRe.MatchString(s.Photo) {
			s.Photo = ""
		}
		if s.IIN != "" && !regexp.MustCompile(`^\d{12}$`).MatchString(s.IIN) {
			return "ИИН работника «" + s.Name + "» должен состоять из 12 цифр"
		}
	}
	machines := map[string]bool{}
	for i := range p.Equipment {
		m := &p.Equipment[i]
		if !vipIDRe.MatchString(m.ID) || machines[m.ID] {
			return "У техники должны быть разные номера записей"
		}
		machines[m.ID] = true
		m.Name, m.Plate, m.Note = vipClean(m.Name, 150), vipClean(m.Plate, 30), vipClean(m.Note, 500)
		if m.Name == "" {
			return "У техники не указано название"
		}
		if !vipGroups[m.Group] {
			m.Group = ""
		}
		if !vipPhotoRe.MatchString(m.Photo) {
			m.Photo = ""
		}
		if m.DriverID != "" && !people[m.DriverID] {
			m.DriverID = "" // водителя удалили из штата
		}
	}
	brigades := map[string]bool{}
	for i := range p.Brigades {
		b := &p.Brigades[i]
		if !vipIDRe.MatchString(b.ID) || brigades[b.ID] {
			return "У бригад должны быть разные номера записей"
		}
		brigades[b.ID] = true
		b.Name, b.Note = vipClean(b.Name, 120), vipClean(b.Note, 500)
		if b.Name == "" {
			return "У бригады не указано название"
		}
		b.Members = vipKeep(b.Members, people, 50)
		b.Equipment = vipKeep(b.Equipment, machines, 30)
	}
	works := map[string]bool{}
	for i := range p.Works {
		w := &p.Works[i]
		if !vipIDRe.MatchString(w.ID) || works[w.ID] {
			return "У работ должны быть разные номера записей"
		}
		works[w.ID] = true
		w.Title, w.Place, w.Volume, w.Note, w.Check = vipClean(w.Title, 200), vipClean(w.Place, 200), vipClean(w.Volume, 200), vipClean(w.Note, 2000), vipClean(w.Check, 300)
		if w.Title == "" {
			return "У работы не указано название"
		}
		if !vipValidDate(w.Start) || !vipValidDate(w.End) {
			return "У работы «" + w.Title + "» укажите даты начала и окончания"
		}
		if w.End < w.Start {
			return "У работы «" + w.Title + "» дата окончания раньше даты начала"
		}
		if !vipStatus[w.Status] {
			w.Status = "plan"
		}
		if w.FactStart != "" && !vipValidDate(w.FactStart) {
			w.FactStart = ""
		}
		if w.FactEnd != "" && (!vipValidDate(w.FactEnd) || w.FactStart == "" || w.FactEnd < w.FactStart) {
			w.FactEnd = ""
		}
		if !vipSlugRe.MatchString(w.Kind) {
			w.Kind = ""
		}
		if !vipSlugRe.MatchString(w.Zone) {
			w.Zone = ""
		}
		if w.Cost < 0 || w.Cost > 1e13 {
			w.Cost = 0
		}
		if w.Paid < 0 || w.Paid > 1e13 {
			w.Paid = 0
		}
		if !vipSlugRe.MatchString(w.Shape) {
			w.Shape = ""
		}
		if w.Floor < 0 || w.Floor > 2 {
			w.Floor = 0
		}
		if w.Pos != nil && !(w.Pos.X >= -30 && w.Pos.X <= 100 && w.Pos.Z >= -30 && w.Pos.Z <= 55) {
			w.Pos = nil // NaN и точки далеко за площадкой
		}
		if w.Pos2 != nil && !(w.Pos2.X >= -30 && w.Pos2.X <= 100 && w.Pos2.Z >= -30 && w.Pos2.Z <= 55) {
			w.Pos2 = nil
		}
		if w.BrigadeID != "" && !brigades[w.BrigadeID] {
			w.BrigadeID = "" // бригаду удалили
		}
		if len(w.Media) > 300 {
			return "У работы «" + w.Title + "» больше 300 фото и видео — удалите лишние"
		}
		if w.Media == nil {
			w.Media = []vipMedia{}
		}
		seen := map[string]bool{}
		for j := range w.Media {
			m := &w.Media[j]
			if !vipIDRe.MatchString(m.ID) || seen[m.ID] {
				return "У фото и видео должны быть разные номера записей"
			}
			seen[m.ID] = true
			// только файлы, загруженные через этот модуль: чужая ссылка в проект не попадёт
			if !vipMediaRe.MatchString(m.URL) {
				return "Фото и видео добавляются только загрузкой через модуль"
			}
			if m.Kind != "video" {
				m.Kind = "photo"
			}
			m.Name, m.Caption, m.AddedBy = vipClean(m.Name, 150), vipClean(m.Caption, 300), vipClean(m.AddedBy, 120)
			if m.Date != "" && !vipValidDate(m.Date) {
				m.Date = ""
			}
			m.AddedAt = vipClean(m.AddedAt, 30)
			if m.Size < 0 {
				m.Size = 0
			}
		}
	}
	return ""
}

// vipKeep leaves known ids only, each once, at most max
func vipKeep(ids []string, known map[string]bool, max int) []string {
	out := []string{}
	seen := map[string]bool{}
	for _, id := range ids {
		if known[id] && !seen[id] && len(out) < max {
			seen[id] = true
			out = append(out, id)
		}
	}
	return out
}

func vipStaffOnly(w http.ResponseWriter, r *http.Request) bool {
	uid, role := currentUser(r)
	if uid == "" {
		writeError(w, http.StatusUnauthorized, "Войдите, чтобы открыть проекты")
		return false
	}
	if !isStaff(role) && !middleware.IsObserverRead(r) { // наблюдатель — только чтение
		writeError(w, http.StatusForbidden, "Проекты строительства ведут администратор и менеджер")
		return false
	}
	return true
}

func vipResponse(p *database.VipProject, withData bool) map[string]interface{} {
	out := map[string]interface{}{"id": p.ID, "name": p.Name, "version": p.Version, "updatedAt": p.UpdatedAt}
	if withData {
		out["data"] = json.RawMessage(p.Data)
	} else {
		out["works"], out["staff"], out["equipment"], out["startDate"] = p.Works, p.Staff, p.Equipment, p.StartDate
	}
	return out
}

// read parses and validates {version, data}
func (h *VipHandler) read(w http.ResponseWriter, r *http.Request) (*database.VipProject, int, bool) {
	var in struct {
		Version int             `json:"version"`
		Data    json.RawMessage `json:"data"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, vipMaxBody)).Decode(&in); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			writeError(w, http.StatusRequestEntityTooLarge, "Проект слишком большой (больше 2 МБ)")
		} else {
			writeError(w, http.StatusBadRequest, "Не удалось прочитать проект")
		}
		return nil, 0, false
	}
	var doc vipProject
	if len(in.Data) == 0 || json.Unmarshal(in.Data, &doc) != nil {
		writeError(w, http.StatusBadRequest, "Не удалось прочитать проект: проверьте файл")
		return nil, 0, false
	}
	if msg := doc.validate(); msg != "" {
		writeError(w, http.StatusBadRequest, msg)
		return nil, 0, false
	}
	data, err := json.Marshal(&doc)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Не удалось прочитать проект")
		return nil, 0, false
	}
	return &database.VipProject{Name: doc.Name, Data: data}, in.Version, true
}

// Projects handles GET/POST /api/v1/vip/projects and GET/PUT/DELETE /api/v1/vip/projects/{id}
func (h *VipHandler) Projects(w http.ResponseWriter, r *http.Request) {
	if !vipStaffOnly(w, r) {
		return
	}
	uid, _ := currentUser(r)
	id := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/vip/projects"), "/")

	if id == "" {
		switch r.Method {
		case http.MethodGet:
			list, err := database.ListVipProjects()
			if err != nil {
				writeError(w, http.StatusServiceUnavailable, "Список проектов временно недоступен")
				return
			}
			items := make([]map[string]interface{}, 0, len(list))
			for _, p := range list {
				items = append(items, vipResponse(p, false))
			}
			writeJSON(w, http.StatusOK, map[string]interface{}{"items": items})
		case http.MethodPost:
			p, _, ok := h.read(w, r)
			if !ok {
				return
			}
			if n, err := database.CountVipProjects(); err != nil {
				writeError(w, http.StatusServiceUnavailable, "Не удалось сохранить проект, попробуйте позже")
				return
			} else if n >= vipMaxProjects {
				writeError(w, http.StatusConflict, "Сохранено уже 200 проектов — удалите ненужные")
				return
			}
			p.CreatedBy = uid
			if err := database.CreateVipProject(p); err != nil {
				writeError(w, http.StatusServiceUnavailable, "Не удалось сохранить проект, попробуйте позже")
				return
			}
			writeJSON(w, http.StatusCreated, vipResponse(p, true))
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
		return
	}

	if !vipIDRe.MatchString(id) {
		writeError(w, http.StatusNotFound, "Проект не найден")
		return
	}
	switch r.Method {
	case http.MethodGet:
		p, err := database.GetVipProject(id)
		if errors.Is(err, database.ErrNotFound) {
			writeError(w, http.StatusNotFound, "Проект не найден")
			return
		}
		if err != nil {
			writeError(w, http.StatusServiceUnavailable, "Проект временно недоступен")
			return
		}
		writeJSON(w, http.StatusOK, vipResponse(p, true))
	case http.MethodPut:
		p, version, ok := h.read(w, r)
		if !ok {
			return
		}
		p.ID = id
		err := database.UpdateVipProject(p, version)
		switch {
		case errors.Is(err, database.ErrNotFound):
			writeError(w, http.StatusNotFound, "Проект не найден: возможно, его удалили")
		case errors.Is(err, database.ErrVersionConflict):
			writeJSON(w, http.StatusConflict, map[string]interface{}{
				"error": "Проект изменили с другого устройства. Обновите страницу, чтобы увидеть свежую версию, и повторите правку",
				"code":  "version_conflict",
			})
		case err != nil:
			writeError(w, http.StatusServiceUnavailable, "Не удалось сохранить проект, попробуйте позже")
		default:
			writeJSON(w, http.StatusOK, vipResponse(p, true))
		}
	case http.MethodDelete:
		err := database.DeleteVipProject(id)
		if errors.Is(err, database.ErrNotFound) {
			writeError(w, http.StatusNotFound, "Проект не найден")
			return
		}
		if err != nil {
			writeError(w, http.StatusServiceUnavailable, "Не удалось удалить проект")
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

var (
	vipPhotoExt = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".heic": true}
	vipVideoExt = map[string]bool{".mp4": true, ".mov": true, ".m4v": true, ".webm": true}
	vipDocExt   = map[string]bool{".pdf": true, ".xlsx": true, ".xls": true, ".docx": true, ".doc": true}
)

// vipLooksLike checks the first bytes: an image must be an image, a video must be MP4/MOV/WebM
func vipLooksLike(head []byte, ext string) bool {
	ct := http.DetectContentType(head)
	if vipDocExt[ext] {
		switch ext {
		case ".pdf":
			return strings.HasPrefix(string(head), "%PDF-")
		case ".xlsx", ".docx":
			return strings.HasPrefix(string(head), "PK\x03\x04")
		default: // старые .doc и .xls
			return strings.HasPrefix(string(head), "\xD0\xCF\x11\xE0")
		}
	}
	if vipPhotoExt[ext] {
		if ext == ".heic" {
			return len(head) >= 12 && string(head[4:8]) == "ftyp"
		}
		return strings.HasPrefix(ct, "image/")
	}
	if ext == ".webm" {
		return ct == "video/webm"
	}
	// MP4 и MOV — контейнер ISO: в начале идёт блок ftyp (у старых MOV — moov, mdat, wide, free)
	if len(head) < 12 {
		return false
	}
	switch string(head[4:8]) {
	case "ftyp", "moov", "mdat", "wide", "free", "skip":
		return true
	}
	return false
}

// UploadMedia handles POST /api/v1/vip/media (multipart, field "file"): фото до 20 МБ, видео до 200 МБ.
// Файл пишется на диск потоком, имя — случайное: по ссылке его не подобрать.
func (h *VipHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	if !vipStaffOnly(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, VipMediaBodyLimit)
	mr, err := r.MultipartReader()
	if err != nil {
		writeError(w, http.StatusBadRequest, "Файл не передан в запросе")
		return
	}
	for {
		part, err := mr.NextPart()
		if err != nil {
			writeError(w, http.StatusBadRequest, "Файл не передан в запросе")
			return
		}
		if part.FormName() != "file" {
			continue
		}
		original := filepath.Base(part.FileName())
		ext := strings.ToLower(filepath.Ext(original))
		kind, limit := "", int64(0)
		switch {
		case vipPhotoExt[ext]:
			kind, limit = "photo", vipMaxPhoto
		case vipVideoExt[ext]:
			kind, limit = "video", vipMaxVideo
		case vipDocExt[ext]:
			kind, limit = "doc", vipMaxDoc
		default:
			writeError(w, http.StatusBadRequest, "Подходят фото (JPG, PNG, WEBP, HEIC), видео (MP4, MOV, WEBM) и документы (PDF, Word, Excel)")
			return
		}
		head := make([]byte, 512)
		n, _ := io.ReadFull(part, head)
		head = head[:n]
		if n == 0 || !vipLooksLike(head, ext) {
			if kind == "photo" {
				writeError(w, http.StatusBadRequest, "Файл не является фотографией")
			} else if kind == "doc" {
				writeError(w, http.StatusBadRequest, "Файл не является документом PDF, Word или Excel")
			} else {
				writeError(w, http.StatusBadRequest, "Файл не является видео MP4, MOV или WEBM")
			}
			return
		}
		dir := filepath.Join(h.cfg.UploadDir, "vip")
		if err := os.MkdirAll(dir, 0755); err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось сохранить файл на сервере")
			return
		}
		var rnd [12]byte
		if _, err := rand.Read(rnd[:]); err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось сохранить файл на сервере")
			return
		}
		name := hex.EncodeToString(rnd[:]) + ext
		dstPath := filepath.Join(dir, name)
		dst, err := os.Create(dstPath)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось сохранить файл на сервере")
			return
		}
		size := int64(0)
		_, werr := dst.Write(head)
		if werr == nil {
			var copied int64
			copied, werr = io.Copy(dst, io.LimitReader(part, limit-int64(n)+1))
			size = int64(n) + copied
		}
		cerr := dst.Close()
		var tooBig *http.MaxBytesError
		switch {
		case errors.As(werr, &tooBig), size > limit:
			_ = os.Remove(dstPath)
			writeError(w, http.StatusRequestEntityTooLarge, fmt.Sprintf("Файл больше допустимого: фото до %d МБ, видео до %d МБ, документ до %d МБ", vipMaxPhoto>>20, vipMaxVideo>>20, vipMaxDoc>>20))
			return
		case werr != nil || cerr != nil:
			_ = os.Remove(dstPath)
			writeError(w, http.StatusInternalServerError, "Не удалось сохранить файл: загрузка прервалась")
			return
		}
		writeJSON(w, http.StatusCreated, map[string]interface{}{
			"url":  "/uploads/vip/" + name,
			"kind": kind,
			"name": vipClean(original, 150),
			"size": size,
		})
		return
	}
}
