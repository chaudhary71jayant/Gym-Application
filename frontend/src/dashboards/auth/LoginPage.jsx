import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import authService from "../../services/auth.service";
import {
  FITNESS_GOALS,
  MEMBERSHIP_PLANS,
  ROLE_HOME_ROUTES,
} from "../../utils/constants";
import { computePlanEndDate, formatCurrency, getErrorMessage } from "../../utils/formatters";
import {
  ActivityIcon,
  CalendarCheckIcon,
  DumbbellIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldIcon,
  SparklesIcon,
  UtensilsIcon,
} from "../../components/ui/Icons";

const HIGHLIGHTS = [
  {
    icon: CalendarCheckIcon,
    title: "Live Check-In & Session Timer",
    desc: "One-tap gym attendance with real-time workout duration tracking.",
    tone: "text-emerald-300 bg-emerald-500/15 border-emerald-500/25",
  },
  {
    icon: DumbbellIcon,
    title: "Structured Weekly Programming",
    desc: "7-day trainer-designed exercise splits tailored to your fitness goals.",
    tone: "text-indigo-300 bg-indigo-500/15 border-indigo-500/25",
  },
  {
    icon: UtensilsIcon,
    title: "Precision Nutrition & Macros",
    desc: "Meal-by-meal calorie targets, protein/carb/fat macros, and restrictions.",
    tone: "text-amber-300 bg-amber-500/15 border-amber-500/25",
  },
  {
    icon: ShieldIcon,
    title: "Role-Based Club Operations",
    desc: "Dedicated portals for Members, Trainers, Club Admins, and SuperAdmins.",
    tone: "text-sky-300 bg-sky-500/15 border-sky-500/25",
  },
];

const LoginPage = ({ initialMode = "login" }) => {
  const navigate = useNavigate();
  const { login, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState(initialMode);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    fitnessGoal: "general_fitness",
    membershipPlan: "monthly",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.email.trim() || !loginData.password) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await authService.login({
        email: loginData.email.trim(),
        password: loginData.password,
      });
      login(response.user);
      await refreshUser();
      showToast(`Welcome back, ${response.user.name}!`);
      navigate(ROLE_HOME_ROUTES[response.user.role] || "/member/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (
      !registerData.name.trim() ||
      !registerData.email.trim() ||
      !registerData.password ||
      !registerData.fitnessGoal
    ) {
      setError("Please fill in all required registration fields.");
      return;
    }
    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setError("");

    const todayStr = new Date().toISOString().slice(0, 10);
    const endStr = computePlanEndDate(todayStr, registerData.membershipPlan);

    try {
      await authService.register({
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        phone: registerData.phone.trim(),
        password: registerData.password,
        fitnessGoal: registerData.fitnessGoal,
        membershipPlan: registerData.membershipPlan,
        membershipStart: todayStr,
        membershipEnd: endStr,
      });

      // Automatically sign the member in so the httpOnly cookie is set
      try {
        const loginRes = await authService.login({
          email: registerData.email.trim(),
          password: registerData.password,
        });
        login(loginRes.user);
        await refreshUser();
        showToast("Account created! Welcome to GymPro.");
        navigate(ROLE_HOME_ROUTES[loginRes.user.role] || "/member/dashboard");
      } catch {
        showToast("Account created! Please sign in with your credentials.");
        setLoginData({ email: registerData.email.trim(), password: "" });
        setMode("login");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Showcase Panel */}
      <section className="relative lg:w-[52%] p-8 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-0 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl"
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-indigo-950/70">
              <DumbbellIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display text-2xl font-extrabold tracking-tight text-white">
                Gym<span className="text-indigo-400">Pro</span>
              </span>
              <p className="text-xs text-slate-400">Athletic Club Operating System</p>
            </div>
          </div>

          <div className="mt-8 lg:mt-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-4">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Unified Performance &amp; Club Management</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-white tracking-tight leading-[1.15]">
              Train smarter.{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                Manage effortlessly.
              </span>
            </h1>
            <p className="mt-3.5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              One streamlined hub connecting gym members, personal trainers, club
              administrators, and operations with real-time workouts, nutrition plans,
              attendance, and billing.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 backdrop-blur-md"
              >
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${item.tone}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Right Auth Panel */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Mode Switch Tabs */}
            <div
              role="tablist"
              aria-label="Account access"
              className="flex border-b border-slate-800 mb-6"
            >
              <button
                type="button"
                role="tab"
                id="tab-signin"
                aria-selected={mode === "login"}
                onClick={() => switchMode("login")}
                className={`flex-1 pb-3 text-sm font-semibold transition relative ${
                  mode === "login"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
                {mode === "login" && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-400 rounded-full"
                  />
                )}
              </button>

              <button
                type="button"
                role="tab"
                id="tab-register"
                aria-selected={mode === "register"}
                onClick={() => switchMode("register")}
                className={`flex-1 pb-3 text-sm font-semibold transition relative ${
                  mode === "register"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Join as Member
                {mode === "register" && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-400 rounded-full"
                  />
                )}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 flex items-start gap-2.5"
              >
                <ActivityIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {mode === "login" ? (
              <form
                onSubmit={handleLoginSubmit}
                aria-labelledby="tab-signin"
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold text-white">Welcome back</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Sign in to access your role dashboard.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    spellCheck={false}
                    required
                    enterKeyHint="next"
                    value={loginData.email}
                    onChange={(e) => {
                      setLoginData((p) => ({ ...p, email: e.target.value }));
                      if (error) setError("");
                    }}
                    placeholder="you@example.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      enterKeyHint="done"
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData((p) => ({ ...p, password: e.target.value }));
                        if (error) setError("");
                      }}
                      placeholder="Enter your password"
                      className="input-field pr-11"
                    />
                    <button
                      type="button"
                      aria-pressed={showPassword}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60 text-white font-semibold text-sm shadow-lg shadow-indigo-950/50 transition"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>

                <p className="text-center text-xs text-slate-400 pt-2">
                  Staff &amp; Trainer accounts are provisioned by your Club Admin.
                </p>
              </form>
            ) : (
              <form
                onSubmit={handleRegisterSubmit}
                aria-labelledby="tab-register"
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold text-white">Create member account</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Join the club and unlock personalized workout &amp; nutrition plans.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={registerData.name}
                    onChange={(e) => {
                      setRegisterData((p) => ({ ...p, name: e.target.value }));
                      if (error) setError("");
                    }}
                    placeholder="Alex Morgan"
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      spellCheck={false}
                      required
                      value={registerData.email}
                      onChange={(e) => {
                        setRegisterData((p) => ({ ...p, email: e.target.value }));
                        if (error) setError("");
                      }}
                      placeholder="you@example.com"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Phone
                    </label>
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={registerData.phone}
                      onChange={(e) =>
                        setRegisterData((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+91 98765 43210"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      name="password"
                      type={showRegPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={6}
                      required
                      value={registerData.password}
                      onChange={(e) => {
                        setRegisterData((p) => ({ ...p, password: e.target.value }));
                        if (error) setError("");
                      }}
                      placeholder="At least 6 characters"
                      className="input-field pr-11"
                    />
                    <button
                      type="button"
                      aria-pressed={showRegPassword}
                      aria-label={showRegPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowRegPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showRegPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="reg-goal"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Fitness Goal <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="reg-goal"
                      name="fitnessGoal"
                      required
                      value={registerData.fitnessGoal}
                      onChange={(e) =>
                        setRegisterData((p) => ({ ...p, fitnessGoal: e.target.value }))
                      }
                      className="input-field"
                    >
                      {FITNESS_GOALS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-plan"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Membership Plan
                    </label>
                    <select
                      id="reg-plan"
                      name="membershipPlan"
                      value={registerData.membershipPlan}
                      onChange={(e) =>
                        setRegisterData((p) => ({
                          ...p,
                          membershipPlan: e.target.value,
                        }))
                      }
                      className="input-field"
                    >
                      {MEMBERSHIP_PLANS.map((plan) => (
                        <option key={plan.value} value={plan.value}>
                          {plan.label} ({formatCurrency(plan.defaultPrice)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60 text-white font-semibold text-sm shadow-lg shadow-indigo-950/50 transition"
                >
                  {isLoading ? "Creating account..." : "Create Member Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
