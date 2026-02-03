const express = require('express');
const router = express.Router();
const db = require('../database');
const md5 = require('md5');

// Trang chủ & Tìm kiếm
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let sql = `SELECT s.* FROM stories s WHERE s.title LIKE ? ORDER BY s.id DESC LIMIT ? OFFSET ?`;
    
    db.all(sql, [`%${search}%`, limit, offset], (err, stories) => {
        const promises = stories.map(story => {
            return new Promise((resolve) => {
                // Lấy tags
                db.all(`SELECT t.name FROM tags t JOIN story_tags st ON t.id = st.tag_id WHERE st.story_id = ?`, [story.id], (err, tags) => {
                    story.tags = tags;
                    // Lấy đoạn đầu chương 1 để preview
                    db.get(`SELECT content FROM chapters WHERE story_id = ? ORDER BY id ASC LIMIT 1`, [story.id], (err, chap) => {
                        story.preview = chap ? chap.content.substring(0, 150) + '...' : 'Chưa có chương nào';
                        resolve();
                    });
                });
            });
        });

        Promise.all(promises).then(() => {
            res.render('home', { stories, page, search, user: req.session.user });
        });
    });
});

router.get('/login', (req, res) => {
    // Truyền biến user (dù chưa đăng nhập thì là null) để header không bị lỗi
    res.render('login', { user: req.session.user }); 
});

// Xử lý Đăng ký (User đầu tiên là Admin)
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT count(*) as count FROM users", (err, row) => {
        const role = row.count === 0 ? 'admin' : 'user';
        db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, md5(password), role], (err) => {
            res.redirect('/login');
        });
    });
});

// Xử lý Đăng nhập
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, md5(password)], (err, user) => {
        if (user) {
            req.session.user = user;
            res.redirect('/');
        } else {
            res.send("Sai thông tin đăng nhập <a href='/login'>Thử lại</a>");
        }
    });
});

// Xem chi tiết truyện
// Xem chi tiết truyện
router.get('/story/:id', (req, res) => {
    const id = req.params.id;
    // Lấy thông tin truyện
    db.get("SELECT * FROM stories WHERE id = ?", [id], (err, story) => {
        if (!story) return res.send("Truyện không tồn tại"); // Báo lỗi nếu ID sai

        // Lấy danh sách chương
        db.all("SELECT * FROM chapters WHERE story_id = ? ORDER BY id ASC", [id], (err, chapters) => {
            
            // Lấy danh sách Tags
            db.all(`SELECT t.name FROM tags t JOIN story_tags st ON t.id = st.tag_id WHERE st.story_id = ?`, [id], (err, tags) => {
                
                // Render giao diện và truyền đầy đủ biến
                res.render('story', { 
                    story: story, 
                    chapters: chapters, 
                    tags: tags, 
                    user: req.session.user // <--- QUAN TRỌNG: Phải có dòng này mới hiện Header
                });
            });
        });
    });
});

router.get('/read/:id', (req, res) => {
    const chapterId = req.params.id;

    db.get("SELECT * FROM chapters WHERE id = ?", [chapterId], (err, chapter) => {
        if (err || !chapter) {
            return res.status(404).send("Chương này không tồn tại hoặc đã bị xóa.");
        }

        db.get("SELECT * FROM stories WHERE id = ?", [chapter.story_id], (err, story) => {
            
            db.all("SELECT id FROM chapters WHERE story_id = ? ORDER BY id ASC", [chapter.story_id], (err, allChapters) => {
                
                const currentIndex = allChapters.findIndex(c => c.id == chapterId);
                
                const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
                const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

                res.render('read', {
                    story: story,
                    chapter: chapter,
                    prevChapter: prevChapter,
                    nextChapter: nextChapter,
                    user: req.session.user
                });
            });
        });
    });
});

module.exports = router;