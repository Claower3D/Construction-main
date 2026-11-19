package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"qazgost-ai/backend/pkg/vision"
)

// «Смета по фото» не считается по снимку человека: сервер сам смотрит на фото (pkg/vision)
// и просит переснять объект. Проверка стоит на сервере, поэтому действует сразу для сайта и
// всех приложений, в том числе уже установленных.

// checkPhotoPerson вынесена в переменную, чтобы тесты могли подставить свой ответ.
var checkPhotoPerson = vision.CheckPerson

const (
	photoNotObjectCode = "photo_not_object"
	photoPersonMsg     = "На фото крупным планом человек, а не объект. Сфотографируйте помещение или участок без людей в кадре — либо уберите фото, и смета посчитается по описанию."
	photoGuardMax      = 3 // сколько первых фото проверяем
)

// photosShowPerson — true, если на всех проверенных фото в основном человек.
// Любой сбой (незнакомый формат, занятость сервера) проверку пропускает: смета важнее.
func photosShowPerson(photos []string) bool {
	checked, persons := 0, 0
	for _, p := range photos {
		if strings.TrimSpace(p) == "" {
			continue
		}
		if checked >= photoGuardMax {
			break
		}
		img, err := vision.DecodeDataURL(p)
		if err != nil {
			return false
		}
		res, err := checkPhotoPerson(img)
		if err != nil {
			log.Printf("photo guard: проверка пропущена: %v", err)
			return false
		}
		checked++
		if !res.Dominant {
			return false // хотя бы на одном фото объект — считаем смету
		}
		persons++
	}
	return checked > 0 && persons == checked
}

func writePhotoNotObject(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnprocessableEntity)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg, "detail": msg, "code": photoNotObjectCode})
}

// notObjectReply разбирает ответ ИИ: {"not_object":true,"reason":"…"} — на фото не стройка.
func notObjectReply(rawJSON string) (string, bool) {
	var v struct {
		NotObject bool   `json:"not_object"`
		Reason    string `json:"reason"`
	}
	if err := json.Unmarshal([]byte(rawJSON), &v); err != nil || !v.NotObject {
		return "", false
	}
	msg := "На фото не строительный объект"
	if r := strings.TrimSpace(v.Reason); r != "" {
		if len([]rune(r)) > 120 {
			r = string([]rune(r)[:120])
		}
		msg += " (" + r + ")"
	}
	return msg + ". Сфотографируйте помещение или участок — либо уберите фото, и смета посчитается по описанию.", true
}
