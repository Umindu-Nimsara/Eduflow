const StudyGroup = require('../models/StudyGroup.model');
const Course = require('../models/Course.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.createStudyGroup = asyncHandler(async (req, res, next) => {
  const { courseId, name, description, maxMembers, isPrivate } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  const studyGroup = await StudyGroup.create({
    name,
    description,
    courseId,
    createdBy: req.user._id,
    maxMembers: maxMembers || 10,
    isPrivate: isPrivate || false,
    members: [{
      userId: req.user._id,
      role: 'leader',
      joinedAt: new Date()
    }]
  });

  await studyGroup.populate('members.userId', 'name email');

  res.status(201).json({
    success: true,
    data: studyGroup
  });
});

exports.getStudyGroupsByCourse = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  const query = { courseId, status: 'active' };
  
  if (req.user.role === 'student') {
    query.$or = [
      { isPrivate: false },
      { 'members.userId': req.user._id }
    ];
  }

  const studyGroups = await StudyGroup.find(query)
    .populate('createdBy', 'name email')
    .populate('members.userId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: studyGroups.length,
    data: studyGroups
  });
});

exports.getStudyGroup = asyncHandler(async (req, res, next) => {
  const studyGroup = await StudyGroup.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('members.userId', 'name email profilePicture');

  if (!studyGroup) {
    return next(new AppError('Study group not found', 404));
  }

  res.status(200).json({
    success: true,
    data: studyGroup
  });
});

exports.joinStudyGroup = asyncHandler(async (req, res, next) => {
  const studyGroup = await StudyGroup.findById(req.params.id);

  if (!studyGroup) {
    return next(new AppError('Study group not found', 404));
  }

  const isMember = studyGroup.members.some(
    m => m.userId.toString() === req.user._id.toString()
  );

  if (isMember) {
    return next(new AppError('Already a member of this group', 400));
  }

  if (studyGroup.members.length >= studyGroup.maxMembers) {
    return next(new AppError('Group is full', 400));
  }

  studyGroup.members.push({
    userId: req.user._id,
    role: 'member',
    joinedAt: new Date()
  });

  await studyGroup.save();
  await studyGroup.populate('members.userId', 'name email');

  res.status(200).json({
    success: true,
    data: studyGroup
  });
});

exports.leaveStudyGroup = asyncHandler(async (req, res, next) => {
  const studyGroup = await StudyGroup.findById(req.params.id);

  if (!studyGroup) {
    return next(new AppError('Study group not found', 404));
  }

  const memberIndex = studyGroup.members.findIndex(
    m => m.userId.toString() === req.user._id.toString()
  );

  if (memberIndex === -1) {
    return next(new AppError('Not a member of this group', 400));
  }

  const member = studyGroup.members[memberIndex];
  if (member.role === 'leader' && studyGroup.members.length > 1) {
    return next(new AppError('Leader must transfer leadership before leaving', 400));
  }

  studyGroup.members.splice(memberIndex, 1);
  await studyGroup.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.updateStudyGroup = asyncHandler(async (req, res, next) => {
  let studyGroup = await StudyGroup.findById(req.params.id);

  if (!studyGroup) {
    return next(new AppError('Study group not found', 404));
  }

  const isLeader = studyGroup.members.some(
    m => m.userId.toString() === req.user._id.toString() && m.role === 'leader'
  );

  if (!isLeader && req.user.role !== 'admin') {
    return next(new AppError('Only group leader can update', 403));
  }

  studyGroup = await StudyGroup.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('members.userId', 'name email');

  res.status(200).json({
    success: true,
    data: studyGroup
  });
});

exports.deleteStudyGroup = asyncHandler(async (req, res, next) => {
  const studyGroup = await StudyGroup.findById(req.params.id);

  if (!studyGroup) {
    return next(new AppError('Study group not found', 404));
  }

  const isLeader = studyGroup.members.some(
    m => m.userId.toString() === req.user._id.toString() && m.role === 'leader'
  );

  if (!isLeader && req.user.role !== 'admin') {
    return next(new AppError('Only group leader can delete', 403));
  }

  await studyGroup.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.getMyStudyGroups = asyncHandler(async (req, res, next) => {
  const studyGroups = await StudyGroup.find({
    'members.userId': req.user._id,
    status: 'active'
  })
    .populate('createdBy', 'name email')
    .populate('members.userId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: studyGroups.length,
    data: studyGroups
  });
});
