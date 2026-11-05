
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Return safe user details
const userDetails = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  profilePhoto: user.profilePhoto || "",
  createdAt: user.createdAt
});

const getGitHubCallbackUrl = () =>
  process.env.GITHUB_CALLBACK_URL ||
  "http://localhost:5000/api/auth/github/callback";

// Start GitHub OAuth
router.get("/github", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return res.status(503).json({
      message: "GitHub login is not configured on the server."
    });
  }

  const state = jwt.sign(
    { purpose: "github-oauth" },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGitHubCallbackUrl(),
    scope: "read:user user:email",
    state
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// Complete GitHub OAuth
router.get("/github/callback", async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const failRedirect = (message) => {
    const params = new URLSearchParams({ error: message });
    res.redirect(`${frontendUrl}/login?${params.toString()}`);
  };

  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return failRedirect("GitHub authorization was cancelled or incomplete.");
    }

    const stateData = jwt.verify(state, process.env.JWT_SECRET);
    if (stateData.purpose !== "github-oauth") {
      return failRedirect("Invalid GitHub login state.");
    }

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: getGitHubCallbackUrl()
        })
      }
    );
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return failRedirect("GitHub authorization failed.");
    }

    const githubHeaders = {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "BookCraft"
    };
    const [profileResponse, emailsResponse] = await Promise.all([
      fetch("https://api.github.com/user", { headers: githubHeaders }),
      fetch("https://api.github.com/user/emails", { headers: githubHeaders })
    ]);

    if (!profileResponse.ok) {
      return failRedirect("Unable to load your GitHub profile.");
    }

    const profile = await profileResponse.json();
    let email = profile.email;

    if (!email && emailsResponse.ok) {
      const emails = await emailsResponse.json();
      email =
        emails.find((item) => item.primary && item.verified)?.email ||
        emails.find((item) => item.verified)?.email ||
        null;
    }

    if (!email) {
      return failRedirect("GitHub did not provide a verified email address.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({
      $or: [
        { githubId: String(profile.id) },
        { email: normalizedEmail }
      ]
    });

    if (user) {
      user.githubId = String(profile.id);
      if (!user.profilePhoto && profile.avatar_url) {
        user.profilePhoto = profile.avatar_url;
      }
      await user.save();
    } else {
      user = await User.create({
        name: profile.name?.trim() || profile.login,
        email: normalizedEmail,
        githubId: String(profile.id),
        profilePhoto: profile.avatar_url || ""
      });
    }

    const params = new URLSearchParams({
      token: generateToken(user._id),
      user: JSON.stringify(userDetails(user))
    });
    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return failRedirect("Unable to complete GitHub login.");
  }
});

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide name, email and password."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    return res.status(201).json({
      message: "Registration successful.",
      token: generateToken(user._id),
      user: userDetails(user)
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Unable to register user."
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    return res.json({
      message: "Login successful.",
      token: generateToken(user._id),
      user: userDetails(user)
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to login."
    });
  }
});

// GET LOGGED-IN USER PROFILE
router.get("/me", (req, res, next) => {
  console.log("BookCraft /api/auth/me route reached");
  next();
}, authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found in database."
      });
    }

    return res.status(200).json({
      user: userDetails(user)
    });

  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Unable to load profile."
    });
  }
});

// UPDATE PROFILE NAME
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name cannot be empty."
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    return res.json({
      message: "Profile updated successfully.",
      user: userDetails(user)
    });

  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      message: "Unable to update profile."
    });
  }
});

// UPLOAD OR REMOVE PROFILE PHOTO
router.put("/profile/photo", authMiddleware, async (req, res) => {
  try {
    const { profilePhoto } = req.body;

    if (typeof profilePhoto !== "string") {
      return res.status(400).json({
        message: "Invalid profile photo."
      });
    }

    if (profilePhoto === "") {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePhoto: "" },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found."
        });
      }

      return res.json({
        message: "Profile photo removed successfully.",
        user: userDetails(user)
      });
    }

    const match = profilePhoto.match(
      /^data:image\/(jpeg|png|webp);base64,/
    );

    if (!match) {
      return res.status(400).json({
        message: "Only JPG, PNG and WebP images are allowed."
      });
    }

    const base64Data = profilePhoto.split(",")[1];

    if (!base64Data) {
      return res.status(400).json({
        message: "Invalid image data."
      });
    }

    const imageBuffer = Buffer.from(base64Data, "base64");

    if (imageBuffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({
        message: "Image size must be less than 2 MB."
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    return res.json({
      message: "Profile photo updated successfully.",
      user: userDetails(user)
    });

  } catch (error) {
    console.error("Profile photo error:", error);

    return res.status(500).json({
      message: "Unable to update profile photo."
    });
  }
});

// CHANGE PASSWORD
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Please provide both passwords."
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must contain at least 6 characters."
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Current password is incorrect."
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from current password."
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      message: "Password changed successfully. Please login again."
    });

  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Unable to change password."
    });
  }
});

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({
    message: "BookCraft authentication routes are working!"
  });
});

module.exports = router;
