package handlers

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// SpeechHandler handles speech recognition via Google Speech API v2
type SpeechHandler struct{}

func NewSpeechHandler() *SpeechHandler {
	return &SpeechHandler{}
}

type speechResponse struct {
	Text string `json:"text"`
	Ok   bool   `json:"ok"`
	Err  string `json:"error,omitempty"`
}

// Recognize accepts WAV audio via POST and returns recognized text
func (h *SpeechHandler) Recognize(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(200)
		return
	}

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 10*1024*1024)) // max 10MB
	defer r.Body.Close()
	if err != nil {
		respondSpeech(w, speechResponse{Err: "Failed to read audio", Ok: false})
		return
	}

	if len(body) < 44 {
		respondSpeech(w, speechResponse{Err: "Audio too short", Ok: false})
		return
	}

	// Extract PCM from WAV
	var pcmData []byte
	var sampleRate int

	if string(body[:4]) == "RIFF" {
		pcm, rate, extractErr := extractPCMFromWAV(body)
		if extractErr != nil {
			respondSpeech(w, speechResponse{Err: fmt.Sprintf("WAV parse error: %v", extractErr), Ok: false})
			return
		}
		pcmData = pcm
		sampleRate = rate
	} else {
		pcmData = body
		sampleRate = 16000
	}

	// Send to Google Speech API v2
	googleURL := fmt.Sprintf("http://www.google.com/speech-api/v2/recognize?output=json&lang=ru-RU&key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw")
	contentType := fmt.Sprintf("audio/l16; rate=%d", sampleRate)

	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequest("POST", googleURL, bytes.NewReader(pcmData))
	if err != nil {
		respondSpeech(w, speechResponse{Err: "Request build error", Ok: false})
		return
	}
	req.Header.Set("Content-Type", contentType)

	resp, err := client.Do(req)
	if err != nil {
		respondSpeech(w, speechResponse{Err: fmt.Sprintf("Google Speech API unavailable: %v", err), Ok: false})
		return
	}
	defer resp.Body.Close()

	resultBytes, _ := io.ReadAll(resp.Body)
	resultStr := string(resultBytes)

	// Parse Google's multi-line JSON response
	text := ""
	for _, line := range splitLines(resultStr) {
		if len(line) == 0 {
			continue
		}
		var obj map[string]interface{}
		if json.Unmarshal([]byte(line), &obj) != nil {
			continue
		}
		results, ok := obj["result"].([]interface{})
		if !ok || len(results) == 0 {
			continue
		}
		for _, r := range results {
			rm, ok := r.(map[string]interface{})
			if !ok {
				continue
			}
			alts, ok := rm["alternative"].([]interface{})
			if !ok || len(alts) == 0 {
				continue
			}
			first, ok := alts[0].(map[string]interface{})
			if !ok {
				continue
			}
			if t, ok := first["transcript"].(string); ok && t != "" {
				text = t
				break
			}
		}
		if text != "" {
			break
		}
	}

	respondSpeech(w, speechResponse{Text: text, Ok: true})
}

func extractPCMFromWAV(data []byte) ([]byte, int, error) {
	if len(data) < 44 {
		return nil, 0, fmt.Errorf("WAV too short")
	}

	// Read sample rate from WAV header (bytes 24-27, little-endian)
	sampleRate := int(binary.LittleEndian.Uint32(data[24:28]))

	// Find "data" chunk
	offset := 12
	for offset < len(data)-8 {
		chunkID := string(data[offset : offset+4])
		chunkSize := int(binary.LittleEndian.Uint32(data[offset+4 : offset+8]))
		if chunkID == "data" {
			start := offset + 8
			end := start + chunkSize
			if end > len(data) {
				end = len(data)
			}
			return data[start:end], sampleRate, nil
		}
		offset += 8 + chunkSize
		// Pad to even boundary
		if offset%2 != 0 {
			offset++
		}
	}

	// Fallback: skip first 44 bytes (standard WAV header)
	return data[44:], sampleRate, nil
}

func splitLines(s string) []string {
	var lines []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			line := s[start:i]
			if len(line) > 0 && line[len(line)-1] == '\r' {
				line = line[:len(line)-1]
			}
			lines = append(lines, line)
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}

func respondSpeech(w http.ResponseWriter, resp speechResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(resp)
}
