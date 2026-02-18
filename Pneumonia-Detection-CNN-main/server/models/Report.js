const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    prediction: {
        type: String, // 'Pneumonia' or 'Normal'
        required: true
    },
    confidence: {
        type: Number,
        required: true
    },

    notes: {
        type: String
    },
    heatmap: {
        type: String // Base64 PNG
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', reportSchema);
