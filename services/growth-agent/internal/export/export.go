package export

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"time"

	"github.com/0xWelsh/motorke/services/growth-agent/internal/store"
)

func ProspectsCSV(ctx context.Context, st *store.Store, status, county string) ([]byte, error) {
	prospects, err := st.ListProspects(ctx, status, county, 5000)
	if err != nil {
		return nil, err
	}

	buf := &bytes.Buffer{}
	w := csv.NewWriter(buf)
	_ = w.Write([]string{
		"id", "name", "county", "status", "source", "phone", "whatsapp", "email", "website",
		"inventory_count", "inventory_delta", "outreach_count", "last_outreach_at", "matched_dealer_id", "notes", "created_at",
	})

	for _, p := range prospects {
		delta := ""
		if p.InventoryCountPrev != nil {
			delta = fmt.Sprintf("%d", p.InventoryCount-*p.InventoryCountPrev)
		}
		lastOutreach := ""
		if p.LastOutreachAt != nil {
			lastOutreach = p.LastOutreachAt.UTC().Format(time.RFC3339)
		}
		_ = w.Write([]string{
			p.ID,
			p.Name,
			p.County,
			p.Status,
			p.Source,
			deref(p.Phone),
			deref(p.Whatsapp),
			deref(p.Email),
			deref(p.Website),
			fmt.Sprintf("%d", p.InventoryCount),
			delta,
			fmt.Sprintf("%d", p.OutreachCount),
			lastOutreach,
			deref(p.MatchedDealerID),
			deref(p.Notes),
			p.CreatedAt.UTC().Format(time.RFC3339),
		})
	}
	w.Flush()
	return buf.Bytes(), w.Error()
}

func OutreachCSV(ctx context.Context, st *store.Store) ([]byte, error) {
	events, err := st.ListOutreach(ctx, 5000)
	if err != nil {
		return nil, err
	}

	buf := &bytes.Buffer{}
	w := csv.NewWriter(buf)
	_ = w.Write([]string{
		"id", "prospect_id", "channel", "status", "direction", "subject", "body",
		"scheduled_at", "completed_at", "created_by", "created_at",
	})

	for _, e := range events {
		_ = w.Write([]string{
			e.ID,
			e.ProspectID,
			e.Channel,
			e.Status,
			e.Direction,
			deref(e.Subject),
			deref(e.Body),
			formatTime(e.ScheduledAt),
			formatTime(e.CompletedAt),
			deref(e.CreatedBy),
			e.CreatedAt.UTC().Format(time.RFC3339),
		})
	}
	w.Flush()
	return buf.Bytes(), w.Error()
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func formatTime(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}
