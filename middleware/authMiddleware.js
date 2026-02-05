const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    const token = req.header('token');

    if (!token) {
        return res.status(403).json({ message: 'Нет доступа (Authorization denied)' });
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verify;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Токен не валиден' });
    }
};