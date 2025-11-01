const router = require("express").Router();
const { messages } = require("../db/schema.js");
const { db } = require("../db/index.js");
const { eq, or, and, inArray } = require("drizzle-orm"); // required for filters

// -----------------------------
// POST /send
// -----------------------------
router.post("/send", async (req, res) => {
  try {
    const { senderId, receiverId, content, msgType, deviceId } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [newMessage] = await db
      .insert(messages)
      .values({
        senderId,
        receiverId,
        ciphertext: content,
        deviceId,
        msgType: msgType || "text",
        delivered: false,
      })
      .returning();

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// routes/messages.js
router.get("/pending/:deviceId", async (req, res) => {
  const userId = req.user.id;
  const { deviceId } = req.params;

  // Long polling: wait up to 25s for messages
  const start = Date.now();
  while (Date.now() - start < 25000) {
    const pendingMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.deviceId, deviceId),
          eq(messages.delivered, false)
        )
      );

    if (pendingMessages.length > 0) {
      return res.json(pendingMessages);
    }

    await new Promise((r) => setTimeout(r, 2000)); // wait 2s before retry
  }

  res.json([]); // timeout — no messages
});

// -----------------------------
// GET /messages/:userId
// -----------------------------
router.get("/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id || userId; // fallback for now

    const userMessages = await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, currentUserId),
            eq(messages.receiverId, userId)
          ),
          and(
            eq(messages.senderId, userId),
            eq(messages.receiverId, currentUserId)
          )
        )
      );

    res.status(200).json({ messages: userMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -----------------------------
// GET /unread
// -----------------------------
router.get("/unread", async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadMessages = await db
      .select()
      .from(messages)
      .where(
        and(eq(messages.receiverId, userId), eq(messages.delivered, false))
      );

    res.status(200).json({ messages: unreadMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/ack", async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user?.id; // optional, depending on auth setup

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "messageIds array is required" });
    }

    await db
      .update(messages)
      .set({ delivered: true })
      .where(inArray(messages.id, messageIds));

    res.status(200).json({ message: "Messages acknowledged" });
  } catch (err) {
    console.error("ACK error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
