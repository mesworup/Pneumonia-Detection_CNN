const Report = require("../models/Report");
const User = require("../models/User");
const axios = require("axios");
const path = require("path");

// ML Service Configuration
const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://localhost:8000/predict";

// @desc    Call Python ML Service for Prediction
const getPrediction = async (imagePath) => {
  try {
    const fs = require("fs");
    const FormData = require("form-data");

    // Convert relative path to absolute
    const absolutePath = path.resolve(imagePath);

    // Create form data with the image file
    const formData = new FormData();
    formData.append("file", fs.createReadStream(absolutePath));

    const response = await axios.post(ML_SERVICE_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // 60 second timeout for Grad-CAM processing
    });

    return response.data;
  } catch (error) {
    console.error("ML Service Error:", error.message);
    throw new Error("Unable to process image. ML service may be offline.");
  }
};

// @desc    Analyze X-Ray but don't save to DB (Preview)
// @route   POST /api/reports/analyze
// @access  Private (Doctor only)
exports.analyzeXray = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    // Get prediction from ML model
    const imagePath = `uploads/${req.file.filename}`;
    const mlResult = await getPrediction(imagePath);

    // Log analysis result without massive base64 string
    const logResult = { ...mlResult };
    if (logResult.heatmap) logResult.heatmap = "<BASE64_HEATMAP_TRUNCATED>";
    console.log("ML Service Analysis:", JSON.stringify(logResult, null, 2));

    // Map FastAPI response (EfficientNetV2) to standardized format
    res.json({
      is_xray: mlResult.is_xray, // Pass Gate Model result
      xray_confidence: mlResult.xray_confidence,
      message: mlResult.message,
      prediction: mlResult.classification,
      confidence: mlResult.class_confidence,
      imageUrl: `/${imagePath}`,
      heatmap: mlResult.heatmap,
    });
  } catch (error) {
    console.error("Analyze Error:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Finalize and Save Report
// @route   POST /api/reports
// @access  Private (Doctor only)
exports.createReport = async (req, res) => {
  try {
    const { patientId, prediction, confidence, imageUrl, notes, heatmap } =
      req.body;

    if (!patientId || !prediction || !imageUrl) {
      return res.status(400).json({ message: "Missing required report data" });
    }

    const report = await Report.create({
      patientId,
      doctorId: req.user._id,
      imageUrl,
      prediction,
      confidence,
      notes,
      heatmap,
    });

    // Notify patient mapping
    const { createNotification } = require("./notificationController");
    await createNotification(
      patientId,
      "A new medical report has been assigned to you",
      "report_assigned",
      {
        reportId: report._id,
        doctorId: req.user._id,
        doctorName: req.user.name,
      },
    );

    res.status(201).json(report.toObject());
  } catch (error) {
    console.error("Create Report Error:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Get reports for a specific patient (for Patient Dashboard)
// @route   GET /api/reports/my-reports
// @access  Private (Patient only)
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ patientId: req.user._id })
      .populate("doctorId", "name")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get list of patients (for Doctor Dashboard)
// @route   GET /api/reports/patients
// @access  Private (Doctor only)
exports.getPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" }).select("-password");

    // Add report count and status for each patient
    const patientsWithStatus = await Promise.all(
      patients.map(async (patient) => {
        const reportCount = await Report.countDocuments({
          patientId: patient._id,
        });
        return {
          ...patient.toObject(),
          reportCount,
          status: reportCount > 0 ? "ANALYZED" : "PENDING",
        };
      }),
    );

    res.json(patientsWithStatus);
  } catch (error) {
    console.error("Get Patients Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update Report (Notes)
// @route   PUT /api/reports/:id
// @access  Private (Doctor only)
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Only the doctor who created the report can update it
    if (report.doctorId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this report" });
    }

    // Update notes
    report.notes = req.body.notes || report.notes;
    await report.save();

    res.json(report);
  } catch (error) {
    console.error("Update Report Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
