import { Router, Response } from 'express';
import pool from '../db.js';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, amount, date, category } = req.body;

    const newExpense = await pool.query(
      'INSERT INTO expenses (user_id, title, amount, date, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user?.id, title, amount, date, category || 'Другое']
    );

    res.json(newExpense.rows[0]);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(errorMessage);
    res.status(500).json('Server Error');
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const allExpenses = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
      [req.user?.id]
    );
    res.json(allExpenses.rows);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(errorMessage);
    res.status(500).json('Server Error');
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, amount, date, category } = req.body;

    const updateExpense = await pool.query(
      'UPDATE expenses SET title = $1, amount = $2, date = $3, category = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [title, amount, date, category || 'Другое', id, req.user?.id]
    );

    if (updateExpense.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    res.json(updateExpense.rows[0]);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(errorMessage);
    res.status(500).json('Server Error');
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleteExpense = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user?.id]
    );

    if (deleteExpense.rows.length === 0) {
      return res.status(403).json({ message: 'Эта запись не ваша или не существует' });
    }

    res.json({ message: 'Запись удалена' });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(errorMessage);
    res.status(500).json('Server Error');
  }
});

export default router;
