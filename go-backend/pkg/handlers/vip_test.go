package handlers

import (
	"bytes"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"qazgost-ai/backend/pkg/config"
)

func vipDoc(name string) map[string]interface{} {
	return map[string]interface{}{
		"name": name, "object": "Ангар", "startDate": "2026-10-01", "evil": "<script>",
		"contractor": map[string]interface{}{"name": "ИП Тест", "iin": "000000000000"},
		"client":     map[string]interface{}{"name": "ТОО Заказчик", "bin": "111111111111"},
		"invoice":    map[string]interface{}{"number": "14", "date": "2026-11-24"},
		"staff": []map[string]interface{}{
			{"id": "p1", "name": "Иванов Иван", "role": "Мастер", "iin": "900101300123"},
			{"id": "p2", "name": "Петров Пётр", "role": "Рабочий"},
		},
		"equipment": []map[string]interface{}{{"id": "m1", "name": "Кран", "plate": "001 AAA 09", "driverId": "p2"}, {"id": "m2", "name": "КАМАЗ", "driverId": "нет-такого"}},
		"brigades":  []map[string]interface{}{{"id": "b1", "name": "Бригада 1", "members": []string{"p1", "p2", "p9", "p1"}, "equipment": []string{"m1", "m7"}}},
		"works": []map[string]interface{}{
			{"id": "w1", "title": "Ливневая система", "start": "2026-10-29", "end": "2026-11-13", "status": "progress", "brigadeId": "b1"},
			{"id": "w2", "title": "Резка отверстий", "start": "2026-11-11", "end": "2026-11-11", "status": "странный", "brigadeId": "b404"},
		},
	}
}

func TestVipProjectsLifecycle(t *testing.T) {
	h := NewVipHandler(&config.Config{UploadDir: t.TempDir()})
	admin := fmt.Sprintf("u_vip_%d", time.Now().UnixNano())
	call := func(method, path string, body interface{}, uid, role string) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		var r *http.Request
		if body != nil {
			r = jsonReq(method, path, body)
		} else {
			r = httptest.NewRequest(method, path, nil)
		}
		if uid != "" {
			r = asUser(r, uid, role)
		}
		h.Projects(w, r)
		return w
	}

	// доступ: только администратор и менеджер
	if w := call("GET", "/api/v1/vip/projects", nil, "", ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("без входа — 401, получено %d", w.Code)
	}
	for _, role := range []string{"customer", "executor", "engineer", "company"} {
		if w := call("GET", "/api/v1/vip/projects", nil, "u_x", role); w.Code != http.StatusForbidden {
			t.Fatalf("роль %s не должна видеть проекты, получено %d", role, w.Code)
		}
		if w := call("POST", "/api/v1/vip/projects", map[string]interface{}{"data": vipDoc("Чужой")}, "u_x", role); w.Code != http.StatusForbidden {
			t.Fatalf("роль %s не должна создавать проекты, получено %d", role, w.Code)
		}
	}

	name := fmt.Sprintf("Завод %d", time.Now().UnixNano())
	w := call("POST", "/api/v1/vip/projects", map[string]interface{}{"data": vipDoc(name)}, admin, "admin")
	if w.Code != http.StatusCreated {
		t.Fatalf("создание: %d %s", w.Code, w.Body.String())
	}
	var created struct {
		ID      string
		Version int
		Data    struct {
			Name      string
			Staff     []struct{ ID, IIN string }
			Equipment []struct{ ID, DriverID string }
			Brigades  []struct {
				Members   []string
				Equipment []string
			}
			Works []struct{ ID, Status, BrigadeID string }
		}
	}
	decode(t, w, &created)
	if created.ID == "" || created.Version != 1 || created.Data.Name != name {
		t.Fatalf("неожиданный ответ: %+v", created)
	}
	if strings.Contains(w.Body.String(), "evil") {
		t.Fatalf("лишние поля должны отбрасываться")
	}
	// ссылки на несуществующих людей, технику и бригады убираются, статус приводится к известному
	if b := created.Data.Brigades[0]; len(b.Members) != 2 || len(b.Equipment) != 1 {
		t.Fatalf("бригада должна содержать только известных людей и технику без повторов: %+v", b)
	}
	if created.Data.Equipment[1].DriverID != "" || created.Data.Works[1].BrigadeID != "" || created.Data.Works[1].Status != "plan" {
		t.Fatalf("ссылки и статус не нормализованы: %+v", created.Data)
	}
	path := "/api/v1/vip/projects/" + created.ID

	// менеджер видит проект в списке со сводкой
	w = call("GET", "/api/v1/vip/projects", nil, "u_mgr", "manager")
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), created.ID) {
		t.Fatalf("список: %d %s", w.Code, w.Body.String())
	}
	var list struct {
		Items []struct {
			ID                      string
			Works, Staff, Equipment int
			StartDate               string
		}
	}
	decode(t, w, &list)
	found := false
	for _, it := range list.Items {
		if it.ID == created.ID {
			found = it.Works == 2 && it.Staff == 2 && it.Equipment == 2 && it.StartDate == "2026-10-01"
		}
	}
	if !found {
		t.Fatalf("сводка в списке неверна: %+v", list.Items)
	}

	// неверные документы
	bad := map[string]func(d map[string]interface{}){
		"пустое название": func(d map[string]interface{}) { d["name"] = "   " },
		"дата не дата": func(d map[string]interface{}) {
			d["works"].([]map[string]interface{})[0]["start"] = "29 октября"
		},
		"нет такого числа":         func(d map[string]interface{}) { d["works"].([]map[string]interface{})[0]["end"] = "2026-11-31" },
		"конец раньше начала":      func(d map[string]interface{}) { d["works"].([]map[string]interface{})[0]["end"] = "2026-10-01" },
		"работа без названия":      func(d map[string]interface{}) { d["works"].([]map[string]interface{})[0]["title"] = "" },
		"ИИН не из 12 цифр":        func(d map[string]interface{}) { d["staff"].([]map[string]interface{})[0]["iin"] = "12345" },
		"два работника с одним id": func(d map[string]interface{}) { d["staff"].([]map[string]interface{})[1]["id"] = "p1" },
		"чужая ссылка на фото": func(d map[string]interface{}) {
			d["works"].([]map[string]interface{})[0]["media"] = []map[string]interface{}{{"id": "f1", "kind": "photo", "url": "https://evil.example/x.jpg"}}
		},
		"ссылка-скрипт": func(d map[string]interface{}) {
			d["works"].([]map[string]interface{})[0]["media"] = []map[string]interface{}{{"id": "f1", "kind": "photo", "url": "javascript:alert(1)"}}
		},
		"выход из папки": func(d map[string]interface{}) {
			d["works"].([]map[string]interface{})[0]["media"] = []map[string]interface{}{{"id": "f1", "kind": "photo", "url": "/uploads/vip/../../etc/passwd.jpg"}}
		},
	}
	for label, mutate := range bad {
		d := vipDoc(name)
		mutate(d)
		if w := call("PUT", path, map[string]interface{}{"version": 1, "data": d}, admin, "admin"); w.Code != http.StatusBadRequest {
			t.Fatalf("%s: ожидался отказ 400, получено %d %s", label, w.Code, w.Body.String())
		}
	}
	if w := call("PUT", path, map[string]interface{}{"version": 1}, admin, "admin"); w.Code != http.StatusBadRequest {
		t.Fatalf("сохранение без документа: %d", w.Code)
	}

	// сохранение с фото, загруженным через модуль
	d := vipDoc(name + " — правка")
	d["works"].([]map[string]interface{})[0]["media"] = []map[string]interface{}{{"id": "f1", "kind": "video", "url": "/uploads/vip/0123456789abcdef01234567.mp4", "date": "2026-11-20", "caption": "Заливка\x00"}}
	w = call("PUT", path, map[string]interface{}{"version": 1, "data": d}, "u_mgr", "manager")
	if w.Code != http.StatusOK {
		t.Fatalf("сохранение: %d %s", w.Code, w.Body.String())
	}
	if strings.Contains(w.Body.String(), `\u0000`) {
		t.Fatalf("нулевой байт должен убираться")
	}
	var saved struct{ Version int }
	decode(t, w, &saved)
	if saved.Version != 2 {
		t.Fatalf("версия должна вырасти до 2, получено %d", saved.Version)
	}
	// второй человек со старой копией не затирает чужую правку
	w = call("PUT", path, map[string]interface{}{"version": 1, "data": vipDoc("Старая копия")}, admin, "admin")
	if w.Code != http.StatusConflict || !strings.Contains(w.Body.String(), "version_conflict") {
		t.Fatalf("сохранение старой копии должно дать 409, получено %d %s", w.Code, w.Body.String())
	}
	w = call("GET", path, nil, admin, "admin")
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), "— правка") || !strings.Contains(w.Body.String(), "0123456789abcdef01234567.mp4") {
		t.Fatalf("после конфликта должна остаться правка менеджера: %d %s", w.Code, w.Body.String())
	}

	if w := call("GET", "/api/v1/vip/projects/нет", nil, admin, "admin"); w.Code != http.StatusNotFound {
		t.Fatalf("плохой номер проекта: %d", w.Code)
	}
	if w := call("PUT", "/api/v1/vip/projects/vip_0", map[string]interface{}{"version": 1, "data": vipDoc("x")}, admin, "admin"); w.Code != http.StatusNotFound {
		t.Fatalf("сохранение несуществующего проекта: %d", w.Code)
	}
	if w := call("DELETE", path, nil, "u_x", "engineer"); w.Code != http.StatusForbidden {
		t.Fatalf("инженер не удаляет проект: %d", w.Code)
	}
	if w := call("DELETE", path, nil, admin, "admin"); w.Code != http.StatusOK {
		t.Fatalf("удаление: %d", w.Code)
	}
	if w := call("GET", path, nil, admin, "admin"); w.Code != http.StatusNotFound {
		t.Fatalf("после удаления: %d", w.Code)
	}
}

func TestVipMediaUpload(t *testing.T) {
	dir := t.TempDir()
	h := NewVipHandler(&config.Config{UploadDir: dir})
	upload := func(name string, data []byte, role string) *httptest.ResponseRecorder {
		var buf bytes.Buffer
		mw := multipart.NewWriter(&buf)
		_ = mw.WriteField("caption", "подпись")
		fw, _ := mw.CreateFormFile("file", name)
		_, _ = fw.Write(data)
		_ = mw.Close()
		req := httptest.NewRequest("POST", "/api/v1/vip/media", &buf)
		req.Header.Set("Content-Type", mw.FormDataContentType())
		if role != "" {
			req = asUser(req, "u_media", role)
		}
		w := httptest.NewRecorder()
		h.UploadMedia(w, req)
		return w
	}
	png := []byte("\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89")
	mp4 := append([]byte("\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom"), make([]byte, 600)...)
	mov := append([]byte("\x00\x00\x00\x14ftypqt  \x00\x00\x00\x00qt  "), make([]byte, 100)...)

	if w := upload("a.png", png, ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("без входа: %d", w.Code)
	}
	if w := upload("a.png", png, "executor"); w.Code != http.StatusForbidden {
		t.Fatalf("исполнитель не загружает: %d", w.Code)
	}
	for name, data := range map[string][]byte{"фото объекта.PNG": png, "видео.mp4": mp4, "IMG_0001.MOV": mov} {
		w := upload(name, data, "manager")
		if w.Code != http.StatusCreated {
			t.Fatalf("%s: %d %s", name, w.Code, w.Body.String())
		}
		var out struct {
			URL, Kind, Name string
			Size            int64
		}
		decode(t, w, &out)
		if !vipMediaRe.MatchString(out.URL) || out.Size != int64(len(data)) {
			t.Fatalf("%s: неожиданный ответ %+v", name, out)
		}
		wantKind := "video"
		if strings.HasSuffix(strings.ToLower(name), ".png") {
			wantKind = "photo"
		}
		if out.Kind != wantKind {
			t.Fatalf("%s: тип %s, ожидался %s", name, out.Kind, wantKind)
		}
		if fi, err := os.Stat(filepath.Join(dir, "vip", filepath.Base(out.URL))); err != nil || fi.Size() != int64(len(data)) {
			t.Fatalf("%s: файл не записан целиком: %v", name, err)
		}
	}
	for name, data := range map[string][]byte{
		"x.html":       []byte("<script>alert(1)</script>"),
		"x.svg":        []byte(`<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>`),
		"x.exe":        []byte("MZ\x90\x00"),
		"скрипт.png":   []byte("<html><script>alert(1)</script></html>"),
		"скрипт.mp4":   []byte("<html><script>alert(1)</script></html>"),
		"пустой.jpg":   {},
		"x.png.html":   png,
		"../../x.php":  []byte("<?php echo 1;"),
		"без_расширен": png,
	} {
		if w := upload(name, data, "admin"); w.Code != http.StatusBadRequest {
			t.Fatalf("%s должен быть отклонён, получено %d %s", name, w.Code, w.Body.String())
		}
	}
	entries, _ := os.ReadDir(filepath.Join(dir, "vip"))
	if len(entries) != 3 {
		t.Fatalf("на диске должны остаться только 3 принятых файла, найдено %d", len(entries))
	}
	// фото больше 20 МБ
	big := append(append([]byte{}, png...), make([]byte, vipMaxPhoto+10)...)
	if w := upload("большое.png", big, "admin"); w.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("фото больше предела: %d", w.Code)
	}
	if entries, _ := os.ReadDir(filepath.Join(dir, "vip")); len(entries) != 3 {
		t.Fatalf("слишком большой файл не должен оставаться на диске")
	}
}

// Новые поля проекта: фото людей и техники, подгруппа техники, выходной, факт, бюджет, документы.
// Чужие ссылки и неизвестные значения не сохраняются.
func TestVipProjectExtraFields(t *testing.T) {
	const photo = "/uploads/vip/0123456789abcdef01234567.jpg"
	p := vipProject{
		Name: "Завод", RestDay: 3, Budget: 5e8,
		Staff:     []vipPerson{{ID: "p1", Name: "Иванов", Photo: photo}, {ID: "p2", Name: "Петров", Photo: "https://evil.example/x.jpg"}},
		Equipment: []vipMachine{{ID: "m1", Name: "Кран", Group: "crane", Photo: photo}, {ID: "m2", Name: "КАМАЗ", Group: "ракета", Photo: "/uploads/vip/0123456789abcdef01234567.mp4"}},
		Works: []vipWork{
			{ID: "w1", Title: "Кровля", Start: "2026-11-01", End: "2026-11-05", FactStart: "2026-11-02", FactEnd: "2026-11-07", Kind: "roof", Zone: "roof-n", Cost: 100, Paid: 40},
			{ID: "w2", Title: "Пол", Start: "2026-11-01", End: "2026-11-05", FactEnd: "2026-11-07", Kind: "<b>", Zone: "Зона", Cost: -5},
		},
		Docs: []vipFile{{ID: "d1", URL: "/uploads/vip/0123456789abcdef01234567.pdf", Name: "smeta.pdf"}},
	}
	if msg := p.validate(); msg != "" {
		t.Fatalf("проект должен приниматься: %s", msg)
	}
	if p.RestDay != 3 || p.Budget != 5e8 {
		t.Errorf("выходной и бюджет: %d %v", p.RestDay, p.Budget)
	}
	if p.Staff[0].Photo != photo || p.Staff[1].Photo != "" {
		t.Errorf("фото людей: %q %q", p.Staff[0].Photo, p.Staff[1].Photo)
	}
	if p.Equipment[0].Group != "crane" || p.Equipment[0].Photo != photo || p.Equipment[1].Group != "" || p.Equipment[1].Photo != "" {
		t.Errorf("техника: %+v", p.Equipment)
	}
	if w := p.Works[0]; w.FactStart != "2026-11-02" || w.FactEnd != "2026-11-07" || w.Kind != "roof" || w.Zone != "roof-n" || w.Cost != 100 || w.Paid != 40 {
		t.Errorf("работа 1: %+v", w)
	}
	if w := p.Works[1]; w.FactEnd != "" || w.Kind != "" || w.Zone != "" || w.Cost != 0 {
		t.Errorf("работа 2 должна очиститься: %+v", w)
	}
	if p.Docs[0].Title != "smeta.pdf" {
		t.Errorf("документ без названия получает имя файла: %q", p.Docs[0].Title)
	}
	bad := vipProject{Name: "Завод", Docs: []vipFile{{ID: "d1", URL: "https://evil.example/a.pdf"}}}
	if bad.validate() == "" {
		t.Error("документ с чужой ссылкой должен отклоняться")
	}
	if !vipLooksLike([]byte("%PDF-1.7 ..."), ".pdf") || vipLooksLike([]byte("<html>"), ".pdf") || !vipLooksLike([]byte("PK\x03\x04...."), ".xlsx") {
		t.Error("проверка содержимого документов")
	}
}
