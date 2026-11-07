-- Migration: Optimize indexes for Supabase performance
-- Generated: 2026-11-07
-- Purpose: Add composite indexes for common query patterns to reduce
--          connection usage and query latency on Supabase PgBouncer.
-- Note: Column names use Prisma's default camelCase for PostgreSQL

-- ============================================================================
-- CARS TABLE - Most queried table, needs composite indexes for filter combos
-- ============================================================================

-- Primary listing query: available + dealer verification + make/model filters
-- Used in: /api/cars/list, /api/cars, car browse pages
CREATE INDEX IF NOT EXISTS idx_cars_listing_filters
ON cars (available, "dealerId", make, model, "bodyType", "fuelType", transmission, year, price)
WHERE available = true;

-- Featured/hot/spotlight cars for homepage
CREATE INDEX IF NOT EXISTS idx_cars_featured_promo
ON cars (available, featured, "featuredWeight", "spotlightUntil", "hotBadgeUntil", "createdAt" DESC)
WHERE available = true;

-- Dealer inventory: dealerId + available + soldAt
-- Used in: dealer dashboard, /api/cars with dealerId filter
CREATE INDEX IF NOT EXISTS idx_cars_dealer_inventory
ON cars ("dealerId", available, "soldAt", "createdAt" DESC);

-- Price range queries (very common in filters)
CREATE INDEX IF NOT EXISTS idx_cars_price_range
ON cars (available, price, year)
WHERE available = true;

-- Search by make/model (text search fallback when full-text not used)
CREATE INDEX IF NOT EXISTS idx_cars_make_model_search
ON cars (make, model, available)
WHERE available = true;

-- ============================================================================
-- DEALERS TABLE - Join target for cars queries
-- ============================================================================

-- Verification status filter (replaces old `verified` boolean)
CREATE INDEX IF NOT EXISTS idx_dealers_verification
ON dealers ("verificationStatus", type);

-- County filter for location-based browsing
CREATE INDEX IF NOT EXISTS idx_dealers_county
ON dealers (county, "verificationStatus");

-- ============================================================================
-- CAR_VIEWS TABLE - High write volume, needs read optimization
-- ============================================================================

-- Related views query: find other cars viewed by same user/session
-- Used in: /api/cars/[id]/related-views
CREATE INDEX IF NOT EXISTS idx_car_views_cooccurrence
ON car_views ("carId", "userId", "sessionKey", "viewedAt" DESC);

-- User viewing history (for personalization)
CREATE INDEX IF NOT EXISTS idx_car_views_user_history
ON car_views ("userId", "viewedAt" DESC);

-- Session-based deduping (30-min window)
CREATE INDEX IF NOT EXISTS idx_car_views_session_dedup
ON car_views ("sessionKey", "carId", "viewedAt");

-- ============================================================================
-- CAR_IMAGES TABLE - Primary image lookup per car
-- ============================================================================

-- Get primary image for car listings (used in almost every car query)
CREATE INDEX IF NOT EXISTS idx_car_images_primary
ON car_images ("carId", "isPrimary" DESC, "order");

-- ============================================================================
-- LEADS TABLE - Dealer dashboard queries
-- ============================================================================

-- Dealer lead dashboard: status + createdAt ordering
CREATE INDEX IF NOT EXISTS idx_leads_dealer_dashboard
ON leads ("dealerId", status, "createdAt" DESC);

-- Assigned leads for sales team
CREATE INDEX IF NOT EXISTS idx_leads_assigned
ON leads ("assignedToId", status, "createdAt" DESC);

-- User lead history
CREATE INDEX IF NOT EXISTS idx_leads_user_history
ON leads ("userId", "createdAt" DESC);

-- ============================================================================
-- CAR_REVIEWS TABLE
-- ============================================================================

-- Reviews per car (already has index on carId, createdAt)
-- Adding composite for car + rating aggregation
CREATE INDEX IF NOT EXISTS idx_car_reviews_car_rating
ON car_reviews ("carId", rating);

-- ============================================================================
-- DUTY_VEHICLES & DUTY_CALCULATIONS - Calculator queries
-- ============================================================================

-- Duty vehicle lookup by make/model/year
CREATE INDEX IF NOT EXISTS idx_duty_vehicles_lookup
ON duty_vehicles (make, model, year, active)
WHERE active = true;

-- Duty calculation analytics
CREATE INDEX IF NOT EXISTS idx_duty_calculations_analytics
ON duty_calculations (make, model, "createdAt" DESC);

-- ============================================================================
-- CLEANUP: Drop redundant single-column indexes if they exist
-- (PostgreSQL will skip if index doesn't exist)
-- ============================================================================

-- These are likely already covered by composite indexes above
DROP INDEX IF EXISTS idx_cars_dealerId;
DROP INDEX IF EXISTS idx_cars_price;
DROP INDEX IF EXISTS idx_cars_year;
DROP INDEX IF EXISTS idx_cars_available;
DROP INDEX IF EXISTS idx_cars_bodyType;
DROP INDEX IF EXISTS idx_cars_fuelType;
DROP INDEX IF EXISTS idx_cars_createdAt;
DROP INDEX IF EXISTS idx_cars_featured;
DROP INDEX IF EXISTS idx_cars_views;
DROP INDEX IF EXISTS idx_cars_featuredWeight;
DROP INDEX IF EXISTS idx_cars_spotlightUntil;
DROP INDEX IF EXISTS idx_car_views_carId_viewedAt;
DROP INDEX IF EXISTS idx_car_views_userId_carId_viewedAt;
DROP INDEX IF EXISTS idx_car_views_sessionKey_carId_viewedAt;
DROP INDEX IF EXISTS idx_car_images_carId_isPrimary;
DROP INDEX IF EXISTS idx_leads_dealerId_createdAt;
DROP INDEX IF EXISTS idx_leads_assignedToId_createdAt;