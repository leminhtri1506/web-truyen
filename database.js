const sqlite3 = require('sqlite3').verbose();
const md5 = require('md5');
const fs = require('fs');
const path = require('path');

// 1. Xác định đường dẫn thư mục 'data' nằm cùng cấp với file này
const dataDir = path.resolve(__dirname, 'data');

// 2. Kiểm tra xem thư mục 'data' có tồn tại không. Nếu không thì tạo mới.
// Bước này giúp Docker không bị lỗi khi chưa có file db
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
    console.log("Đã tự động tạo thư mục data.");
}

// 3. Kết nối tới database (nằm bên trong thư mục data)
const dbPath = path.join(dataDir, 'truyen.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Lỗi kết nối Database:", err.message);
    } else {
        console.log("Đã kết nối tới SQLite Database tại:", dbPath);
    }
});

// 4. Tạo bảng dữ liệu nếu chưa có
db.serialize(() => {
    // Bảng Users (Người dùng & Admin)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
    )`);

    // Bảng Tags (Thể loại truyện)
    db.run(`CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
    )`);

    // Bảng Stories (Thông tin truyện)
    db.run(`CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        cover TEXT,
        status TEXT DEFAULT 'Đang cập nhật',  -- <--- THÊM DÒNG NÀY
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Bảng liên kết Truyện - Tag (Một truyện có nhiều tag)
    db.run(`CREATE TABLE IF NOT EXISTS story_tags (
        story_id INTEGER,
        tag_id INTEGER
    )`);

    // Bảng Chapters (Nội dung chương)
    db.run(`CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id INTEGER,
        title TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Xuất biến db để các file khác sử dụng
module.exports = db;