const express = require('express');
const router = express.Router();
const db = require('../database');
const md5 = require('md5');

// Trang chủ & Tìm kiếm
// routes/index.js

// Trang chủ (Có phân trang)
router.get('/', (req, res) => {
    // 1. Xác định trang hiện tại (mặc định là 1)
    const page = parseInt(req.query.page) || 1;
    const limit = 10; 
    const offset = (page - 1) * limit;

    db.get("SELECT COUNT(*) as count FROM stories", [], (err, row) => {
        if (err) {
            console.error(err);
            return res.send("Lỗi Database");
        }

        const totalStories = row.count;
        const totalPages = Math.ceil(totalStories / limit);

        // 3. Lấy danh sách truyện cho trang hiện tại (Sắp xếp mới nhất trước)
        db.all("SELECT * FROM stories ORDER BY id DESC LIMIT ? OFFSET ?", [limit, offset], (err, stories) => {
            if (err) {
                console.error(err);
                return res.send("Lỗi lấy danh sách truyện");
            }

            // 4. Render và GỬI BIẾN currentPage SANG VIEW (Khắc phục lỗi)
            res.render('home', {
                stories: stories,
                user: req.session.user,
                currentPage: page,       // <--- Đây là biến bị thiếu
                totalPages: totalPages   // <--- Đây là biến bị thiếu
            });
        });
    });
});

router.get('/login', (req, res) => {
    res.render('login', { user: req.session.user }); 
});

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
            
            db.all("SELECT id, title FROM chapters WHERE story_id = ? ORDER BY id ASC", [chapter.story_id], (err, allChapters) => {
                
                const currentIndex = allChapters.findIndex(c => c.id == chapterId);
                
                const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
                const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

                res.render('read', {
                    story: story,
                    chapter: chapter,
                    prevChapter: prevChapter,
                    nextChapter: nextChapter,
                    allChapters: allChapters, 
                    user: req.session.user
                });
            });
        });
    });
});

module.exports = router;