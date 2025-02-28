const express = require('express');
const cors = require('cors');
const { check } = require('express-validator');
const auth = require('./middleware/auth');

// Controllers
const userController = require('./controllers/userController');
const productController = require('./controllers/productController');
const orderController = require('./controllers/orderController');

const app = express();

app.use(cors());
app.use(express.json());

// User routes
app.post('/api/register', [
    check('email').isEmail(),
    check('password').isLength({ min: 6 }),
    check('name').notEmpty()
], userController.register);

app.post('/api/login', [
    check('email').isEmail(),
    check('password').notEmpty()
], userController.login);

// Product routes
app.get('/api/products', productController.getAllProducts);
app.get('/api/products/:id', productController.getProduct);
app.post('/api/products', auth, [
    check('name').notEmpty(),
    check('price').isNumeric(),
    check('stock').isInt({ min: 0 })
], productController.createProduct);
app.put('/api/products/:id', auth, productController.updateProduct);
app.delete('/api/products/:id', auth, productController.deleteProduct);

// Order routes
app.post('/api/orders', auth, [
    check('items').isArray(),
    check('items.*.productId').isNumeric(),
    check('items.*.quantity').isInt({ min: 1 })
], orderController.createOrder);
app.get('/api/orders', auth, orderController.getUserOrders);
app.patch('/api/orders/:orderId/status', auth, orderController.updateOrderStatus);

// Only start the server if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;