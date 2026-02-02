const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');

// Cấu hình upload ảnh
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Middleware kiểm tra quyền Admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    next();
};

// Trang Dashboard Admin
router.get('/', requireAdmin, (req, res) => {
    db.all("SELECT * FROM tags", (err, tags) => {
        db.all("SELECT * FROM stories ORDER BY id DESC", (err, stories) => {
            res.render('admin_panel', { tags, stories, user: req.session.user });
        });
    });
});

// Xử lý thêm Tag
router.post('/add-tag', requireAdmin, (req, res) => {
    db.run("INSERT INTO tags (name) VALUES (?)", [req.body.name], () => res.redirect('/admin'));
});

// Xử lý thêm Truyện
router.post('/add-story', requireAdmin, upload.single('cover'), (req, res) => {
    const { title, description, tags } = req.body;
    const cover = req.file ? '/uploads/' + req.file.filename : '';
    
    db.run("INSERT INTO stories (title, description, cover) VALUES (?, ?, ?)", [title, description, cover], function(err) {
        const storyId = this.lastID;
        if (tags) {
            const tagList = Array.isArray(tags) ? tags : [tags];
            tagList.forEach(tagId => db.run("INSERT INTO story_tags (story_id, tag_id) VALUES (?, ?)", [storyId, tagId]));
        }
        res.redirect('/admin');
    });
});

// Xử lý thêm Chương
router.post('/add-chapter', requireAdmin, (req, res) => {
    const { story_id, title, content } = req.body;
    db.run("INSERT INTO chapters (story_id, title, content) VALUES (?, ?, ?)", [story_id, title, content], () => {
        res.redirect('/story/' + story_id);
    });
});

module.exports = router;