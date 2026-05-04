const CollaborativeProject = require('../models/CollaborativeProject.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.createProject = asyncHandler(async (req, res, next) => {
  const project = await CollaborativeProject.create({
    ...req.body,
    createdBy: req.user._id,
    teamMembers: [{
      userId: req.user._id,
      role: 'leader'
    }]
  });

  await project.populate('teamMembers.userId', 'name email');

  res.status(201).json({
    success: true,
    data: project
  });
});

exports.getProjects = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  const projects = await CollaborativeProject.find({ courseId })
    .populate('createdBy', 'name email')
    .populate('teamMembers.userId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects
  });
});

exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await CollaborativeProject.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('teamMembers.userId', 'name email profilePicture')
    .populate('tasks.assignedTo', 'name email');

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

exports.addTeamMember = asyncHandler(async (req, res, next) => {
  const project = await CollaborativeProject.findById(req.params.id);

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  const { userId } = req.body;

  const exists = project.teamMembers.some(m => m.userId.toString() === userId);
  if (exists) {
    return next(new AppError('User already in team', 400));
  }

  project.teamMembers.push({
    userId,
    role: 'member'
  });

  await project.save();
  await project.populate('teamMembers.userId', 'name email');

  res.status(200).json({
    success: true,
    data: project
  });
});

exports.addTask = asyncHandler(async (req, res, next) => {
  const project = await CollaborativeProject.findById(req.params.id);

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  project.tasks.push(req.body);
  await project.save();

  res.status(200).json({
    success: true,
    data: project
  });
});

exports.updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { id, taskId } = req.params;
  const { status } = req.body;

  const project = await CollaborativeProject.findById(id);

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  const task = project.tasks.id(taskId);
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  task.status = status;
  await project.save();

  res.status(200).json({
    success: true,
    data: project
  });
});

exports.gradeProject = asyncHandler(async (req, res, next) => {
  const { grade, feedback } = req.body;

  const project = await CollaborativeProject.findByIdAndUpdate(
    req.params.id,
    { grade, feedback, status: 'completed' },
    { new: true }
  );

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  res.status(200).json({
    success: true,
    data: project
  });
});
