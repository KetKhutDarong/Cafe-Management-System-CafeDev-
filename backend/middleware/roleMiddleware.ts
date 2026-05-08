import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { UserRole } from "../types";

export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }

    next();
  };
};

export const checkPermission = (permissionKey: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admins have all permissions
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Define default permissions for staff roles if missing in DB
    const isStaff = [UserRole.MANAGER, UserRole.CASHIER, UserRole.BARISTA].includes(req.user.role);
    
    const defaultPermissions: Record<string, boolean> = {
      manageOrders: isStaff, // Orders accessible by staff by default
      manageInventory: req.user.role === UserRole.MANAGER,
      manageEmployees: false,
      viewReports: req.user.role === UserRole.MANAGER,
      manageMenu: req.user.role === UserRole.MANAGER,
      manageTables: isStaff,
      manageSupport: req.user.role === UserRole.MANAGER
    };

    // Check if the user has the specific permission
    // We treat 'permissions' as a Map if it's from Mongoose, but it might be a plain object
    const permissions = req.user.permissions;
    let hasPermission: boolean | undefined;

    if (permissions) {
      // Handle both Map and plain object
      if (typeof permissions.get === 'function') {
        hasPermission = permissions.get(permissionKey);
      } else {
        hasPermission = permissions[permissionKey];
      }
    }

    // If permission is explicitly set (true or false), use it
    if (hasPermission !== undefined) {
      if (hasPermission) return next();
    } else {
      // Fallback to role-based default if permission is missing
      if (defaultPermissions[permissionKey]) return next();
    }

    return res.status(403).json({ error: `Access denied: insufficient module permissions (${permissionKey})` });
  };
};
