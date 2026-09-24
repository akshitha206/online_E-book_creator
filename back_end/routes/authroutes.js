const express = require("express");

const {
    registerUser,
    loginUser,
    updateProfile,
    getUsers
} = require("../controllers/authcontroller");

const protect = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/profile", protect, updateProfile);
router.get("/users", protect, getUsers);

module.exports = router;