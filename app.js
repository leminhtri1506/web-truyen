const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 1506;

// Cấu hình View Engine là EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cấu hình thư mục Public (chứa css, ảnh)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware xử lý dữ liệu gửi lên
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'bi-mat-cua-ban',
    resave: false,
    saveUninitialized: true
}));

// Import các file Logic (Routes)
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

// Sử dụng Routes
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});