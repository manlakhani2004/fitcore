const User = require('../models/User');
const Payment = require('../models/Payment');
const UserMembership = require('../models/UserMembership');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const UserGamification = require('../models/UserGamification');
const Appointment = require('../models/Appointment');
const DailyTask = require('../models/DailyTask');

// @desc    Export User Data to CSV format
// @route   GET /api/reports/export/users
// @access  Private (Admin)
exports.exportUsersCSV = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const users = await User.find().select('name email role createdAt');

        let csv = 'User ID,Name,Email,Role,Joined Date\n';
        users.forEach(u => {
            csv += `"${u._id}","${u.name}","${u.email}","${u.role}","${u.createdAt ? u.createdAt.toISOString() : ''}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('fitcore_users.csv');
        res.status(200).send(csv);
    } catch (err) {
        console.error('exportUsersCSV error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Export Revenue & Transactions to CSV
// @route   GET /api/reports/export/revenue
// @access  Private (Admin)
exports.exportRevenueCSV = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const payments = await Payment.find().populate('userId', 'name email').sort({ createdAt: -1 });

        let csv = 'Transaction ID,User Name,User Email,Type,Amount (USD),Status,Refund Status,Date\n';
        payments.forEach(p => {
            const userName = p.userId?.name || 'Unknown';
            const userEmail = p.userId?.email || 'N/A';
            csv += `"${p._id}","${userName}","${userEmail}","${p.type}","${p.amount}","${p.status}","${p.refundStatus || 'none'}","${p.createdAt ? p.createdAt.toISOString() : ''}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('fitcore_revenue_report.csv');
        res.status(200).send(csv);
    } catch (err) {
        console.error('exportRevenueCSV error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Export Workout & Nutrition Analytics to CSV
// @route   GET /api/reports/export/analytics
// @access  Private (Admin)
exports.exportAnalyticsCSV = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const workouts = await WorkoutLog.find().populate('memberId', 'name email').sort({ date: -1 });

        let csv = 'Log ID,Member Name,Member Email,Date,Exercises Count,Total Volume (kg),Calories Burned,Duration (mins)\n';
        workouts.forEach(w => {
            const memberName = w.memberId?.name || 'Athlete';
            const memberEmail = w.memberId?.email || 'N/A';
            const exCount = w.exercisesCompleted?.length || 0;
            csv += `"${w._id}","${memberName}","${memberEmail}","${w.date ? new Date(w.date).toISOString() : ''}","${exCount}","${w.totalVolume || 0}","${w.caloriesBurned || 0}","${w.totalDuration || 0}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('fitcore_analytics_report.csv');
        res.status(200).send(csv);
    } catch (err) {
        console.error('exportAnalyticsCSV error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Export Platform Activity & Appointments to CSV
// @route   GET /api/reports/export/activity
// @access  Private (Admin)
exports.exportActivityCSV = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const appointments = await Appointment.find()
            .populate('memberId', 'name email')
            .populate('coachId', 'name email')
            .sort({ date: -1 });

        let csv = 'Appointment ID,Member Name,Coach Name,Date,Start Time,End Time,Type,Status\n';
        appointments.forEach(a => {
            const memberName = a.memberId?.name || 'Member';
            const coachName = a.coachId?.name || 'Coach';
            csv += `"${a._id}","${memberName}","${coachName}","${a.date ? new Date(a.date).toISOString().split('T')[0] : ''}","${a.startTime || ''}","${a.endTime || ''}","${a.type || 'online'}","${a.status}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('fitcore_activity_audit.csv');
        res.status(200).send(csv);
    } catch (err) {
        console.error('exportActivityCSV error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
