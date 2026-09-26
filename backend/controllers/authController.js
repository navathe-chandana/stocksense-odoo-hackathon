const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, role, created_at
      `,
      [name, email, passwordHash]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed"
    });
  }
};


// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed"
    });
  }
};

// Forgot Password - Generate OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `
      UPDATE users
      SET otp_code = $1,
          otp_expires_at = $2
      WHERE email = $3
      `,
      [otp, expiresAt, email]
    );

    // Hackathon/demo implementation:
    // Return OTP in response instead of sending email.
    res.json({
      message: "OTP generated successfully",
      otp,
      expires_in: "10 minutes"
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      message: "Failed to generate OTP"
    });
  }
};
// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required"
      });
    }

    const result = await pool.query(
      `
      SELECT id, otp_code, otp_expires_at
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = result.rows[0];

    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({
        message: "OTP has expired"
      });
    }

    res.json({
      message: "OTP verified successfully"
    });

  } catch (error) {
    console.error("OTP verification error:", error);

    res.status(500).json({
      message: "Failed to verify OTP"
    });
  }
};


// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and new password are required"
      });
    }

    const result = await pool.query(
      `
      SELECT id, otp_code, otp_expires_at
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = result.rows[0];

    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({
        message: "OTP has expired"
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `
      UPDATE users
      SET password_hash = $1,
          otp_code = NULL,
          otp_expires_at = NULL
      WHERE email = $2
      `,
      [passwordHash, email]
    );

    res.json({
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Password reset error:", error);

    res.status(500).json({
      message: "Failed to reset password"
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword
};