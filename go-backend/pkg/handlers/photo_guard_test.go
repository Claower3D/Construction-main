package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"image"
	"image/color"
	"image/jpeg"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/vision"
)

func testPhoto(t *testing.T, shade uint8) string {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 96, 72))
	for y := 0; y < 72; y++ {
		for x := 0; x < 96; x++ {
			img.Set(x, y, color.RGBA{shade, shade / 2, uint8(x), 255})
		}
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, nil); err != nil {
		t.Fatal(err)
	}
	return "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(buf.Bytes())
}

// stubPersonCheck подменяет нейросеть: answers — ответы по порядку фото.
func stubPersonCheck(t *testing.T, answers ...interface{}) *int {
	t.Helper()
	calls := 0
	old := checkPhotoPerson
	checkPhotoPerson = func(image.Image) (vision.PersonCheck, error) {
		a := answers[calls%len(answers)]
		calls++
		if err, ok := a.(error); ok {
			return vision.PersonCheck{}, err
		}
		return vision.PersonCheck{Dominant: a.(bool)}, nil
	}
	t.Cleanup(func() { checkPhotoPerson = old })
	return &calls
}

func visionCall(h *AiHandler, photos []string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	h.VisionProxy(w, jsonReq("POST", "/api/v1/ai/vision", map[string]interface{}{
		"photos": photos, "description": "Электромонтаж; объём/площадь: 25 м²", "category": "электромонтаж", "city": "Караганда", "mode": "auto",
	}))
	return w
}

func TestVision_PersonPhotoIsRefused(t *testing.T) {
	h := NewAiHandler(&config.Config{})
	calls := stubPersonCheck(t, true)
	w := visionCall(h, []string{testPhoto(t, 200)})
	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("ждали 422, получили %d: %s", w.Code, w.Body.String())
	}
	var body map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("ответ не JSON: %s", w.Body.String())
	}
	if body["code"] != photoNotObjectCode || !strings.Contains(body["error"].(string), "человек") {
		t.Fatalf("непонятный отказ: %v", body)
	}
	if _, has := body["scenarios"]; has || *calls != 1 {
		t.Fatalf("смета всё равно посчитана или фото проверено %d раз", *calls)
	}
}

func TestVision_ObjectPhotoGetsEstimate(t *testing.T) {
	h := NewAiHandler(&config.Config{})
	cases := []struct {
		name    string
		answers []interface{}
		photos  []string
		calls   int
	}{
		{"объект", []interface{}{false}, []string{testPhoto(t, 90)}, 1},
		{"без фото", []interface{}{true}, nil, 0},
		{"человек и объект", []interface{}{true, false}, []string{testPhoto(t, 200), testPhoto(t, 90)}, 2},
		{"сбой проверки", []interface{}{errors.New("занято")}, []string{testPhoto(t, 200)}, 1},
		{"битое фото", []interface{}{true}, []string{"data:image/jpeg;base64,AAAA"}, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			calls := stubPersonCheck(t, c.answers...)
			w := visionCall(h, c.photos)
			var body map[string]interface{}
			_ = json.Unmarshal(w.Body.Bytes(), &body)
			if w.Code != http.StatusOK || body["scenarios"] == nil {
				t.Fatalf("ждали смету, получили %d: %.200s", w.Code, w.Body.String())
			}
			if *calls != c.calls {
				t.Fatalf("фото проверено %d раз, ждали %d", *calls, c.calls)
			}
		})
	}
}

// Четыре фото людей: проверяем только первые три и отказываем.
func TestVision_ChecksFirstPhotosOnly(t *testing.T) {
	h := NewAiHandler(&config.Config{})
	calls := stubPersonCheck(t, true)
	p := testPhoto(t, 200)
	if w := visionCall(h, []string{p, p, p, p}); w.Code != http.StatusUnprocessableEntity || *calls != photoGuardMax {
		t.Fatalf("код %d, проверок %d", w.Code, *calls)
	}
}

// Без подмены: настоящая сеть на фото без людей пропускает расчёт.
func TestVision_RealNetworkPassesObject(t *testing.T) {
	h := NewAiHandler(&config.Config{})
	if w := visionCall(h, []string{testPhoto(t, 120)}); w.Code != http.StatusOK {
		t.Fatalf("ждали 200, получили %d: %.200s", w.Code, w.Body.String())
	}
}

func TestNotObjectReply(t *testing.T) {
	if msg, no := notObjectReply(`{"not_object":true,"reason":"портрет человека"}`); !no || !strings.Contains(msg, "портрет человека") {
		t.Fatalf("не распознали отказ ИИ: %q %v", msg, no)
	}
	for _, raw := range []string{`{"detected_type":"стена","total_cost":100}`, `{"not_object":false}`, `не json`} {
		if _, no := notObjectReply(raw); no {
			t.Fatalf("ложный отказ на %q", raw)
		}
	}
}
