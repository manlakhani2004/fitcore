const DailyTask = require('../models/DailyTask');
const ClientAssignment = require('../models/ClientAssignment');

// @desc    Get tasks for coach's client (or all clients' tasks)
// @route   GET /api/tasks/coach?clientId=&date=
// @access  Private (Coach)
exports.getCoachTasks = async (req, res) => {
    try {
        const filter = { coachId: req.user.id };
        if (req.query.clientId) filter.clientId = req.query.clientId;
        if (req.query.date) {
            const d = new Date(req.query.date);
            const start = new Date(d.setHours(0,0,0,0));
            const end = new Date(d.setHours(23,59,59,999));
            filter.date = { $gte: start, $lte: end };
        }
        const tasks = await DailyTask.find(filter)
            .populate('clientId', 'name avatar')
            .sort({ date: -1, createdAt: -1 });
        res.status(200).json({ success: true, data: tasks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create a task for a client
// @route   POST /api/tasks/coach
// @access  Private (Coach)
exports.createTask = async (req, res) => {
    try {
        const { clientId, title, description, date, type } = req.body;
        const assignment = await ClientAssignment.findOne({ coachId: req.user.id, clientId });
        if (!assignment) {
            return res.status(403).json({ success: false, message: 'Client not in your roster' });
        }
        const task = await DailyTask.create({
            coachId: req.user.id,
            clientId,
            title,
            description,
            date: new Date(date),
            type: type || 'general'
        });
        res.status(201).json({ success: true, data: task });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update a task (coach)
// @route   PUT /api/tasks/coach/:id
// @access  Private (Coach)
exports.updateTask = async (req, res) => {
    try {
        const task = await DailyTask.findOneAndUpdate(
            { _id: req.params.id, coachId: req.user.id },
            req.body,
            { new: true }
        );
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.status(200).json({ success: true, data: task });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a task (coach)
// @route   DELETE /api/tasks/coach/:id
// @access  Private (Coach)
exports.deleteTask = async (req, res) => {
    try {
        const task = await DailyTask.findOneAndDelete({ _id: req.params.id, coachId: req.user.id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.status(200).json({ success: true, message: 'Task deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get my tasks (member)
// @route   GET /api/tasks/my?date=
// @access  Private (Member)
exports.getMyTasks = async (req, res) => {
    try {
        const filter = { clientId: req.user.id };
        if (req.query.date) {
            const d = new Date(req.query.date);
            const start = new Date(d.setHours(0,0,0,0));
            const end = new Date(d.setHours(23,59,59,999));
            filter.date = { $gte: start, $lte: end };
        }
        const tasks = await DailyTask.find(filter)
            .populate('coachId', 'name avatar')
            .sort({ date: -1, createdAt: -1 });
        res.status(200).json({ success: true, data: tasks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Toggle task completion (member)
// @route   PUT /api/tasks/my/:id
// @access  Private (Member)
exports.toggleTask = async (req, res) => {
    try {
        const task = await DailyTask.findOne({ _id: req.params.id, clientId: req.user.id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : undefined;
        await task.save();
        res.status(200).json({ success: true, data: task });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
