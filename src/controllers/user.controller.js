// Example controllers
export const getUsers = async (req, res) => {
  // Simulate fetching users
  const users = [{ id: 1, name: 'John Doe' }];
  res.status(200).json({ success: true, data: users });
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    const error = new Error('Invalid user ID');
    error.statusCode = 400;
    throw error; // Will be caught by asyncHandler and global errorHandler
  }

  // Simulate fetching one user
  const user = { id, name: 'Jane Doe' };
  res.status(200).json({ success: true, data: user });
};
