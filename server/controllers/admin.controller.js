import User from "../models/user.model.js";

// GET /admin/stats/users
// Returns total users and subscribed users (subscription.status === 'active')
export const getUserStats = async (req, res, next) => {
  try {
    const allUsersCount = await User.countDocuments();
    const subscribedUsersCount = await User.countDocuments({
      "subscription.status": "active",
    });

    return res.status(200).json({
      success: true,
      allUsersCount,
      subscribedUsersCount,
    });
  } catch (error) {
    next(error);
  }
};
