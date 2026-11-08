package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// Подмена X-Forwarded-For не должна обходить лимит: учитывается адрес, дописанный прокси.
func TestRateLimitIgnoresSpoofedForwardedFor(t *testing.T) {
	h := RateLimit(3, time.Minute, func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) })
	codes := []int{}
	for i := 0; i < 5; i++ {
		r := httptest.NewRequest(http.MethodPost, "/", nil)
		r.RemoteAddr = "10.1.1.1:5000"
		// клиент подставляет случайный первый адрес, прокси дописывает настоящий
		r.Header.Set("X-Forwarded-For", "203.0.113."+string(rune('0'+i))+", 198.51.100.7")
		rr := httptest.NewRecorder()
		h(rr, r)
		codes = append(codes, rr.Code)
	}
	if codes[3] != http.StatusTooManyRequests || codes[4] != http.StatusTooManyRequests {
		t.Fatalf("лимит обойдён подменой X-Forwarded-For: %v", codes)
	}
	// клиент напрямую из интернета: его X-Forwarded-For не учитывается вовсе
	h2 := RateLimit(2, time.Minute, func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) })
	last := 0
	for i := 0; i < 4; i++ {
		r := httptest.NewRequest(http.MethodPost, "/", nil)
		r.RemoteAddr = "203.0.113.50:4000"
		r.Header.Set("X-Forwarded-For", "192.0.2."+string(rune('0'+i)))
		rr := httptest.NewRecorder()
		h2(rr, r)
		last = rr.Code
	}
	if last != http.StatusTooManyRequests {
		t.Fatalf("прямой клиент обошёл лимит подменой заголовка: %d", last)
	}
	// разные настоящие клиенты учитываются раздельно
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	r.Header.Set("X-Forwarded-For", "198.51.100.8")
	rr := httptest.NewRecorder()
	h(rr, r)
	if rr.Code != http.StatusOK {
		t.Fatalf("другой клиент получил %d", rr.Code)
	}
}
