package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

const (
	defaultPort      = "8081"
	defaultLimit     = 5
	maxLimit         = 20
	defaultTimeoutMS = 800
)

type carSearchResult struct {
	ID       string  `json:"id"`
	Make     string  `json:"make"`
	Model    string  `json:"model"`
	Year     int     `json:"year"`
	Price    int     `json:"price"`
	EngineCC *int    `json:"engineCC"`
	FuelType *string `json:"fuelType"`
	Image    *string `json:"image"`
}

type server struct {
	db             *sql.DB
	requestTimeout time.Duration
}

func main() {
	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("ping db: %v", err)
	}

	timeoutMS := envAsInt("GO_SEARCH_DB_TIMEOUT_MS", defaultTimeoutMS)
	s := &server{
		db:             db,
		requestTimeout: time.Duration(timeoutMS) * time.Millisecond,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", s.healthz)
	mux.HandleFunc("/search", s.search)

	port := os.Getenv("PORT")
	if strings.TrimSpace(port) == "" {
		port = defaultPort
	}

	httpServer := &http.Server{
		Addr:              ":" + port,
		Handler:           withJSONHeaders(withRequestLogging(mux)),
		ReadHeaderTimeout: 3 * time.Second,
	}

	log.Printf("go-search listening on :%s", port)
	if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("listen: %v", err)
	}
}

func (s *server) healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *server) search(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if len(query) < 2 {
		writeJSON(w, http.StatusOK, []carSearchResult{})
		return
	}

	limit := clampLimit(r.URL.Query().Get("limit"))
	ctx, cancel := context.WithTimeout(r.Context(), s.requestTimeout)
	defer cancel()

	results, err := s.lookupCars(ctx, query, limit)
	if err != nil {
		log.Printf("search error query=%q err=%v", query, err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "search failed"})
		return
	}

	writeJSON(w, http.StatusOK, results)
}

func (s *server) lookupCars(ctx context.Context, query string, limit int) ([]carSearchResult, error) {
	const sqlQuery = `
SELECT
  c.id,
  c.make,
  c.model,
  c.year,
  c.price,
  c."engineCC",
  c."fuelType",
  (
    SELECT ci.url
    FROM car_images ci
    WHERE ci."carId" = c.id
      AND ci."isPrimary" = true
    ORDER BY ci."order" ASC, ci.id ASC
    LIMIT 1
  ) AS image
FROM cars c
WHERE c.available = true
  AND (c.make ILIKE $1 OR c.model ILIKE $1)
ORDER BY c."createdAt" DESC
LIMIT $2;
`

	pattern := "%" + query + "%"
	rows, err := s.db.QueryContext(ctx, sqlQuery, pattern, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]carSearchResult, 0, limit)
	for rows.Next() {
		var item carSearchResult
		if err := rows.Scan(
			&item.ID,
			&item.Make,
			&item.Model,
			&item.Year,
			&item.Price,
			&item.EngineCC,
			&item.FuelType,
			&item.Image,
		); err != nil {
			return nil, err
		}
		results = append(results, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return results, nil
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func clampLimit(raw string) int {
	limit, err := strconv.Atoi(raw)
	if err != nil || limit <= 0 {
		return defaultLimit
	}
	if limit > maxLimit {
		return maxLimit
	}
	return limit
}

func envAsInt(key string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

func withJSONHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		next.ServeHTTP(w, r)
	})
}

func withRequestLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(started))
	})
}
