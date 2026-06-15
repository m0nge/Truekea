import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storageRouter from "./storage";
import listingsRouter from "./listings";
import conversationsRouter from "./conversations";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(listingsRouter);
router.use(conversationsRouter);
router.use(statsRouter);

export default router;
