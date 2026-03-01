const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/authMiddleware');
const { analyzeXray, createReport, getMyReports, getPatients, updateReport } = require('../controllers/reportController');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

// Routes
router.post('/analyze', protect, authorize('doctor'), upload.single('image'), analyzeXray);
router.post('/', protect, authorize('doctor'), createReport);
router.get('/my-reports', protect, authorize('patient'), getMyReports);
router.get('/patients', protect, authorize('doctor'), getPatients);
router.get('/patient/:id', protect, authorize('doctor'), async (req, res) => {
    try {
        const Report = require('../models/Report');
        const reports = await Report.find({ patientId: req.params.id })
            .populate('doctorId', 'name')
            .populate('patientId', 'name email')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
router.delete('/:id', protect, authorize('doctor'), async (req, res) => {
    try {
        const Report = require('../models/Report');
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Only the doctor who created the report can delete it
        if (report.doctorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this report' });
        }

        await report.deleteOne();
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/:id', protect, authorize('doctor'), updateReport);

module.exports = router;
