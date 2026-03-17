const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskStats,
} = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  taskQueryValidation,
  validate,
} = require('../middleware/validation');
const { body } = require('express-validator');

// All task routes require authentication
router.use(authenticate);

router.get('/stats', getTaskStats);
router.get('/', taskQueryValidation, validate, getTasks);
router.post('/', createTaskValidation, validate, createTask);
router.get('/:id', taskIdValidation, validate, getTask);
router.put('/:id', updateTaskValidation, validate, updateTask);
router.delete('/:id', taskIdValidation, validate, deleteTask);
router.patch(
  '/:id/status',
  taskIdValidation,
  [body('status').notEmpty().withMessage('Status is required')],
  validate,
  updateTaskStatus
);

module.exports = router;
