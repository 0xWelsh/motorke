package main

import (
	"log"
	"os"

	"github.com/0xWelsh/motorke/services/seo-worker/internal/crawler"
	"github.com/0xWelsh/motorke/services/seo-worker/internal/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8090"
	}

	app := fiber.New(fiber.Config{
		AppName: "motorke-seo-worker",
	})
	app.Use(logger.New())
	app.Use(cors.New())

	h := handler.New(crawler.New(os.Getenv("CRAWL_BASE_URL")))

	app.Get("/health", h.Health)
	app.Post("/crawl", h.Crawl)
	app.Post("/crawl/site", h.CrawlSite)

	log.Printf("seo-worker listening on :%s", port)
	log.Fatal(app.Listen(":" + port))
}
