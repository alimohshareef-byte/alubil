const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "ai.env" });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // مهم

// 👇 هنا تحطه بالضبط
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/golden.html");
});

// API
app.post("/ai", async (req, res) => {
    const { question } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "user", content: question }
            ]
        })
    });

    const data = await response.json();

console.log("AI RESPONSE:", data); // 👈 مهم جدًا

if (!data.choices) {
    return res.status(500).json({ error: data });
}

    res.json({
        result: data.choices[0].message.content
    });
});

// تشغيل السيرفر (آخر شيء)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});

const fs = require("fs");

app.use(cors());
app.use(express.json());

app.post("/save", (req, res) => {

    console.log("DATA RECEIVED:", req.body); // 👈 مهم

    try {
        fs.writeFileSync(`answers_${Date.now()}.json`, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "فشل الحفظ" });
    }

});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});

// جلب آخر ملف محفوظ
app.get("/answers", (req, res) => {
    try {
        const files = fs.readdirSync(__dirname)
            .filter(f => f.startsWith("answers_"))
            .sort()
            .reverse();

        if (files.length === 0) {
            return res.json([]);
        }

        const data = fs.readFileSync(files[0]);
        res.json(JSON.parse(data));

    } catch (error) {
        res.status(500).json({ error: "فشل القراءة" });
    }
});
const XLSX = require("xlsx");

app.get("/export", (req, res) => {

    const files = fs.readdirSync(__dirname)
        .filter(f => f.startsWith("answers_"))
        .sort()
        .reverse();

    if (files.length === 0) {
        return res.send("لا توجد بيانات");
    }

    const data = JSON.parse(fs.readFileSync(files[0]));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Answers");

    const filePath = "answers.xlsx";
    XLSX.writeFile(workbook, filePath);

    res.download(filePath);
});
