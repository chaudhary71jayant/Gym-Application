import {
  DIET_GOALS,
  FITNESS_GOALS,
  MEAL_TYPES,
  MEMBERSHIP_PLANS,
  PAYMENT_METHODS,
  TRAINER_SPECIALIZATIONS,
  WEEKDAYS,
} from "./constants";

const lookupLabel = (list, value) =>
  list.find((item) => item.value === value)?.label;

export const formatGoal = (goal) => {
  if (!goal) return "Not set";
  return (
    lookupLabel(FITNESS_GOALS, goal) ||
    lookupLabel(DIET_GOALS, goal) ||
    goal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

export const formatSpecialization = (spec) => {
  if (!spec) return "General";
  return (
    lookupLabel(TRAINER_SPECIALIZATIONS, spec) ||
    spec.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

export const formatPlanName = (plan) => {
  if (!plan) return "No active plan";
  return (
    lookupLabel(MEMBERSHIP_PLANS, plan) ||
    plan.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

export const formatMealType = (mealType) => {
  if (!mealType) return "Meal";
  return (
    lookupLabel(MEAL_TYPES, mealType) ||
    mealType.trim().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

export const formatPaymentMethod = (method) => {
  if (!method) return "—";
  return lookupLabel(PAYMENT_METHODS, method) || method.replace(/_/g, " ").toUpperCase();
};

export const formatCurrency = (amount) => {
  const numeric = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numeric);
};

export const formatDate = (dateValue, options) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(
    "en-IN",
    options || { day: "numeric", month: "short", year: "numeric" }
  );
};

export const formatTime = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const computeDurationMinutes = (checkIn, checkOut, fallbackMinutes) => {
  if (typeof fallbackMinutes === "number" && !Number.isNaN(fallbackMinutes)) {
    return fallbackMinutes;
  }
  if (!checkIn || !checkOut) return null;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (Number.isNaN(diff) || diff < 0) return null;
  return Math.round(diff / 60000);
};

export const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined) return "—";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
};

export const formatElapsedClock = (startIso, nowMs) => {
  if (!startIso) return "00:00:00";
  const diffSec = Math.max(0, Math.floor((nowMs - new Date(startIso).getTime()) / 1000));
  const hrs = String(Math.floor(diffSec / 3600)).padStart(2, "0");
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
  const secs = String(diffSec % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
};

export const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const getTodayWeekdayKey = () => {
  const jsDay = new Date().getDay();
  const index = jsDay === 0 ? 6 : jsDay - 1;
  return WEEKDAYS[index].key;
};

export const computePlanEndDate = (startDateStr, planValue) => {
  const plan = MEMBERSHIP_PLANS.find((p) => p.value === planValue);
  if (!startDateStr || !plan) return "";
  const date = new Date(startDateStr);
  if (Number.isNaN(date.getTime())) return "";
  date.setMonth(date.getMonth() + plan.months);
  return date.toISOString().slice(0, 10);
};

export const calculateBMI = (weightKg, heightCm) => {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!w || !h || w <= 0 || h <= 0) return null;
  const hMeters = h / 100;
  const bmi = w / (hMeters * hMeters);
  const rounded = Math.round(bmi * 10) / 10;
  let category = "Normal";
  if (rounded < 18.5) category = "Underweight";
  else if (rounded >= 25 && rounded < 30) category = "Overweight";
  else if (rounded >= 30) category = "Obese";
  return { value: rounded, category };
};

export const getErrorMessage = (err, fallback = "Something went wrong. Please try again.") =>
  err?.response?.data?.message || err?.message || fallback;
