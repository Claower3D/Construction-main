package handlers

import (
	"encoding/json"
	"net/http"

	"qazgost-ai/backend/pkg/middleware"
)

// currentUser returns the authenticated user id and role injected by AuthMiddleware
// (or OptionalAuthMiddleware). Both are empty for anonymous requests.
func currentUser(r *http.Request) (id, role string) {
	id, _ = r.Context().Value(middleware.ContextUserID).(string)
	role, _ = r.Context().Value(middleware.ContextRole).(string)
	return id, role
}

// isStaff reports whether the role may act on other users' data
func isStaff(role string) bool {
	return role == "admin" || role == "manager"
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
