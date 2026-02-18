import React from 'react';

const stats = [
    { label: "Accuracy", value: "99%" },
    { label: "Precision", value: "95%" },
    { label: "Recall", value: "99%" },
    { label: "Specificity", value: "99%" },
    { label: "F1 Score", value: "97%" },
    { label: "F2 Score", value: "98%" },
    { label: "G-Mean", value: "99%" },
];

// Duplicate stats to ensure smooth infinite scrolling
const duplicatedStats = [...stats, ...stats, ...stats];

const StatsTicker = () => {
    return (
        <section className="stats-ticker-section">
            <div className="ticker-wrap">
                <div className="ticker-move">
                    {duplicatedStats.map((stat, index) => (
                        <div className="ticker-item" key={index}>
                            <div className="stat-card">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsTicker;
