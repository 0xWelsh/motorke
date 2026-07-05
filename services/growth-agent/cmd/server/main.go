package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/0xWelsh/motorke/services/growth-agent/internal/auth"
	"github.com/0xWelsh/motorke/services/growth-agent/internal/handler"
	"github.com/0xWelsh/motorke/services/growth-agent/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := store.Connect(ctx, databaseURL)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer pool.Close()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8091"
	}

	app := fiber.New(fiber.Config{AppName: "bidgari-growth-agent"})
	app.Use(logger.New())
	app.Use(cors.New())

	h := handler.New(store.New(pool))
	secured := app.Group("/", auth.Require)

	app.Get("/health", h.Health)

	secured.Post("/discover/ingest", h.Ingest)
	secured.Post("/discover/run", h.Discover)
	secured.Get("/prospects", h.ListProspects)
	secured.Get("/prospects/:id", h.GetProspect)
	secured.Patch("/prospects/:id", h.PatchProspect)
	secured.Post("/prospects/:id/outreach", h.CreateOutreach)
	secured.Get("/outreach", h.ListOutreach)
	secured.Post("/monitor/inventory", h.MonitorInventory)
	secured.Get("/export/prospects.csv", h.ExportProspectsCSV)
	secured.Get("/export/outreach.csv", h.ExportOutreachCSV)

	log.Printf("growth-agent listening on :%s", port)
	log.Fatal(app.Listen(":" + port))
}
