const User = require('../models/User');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    // 1) Filter out unwanted fields that are not allowed to be updated
    const filteredBody = { ...req.body };
    delete filteredBody.password;
    delete filteredBody.email;
    delete filteredBody.role;

    // 2) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
