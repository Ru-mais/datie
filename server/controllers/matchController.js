const User = require('../models/User');

exports.getDiscoveryProfiles = async (req, res) => {
  try {
    const { district, minAge, maxAge, gender } = req.query;
    
    // Build query
    const query = {
      _id: { $ne: req.user.id }, // Exclude current user
      _id: { $nin: [...req.user.swipedRight, ...req.user.swipedLeft] } // Exclude already swiped
    };

    if (district) query.district = district;
    if (gender) query.gender = gender;
    
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }

    // Sort by premium users first, then randomly
    const profiles = await User.find(query)
      .sort({ isPremium: -1 })
      .limit(20);

    res.status(200).json({
      status: 'success',
      results: profiles.length,
      data: {
        profiles,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.handleSwipe = async (req, res) => {
  try {
    const { targetUserId, direction } = req.body;
    const currentUser = await User.findById(req.user.id);

    if (direction === 'right') {
      // 1) Add to swipedRight
      if (!currentUser.swipedRight.includes(targetUserId)) {
        currentUser.swipedRight.push(targetUserId);
        
        // 2) Check for mutual match
        const targetUser = await User.findById(targetUserId);
        if (targetUser.swipedRight.includes(currentUser._id)) {
          // IT'S A MATCH!
          currentUser.matches.push(targetUserId);
          targetUser.matches.push(currentUser._id);
          await targetUser.save();
          
          await currentUser.save();
          return res.status(200).json({
            status: 'success',
            match: true,
            data: { user: targetUser }
          });
        }
      }
    } else {
      // Swipe left
      if (!currentUser.swipedLeft.includes(targetUserId)) {
        currentUser.swipedLeft.push(targetUserId);
      }
    }

    await currentUser.save();
    res.status(200).json({
      status: 'success',
      match: false
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getMatches = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'matches',
      select: 'name age district profession images bio'
    });

    res.status(200).json({
      status: 'success',
      data: {
        matches: user.matches,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
