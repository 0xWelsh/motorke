package ids

import "github.com/google/uuid"

// NewID returns a unique id compatible with Prisma text primary keys.
func NewID() string {
	return uuid.NewString()
}
