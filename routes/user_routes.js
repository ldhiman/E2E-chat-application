const router = require("express").Router();
const { users } = require("../db/schema.js");
const { db } = require("../db/index.js");
const { eq, or, and } = require("drizzle-orm"); // required for filters

// -----------------------------
// GET /me
// -----------------------------
router.get("/me", async (req, res) => {
  try {
    const userId = req.user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        lastSeen: user.lastSeen,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/profile/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        lastSeen: user.lastSeen,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET all users (for testing purposes)
router.get("/all", async (req, res) => {
  try {
    const users_list = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        lastSeen: users.lastSeen,
      })
      .from(users);
    res.status(200).json(users_list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
