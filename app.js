const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session); // Thêm dòng này
const multer = require('multer');
const path = require('path');
const db = require('./db'); // (Lưu ý: file database của bạn tên là db.js hay database.js? Kiểm tra lại tên file import này nhé. Trong code cũ là db.js, nếu bạn đổi tên file thì sửa dòng này)
const md5 = require('md5');

const app = express();
const PORT = 1506;

// Cấu hình upload ảnh
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Cấu hình Session (QUAN TRỌNG: Lưu vào thư mục ./data)
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db', 
        dir: './data',     // <--- SỬA LẠI: Lưu vào thư mục data để không bị mất
        concurrentDB: true
    }),
    secret: 'bi-mat-cua-ban',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    } 
}));

// Import Routes
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});