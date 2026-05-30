package store

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/0xWelsh/motorke/services/growth-agent/internal/ids"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Prospect struct {
	ID                 string     `json:"id"`
	Name               string     `json:"name"`
	Source             string     `json:"source"`
	SourceURL          *string    `json:"sourceUrl,omitempty"`
	Phone              *string    `json:"phone,omitempty"`
	Whatsapp           *string    `json:"whatsapp,omitempty"`
	Email              *string    `json:"email,omitempty"`
	Website            *string    `json:"website,omitempty"`
	FacebookURL        *string    `json:"facebookUrl,omitempty"`
	InstagramURL       *string    `json:"instagramUrl,omitempty"`
	Location           *string    `json:"location,omitempty"`
	County             string     `json:"county"`
	Address            *string    `json:"address,omitempty"`
	Status             string     `json:"status"`
	Tags               []string   `json:"tags"`
	Notes              *string    `json:"notes,omitempty"`
	InventoryURL       *string    `json:"inventoryUrl,omitempty"`
	InventoryCount     int        `json:"inventoryCount"`
	InventoryCountPrev *int       `json:"inventoryCountPrev,omitempty"`
	InventoryCheckedAt *time.Time `json:"inventoryCheckedAt,omitempty"`
	MatchedDealerID    *string    `json:"matchedDealerId,omitempty"`
	OutreachCount      int        `json:"outreachCount"`
	LastOutreachAt     *time.Time `json:"lastOutreachAt,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

type OutreachEvent struct {
	ID          string     `json:"id"`
	ProspectID  string     `json:"prospectId"`
	Channel     string     `json:"channel"`
	Status      string     `json:"status"`
	Direction   string     `json:"direction"`
	Subject     *string    `json:"subject,omitempty"`
	Body        *string    `json:"body,omitempty"`
	ScheduledAt *time.Time `json:"scheduledAt,omitempty"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
	CreatedBy   *string    `json:"createdBy,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

type IngestInput struct {
	Name         string   `json:"name"`
	Source       string   `json:"source"`
	SourceURL    string   `json:"sourceUrl"`
	Phone        string   `json:"phone"`
	Whatsapp     string   `json:"whatsapp"`
	Email        string   `json:"email"`
	Website      string   `json:"website"`
	FacebookURL  string   `json:"facebookUrl"`
	InstagramURL string   `json:"instagramUrl"`
	Location     string   `json:"location"`
	County       string   `json:"county"`
	Address      string   `json:"address"`
	Notes        string   `json:"notes"`
	InventoryURL string   `json:"inventoryUrl"`
	Tags         []string `json:"tags"`
}

type Store struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func Connect(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = 8
	return pgxpool.NewWithConfig(ctx, cfg)
}

func digitsOnly(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func (s *Store) FindProspectByPhoneOrName(ctx context.Context, phone, name, county string) (*Prospect, error) {
	d := digitsOnly(phone)
	if d != "" {
		row := s.pool.QueryRow(ctx, `
SELECT id, name, source, "sourceUrl", phone, whatsapp, email, website, "facebookUrl", "instagramUrl",
       location, county, address, status::text, tags, notes, "inventoryUrl", "inventoryCount",
       "inventoryCountPrev", "inventoryCheckedAt", "matchedDealerId", "outreachCount", "lastOutreachAt",
       "createdAt", "updatedAt"
FROM growth_prospects
WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $1
   OR regexp_replace(COALESCE(whatsapp, ''), '[^0-9]', '', 'g') = $1
LIMIT 1`, d)
		p, err := scanProspect(row)
		if err == nil {
			return p, nil
		}
		if err != pgx.ErrNoRows {
			return nil, err
		}
	}
	row := s.pool.QueryRow(ctx, `
SELECT id, name, source, "sourceUrl", phone, whatsapp, email, website, "facebookUrl", "instagramUrl",
       location, county, address, status::text, tags, notes, "inventoryUrl", "inventoryCount",
       "inventoryCountPrev", "inventoryCheckedAt", "matchedDealerId", "outreachCount", "lastOutreachAt",
       "createdAt", "updatedAt"
FROM growth_prospects
WHERE lower(name) = lower($1) AND lower(county) = lower($2)
LIMIT 1`, strings.TrimSpace(name), strings.TrimSpace(county))
	return scanProspect(row)
}

func (s *Store) UpsertProspect(ctx context.Context, in IngestInput) (*Prospect, bool, error) {
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, false, fmt.Errorf("name required")
	}
	county := strings.TrimSpace(in.County)
	if county == "" {
		county = "Nairobi"
	}
	source := strings.TrimSpace(in.Source)
	if source == "" {
		source = "manual"
	}

	existing, err := s.FindProspectByPhoneOrName(ctx, in.Phone, name, county)
	if err != nil && err != pgx.ErrNoRows {
		return nil, false, err
	}

	now := time.Now().UTC()
	if existing != nil {
		_, err = s.pool.Exec(ctx, `
UPDATE growth_prospects SET
  name = $2,
  source = COALESCE(NULLIF($3, ''), source),
  "sourceUrl" = COALESCE(NULLIF($4, ''), "sourceUrl"),
  phone = COALESCE(NULLIF($5, ''), phone),
  whatsapp = COALESCE(NULLIF($6, ''), whatsapp),
  email = COALESCE(NULLIF($7, ''), email),
  website = COALESCE(NULLIF($8, ''), website),
  "facebookUrl" = COALESCE(NULLIF($9, ''), "facebookUrl"),
  "instagramUrl" = COALESCE(NULLIF($10, ''), "instagramUrl"),
  location = COALESCE(NULLIF($11, ''), location),
  county = $12,
  address = COALESCE(NULLIF($13, ''), address),
  notes = COALESCE(NULLIF($14, ''), notes),
  "inventoryUrl" = COALESCE(NULLIF($15, ''), "inventoryUrl"),
  tags = CASE WHEN cardinality($16::text[]) > 0 THEN $16 ELSE tags END,
  status = CASE WHEN status = 'DISCOVERED' AND ($5 <> '' OR $6 <> '' OR $7 <> '') THEN 'CONTACT_COLLECTED'::"GrowthProspectStatus" ELSE status END,
  "updatedAt" = $17
WHERE id = $1`,
			existing.ID, name, source, in.SourceURL, in.Phone, in.Whatsapp, in.Email, in.Website,
			in.FacebookURL, in.InstagramURL, in.Location, county, in.Address, in.Notes, in.InventoryURL,
			in.Tags, now,
		)
		if err != nil {
			return nil, false, err
		}
		p, err := s.GetProspect(ctx, existing.ID)
		return p, false, err
	}

	id := ids.NewID()
	initialStatus := "DISCOVERED"
	if strings.TrimSpace(in.Phone) != "" || strings.TrimSpace(in.Whatsapp) != "" || strings.TrimSpace(in.Email) != "" {
		initialStatus = "CONTACT_COLLECTED"
	}
	_, err = s.pool.Exec(ctx, `
INSERT INTO growth_prospects (
  id, name, source, "sourceUrl", phone, whatsapp, email, website, "facebookUrl", "instagramUrl",
  location, county, address, status, tags, notes, "inventoryUrl", "createdAt", "updatedAt"
) VALUES (
  $1, $2, $3, NULLIF($4,''), NULLIF($5,''), NULLIF($6,''), NULLIF($7,''), NULLIF($8,''),
  NULLIF($9,''), NULLIF($10,''), NULLIF($11,''), $12, NULLIF($13,''), $14::"GrowthProspectStatus",
  $15, NULLIF($16,''), NULLIF($17,''), $18, $18
)`,
		id, name, source, in.SourceURL, in.Phone, in.Whatsapp, in.Email, in.Website, in.FacebookURL,
		in.InstagramURL, in.Location, county, in.Address, initialStatus, in.Tags, in.Notes, in.InventoryURL, now,
	)
	if err != nil {
		return nil, false, err
	}
	p, err := s.GetProspect(ctx, id)
	return p, true, err
}

func (s *Store) DiscoverFromPlatformDealers(ctx context.Context) (int, error) {
	rows, err := s.pool.Query(ctx, `
SELECT d.id, d.name, d.phone, d.whatsapp, d.email, d.website, d."facebookUrl", d."instagramUrl",
       d.location, d.county, d.address, d.lat, d.lng
FROM dealers d
WHERE NOT EXISTS (
  SELECT 1 FROM growth_prospects gp WHERE gp."matchedDealerId" = d.id
)
AND (d.verified = false OR NOT EXISTS (SELECT 1 FROM users u WHERE u."dealerId" = d.id AND u.active = true))
LIMIT 200`)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	created := 0
	now := time.Now().UTC()
	for rows.Next() {
		var dealerID, name, phone, county string
		var whatsapp, email, website, facebook, instagram, location, address *string
		var lat, lng *float64
		if err := rows.Scan(&dealerID, &name, &phone, &whatsapp, &email, &website, &facebook, &instagram, &location, &county, &address, &lat, &lng); err != nil {
			return created, err
		}
		id := ids.NewID()
		status := "DISCOVERED"
		if strings.TrimSpace(phone) != "" || (whatsapp != nil && strings.TrimSpace(*whatsapp) != "") {
			status = "CONTACT_COLLECTED"
		}
		_, err = s.pool.Exec(ctx, `
INSERT INTO growth_prospects (
  id, name, source, phone, whatsapp, email, website, "facebookUrl", "instagramUrl",
  location, county, address, lat, lng, status, "matchedDealerId", tags, "createdAt", "updatedAt"
) VALUES (
  $1, $2, 'platform_dealer', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::"GrowthProspectStatus", $15,
  ARRAY['platform']::text[], $16, $16
)`,
			id, name, nullIfEmpty(phone), whatsapp, email, website, facebook, instagram, location, county, address, lat, lng, status, dealerID, now,
		)
		if err != nil {
			return created, err
		}
		created++
	}
	return created, rows.Err()
}

func nullIfEmpty(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

func (s *Store) ListProspects(ctx context.Context, status, county string, limit int) ([]Prospect, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	var args []any
	where := "WHERE 1=1"
	argN := 1
	if strings.TrimSpace(status) != "" {
		where += fmt.Sprintf(" AND status = $%d::\"GrowthProspectStatus\"", argN)
		args = append(args, status)
		argN++
	}
	if strings.TrimSpace(county) != "" {
		where += fmt.Sprintf(" AND lower(county) = lower($%d)", argN)
		args = append(args, county)
		argN++
	}
	args = append(args, limit)
	query := fmt.Sprintf(`
SELECT id, name, source, "sourceUrl", phone, whatsapp, email, website, "facebookUrl", "instagramUrl",
       location, county, address, status::text, tags, notes, "inventoryUrl", "inventoryCount",
       "inventoryCountPrev", "inventoryCheckedAt", "matchedDealerId", "outreachCount", "lastOutreachAt",
       "createdAt", "updatedAt"
FROM growth_prospects
%s
ORDER BY "updatedAt" DESC
LIMIT $%d`, where, argN)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Prospect, 0)
	for rows.Next() {
		p, err := scanProspect(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

func (s *Store) GetProspect(ctx context.Context, id string) (*Prospect, error) {
	row := s.pool.QueryRow(ctx, `
SELECT id, name, source, "sourceUrl", phone, whatsapp, email, website, "facebookUrl", "instagramUrl",
       location, county, address, status::text, tags, notes, "inventoryUrl", "inventoryCount",
       "inventoryCountPrev", "inventoryCheckedAt", "matchedDealerId", "outreachCount", "lastOutreachAt",
       "createdAt", "updatedAt"
FROM growth_prospects WHERE id = $1`, id)
	return scanProspect(row)
}

type UpdateProspectInput struct {
	Status          string
	Notes           string
	Phone           string
	Whatsapp        string
	Email           string
	MatchedDealerID string
	Tags            []string
}

func (s *Store) UpdateProspect(ctx context.Context, id string, in UpdateProspectInput) (*Prospect, error) {
	now := time.Now().UTC()
	_, err := s.pool.Exec(ctx, `
UPDATE growth_prospects SET
  status = COALESCE(NULLIF($2, ''), status)::"GrowthProspectStatus",
  notes = COALESCE(NULLIF($3, ''), notes),
  phone = COALESCE(NULLIF($4, ''), phone),
  whatsapp = COALESCE(NULLIF($5, ''), whatsapp),
  email = COALESCE(NULLIF($6, ''), email),
  "matchedDealerId" = COALESCE(NULLIF($7, ''), "matchedDealerId"),
  tags = CASE WHEN cardinality($8::text[]) > 0 THEN $8 ELSE tags END,
  "updatedAt" = $9
WHERE id = $1`,
		id, in.Status, in.Notes, in.Phone, in.Whatsapp, in.Email, in.MatchedDealerID, in.Tags, now,
	)
	if err != nil {
		return nil, err
	}
	return s.GetProspect(ctx, id)
}

type CreateOutreachInput struct {
	ProspectID  string
	Channel     string
	Status      string
	Direction   string
	Subject     string
	Body        string
	ScheduledAt *time.Time
	CompletedAt *time.Time
	CreatedBy   string
}

func (s *Store) CreateOutreach(ctx context.Context, in CreateOutreachInput) (*OutreachEvent, error) {
	channel := strings.ToUpper(strings.TrimSpace(in.Channel))
	if channel == "" {
		channel = "WHATSAPP"
	}
	status := strings.ToUpper(strings.TrimSpace(in.Status))
	if status == "" {
		status = "PLANNED"
	}
	direction := strings.ToUpper(strings.TrimSpace(in.Direction))
	if direction == "" {
		direction = "OUTBOUND"
	}

	id := ids.NewID()
	now := time.Now().UTC()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
INSERT INTO growth_outreach_events (
  id, "prospectId", channel, status, direction, subject, body, "scheduledAt", "completedAt", "createdBy", "createdAt", "updatedAt"
) VALUES (
  $1, $2, $3::"GrowthOutreachChannel", $4::"GrowthOutreachStatus", $5,
  NULLIF($6,''), NULLIF($7,''), $8, $9, NULLIF($10,''), $11, $11
)`,
		id, in.ProspectID, channel, status, direction, in.Subject, in.Body, in.ScheduledAt, in.CompletedAt, in.CreatedBy, now,
	)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
UPDATE growth_prospects SET
  "outreachCount" = "outreachCount" + 1,
  "lastOutreachAt" = $2,
  status = CASE
    WHEN status IN ('DISCOVERED', 'CONTACT_COLLECTED', 'OUTREACH_PLANNED') THEN 'CONTACTED'::"GrowthProspectStatus"
    ELSE status
  END,
  "updatedAt" = $2
WHERE id = $1`, in.ProspectID, now)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return s.GetOutreach(ctx, id)
}

func (s *Store) GetOutreach(ctx context.Context, id string) (*OutreachEvent, error) {
	row := s.pool.QueryRow(ctx, `
SELECT id, "prospectId", channel::text, status::text, direction, subject, body,
       "scheduledAt", "completedAt", "createdBy", "createdAt", "updatedAt"
FROM growth_outreach_events WHERE id = $1`, id)
	return scanOutreach(row)
}

func (s *Store) ListOutreach(ctx context.Context, limit int) ([]OutreachEvent, error) {
	if limit <= 0 || limit > 500 {
		limit = 50
	}
	rows, err := s.pool.Query(ctx, `
SELECT id, "prospectId", channel::text, status::text, direction, subject, body,
       "scheduledAt", "completedAt", "createdBy", "createdAt", "updatedAt"
FROM growth_outreach_events
ORDER BY "createdAt" DESC
LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]OutreachEvent, 0)
	for rows.Next() {
		e, err := scanOutreach(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (s *Store) RecordInventorySnapshot(ctx context.Context, prospectID, source string, count int) error {
	var prev int
	err := s.pool.QueryRow(ctx, `SELECT "inventoryCount" FROM growth_prospects WHERE id = $1`, prospectID).Scan(&prev)
	if err != nil {
		return err
	}
	delta := count - prev
	now := time.Now().UTC()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
INSERT INTO growth_inventory_snapshots (id, "prospectId", source, "inventoryCount", delta, "capturedAt")
VALUES ($1, $2, $3, $4, $5, $6)`,
		ids.NewID(), prospectID, source, count, delta, now,
	)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
UPDATE growth_prospects SET
  "inventoryCountPrev" = "inventoryCount",
  "inventoryCount" = $2,
  "inventoryCheckedAt" = $3,
  "updatedAt" = $3
WHERE id = $1`, prospectID, count, now)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s *Store) DealerLiveInventoryCount(ctx context.Context, dealerID string) (int, error) {
	var count int
	err := s.pool.QueryRow(ctx, `
SELECT COUNT(*)::int FROM cars WHERE "dealerId" = $1 AND available = true`, dealerID).Scan(&count)
	return count, err
}

func (s *Store) ProspectsForInventoryMonitor(ctx context.Context) ([]Prospect, error) {
	rows, err := s.pool.Query(ctx, `
SELECT id, name, source, "sourceUrl", phone, whatsapp, email, website, "facebookUrl", "instagramUrl",
       location, county, address, status::text, tags, notes, "inventoryUrl", "inventoryCount",
       "inventoryCountPrev", "inventoryCheckedAt", "matchedDealerId", "outreachCount", "lastOutreachAt",
       "createdAt", "updatedAt"
FROM growth_prospects
WHERE "matchedDealerId" IS NOT NULL OR NULLIF("inventoryUrl", '') IS NOT NULL
ORDER BY COALESCE("inventoryCheckedAt", '1970-01-01'::timestamptz) ASC
LIMIT 300`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Prospect, 0)
	for rows.Next() {
		p, err := scanProspect(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

type scannable interface {
	Scan(dest ...any) error
}

func scanProspect(row scannable) (*Prospect, error) {
	var p Prospect
	err := row.Scan(
		&p.ID, &p.Name, &p.Source, &p.SourceURL, &p.Phone, &p.Whatsapp, &p.Email, &p.Website,
		&p.FacebookURL, &p.InstagramURL, &p.Location, &p.County, &p.Address, &p.Status, &p.Tags,
		&p.Notes, &p.InventoryURL, &p.InventoryCount, &p.InventoryCountPrev, &p.InventoryCheckedAt,
		&p.MatchedDealerID, &p.OutreachCount, &p.LastOutreachAt, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func scanOutreach(row scannable) (*OutreachEvent, error) {
	var e OutreachEvent
	err := row.Scan(
		&e.ID, &e.ProspectID, &e.Channel, &e.Status, &e.Direction, &e.Subject, &e.Body,
		&e.ScheduledAt, &e.CompletedAt, &e.CreatedBy, &e.CreatedAt, &e.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &e, nil
}
