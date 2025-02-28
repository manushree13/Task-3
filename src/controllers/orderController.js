const Order = require('../models/order');
const Product = require('../models/product');
const { validationResult } = require('express-validator');

exports.createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { items } = req.body;
        const userId = req.user.userId;

        // Calculate total amount and validate stock
        let totalAmount = 0;
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ error: `Product ${item.productId} not found` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for product ${item.productId}` });
            }
            item.price = product.price;
            totalAmount += item.price * item.quantity;
        }

        const order = await Order.create({
            userId,
            items,
            totalAmount
        });

        res.status(201).json(order);
    } catch (error) {
        if (error.message === 'Insufficient stock') {
            return res.status(400).json({ error: 'Insufficient stock' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orders = await Order.findByUserId(userId);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const order = await Order.updateStatus(orderId, status);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};