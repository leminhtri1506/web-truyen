const sqlite3 = require('sqlite3').verbose();
const md5 = require('md5');
const fs = require('fs');    // <--- Thêm thư viện quản lý file
const path = require('path');

// Database sẽ được lưu vào file truyen.db
const db = new sqlite3.Database('./truyen.db');

db.serialize(() => {
    // Tạo bảng Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
    )`);

    // Tạo bảng Tags
    db.run(`CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
    )`);

    // Tạo bảng Truyện
    db.run(`CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        cover TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tạo bảng Liên kết Truyện - Tag
    db.run(`CREATE TABLE IF NOT EXISTS story_tags (
        story_id INTEGER,
        tag_id INTEGER
    )`);

    // Tạo bảng Chương
    db.run(`CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id INTEGER,
        title TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

module.exports = db;