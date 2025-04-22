require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "11JORDANNIEL11",
  database: process.env.DB_NAME || "minggu15"
});

// Store Routes
app.get('/api/stores', async (req, res) => {
  try {
    const [stores] = await pool.query('SELECT * FROM stores');
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  const { store_id } = req.query;
  try {
    let query = 'SELECT * FROM products';
    const params = [];
    if (store_id) {
      query += ' WHERE store_id = ?';
      params.push(store_id);
    }
    const [products] = await pool.query(query, params);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cart Routes
app.get('/api/cart', async (req, res) => {
  try {
    const [cartItems] = await pool.query(`
      SELECT 
        c.id, 
        c.product_id, 
        c.quantity, 
        c.is_checked, 
        c.note, 
        p.name AS product_name, 
        p.price, 
        p.discount_percentage, 
        p.image_url, 
        s.id AS store_id,
        s.name AS store_name, 
        s.avatar_url AS store_avatar_url
      FROM cart c
      JOIN products p ON c.product_id = p.id
      JOIN stores s ON p.store_id = s.id
    `);
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to Cart
app.post('/api/cart', async (req, res) => {
  const { product_id, quantity, is_checked, note } = req.body;
  try {
    // Cek apakah produk sudah ada di cart
    const [existing] = await pool.query('SELECT * FROM cart WHERE product_id = ?', [product_id]);

    if (existing.length > 0) {
      // Jika produk sudah ada, update kuantitas
      const newQuantity = existing[0].quantity + quantity;
      await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQuantity, existing[0].id]);
      res.json({ message: 'Quantity updated successfully', id: existing[0].id });
    } else {
      // Jika produk belum ada, tambahkan ke cart
      const [result] = await pool.query(
        'INSERT INTO cart (product_id, quantity, is_checked, note) VALUES (?, ?, ?, ?)',
        [product_id, quantity, is_checked, note]
      );
      res.status(201).json({ id: result.insertId });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Cart Item
app.put('/api/cart/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, is_checked, note } = req.body;

  try {
    // Ambil data saat ini
    const [existing] = await pool.query('SELECT * FROM cart WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    const currentItem = existing[0];

    // Gunakan nilai lama jika tidak ada nilai baru
    const updatedQuantity = quantity ?? currentItem.quantity;
    const updatedIsChecked = is_checked ?? currentItem.is_checked;
    const updatedNote = note ?? currentItem.note;

    const [result] = await pool.query(
      'UPDATE cart SET quantity = ?, is_checked = ?, note = ? WHERE id = ?',
      [updatedQuantity, updatedIsChecked, updatedNote, id]
    );

    res.json({ message: "Cart item updated successfully" });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Item from Cart
app.delete('/api/cart/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Hapus item dari keranjang berdasarkan ID produk
    await pool.query('DELETE FROM cart WHERE id = ?', [id]);
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete All Items from a Store in Cart
app.delete('/api/cart/store/:store_id', async (req, res) => {
  const { store_id } = req.params;
  try {
    // Hapus semua item dari toko tertentu di keranjang
    await pool.query(`
      DELETE c
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE p.store_id = ?
    `, [store_id]);
    res.json({ message: 'All items from the store have been removed from the cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Checkout Route (Optional - Calculate Total)
app.post('/api/checkout', async (req, res) => {
  try {
    const [checkedItems] = await pool.query(
      'SELECT * FROM cart WHERE is_checked = TRUE'
    );
    res.json({ 
      items: checkedItems, 
      total: checkedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Server Setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
