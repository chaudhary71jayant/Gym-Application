const authorize = (...allowedRoles) => {
    return (req,res,next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user?.role ?? "unknown"}' is not permitted to access this resource`,
            });
        }
        next();
    };
};

export default authorize;
