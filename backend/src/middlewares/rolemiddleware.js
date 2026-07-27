const authorize = (...allowedRoles) => {
    return (req,res,next) => {
       if(req.user.role === "superAdmin" && !allowedRoles.includes("superAdmin")) {
        return res.status(403).json({
            success : false,
            message : "Superadmin cannot access application routes.",
        });
       }

       if(!allowedRoles.includes(req.user.role)){
        return res.status(403).json({
            success : false,
            message : `Access denied. Role ${req.user ?.role ?? "unknown"}' is not permitted to access this resource`,
        });
       }

       next();
    };
};

export default authorize;
