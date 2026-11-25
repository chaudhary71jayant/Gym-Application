export const FITNESS_GOALS = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "endurance", label: "Endurance" },
  { value: "flexibility", label: "Flexibility" },
  { value: "general_fitness", label: "General Fitness" },
];

export const MEMBERSHIP_PLANS = [
  { value: "monthly", label: "Monthly", months: 1, defaultPrice: 1499 },
  { value: "quarterly", label: "Quarterly", months: 3, defaultPrice: 3999 },
  { value: "half_yearly", label: "Half Yearly", months: 6, defaultPrice: 7499 },
  { value: "yearly", label: "Yearly", months: 12, defaultPrice: 13999 },
];

export const MEMBERSHIP_STATUSES = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

export const TRAINER_SPECIALIZATIONS = [
  { value: "weight_training", label: "Weight Training" },
  { value: "cardio", label: "Cardio" },
  { value: "yoga", label: "Yoga" },
  { value: "crossfit", label: "CrossFit" },
  { value: "nutrition", label: "Nutrition" },
  { value: "rehabilitaion", label: "Rehabilitation" },
  { value: "flexibility", label: "Flexibility" },
];

export const DIET_GOALS = [
  { value: "Weight_loss", label: "Weight Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "endurance", label: "Endurance" },
  { value: "maintainance", label: "Maintenance" },
];

export const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "morning_snack", label: "Morning Snack" },
  { value: "lunch", label: "Lunch" },
  { value: "evening_snack", label: "Evening Snack" },
  { value: " dinner", label: "Dinner" },
  { value: "pre_workout", label: "Pre-Workout" },
  { value: "post_workout", label: "Post-Workout" },
];

export const PAYMENT_METHODS = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "net_banking", label: "Net Banking" },
  { value: "razorpay", label: "Razorpay" },
  { value: "stripe", label: "Stripe" },
];

export const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export const WEEKDAYS = [
  { key: "monday", short: "Mon", label: "Monday" },
  { key: "tuesday", short: "Tue", label: "Tuesday" },
  { key: "wednesday", short: "Wed", label: "Wednesday" },
  { key: "thursday", short: "Thu", label: "Thursday" },
  { key: "friday", short: "Fri", label: "Friday" },
  { key: "saturday", short: "Sat", label: "Saturday" },
  { key: "sunday", short: "Sun", label: "Sunday" },
];

export const ROLE_HOME_ROUTES = {
  superAdmin: "/superadmin/dashboard",
  admin: "/admin/dashboard",
  trainer: "/trainer/dashboard",
  member: "/member/dashboard",
};

export const ROLE_PROFILE_ROUTES = {
  superAdmin: "/superadmin/profile",
  admin: "/admin/profile",
  trainer: "/trainer/profile",
  member: "/member/profile",
};
