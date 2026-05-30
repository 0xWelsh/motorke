package handler

import (
	"strings"
	"time"

	"github.com/0xWelsh/motorke/services/growth-agent/internal/export"
	"github.com/0xWelsh/motorke/services/growth-agent/internal/monitor"
	"github.com/0xWelsh/motorke/services/growth-agent/internal/store"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	store   *store.Store
	monitor *monitor.Service
}

func New(st *store.Store) *Handler {
	return &Handler{
		store:   st,
		monitor: monitor.New(st),
	}
}

func (h *Handler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"ok": true, "service": "growth-agent"})
}

type ingestBody struct {
	Prospects []store.IngestInput `json:"prospects"`
}

func (h *Handler) Ingest(c *fiber.Ctx) error {
	var body ingestBody
	if err := c.BodyParser(&body); err != nil || len(body.Prospects) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "prospects array required"})
	}
	if len(body.Prospects) > 200 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "max 200 prospects per request"})
	}

	created := 0
	updated := 0
	saved := make([]store.Prospect, 0, len(body.Prospects))
	for _, item := range body.Prospects {
		p, isNew, err := h.store.UpsertProspect(c.Context(), item)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		if isNew {
			created++
		} else {
			updated++
		}
		saved = append(saved, *p)
	}
	return c.JSON(fiber.Map{
		"created":   created,
		"updated":   updated,
		"prospects": saved,
	})
}

type discoverBody struct {
	LinkPlatformDealers bool                `json:"linkPlatformDealers"`
	Prospects           []store.IngestInput `json:"prospects"`
}

func (h *Handler) Discover(c *fiber.Ctx) error {
	var body discoverBody
	_ = c.BodyParser(&body)

	platformCreated := 0
	if body.LinkPlatformDealers {
		n, err := h.store.DiscoverFromPlatformDealers(c.Context())
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		platformCreated = n
	}

	ingestCreated := 0
	ingestUpdated := 0
	if len(body.Prospects) > 0 {
		for _, item := range body.Prospects {
			_, isNew, err := h.store.UpsertProspect(c.Context(), item)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
			}
			if isNew {
				ingestCreated++
			} else {
				ingestUpdated++
			}
		}
	}

	return c.JSON(fiber.Map{
		"platformDealersCreated": platformCreated,
		"prospectsCreated":       ingestCreated,
		"prospectsUpdated":     ingestUpdated,
	})
}

func (h *Handler) ListProspects(c *fiber.Ctx) error {
	status := c.Query("status")
	county := c.Query("county")
	limit := c.QueryInt("limit", 100)
	items, err := h.store.ListProspects(c.Context(), status, county, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"prospects": items, "count": len(items)})
}

func (h *Handler) GetProspect(c *fiber.Ctx) error {
	p, err := h.store.GetProspect(c.Context(), c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "prospect not found"})
	}
	return c.JSON(p)
}

type patchProspectBody struct {
	Status          string   `json:"status"`
	Notes           string   `json:"notes"`
	Phone           string   `json:"phone"`
	Whatsapp        string   `json:"whatsapp"`
	Email           string   `json:"email"`
	MatchedDealerID string   `json:"matchedDealerId"`
	Tags            []string `json:"tags"`
}

func (h *Handler) PatchProspect(c *fiber.Ctx) error {
	var body patchProspectBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	p, err := h.store.UpdateProspect(c.Context(), c.Params("id"), store.UpdateProspectInput{
		Status:          body.Status,
		Notes:           body.Notes,
		Phone:           body.Phone,
		Whatsapp:        body.Whatsapp,
		Email:           body.Email,
		MatchedDealerID: body.MatchedDealerID,
		Tags:            body.Tags,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(p)
}

type outreachBody struct {
	Channel     string `json:"channel"`
	Status      string `json:"status"`
	Direction   string `json:"direction"`
	Subject     string `json:"subject"`
	Body        string `json:"body"`
	ScheduledAt string `json:"scheduledAt"`
	CompletedAt string `json:"completedAt"`
	CreatedBy   string `json:"createdBy"`
}

func (h *Handler) CreateOutreach(c *fiber.Ctx) error {
	var body outreachBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	event, err := h.store.CreateOutreach(c.Context(), store.CreateOutreachInput{
		ProspectID:  c.Params("id"),
		Channel:     body.Channel,
		Status:      body.Status,
		Direction:   body.Direction,
		Subject:     body.Subject,
		Body:        body.Body,
		ScheduledAt: parseTimePtr(body.ScheduledAt),
		CompletedAt: parseTimePtr(body.CompletedAt),
		CreatedBy:   body.CreatedBy,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(event)
}

func (h *Handler) ListOutreach(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 50)
	items, err := h.store.ListOutreach(c.Context(), limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"events": items, "count": len(items)})
}

func (h *Handler) MonitorInventory(c *fiber.Ctx) error {
	results, err := h.monitor.Run(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	changed := 0
	for _, r := range results {
		if r.Delta != 0 && !r.Skipped {
			changed++
		}
	}
	return c.JSON(fiber.Map{
		"checked": len(results),
		"changed": changed,
		"results": results,
	})
}

func (h *Handler) ExportProspectsCSV(c *fiber.Ctx) error {
	data, err := export.ProspectsCSV(c.Context(), h.store, c.Query("status"), c.Query("county"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", `attachment; filename="growth-prospects.csv"`)
	return c.Send(data)
}

func (h *Handler) ExportOutreachCSV(c *fiber.Ctx) error {
	data, err := export.OutreachCSV(c.Context(), h.store)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", `attachment; filename="growth-outreach.csv"`)
	return c.Send(data)
}

func parseTimePtr(raw string) *time.Time {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		return nil
	}
	return &t
}
