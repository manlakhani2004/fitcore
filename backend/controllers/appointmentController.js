const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const CoachAvailability = require('../models/CoachAvailability');

// @desc    Get available slots for a coach on a date
// @route   GET /api/appointments/available-slots/:coachId/:date
// @access  Private
exports.getAvailableSlots = async (req, res) => {
    try {
        const { coachId, date } = req.params;
        if (!mongoose.Types.ObjectId.isValid(coachId)) {
            return res.status(200).json({ success: true, data: [] });
        }
        
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getUTCDay();

        const availability = await CoachAvailability.findOne({ coachId, dayOfWeek });
        if (!availability) {
            return res.status(200).json({ success: true, data: [] });
        }

        const bookedAppointments = await Appointment.find({
            coachId,
            date,
            status: 'confirmed'
        });

        const availableSlots = availability.slots.map(slot => {
            const isBooked = bookedAppointments.some(appt => appt.startTime === slot.startTime);
            return {
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBooked
            };
        });

        res.status(200).json({ success: true, data: availableSlots });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Book an appointment
// @route   POST /api/appointments/book
// @access  Private
exports.bookAppointment = async (req, res) => {
    try {
        const { coachId, date, type, notes } = req.body;
        const startTime = req.body.startTime || req.body.time;

        if (!startTime) {
            return res.status(400).json({ success: false, message: 'Start time is required' });
        }

        let endTime = req.body.endTime;
        if (!endTime && startTime.includes(':')) {
            const [startH, startM] = startTime.split(':').map(Number);
            endTime = `${String(startH + 1).padStart(2, '0')}:${String(startM || 0).padStart(2, '0')}`;
        }

        const existingAppt = await Appointment.findOne({ coachId, date, startTime, status: 'confirmed' });
        if (existingAppt) {
            return res.status(400).json({ success: false, message: 'Slot already booked' });
        }

        const meetingLink = type === 'online' 
            ? `https://meet.google.com/mock-id-${Math.floor(Math.random() * 10000)}` 
            : undefined;

        const appointment = await Appointment.create({
            memberId: req.user.id,
            coachId,
            date,
            startTime,
            endTime: endTime || startTime,
            type: type || 'online',
            notes,
            status: 'confirmed',
            meetingLink
        });

        res.status(201).json({ success: true, data: appointment });
    } catch (err) {
        console.error('bookAppointment error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get logged in user's appointments
// @route   GET /api/appointments/my-appointments
// @access  Private
exports.getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ memberId: req.user.id })
            .populate('coachId', 'name avatar')
            .sort({ date: 1 });

        res.status(200).json({ success: true, data: appointments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get coach's schedule
// @route   GET /api/appointments/coach-schedule
// @access  Private (Coach)
exports.getCoachSchedule = async (req, res) => {
    try {
        if (req.user.role !== 'coach') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const appointments = await Appointment.find({ coachId: req.user.id })
            .populate('memberId', 'name avatar')
            .sort({ date: 1 });

        res.status(200).json({ success: true, data: appointments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
exports.cancelAppointment = async (req, res) => {
    try {
        const { cancelReason } = req.body;
        
        let appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Verify ownership (either the member who booked it or the coach)
        if (appointment.memberId.toString() !== req.user.id && appointment.coachId.toString() !== req.user.id) {
             return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
        }

        appointment.status = 'cancelled';
        appointment.cancelReason = cancelReason;
        await appointment.save();

        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Confirm an appointment
// @route   PUT /api/appointments/:id/confirm
// @access  Private (Coach)
exports.confirmAppointment = async (req, res) => {
    try {
        if (req.user.role !== 'coach') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        let appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointment.coachId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to confirm this appointment' });
        }

        appointment.status = 'confirmed';
        await appointment.save();

        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
