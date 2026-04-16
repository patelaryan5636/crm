const validateRegisterInput = (payload) => {
  const { name, email, password } = payload;

  if (!name || !email || !password) {
    return 'name, email, and password are required';
  }

  if (typeof password !== 'string' || password.length < 8) {
    return 'password must be at least 8 characters long';
  }

  return null;
};

const validateLoginInput = (payload) => {
  const { email, password } = payload;

  if (!email || !password) {
    return 'email and password are required';
  }

  return null;
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
};
