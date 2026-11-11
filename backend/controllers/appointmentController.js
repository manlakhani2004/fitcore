const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const CoachAvailability = require('../models/CoachAvailability');
const CoachProfile = require('../models/CoachProfile');
const Payment = require('../models/Payment');

// Helper to resolve coach User ID from either CoachProfile ID or User ID
async function resolveCoachUserId(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
    const profile = await CoachProfile.findById(id);
    if (profile && profile.userId) {
        return profile.userId.toString();
    }
    return id.toString();
}

// @desc    Get available slots for a coach on a date
// @route   GET /api/appointments/available-slots/:coachId/:date
// @access  Private
exports.getAvailableSlots = async (req, res) => {
    try {
        const { coachId, date } = req.params;
        if (!mongoose.Types.ObjectId.isValid(coachId)) {
            return res.status(200).json({ success: true, data: [] });
        }

        const resolvedCoachId = await resolveCoachUserId(coachId);
        const [y, m, d] = String(date).split('-').map(Number);
        const dayOfWeek = (y && m && d) ? new Date(y, m - 1, d).getDay() : new Date(date).getDay();

        let availability = await CoachAvailability.findOne({ 
            $or: [{ coachId: resolvedCoachId }, { coachId }],
            dayOfWeek
        });
        
        let slots;
        if (availability) {
            slots = availability.slots || [];
        } else {
            // Default general slots (Mon-Fri 9am - 5pm, weekends off)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                slots = [];
            } else {
                slots = [
                    { startTime: '09:00', endTime: '10:00' },
                    { startTime: '10:00', endTime: '11:00' },
                    { startTime: '11:00', endTime: '12:00' },
                    { startTime: '14:00', endTime: '15:00' },
                    { startTime: '15:00', endTime: '16:00' },
                    { startTime: '16:00', endTime: '17:00' }
                ];
            }
        }

        const bookedAppointments = await Appointment.find({
            coachId: { $in: [resolvedCoachId, coachId] },
            date: new Date(date),
            status: 'confirmed'
        });

        const availableSlots = slots.map(slot => {
            const isBooked = bookedAppointments.some(appt => appt.startTime === slot.startTime);
            return {
                startTime: slot.startTime,
                endTime: slot.endTime,
                time: slot.startTime,
                isBooked,
                available: !isBooked
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
        const resolvedCoachId = await resolveCoachUserId(coachId) || coachId;
        const startTime = req.body.startTime || req.body.time;

        if (!startTime) {
            return res.status(400).json({ success: false, message: 'Start time is required' });
        }

        let endTime = req.body.endTime;
        if (!endTime && startTime.includes(':')) {
            const [startH, startM] = startTime.split(':').map(Number);
            endTime = `${String((startH + 1) % 24).padStart(2, '0')}:${String(startM || 0).padStart(2, '0')}`;
        }

        const existingAppt = await Appointment.findOne({ 
            coachId: { $in: [resolvedCoachId, coachId] }, 
            date: new Date(date), 
            startTime, 
            status: 'confirmed' 
        });
        if (existingAppt) {
            return res.status(400).json({ success: false, message: 'Slot already booked' });
        }

        const appointmentId = new mongoose.Types.ObjectId();

        // Fetch coach profile to get rate and custom Google Meet link if set
        const profile = await CoachProfile.findOne({ $or: [{ userId: resolvedCoachId }, { _id: coachId }] });
        const rate = profile?.hourlyRate || 50;

        const meetingLink = type === 'online' 
            ? (profile?.googleMeetLink || '')
            : undefined;

        const appointment = await Appointment.create({
            _id: appointmentId,
            memberId: req.user.id,
            coachId: resolvedCoachId,
            date: new Date(date),
            startTime,
            endTime: endTime || startTime,
            type: type || 'online',
            notes,
            status: 'confirmed',
            meetingLink,
            paymentStatus: 'paid'
        });

        // Record completed appointment payment
        await Payment.create({
            userId: req.user.id,
            type: 'appointment',
            amount: rate,
            currency: 'inr',
            status: 'completed',
            stripePaymentId: `mock_appt_${appointment._id}`
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

        if (req.body.meetingLink) {
            appointment.meetingLink = req.body.meetingLink;
        }

        appointment.status = 'confirmed';
        await appointment.save();

        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Mark appointment as completed
// @route   PUT /api/appointments/:id/complete
// @access  Private (Coach)
exports.completeAppointment = async (req, res) => {
    try {
        if (req.user.role !== 'coach') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        let appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointment.coachId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to complete this appointment' });
        }

        appointment.status = 'completed';
        await appointment.save();

        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update appointment meeting link
// @route   PUT /api/appointments/:id/meeting-link
// @access  Private
exports.updateMeetingLink = async (req, res) => {
    try {
        let { meetingLink, saveAsDefault } = req.body;
        let appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Verify coach or member
        if (appointment.coachId.toString() !== req.user.id && appointment.memberId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this appointment' });
        }

        if (meetingLink) {
            meetingLink = String(meetingLink).trim();
            // If coach entered just a meet code e.g. "abc-defg-hij"
            if (/^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/i.test(meetingLink)) {
                meetingLink = `https://meet.google.com/${meetingLink.toLowerCase()}`;
            } else if (!meetingLink.startsWith('http://') && !meetingLink.startsWith('https://')) {
                meetingLink = `https://${meetingLink}`;
            }
        }

        appointment.meetingLink = meetingLink;
        await appointment.save();

        // Optionally persist as coach's default room for future sessions
        if (saveAsDefault && req.user.role === 'coach') {
            await CoachProfile.findOneAndUpdate(
                { userId: req.user.id },
                { googleMeetLink: meetingLink }
            );
        }

        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
