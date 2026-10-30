const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const filePath = path.join(__dirname, 'sensors.json');

// Tüm sensörleri getir
app.get('/api/sensors', (req, res) => {
    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            res.json(JSON.parse(data));
        } catch (e) {
            res.json({});
        }
    } else {
        res.json({});
    }
});

// Toplu dosya kaydetme (File tabından yükleme için)
app.post('/api/save-all', (req, res) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
        res.json({ success: true, message: 'Tüm konfigürasyon başarıyla kaydedildi!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Tekil sensör ekle veya güncelle (Add/Edit)
app.post('/api/sensor', (req, res) => {
    const { category, sensorData, editIndex } = req.body;
    
    if (!category || !sensorData) {
        return res.status(400).json({ success: false, message: 'Kategori ve sensör verisi zorunludur.' });
    }

    let currentData = {};
    if (fs.existsSync(filePath)) {
        try {
            currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) { currentData = {}; }
    }

    if (!currentData[category]) {
        currentData[category] = [];
    }

    if (editIndex !== null && editIndex !== undefined && editIndex >= 0) {
        // Güncelleme (Edit)
        currentData[category][editIndex] = sensorData;
    } else {
        // Yeni Ekleme (Add New)
        currentData[category].push(sensorData);
    }

    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2), 'utf8');
    res.json({ success: true, message: 'Sensör başarıyla kaydedildi!' });
});

// Sensör silme (Delete)
app.delete('/api/sensor', (req, res) => {
    const { category, index } = req.query;

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Dosya bulunamadı.' });
    }

    try {
        let currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (currentData[category] && Array.isArray(currentData[category])) {
            currentData[category].splice(parseInt(index), 1);
            if (currentData[category].length === 0) {
                delete currentData[category];
            }
            fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2), 'utf8');
            return res.json({ success: true, message: 'Sensör silindi.' });
        }

        res.status(400).json({ success: false, message: 'Kategori veya indeks bulunamadı.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// JSON İndirme
app.get('/api/download', (req, res) => {
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('Dosya yok.');
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});