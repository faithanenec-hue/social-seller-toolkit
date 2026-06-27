import { Router, type IRouter } from "express";
import healthRouter from "./health";
import captionsRouter from "./captions";
import broadcastsRouter from "./broadcasts";
import productsRouter from "./products";
import ordersRouter from "./orders";
import wishlistRouter from "./wishlist";
import loyaltyRouter from "./loyalty";
import analyticsRouter from "./analytics";
import collectionsRouter from "./collections";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(captionsRouter);
router.use(broadcastsRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(wishlistRouter);
router.use(loyaltyRouter);
router.use(analyticsRouter);
router.use(collectionsRouter);

export default router;
