package monitor

import (
	"context"
	"strings"

	"github.com/0xWelsh/motorke/services/growth-agent/internal/store"
)

type Result struct {
	ProspectID     string `json:"prospectId"`
	Name           string `json:"name"`
	InventoryCount int    `json:"inventoryCount"`
	Delta          int    `json:"delta"`
	Source         string `json:"source"`
	Skipped        bool   `json:"skipped,omitempty"`
	Note           string `json:"note,omitempty"`
}

type Service struct {
	store *store.Store
}

func New(st *store.Store) *Service {
	return &Service{store: st}
}

func (s *Service) Run(ctx context.Context) ([]Result, error) {
	prospects, err := s.store.ProspectsForInventoryMonitor(ctx)
	if err != nil {
		return nil, err
	}

	out := make([]Result, 0, len(prospects))
	for _, p := range prospects {
		if p.MatchedDealerID != nil && strings.TrimSpace(*p.MatchedDealerID) != "" {
			count, err := s.store.DealerLiveInventoryCount(ctx, *p.MatchedDealerID)
			if err != nil {
				return out, err
			}
			prev := p.InventoryCount
			if err := s.store.RecordInventorySnapshot(ctx, p.ID, "platform_dealer", count); err != nil {
				return out, err
			}
			out = append(out, Result{
				ProspectID:     p.ID,
				Name:           p.Name,
				InventoryCount: count,
				Delta:          count - prev,
				Source:         "platform_dealer",
			})
			continue
		}

		out = append(out, Result{
			ProspectID: p.ID,
			Name:       p.Name,
			Source:     "external_url",
			Skipped:    true,
			Note:       "external inventoryUrl scraping not enabled — link matchedDealerId or ingest platform dealer",
		})
	}
	return out, nil
}
