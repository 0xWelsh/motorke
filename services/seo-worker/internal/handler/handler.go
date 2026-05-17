package handler

import (
	"os"
	"strings"

	"github.com/0xWelsh/motorke/services/seo-worker/internal/crawler"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	crawl *crawler.Crawler
}

func New(c *crawler.Crawler) *Handler {
	return &Handler{crawl: c}
}

func (h *Handler) auth(c *fiber.Ctx) bool {
	secret := os.Getenv("SEO_WORKER_SECRET")
	if secret == "" {
		return true
	}
	return c.Get("Authorization") == "Bearer "+secret || c.Query("secret") == secret
}

func (h *Handler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"ok": true, "service": "seo-worker"})
}

type crawlBody struct {
	URLs []string `json:"urls"`
}

func (h *Handler) Crawl(c *fiber.Ctx) error {
	if !h.auth(c) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorised"})
	}
	var body crawlBody
	if err := c.BodyParser(&body); err != nil || len(body.URLs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "urls required"})
	}
	if len(body.URLs) > 50 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "max 50 urls"})
	}
	results := h.crawl.CheckURLs(body.URLs, 6)
	return c.JSON(fiber.Map{"results": results})
}

type siteBody struct {
	Paths []string `json:"paths"`
}

func (h *Handler) CrawlSite(c *fiber.Ctx) error {
	if !h.auth(c) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorised"})
	}
	var body siteBody
	_ = c.BodyParser(&body)
	results := h.crawl.CrawlSite(body.Paths)
	ok := true
	for _, r := range results {
		if r.Status >= 400 || r.Error != "" {
			ok = false
			break
		}
	}
	return c.JSON(fiber.Map{"ok": ok, "results": results})
}

func (h *Handler) SecretFromEnv() string {
	return strings.TrimSpace(os.Getenv("SEO_WORKER_SECRET"))
}
