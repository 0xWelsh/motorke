package auth

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func Authorised(c *fiber.Ctx) bool {
	secret := strings.TrimSpace(os.Getenv("GROWTH_AGENT_SECRET"))
	if secret == "" {
		return true
	}
	auth := c.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") && strings.TrimPrefix(auth, "Bearer ") == secret {
		return true
	}
	return c.Query("secret") == secret
}

func Require(c *fiber.Ctx) error {
	if Authorised(c) {
		return c.Next()
	}
	return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorised"})
}
