import { Router } from "express";
import { addLectures, createCourse, deleteCourse, getAllCourses, getLecturesById, updateCourse } from "../controllers/course.controller.js";
import { isAuthorized, isUserLoggedIn } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *       properties:
 *         title:
 *           type: string
 *           description: Course title
 *         description:
 *           type: string
 *           description: Detailed course description
 *         category:
 *           type: string
 *           description: Course category
 *         thumbnail:
 *           type: string
 *           format: binary
 *           description: Course thumbnail image
 *     Lecture:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         title:
 *           type: string
 *           description: Lecture title
 *         description:
 *           type: string
 *           description: Lecture description
 *         videoFile:
 *           type: string
 *           format: binary
 *           description: Video file for the lecture
 */

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management
 */

/**
 * @swagger
 * /api/v1/course:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of all courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 */
router.route('/')
    .get(getAllCourses)

/**
 * @swagger
 * /api/v1/course:
 *   post:
 *     summary: Create a new course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
    .post(isUserLoggedIn, isAuthorized('ADMIN'), upload.single("thumbnail"), createCourse)

/**
 * @swagger
 * /api/v1/course/{id}:
 *   get:
 *     summary: Get course details and lectures by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details with lectures
 *       404:
 *         description: Course not found
 */
router.route('/:id')
    .get(isUserLoggedIn, getLecturesById)

/**
 * @swagger
 * /api/v1/course/{id}:
 *   delete:
 *     summary: Delete a course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Course not found
 */
    .delete(isUserLoggedIn, isAuthorized('ADMIN'), deleteCourse)

/**
 * @swagger
 * /api/v1/course/{id}:
 *   put:
 *     summary: Update course details (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Course not found
 */
    .put(isUserLoggedIn, isAuthorized('ADMIN'), updateCourse)

/**
 * @swagger
 * /api/v1/course/{id}:
 *   post:
 *     summary: Add a lecture to a course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               videoFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Lecture added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Course not found
 */
    .post(isUserLoggedIn, isAuthorized('ADMIN'), upload.single("lecture"), addLectures)

export default router