const router = require("express").Router();
const { devices } = require("../db/schema.js");
const { db } = require("../db/index.js");
const { eq } = require("drizzle-orm");
const { v4: uuidv4 } = require("uuid");

// -----------------------------------------
// POST /devices/register
// -----------------------------------------
router.post("/register", async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId; // prefer from JWT
    const { publicKey, deviceName, deviceId: clientDeviceId } = req.body;

    if (!userId || !publicKey || !deviceName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // If client already has a stored deviceId, reuse it — don't create a new one
    const deviceId = clientDeviceId || uuidv4();

    // Upsert: check if device already registered
    const existing = await db
      .select()
      .from(devices)
      .where(eq(devices.deviceId, deviceId))
      .limit(1);

    let newDevice;
    if (existing.length > 0) {
      // Update public key if re-registering same device
      [newDevice] = await db
        .update(devices)
        .set({ publicKey })
        .where(eq(devices.deviceId, deviceId))
        .returning();
    } else {
      [newDevice] = await db
        .insert(devices)
        .values({
          userId,
          deviceId,
          publicKey,
          deviceName,
        })
        .returning();
    }

    res.status(201).json({
      message: "Device registered successfully",
      device: {
        id: newDevice.id,
        deviceId: newDevice.deviceId,
        userId: newDevice.userId,
        deviceName: newDevice.deviceName,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -----------------------------------------
// GET /devices/my
// -----------------------------------------
router.get("/my", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const userDevices = await db
      .select()
      .from(devices)
      .where(eq(devices.userId, userId));
    res.status(200).json({ devices: userDevices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -----------------------------------------
// DELETE /devices/remove/:deviceId
// -----------------------------------------
router.delete("/remove/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await db
      .delete(devices)
      .where(eq(devices.deviceId, deviceId))
      .where(eq(devices.userId, userId));
    res.status(200).json({ message: "Device removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -----------------------------------------
// GET /devices/public-keys/:userId
// -----------------------------------------
router.get("/public-keys/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userDevices = await db
      .select()
      .from(devices)
      .where(eq(devices.userId, userId));

    if (!userDevices.length) {
      return res
        .status(404)
        .json({ message: "No devices found for this user" });
    }

    const publicKeys = userDevices.map((d) => ({
      deviceId: d.deviceId,
      publicKey: d.publicKey,
      deviceName: d.deviceName,
    }));

    res.status(200).json({ userId, devices: publicKeys });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
