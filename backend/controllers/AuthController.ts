import { JWT_SECRET } from "../config";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { db } from "../db";
import { createNotification } from "./NotificationController";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export const getGoogleAuthUrl = async (req: Request, res: Response) => {
  try {
    let baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    
    // Clean up baseUrl
    baseUrl = baseUrl.trim().replace(/\/$/, "");
    
    // Force HTTPS in production environment if not already
    if (!baseUrl.startsWith('http://localhost') && baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'https://');
    }
    
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    
    console.log("[GoogleAuth] Generating URL. Base:", baseUrl, "Redirect:", redirectUri);
    
    const url = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      redirect_uri: redirectUri,
      prompt: 'consent'
    });
    res.json({ url });
  } catch (error: any) {
    console.error("[GoogleAuth] Error generating URL:", error);
    res.status(500).json({ error: error.message });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  let baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  
  baseUrl = baseUrl.trim().replace(/\/$/, "");
  
  if (!baseUrl.startsWith('http://localhost') && baseUrl.startsWith('http://')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  }
  
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  
  try {
    const { code } = req.query;
    
    if (!code) {
      console.error("[GoogleAuth] Callback hit without code parameter");
      throw new Error("Missing required parameter: code");
    }
    
    console.log("[GoogleAuth] Processing callback with redirectUri:", redirectUri);
    
    const { tokens } = await googleClient.getToken({
      code: code as string,
      redirect_uri: redirectUri,
    });
    
    const googleUserRes = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const googleUser = googleUserRes.data;
    const email = googleUser.email?.toLowerCase().trim();

    // Check if user exists
    let user = await db.findOne("users", { email });

    // Define owner emails that should automatically get admin role
    const ownerEmails = ["dketkhut@gmail.com", "admin@coffee.com"];
    const isOwner = ownerEmails.includes(email);

    if (!user) {
      // Create new user
      user = await db.insert("users", {
        name: googleUser.name,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: isOwner ? "admin" : "customer",
        status: "Active",
        points: 0,
        totalSpent: 0,
        lastVisit: new Date(),
        membershipLevel: "Bronze",
        image: googleUser.picture,
      });
    } else {
      // Update last visit and ensure owner has admin role
      const updateData: any = { lastVisit: new Date() };
      if (isOwner && user.role !== "admin") {
        updateData.role = "admin";
      }
      user = await db.update("users", user.id, updateData);
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    console.log(`[GoogleAuth] Successfully authenticated user: ${email}, Role: ${user.role}, ID: ${user.id}`);

    const userData = {
      user: {
        ...user,
        id: user.id || user._id,
      },
      token,
    };

    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                payload: ${JSON.stringify(userData)} 
              }, '*');
              setTimeout(function() { window.close(); }, 500);
            } else {
              window.location.href = '/';
            }
          </script>
          <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h2>Authentication successful!</h2>
            <p>This window will close automatically.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    const errorMessage = error.response?.data?.error_description || error.message;
    res.status(500).send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_ERROR', 
                error: ${JSON.stringify(errorMessage)} 
              }, '*');
              setTimeout(function() { window.close(); }, 3000);
            }
          </script>
          <div style="font-family: sans-serif; text-align: center; padding-top: 50px; color: #dc2626;">
            <h2>Authentication failed</h2>
            <p>${errorMessage}</p>
            <p>This window will close in 3 seconds.</p>
          </div>
        </body>
      </html>
    `);
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, password, locationId } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.findOne("users", { email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await db.insert("users", {
      name,
      email,
      password: hashedPassword,
      role: "customer",
      status: "Active",
      locationId: locationId || undefined,
      locationIds: locationId ? [locationId] : [],
      points: 0,
      totalSpent: 0,
      lastVisit: new Date(),
      membershipLevel: "Bronze",
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "User created successfully",
      user: {
        ...userWithoutPassword,
        id: user.id || user._id,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const password = req.body.password;
    const email = req.body.email?.toLowerCase().trim();
    
    const user = await db.findOne("users", { email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    if (user.status && user.status.toLowerCase() === "inactive") {
      return res.status(403).json({ error: "Account is disabled" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    const updatedUser = await db.update("users", user.id, { lastVisit: new Date() });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      user: {
        ...userWithoutPassword,
        id: updatedUser.id || updatedUser._id,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await db.findById("users", req.user.id);

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ error: "Invalid current password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.update("users", user.id, { password: hashedPassword });

    res.json({ message: "Password changed successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    let user = await db.findById("users", req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Data Repair: If user has points but 0 totalSpent, estimate it based on 10 pts = $1 ratio
    if (user.role === "customer" && (user.points || 0) > 0 && (user.totalSpent || 0) <= 0) {
      const estimatedSpent = Number((user.points / 10).toFixed(2));
      user = await db.update("users", user.id, { totalSpent: estimatedSpent });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, image, phone, bio, notificationPreferences } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    const userId = req.user.id;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await db.findOne("users", { email });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (image !== undefined) updateData.image = image;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (notificationPreferences !== undefined) updateData.notificationPreferences = notificationPreferences;

    console.log("Updating profile for user:", userId, "with data:", updateData);
    const updatedUser = await db.update("users", userId, updateData);
    console.log("Updated user result:", updatedUser);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({
      message: "Profile updated successfully",
      user: userWithoutPassword
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const redeemPoints = async (req: any, res: Response) => {
  try {
    const { cost, rewardName, locationId } = req.body;
    const userId = req.user.id;
    const user = await db.findById("users", userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if ((user.points || 0) < cost) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    const newPoints = user.points - cost;
    const updatedUser = await db.update("users", userId, { points: newPoints });

    // Create redemption record for staff to see
    await db.insert("redemptions", {
      userId,
      userName: user.name,
      rewardName,
      cost,
      locationId: locationId || user.locationId,
      status: "Pending",
      redeemedAt: new Date()
    });

    // Notify staff about new redemption
    await createNotification({
      title: "New Reward Redemption",
      message: `${user.name} redeemed ${rewardName}.`,
      type: "info",
      category: "order", // Redemptions are treated as order-related alerts for staff
      locationId: locationId || user.locationId,
      link: "/staff"
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({
      message: `Successfully redeemed ${rewardName}!`,
      user: userWithoutPassword
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
