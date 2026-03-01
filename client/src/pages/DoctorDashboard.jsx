import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiEndpoints } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [patientReports, setPatientReports] = useState([]);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [editableNotes, setEditableNotes] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token) {
      fetchPatients();
    }
  }, [token]);

  const fetchPatients = async () => {
    try {
      const response = await fetch(
        apiEndpoints.reports.patients,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      console.log("Fetched patients with status:", data);
      setPatients(data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchPatientReports = async (patientId, patient) => {
    try {
      const response = await fetch(
        apiEndpoints.reports.patientReports(patientId),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setPatientReports(data);
      setSelectedPatient(patient);
      setShowReportsModal(true);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this report? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        apiEndpoints.reports.delete(reportId),
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        // Remove report from local state
        setPatientReports(patientReports.filter((r) => r._id !== reportId));

        // Refresh patient list to update status (if no reports left, status will become PENDING)
        fetchPatients();
      } else {
        alert("Error deleting report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Error deleting report");
    }
  };

  const viewDetailedReport = (report) => {
    setSelectedReport(report);
    setEditableNotes(report.notes || "");
    setShowHeatmap(false); // Reset to show boxes by default
    setShowDetailedReport(true);
  };

  const downloadReport = async (report) => {
    const doc = new jsPDF();
    const patient = report.patientId || selectedPatient;

    // Colors
    const primaryColor = [25, 118, 210]; // Blue
    const secondaryColor = [100, 100, 100]; // Grey
    const warningColor = [211, 47, 47]; // Red for warnings

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("PNEUMODETECT", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Advanced Chest X-ray Analysis Report", 105, 30, {
      align: "center",
    });

    // Report Info
    const reportY = 55;
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.text(`Report ID: ${report._id}`, 15, reportY);
    doc.text(
      `Date: ${new Date(report.createdAt).toLocaleDateString()}`,
      150,
      reportY,
    );

    // Patient Details Section
    autoTable(doc, {
      startY: reportY + 10,
      head: [["Patient Information", "Doctor Information"]],
      body: [
        [
          `Name: ${patient?.name || "N/A"}\nEmail: ${patient?.email || "N/A"}\nPatient ID: ${patient?._id?.slice(-8) || "N/A"}`,
          `Doctor: ${report.doctorId?.name || user?.name}\nDate: ${new Date().toLocaleDateString()}`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
    });

    // Diagnosis Result
    const diagnosisY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("DIAGNOSIS RESULT", 15, diagnosisY);

    // Result Box
    const resultBoxY = diagnosisY + 5;
    const resultColor =
      report.prediction === "Pneumonia" ? [253, 237, 237] : [232, 244, 253];
    const resultTextColor =
      report.prediction === "Pneumonia" ? [211, 47, 47] : [25, 118, 210];

    doc.setFillColor(...resultColor);
    doc.roundedRect(15, resultBoxY, 180, 25, 3, 3, "F");

    doc.setTextColor(...resultTextColor);
    doc.setFontSize(16);
    doc.text(report.prediction.toUpperCase(), 105, resultBoxY + 16, {
      align: "center",
    });

    // Confidence
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.text(
      `Confidence Level: ${(report.confidence * 100).toFixed(1)}%`,
      105,
      resultBoxY + 32,
      { align: "center" },
    );

    // Warnings
    let currentY = resultBoxY + 45;

    if (report.prediction === "Invalid Image") {
      doc.setTextColor(...warningColor);
      doc.setFontSize(11);
      doc.text(
        "⚠️ IMPORTANT: This image was identified as NOT a chest X-ray.",
        15,
        currentY,
      );
      currentY += 10;
    } else if (report.prediction === "Uncertain" || report.confidence < 0.75) {
      doc.setTextColor(...warningColor);
      doc.setFontSize(11);
      doc.text(
        "⚠️ LOW CONFIDENCE: A specialist review is officially recommended.",
        15,
        currentY,
      );
      currentY += 10;
    }

    // Clinical Notes
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("CLINICAL NOTES", 15, currentY + 10);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    const splitNotes = doc.splitTextToSize(
      report.notes || "No notes provided.",
      180,
    );
    doc.text(splitNotes, 15, currentY + 20);

    // Footer for first page
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(240, 240, 240);
    doc.rect(0, pageHeight - 20, 210, 20, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Generated by PneumoDetect AI System - Not a substitute for professional medical advice.",
      105,
      pageHeight - 8,
      { align: "center" },
    );

    // Add new page for X-ray image
    doc.addPage();

    // Header for second page
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CHEST X-RAY IMAGE", 105, 20, { align: "center" });

    // Fetch and add X-ray image
    try {
      const imageUrl = apiEndpoints.uploads.image(report.imageUrl);
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Convert blob to base64
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Add image to PDF (centered, with reasonable size)
      const imgWidth = 160;
      const imgHeight = 160;
      const xPos = (210 - imgWidth) / 2; // Center horizontally
      const yPos = 45;

      doc.addImage(base64Image, "JPEG", xPos, yPos, imgWidth, imgHeight);

      // Image caption
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Analyzed on: ${new Date(report.createdAt).toLocaleString()}`,
        105,
        yPos + imgHeight + 10,
        { align: "center" },
      );
    } catch (error) {
      console.error("Error loading image:", error);
      doc.setTextColor(211, 47, 47);
      doc.setFontSize(12);
      doc.text("Error loading X-ray image", 105, 100, { align: "center" });
    }

    // Footer for second page
    doc.setFillColor(240, 240, 240);
    doc.rect(0, pageHeight - 20, 210, 20, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Generated by PneumoDetect AI System - Not a substitute for professional medical advice.",
      105,
      pageHeight - 8,
      { align: "center" },
    );

    doc.save(
      `Medical_Report_${patient?.name || "Patient"}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setAnalysisResult(null);
    setMessage("");
  };

  const openUploadModal = (patient) => {
    setSelectedPatient(patient);
    setShowUploadModal(true);
    setMessage("");
    setFile(null);
    setNotes("");
    setAnalysisResult(null);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please upload an X-Ray");
      return;
    }

    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        apiEndpoints.reports.analyze,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Analysis data received:", data);

        // Handle Gate Model Rejection (Normalize data for UI)
        if (data.is_xray === false) {
          data.prediction = "Invalid Image";
          data.confidence = data.xray_confidence || 0;
        }

        setAnalysisResult(data);
        setShowHeatmap(false); // Reset to show boxes by default
        setMessage("");
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || "Error analyzing X-Ray");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Server Error");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!analysisResult) {
      setMessage("Please analyze the X-Ray first");
      return;
    }

    setLoading(true);
    setMessage("Submitting report...");

    try {
      const response = await fetch(apiEndpoints.reports.create, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          prediction: analysisResult.prediction,
          confidence: analysisResult.confidence,
          boxes: analysisResult.boxes,
          imageUrl: analysisResult.imageUrl,
          notes: notes,
          heatmap: analysisResult.heatmap,
        }),
      });

      if (response.ok) {
        setMessage("Report submitted successfully!");
        fetchPatients();
        setTimeout(() => {
          setShowUploadModal(false);
          setFile(null);
          setNotes("");
          setAnalysisResult(null);
        }, 1500);
      } else {
        setMessage("Error submitting report");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Server Error");
    }
    setLoading(false);
  };

  return (
    <div
      className="container"
      style={{ paddingTop: "120px", paddingBottom: "3rem" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "0.5rem" }}>Doctor Dashboard</h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            Manage patients and diagnostic reports
          </p>
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="🔍 Search patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "0.8rem 1.2rem",
            borderRadius: "12px",
            border: "2px solid #E5E7EB",
            fontSize: "0.95rem",
            outline: "none",
            minWidth: "300px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#667eea")}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "15px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1.5rem 2rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
            Patient List ({patients.length})
          </h2>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F3F4F6", color: "#374151" }}>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "600",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "600",
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "600",
                  }}
                >
                  Joined Date
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {patients.filter((patient) => {
                const query = searchQuery.toLowerCase();
                return (
                  patient.name.toLowerCase().includes(query) ||
                  patient.email.toLowerCase().includes(query)
                );
              }).length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: "3rem",
                      textAlign: "center",
                      color: "#9CA3AF",
                    }}
                  >
                    {searchQuery
                      ? "No patients match your search"
                      : "No patients found"}
                  </td>
                </tr>
              ) : (
                patients
                  .filter((patient) => {
                    const query = searchQuery.toLowerCase();
                    return (
                      patient.name.toLowerCase().includes(query) ||
                      patient.email.toLowerCase().includes(query)
                    );
                  })
                  .map((patient) => (
                    <tr
                      key={patient._id}
                      style={{ borderBottom: "1px solid #E5E7EB" }}
                    >
                      <td style={{ padding: "1rem" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "600",
                            }}
                          >
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: "500" }}>
                            {patient.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "1rem", color: "#6B7280" }}>
                        {patient.email}
                      </td>
                      <td style={{ padding: "1rem", color: "#6B7280" }}>
                        {new Date(patient.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                        <br />
                        <span style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>
                          {new Date(patient.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </td>
                      {/* Status Column */}
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "20px",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            background:
                              patient.status === "ANALYZED"
                                ? "#D1FAE5"
                                : "#FEF3C7",
                            color:
                              patient.status === "ANALYZED"
                                ? "#065F46"
                                : "#92400E",
                          }}
                        >
                          {patient.status === "ANALYZED"
                            ? "✓ Analyzed"
                            : "⏳ Pending"}
                        </span>
                        {patient.status === "PENDING" && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#9CA3AF",
                              marginTop: "0.25rem",
                            }}
                          >
                            No report available
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            onClick={() => openUploadModal(patient)}
                            style={{
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "white",
                              border: "none",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                              fontWeight: "500",
                              transition: "transform 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.transform = "translateY(-2px)")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.transform = "translateY(0)")
                            }
                          >
                            {patient.status === "ANALYZED"
                              ? "🔄 Re-upload X-Ray"
                              : "📤 Upload X-Ray"}
                          </button>
                          <button
                            onClick={() =>
                              patient.status === "ANALYZED" &&
                              fetchPatientReports(patient._id, patient)
                            }
                            disabled={patient.status === "PENDING"}
                            style={{
                              background:
                                patient.status === "PENDING"
                                  ? "#E5E7EB"
                                  : "#F3F4F6",
                              color:
                                patient.status === "PENDING"
                                  ? "#9CA3AF"
                                  : "#374151",
                              border: "1px solid #D1D5DB",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                              cursor:
                                patient.status === "PENDING"
                                  ? "not-allowed"
                                  : "pointer",
                              fontSize: "0.9rem",
                              fontWeight: "500",
                              transition: "all 0.2s",
                              opacity: patient.status === "PENDING" ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (patient.status === "ANALYZED") {
                                e.target.style.background = "#E5E7EB";
                                e.target.style.transform = "translateY(-2px)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (patient.status === "ANALYZED") {
                                e.target.style.background = "#F3F4F6";
                                e.target.style.transform = "translateY(0)";
                              }
                            }}
                            title={
                              patient.status === "PENDING"
                                ? "No reports available. X-ray analysis is pending."
                                : ""
                            }
                          >
                            📋 View Reports
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "15px",
              padding: "1.25rem",
              maxWidth: analysisResult ? "800px" : "500px",
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ margin: 0 }}>
                Upload X-Ray for {selectedPatient?.name}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                ×
              </button>
            </div>

            {message && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  background:
                    message.includes("Error") ||
                      message.includes("Invalid") ||
                      message.includes("valid chest X-ray")
                      ? "#FEE2E2"
                      : message.includes("Submitting") ||
                        message.includes("Analyzing")
                        ? "#FEF3C7"
                        : "#F0FDFA",
                  color:
                    message.includes("Error") ||
                      message.includes("Invalid") ||
                      message.includes("valid chest X-ray")
                      ? "#DC2626"
                      : message.includes("Submitting") ||
                        message.includes("Analyzing")
                        ? "#92400E"
                        : "#0F766E",
                  borderRadius: "8px",
                  fontWeight: "500",
                }}
              >
                {message}
              </div>
            )}

            {!analysisResult ? (
              <form onSubmit={handleAnalyze}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                    }}
                  >
                    Upload X-Ray Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ width: "100%" }}
                    required
                  />
                  {file && (
                    <div
                      style={{
                        marginTop: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "300px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          boxShadow:
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          background: "#F9FAFB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          onLoad={(e) =>
                            setImageAspectRatio(
                              e.target.naturalWidth / e.target.naturalHeight,
                            )
                          }
                          style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "0.85rem",
                          color: "#10B981",
                          fontWeight: "500",
                        }}
                      >
                        ✓ {file.name}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    padding: "0.8rem 1.5rem",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    fontWeight: "600",
                    transition: "transform 0.2s",
                    opacity: loading ? 0.6 : 1,
                  }}
                  disabled={loading}
                  onMouseEnter={(e) =>
                    !loading && (e.target.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.transform = "translateY(0)")
                  }
                >
                  {loading ? "🔬 Analyzing..." : "🔬 Analyze X-Ray"}
                </button>
              </form>
            ) : (
              <div>
                {/* Analysis Result Display */}
                <div
                  style={{
                    background:
                      analysisResult.prediction === "Pneumonia"
                        ? "#FEE2E2"
                        : analysisResult.prediction === "Invalid Image"
                          ? "#FEE2E2"
                          : "#DBEAFE",
                    border: `2px solid ${analysisResult.prediction === "Pneumonia" ? "#DC2626" : analysisResult.prediction === "Invalid Image" ? "#DC2626" : "#2563EB"}`,
                    borderRadius: "12px",
                    padding: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        fontSize: "1.5rem",
                        color:
                          analysisResult.prediction === "Pneumonia"
                            ? "#DC2626"
                            : analysisResult.prediction === "Invalid Image"
                              ? "#DC2626"
                              : "#2563EB",
                      }}
                    >
                      {analysisResult.prediction === "Pneumonia"
                        ? "⚠️"
                        : analysisResult.prediction === "Invalid Image"
                          ? "❌"
                          : "✓"}{" "}
                      {analysisResult.prediction.toUpperCase()}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        color: "#374151",
                      }}
                    >
                      Confidence:{" "}
                      <strong>
                        {(analysisResult.confidence * 100).toFixed(1)}%
                      </strong>
                    </p>
                  </div>

                  {analysisResult.prediction === "Invalid Image" && (
                    <div
                      style={{
                        background: "white",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        color: "#DC2626",
                      }}
                    >
                      This image is not a chest X-ray. Please upload a chest
                      X-ray image.
                    </div>
                  )}

                  {analysisResult.prediction === "Uncertain" && (
                    <div
                      style={{
                        background: "white",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        color: "#92400E",
                      }}
                    >
                      Low confidence prediction. Specialist review recommended.
                    </div>
                  )}
                </div>

                {/* Side-by-Side X-ray and Heatmap Display */}
                {file && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "2rem",
                        justifyContent: "center",
                        flexWrap: "nowrap",
                        alignItems: "center",
                      }}
                    >
                      {/* Original X-ray */}
                      <div
                        style={{
                          flex: "1",
                          minWidth: "300px",
                          maxWidth: "300px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Original X-ray
                        </div>
                        <div
                          style={{
                            width: "300px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow:
                              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#F9FAFB",
                          }}
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Original X-Ray"
                            onLoad={(e) =>
                              setImageAspectRatio(
                                e.target.naturalWidth / e.target.naturalHeight,
                              )
                            }
                            style={{
                              width: "100%",
                              height: "auto",
                              display: "block",
                            }}
                          />
                        </div>
                      </div>

                      {/* AI Heatmap Analysis */}
                      {analysisResult && analysisResult.heatmap && (
                        <div
                          style={{
                            flex: "1",
                            minWidth: "300px",
                            maxWidth: "300px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.9rem",
                              fontWeight: "600",
                              color: "#374151",
                              marginBottom: "0.5rem",
                            }}
                          >
                            Heatmap Analysis
                          </div>
                          <div
                            style={{
                              width: "300px",
                              borderRadius: "12px",
                              overflow: "hidden",
                              boxShadow:
                                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#F9FAFB",
                            }}
                          >
                            <img
                              src={`data:image/png;base64,${analysisResult.heatmap}`}
                              alt="AI Heatmap"
                              style={{
                                width: "100%",
                                height: "auto",
                                aspectRatio: imageAspectRatio,
                                objectFit: "fill",
                                display: "block",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Heatmap Color Legend */}
                    {analysisResult && analysisResult.heatmap && (
                      <div
                        style={{
                          marginTop: "1rem",
                          background: "white",
                          padding: "1rem",
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          maxWidth: "400px",
                          margin: "0.5rem auto 0",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "0.5rem",
                            textAlign: "center",
                          }}
                        >
                          Heatmap Color Index
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span
                            style={{ fontSize: "0.75rem", color: "#6B7280" }}
                          >
                            Low
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: "16px",
                              borderRadius: "8px",
                              background:
                                "linear-gradient(90deg, #0000FF 0%, #00FFFF 20%, #00FF00 40%, #FFFF00 60%, #FFA500 80%, #FF0000 100%)",
                            }}
                          ></div>
                          <span
                            style={{ fontSize: "0.75rem", color: "#6B7280" }}
                          >
                            High
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-around",
                            fontSize: "0.7rem",
                          }}
                        >
                          <span style={{ color: "#3B82F6" }}>
                            ● Low Model Attention
                          </span>
                          <span style={{ color: "#EF4444" }}>
                            ● High Model Attention
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Clinical Notes Form */}
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                      }}
                    >
                      Clinical Notes{" "}
                      {analysisResult.prediction === "Invalid Image"
                        ? "(Required for Invalid Images)"
                        : "(Optional)"}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="4"
                      placeholder="Add any clinical observations or recommendations..."
                      style={{
                        width: "100%",
                        padding: "0.8rem",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        resize: "vertical",
                        fontSize: "0.95rem",
                      }}
                      required={analysisResult.prediction === "Invalid Image"}
                    ></textarea>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setAnalysisResult(null);
                        setFile(null);
                        setNotes("");
                        setMessage("");
                      }}
                      style={{
                        flex: 1,
                        background: "#F3F4F6",
                        color: "#374151",
                        border: "1px solid #D1D5DB",
                        padding: "0.8rem 1.5rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        fontWeight: "500",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "#E5E7EB")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "#F3F4F6")
                      }
                    >
                      ↺ Re-analyze
                    </button>
                    <button
                      type="submit"
                      style={{
                        flex: 2,
                        background: "#10B981",
                        color: "white",
                        border: "none",
                        padding: "0.8rem 1.5rem",
                        borderRadius: "8px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        transition: "transform 0.2s",
                        opacity: loading ? 0.6 : 1,
                      }}
                      disabled={loading}
                      onMouseEnter={(e) =>
                        !loading &&
                        (e.target.style.transform = "translateY(-2px)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.transform = "translateY(0)")
                      }
                    >
                      {loading ? "Submitting..." : "✓ Submit Report"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "15px",
              padding: "2rem",
              maxWidth: "800px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ margin: 0 }}>
                Patient Reports ({patientReports.length})
              </h2>
              <button
                onClick={() => setShowReportsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                ×
              </button>
            </div>

            {patientReports.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: "#6B7280",
                }}
              >
                No reports found for this patient
              </div>
            )}

            {patientReports.length > 0 && (
              <div style={{ display: "grid", gap: "1rem" }}>
                {patientReports.map((report) => (
                  <div
                    key={report._id}
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: "10px",
                      padding: "1rem",
                      display: "grid",
                      gridTemplateColumns: "150px 1fr",
                      gap: "1rem",
                    }}
                  >
                    <img
                      src={apiEndpoints.uploads.image(report.imageUrl)}
                      alt="X-Ray"
                      style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        background: "#000",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "15px",
                            fontSize: "0.85rem",
                            fontWeight: "bold",
                            background:
                              report.prediction === "Pneumonia"
                                ? "#FEE2E2"
                                : "#DBEAFE",
                            color:
                              report.prediction === "Pneumonia"
                                ? "#DC2626"
                                : "#2563EB",
                          }}
                        >
                          {report.prediction}
                        </span>
                        <span
                          style={{
                            marginLeft: "0.5rem",
                            color: "#6B7280",
                            fontSize: "0.9rem",
                          }}
                        >
                          {(report.confidence * 100).toFixed(1)}% Confidence
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "#6B7280",
                          margin: "0.5rem 0",
                        }}
                      >
                        <strong>Date:</strong>{" "}
                        {new Date(report.createdAt).toLocaleDateString()} at{" "}
                        {new Date(report.createdAt).toLocaleTimeString()}
                      </p>
                      {report.notes && (
                        <p
                          style={{
                            fontSize: "0.9rem",
                            color: "#374151",
                            margin: "0.5rem 0",
                          }}
                        >
                          <strong>Notes:</strong> {report.notes}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginTop: "0.75rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => viewDetailedReport(report)}
                          style={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                            border: "none",
                            padding: "0.4rem 1rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: "500",
                            transition: "transform 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.target.style.transform = "scale(1.05)")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.transform = "scale(1)")
                          }
                        >
                          📄 View Full Report
                        </button>
                        <button
                          onClick={() => downloadReport(report)}
                          style={{
                            background: "#10B981",
                            color: "white",
                            border: "none",
                            padding: "0.4rem 1rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: "500",
                            transition: "transform 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.target.style.transform = "scale(1.05)")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.transform = "scale(1)")
                          }
                        >
                          ⬇️ Download
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report._id)}
                          style={{
                            marginTop: "0.5rem",
                            background: "#FEE2E2",
                            color: "#DC2626",
                            border: "1px solid #FCA5A5",
                            padding: "0.4rem 1rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: "500",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#FCA5A5";
                            e.target.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "#FEE2E2";
                            e.target.style.color = "#DC2626";
                          }}
                        >
                          🗑️ Delete Report
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showDetailedReport && selectedReport && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "15px",
              width: "95%",
              maxWidth: "1200px",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                borderBottom: "1px solid #E5E7EB",
                paddingBottom: "1rem",
              }}
            >
              <h2 style={{ margin: 0, color: "#1F2937" }}>
                Detailed Analysis Report
              </h2>
              <div
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                <button
                  onClick={() => downloadReport(selectedReport)}
                  style={{
                    background: "#10B981",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  ⬇️ Download PDF
                </button>
                <button
                  onClick={() => setShowDetailedReport(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#6B7280",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Side-by-Side X-ray and Heatmap Display */}
            <div
              style={{
                display: "flex",
                gap: "2rem",
                justifyContent: "center",
                flexWrap: "nowrap",
                marginBottom: "1.5rem",
                alignItems: "center",
              }}
            >
              {/* Original X-ray */}
              <div style={{ width: "300px", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Original X-ray
                </div>
                <div
                  style={{
                    width: "300px",
                    minHeight: "200px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={apiEndpoints.uploads.image(selectedReport.imageUrl)}
                    alt="Original X-Ray"
                    onLoad={(e) =>
                      setImageAspectRatio(
                        e.target.naturalWidth / e.target.naturalHeight,
                      )
                    }
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>
              </div>

              {/* AI Heatmap Analysis */}
              {selectedReport.heatmap && (
                <div style={{ width: "300px", textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Heatmap Analysis
                  </div>
                  <div
                    style={{
                      width: "300px",
                      minHeight: "200px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={`data:image/png;base64,${selectedReport.heatmap}`}
                      alt="AI Heatmap"
                      style={{
                        width: "100%",
                        height: "auto",
                        aspectRatio: imageAspectRatio,
                        objectFit: "fill",
                        display: "block",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Heatmap Color Legend */}
            {selectedReport.heatmap && (
              <div
                style={{
                  background: "white",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  maxWidth: "450px",
                  margin: "0 auto 1.5rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "0.5rem",
                    textAlign: "center",
                  }}
                >
                  Heatmap Color Index
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                    Low
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "16px",
                      borderRadius: "8px",
                      background:
                        "linear-gradient(90deg, #0000FF 0%, #00FFFF 20%, #00FF00 40%, #FFFF00 60%, #FFA500 80%, #FF0000 100%)",
                    }}
                  ></div>
                  <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                    High
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    fontSize: "0.7rem",
                  }}
                >
                  <span style={{ color: "#3B82F6" }}>● Low Model Attention</span>
                  <span style={{ color: "#EF4444" }}>
                    ● High Model Attention
                  </span>
                </div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              {/* Scan Details */}
              <div
                style={{
                  padding: "1rem",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#374151" }}>
                  Scan Details
                </h4>
                <p
                  style={{
                    margin: "0.25rem 0",
                    fontSize: "0.9rem",
                    color: "#6B7280",
                  }}
                >
                  <strong>Date:</strong>{" "}
                  {new Date(selectedReport.createdAt).toLocaleDateString()}
                </p>
                <p
                  style={{
                    margin: "0.25rem 0",
                    fontSize: "0.9rem",
                    color: "#6B7280",
                  }}
                >
                  <strong>Time:</strong>{" "}
                  {new Date(selectedReport.createdAt).toLocaleTimeString()}
                </p>
                <p
                  style={{
                    margin: "0.25rem 0",
                    fontSize: "0.9rem",
                    color: "#6B7280",
                  }}
                >
                  <strong>ID:</strong> {selectedReport._id.slice(-8)}
                </p>
              </div>

              {/* AI Analysis Result */}
              <div
                style={{
                  background:
                    selectedReport.prediction === "Pneumonia"
                      ? "#FEE2E2"
                      : "#DBEAFE",
                  border: `1px solid ${selectedReport.prediction === "Pneumonia" ? "#FCA5A5" : "#BFDBFE"}`,
                  padding: "1rem",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 0.5rem 0",
                    color:
                      selectedReport.prediction === "Pneumonia"
                        ? "#991B1B"
                        : "#1E40AF",
                    fontSize: "1.5rem",
                  }}
                >
                  {selectedReport.prediction.toUpperCase()}
                </h3>
                <div
                  style={{
                    fontSize: "1.1rem",
                    color:
                      selectedReport.prediction === "Pneumonia"
                        ? "#B91C1C"
                        : "#1D4ED8",
                    fontWeight: "500",
                  }}
                >
                  Confidence: {(selectedReport.confidence * 100).toFixed(1)}%
                </div>
              </div>

              {selectedReport.prediction === "Invalid Image" && (
                <div
                  style={{
                    padding: "1rem",
                    background: "#FEF3C7",
                    border: "1px solid #FCD34D",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                    color: "#92400E",
                  }}
                >
                  ⚠️ <strong>Invalid Image Detected:</strong> The uploaded image
                  does not appear to be a chest X-ray. The model is designed
                  specifically for chest X-ray analysis. Please verify the image
                  source.
                </div>
              )}

              {selectedReport.confidence < 0.75 &&
                selectedReport.prediction !== "Invalid Image" && (
                  <div
                    style={{
                      padding: "1rem",
                      background: "#FEF3C7",
                      border: "1px solid #FCD34D",
                      borderRadius: "8px",
                      marginBottom: "1.5rem",
                      color: "#92400E",
                    }}
                  >
                    ⚠️ <strong>Low Confidence:</strong> The AI model's
                    confidence is below 75%. We strongly recommend a manual
                    review by a specialist to confirm this diagnosis.
                  </div>
                )}

              <div>
                <h4 style={{ color: "#374151", marginBottom: "0.5rem" }}>
                  Clinical Notes
                </h4>
                <textarea
                  value={editableNotes}
                  onChange={(e) => setEditableNotes(e.target.value)}
                  placeholder="Add clinical notes for this report..."
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    fontSize: "0.95rem",
                    resize: "vertical",
                    marginBottom: "1rem",
                  }}
                />
                <button
                  onClick={async () => {
                    if (!editableNotes.trim()) return;
                    try {
                      const response = await fetch(
                        apiEndpoints.reports.update(selectedReport._id),
                        {
                          method: "PUT",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ notes: editableNotes }),
                        },
                      );
                      if (response.ok) {
                        alert("Notes saved successfully!");
                        // Update local state
                        setSelectedReport({
                          ...selectedReport,
                          notes: editableNotes,
                        });
                        setPatientReports((prevReports) =>
                          prevReports.map((r) =>
                            r._id === selectedReport._id
                              ? { ...r, notes: editableNotes }
                              : r,
                          ),
                        );
                        fetchPatients();
                      } else {
                        alert("Error saving notes");
                      }
                    } catch (error) {
                      console.error("Error:", error);
                      alert("Error saving notes");
                    }
                  }}
                  disabled={!editableNotes.trim()}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: editableNotes.trim() ? "#10B981" : "#D1D5DB",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: editableNotes.trim() ? "pointer" : "not-allowed",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                  }}
                >
                  Save Clinical Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;