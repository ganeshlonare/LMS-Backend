import { Router } from "express";
import { chatWithAi } from "../controllers/googleAi.controller.js";
import { isUserLoggedIn } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AIQuery:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: The message to send to the AI
 *         context:
 *           type: string
 *           description: Optional context for the conversation
 */

/**
 * @swagger
 * tags:
 *   name: AI Chat
 *   description: AI-powered chat functionality
 */

/**
 * @swagger
 * /api/v1/chat:
 *   get:
 *     summary: Chat with AI
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: message
 *         schema:
 *           type: string
 *         required: true
 *         description: The message to send to the AI
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *         description: Optional context for the conversation
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 response:
 *                   type: string
 *                   description: AI's response message
 *       400:
 *         description: Bad request - missing or invalid parameters
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/', isUserLoggedIn, chatWithAi);

export default router;