import React from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = [
    '9:00', '9:50', '10:40', '11:30', '12:20',
    '1:10', '2:00', '2:50', '3:40', '4:30', '5:20'
];

export default function Timetable({ timetable, onUpdate, onClose }) {

    const handleCellChange = (day, time, value) => {
        // We store the grid as an object with keys like "Monday-9:00"
        const key = `${day}-${time}`;
        onUpdate('timetable_grid', { ...timetable?.timetable_grid, [key]: value });
    };

    return (
        <div className="timetable-overlay">
            <div className="timetable-modal timetable-modal--large">
                <div className="timetable-header">
                    <div className="header-info">
                        <h2 className="header-title">📅 Academic Schedule</h2>
                        <p className="header-hint">Enter your class names in the corresponding time slots</p>
                    </div>
                    <button onClick={onClose} className="close-x-btn">✕</button>
                </div>

                <div className="timetable-scroll-container">
                    <div className="timetable-grid-wrapper">
                        {/* Table Header: Time Slots */}
                        <div className="grid-header-row">
                            <div className="grid-cell grid-cell--label">Day</div>
                            {TIMES.map(time => (
                                <div key={time} className="grid-cell grid-cell--time">{time}</div>
                            ))}
                        </div>

                        {/* Table Rows: Days */}
                        {DAYS.map(day => (
                            <div key={day} className="grid-day-row">
                                <div className="grid-cell grid-cell--day-label">{day}</div>
                                {TIMES.map(time => (
                                    <div key={time} className="grid-cell">
                                        <input
                                            type="text"
                                            className="grid-input"
                                            placeholder="..."
                                            value={timetable?.timetable_grid?.[`${day}-${time}`] || ''}
                                            onChange={(e) => handleCellChange(day, time, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="timetable-footer">
                    <button onClick={onClose} className="save-return-btn">Close & Save Schedule</button>
                </div>
            </div>
        </div>
    );
}