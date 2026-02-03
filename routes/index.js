const express = require('express');
const router = express.Router();
const db = require('../database');
const md5 = require('md5');

// Trang chủ & Tìm kiếm
// routes/index.js

// Trang chủ (Có phân trang)
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const offset = (page - 1) * limit;

    db.get("SELECT COUNT(*) as count FROM stories", [], (err, row) => {
        if (err) return res.send("Lỗi Database");

        const totalStories = row.count;
        const totalPages = Math.ceil(totalStories / limit);
        const sql = `
            SELECT s.*, 
            (SELECT content FROM chapters WHERE story_id = s.id ORDER BY id DESC LIMIT 1) as latest_content 
            FROM stories s 
            ORDER BY s.id DESC 
            LIMIT ? OFFSET ?
        `;

        db.all(sql, [limit, offset], (err, stories) => {
            if (err) return res.send("Lỗi lấy danh sách truyện");

            res.render('home', {
                stories: stories,
                user: req.session.user,
                currentPage: page,
                totalPages: totalPages
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
        db.all("SELECT id, title FROM chapters WHERE story_id = ? ORDER BY id ASC", [id], (err, allChapters) => { // Lưu ý: Code cũ của bạn có thể đang dùng biến 'chapters' hoặc 'allChapters', hãy chú ý tên biến
            
            // --- ĐOẠN CODE MỚI: TÍNH SỐ CHƯƠNG TIẾP THEO ---
            let nextChapterTitle = "Chương 1: "; // Mặc định nếu chưa có chương nào
            
            if (allChapters && allChapters.length > 0) {
                // Lấy chương cuối cùng được đăng
                const lastChapter = allChapters[allChapters.length - 1];
                
                // Dùng Regex để tìm con số trong tiêu đề chương cũ (Ví dụ: "Chương 99:..." -> lấy số 99)
                const match = lastChapter.title.match(/Chương\s+(\d+)/i) || lastChapter.title.match(/(\d+)/);
                
                if (match) {
                    const nextNum = parseInt(match[1]) + 1;
                    nextChapterTitle = `Chương ${nextNum}: `;
                } else {
                    // Nếu không tìm thấy số, cứ lấy tổng số chương + 1
                    nextChapterTitle = `Chương ${allChapters.length + 1}: `;
                }
            }
            // -----------------------------------------------

            // Render giao diện và GỬI THÊM BIẾN nextChapterTitle
            res.render('story', { 
                story: story, 
                chapters: allChapters, // Hoặc 'chapters' tùy code cũ của bạn
                tags: tags, 
                user: req.session.user,
                nextChapterTitle: nextChapterTitle // <--- Gửi biến này sang View
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