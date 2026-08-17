import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'UP', service: 'backend', database: 'UP' });
  } catch (error) {
    res.status(503).json({ status: 'DOWN', service: 'backend', database: 'DOWN' });
  }
});

app.get('/api/restaurants', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, cuisine, rating FROM restaurants ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

app.get('/api/restaurants/:id/menu', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, restaurant_id, name, description, price
       FROM menu_items
       WHERE restaurant_id = $1
       ORDER BY id`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customerName, customerPhone, items } = req.body;

  if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customerName, customerPhone and items are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Invalid quantity');
      }

      const result = await client.query(
        'SELECT id, price FROM menu_items WHERE id = $1',
        [item.menuItemId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Menu item ${item.menuItemId} not found`);
      }

      const price = Number(result.rows[0].price);
      total += price * quantity;
      validatedItems.push({ menuItemId: result.rows[0].id, quantity, price });
    }

    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, customer_phone, total_amount)
       VALUES ($1, $2, $3)
       RETURNING id, customer_name, customer_phone, total_amount, status, created_at`,
      [customerName, customerPhone, total]
    );

    const order = orderResult.rows[0];

    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.menuItemId, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: order.id,
      totalAmount: order.total_amount,
      status: order.status
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.customer_name, o.customer_phone, o.total_amount,
              o.status, o.created_at,
              COALESCE(json_agg(
                json_build_object(
                  'menuItemId', oi.menu_item_id,
                  'quantity', oi.quantity,
                  'price', oi.price
                )
              ) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
