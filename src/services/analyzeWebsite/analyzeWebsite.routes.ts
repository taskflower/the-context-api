// src/services/analyzeWebsite/analyzeWebsite.routes.ts
import { Router } from "express";
import markdownRoutes from "./routes/markdown.routes";
import linksRoutes from "./routes/links.routes";
import metricsRoutes from "./routes/metrics.routes";

const router = Router();

router.use(markdownRoutes);
router.use(linksRoutes);
router.use(metricsRoutes);

export default router;