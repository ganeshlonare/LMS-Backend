import Router from 'express';
import { isAuthorized, isUserLoggedIn } from '../middlewares/authMiddleware.js';
import { allPayments, BuySubscription, cancelSubscription, getRazorpayKey, verifySubscription } from '../controllers/payment.cotroller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Subscription:
 *       type: object
 *       required:
 *         - planId
 *       properties:
 *         planId:
 *           type: string
 *           description: ID of the subscription plan
 *     SubscriptionVerification:
 *       type: object
 *       required:
 *         - razorpay_payment_id
 *         - razorpay_subscription_id
 *         - razorpay_signature
 *       properties:
 *         razorpay_payment_id:
 *           type: string
 *         razorpay_subscription_id:
 *           type: string
 *         razorpay_signature:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment and subscription management
 */

/**
 * @swagger
 * /api/v1/payment/razorpay-key:
 *   get:
 *     summary: Get Razorpay key
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Razorpay key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 key:
 *                   type: string
 *                   description: Razorpay API key
 */
router.route('/razorpay-key')
    .get(isUserLoggedIn, getRazorpayKey);

/**
 * @swagger
 * /api/v1/payment/subscription:
 *   post:
 *     summary: Create a subscription
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Subscription'
 *     responses:
 *       200:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscriptionId:
 *                   type: string
 *                   description: Razorpay subscription ID
 *                 orderId:
 *                   type: string
 *                   description: Razorpay order ID
 *       400:
 *         description: Invalid input or subscription failed
 */
router.route('/subscription')
    .post(isUserLoggedIn, BuySubscription);

/**
 * @swagger
 * /api/v1/payment/verify:
 *   post:
 *     summary: Verify subscription payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionVerification'
 *     responses:
 *       200:
 *         description: Subscription verified successfully
 *       400:
 *         description: Invalid verification data
 *       401:
 *         description: Unauthorized
 */
router.route('/verify')
    .post(isUserLoggedIn, verifySubscription);

/**
 * @swagger
 * /api/v1/payment/unsubscribe:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       400:
 *         description: Failed to cancel subscription
 *       401:
 *         description: Unauthorized
 */
router.route('/unsubscribe')
    .post(isUserLoggedIn, cancelSubscription);

/**
 * @swagger
 * /api/v1/payment:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   user:
 *                     type: string
 *                   subscriptionId:
 *                     type: string
 *                   paymentId:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.route('/')
    .get(isUserLoggedIn, isAuthorized('ADMIN'), allPayments);

export default router;