import { Router, Request, Response, NextFunction } from "express";
import { AppConfigService } from "./appConfig.service";

const router = Router();
const service = new AppConfigService();

/**
 * GET /api/v1/config/:id? - pobiera config z Firestore
 */
router.get("/:id?", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configId = req.params.id || "default";
    const cfg = await service.getConfig(configId);
    res.json({ success: true, data: cfg });
  } catch (err) {
    next(err);
  }
});
export default router; // Add this line
