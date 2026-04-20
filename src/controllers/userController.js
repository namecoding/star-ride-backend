export const getMe = async (req, res) => {
    res.json({
      user: req.user,
    });
  };