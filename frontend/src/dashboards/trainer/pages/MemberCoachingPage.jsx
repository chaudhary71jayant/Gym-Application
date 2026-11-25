import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import Avatar from "../../../components/ui/Avatar";
import StatusBadge from "../../../components/ui/StatusBadge";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  DumbbellIcon,
  EditIcon,
  FlameIcon,
  PlusIcon,
  TrashIcon,
  UtensilsIcon,
} from "../../../components/ui/Icons";
import useToast from "../../../hooks/useToast";
import memberService from "../../../services/member.service";
import workoutService from "../../../services/workout.service";
import dietplanServices from "../../../services/dietplan.service";
import attendanceService from "../../../services/attendance.service";
import {
  DIET_GOALS,
  FITNESS_GOALS,
  MEAL_TYPES,
  WEEKDAYS,
} from "../../../utils/constants";
import {
  calculateBMI,
  computeDurationMinutes,
  formatDate,
  formatDuration,
  formatGoal,
  formatMealType,
  formatTime,
  getErrorMessage,
} from "../../../utils/formatters";

const EMPTY_SCHEDULE = () => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
});

const EMPTY_WORKOUT_FORM = () => ({
  title: "",
  description: "",
  goal: "general_fitness",
  durationWeeks: "4",
  isActive: true,
  weeklySchedule: EMPTY_SCHEDULE(),
});

const EMPTY_MEAL_ITEM = () => ({
  name: "",
  quantity: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
});

const EMPTY_MEAL = () => ({
  mealType: "breakfast",
  time: "08:00 AM",
  notes: "",
  items: [EMPTY_MEAL_ITEM()],
});

const EMPTY_DIET_FORM = () => ({
  title: "",
  goal: "Weight_loss",
  dailyCalorieTarget: "2200",
  restrictionsText: "",
  notes: "",
  isActive: true,
  dailyMeals: [EMPTY_MEAL()],
});

const MemberCoachingPage = () => {
  const { id } = useParams();
  const { showToast } = useToast();

  const [member, setMember] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [diets, setDiets] = useState([]);
  const [attendance, setAttendance] = useState({ summary: null, records: [] });
  const [attFilter, setAttFilter] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });

  const [activeTab, setActiveTab] = useState("workouts");
  const [selectedViewDay, setSelectedViewDay] = useState("monday");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Workout Modal State
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [workoutForm, setWorkoutForm] = useState(EMPTY_WORKOUT_FORM);
  const [builderDay, setBuilderDay] = useState("monday");
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);

  // Diet Modal State
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [editingDietId, setEditingDietId] = useState(null);
  const [dietForm, setDietForm] = useState(EMPTY_DIET_FORM);
  const [isSavingDiet, setIsSavingDiet] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'workout' | 'diet', item }
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    const [memberRes, workoutsRes, dietsRes, attRes] = await Promise.all([
      memberService.getMemberById(id),
      workoutService.getMemberWorkouts(id),
      dietplanServices.getMemberDiet(id),
      attendanceService.getMemberAttendance(id, attFilter.month, attFilter.year),
    ]);
    return {
      member: memberRes?.member || null,
      workouts: workoutsRes?.workoutPlans || [],
      diets: dietsRes?.dietPlans || [],
      attendance: {
        summary: attRes?.summary || null,
        records: attRes?.attendance || [],
      },
    };
  }, [attFilter.month, attFilter.year, id]);

  const loadMemberData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAll();
      setMember(data.member);
      setWorkouts(data.workouts);
      setDiets(data.diets);
      setAttendance(data.attendance);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load member coaching workspace."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((data) => {
        if (!active) return;
        setMember(data.member);
        setWorkouts(data.workouts);
        setDiets(data.diets);
        setAttendance(data.attendance);
        setError("");
      })
      .catch((err) => {
        if (active) {
          setError(
            getErrorMessage(err, "Failed to load member coaching workspace.")
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  // Workout Modal Helpers
  const openNewWorkout = () => {
    setEditingWorkoutId(null);
    setWorkoutForm({
      ...EMPTY_WORKOUT_FORM(),
      goal: member?.fitnessGoal || "general_fitness",
    });
    setBuilderDay("monday");
    setIsWorkoutModalOpen(true);
  };

  const openEditWorkout = (plan) => {
    setEditingWorkoutId(plan._id);
    const schedule = EMPTY_SCHEDULE();
    for (const day of WEEKDAYS) {
      schedule[day.key] = (plan.weeklySchedule?.[day.key] || []).map((ex) => ({
        name: ex.name || "",
        sets: String(ex.sets ?? 3),
        reps: ex.reps !== null && ex.reps !== undefined ? String(ex.reps) : "",
        duration:
          ex.duration !== null && ex.duration !== undefined
            ? String(ex.duration)
            : "",
        restTime:
          ex.restTime !== null && ex.restTime !== undefined
            ? String(ex.restTime)
            : "60",
        notes: ex.notes || "",
      }));
    }
    setWorkoutForm({
      title: plan.title || "",
      description: plan.description || "",
      goal: plan.goal || member?.fitnessGoal || "general_fitness",
      durationWeeks: String(plan.durationWeeks || 4),
      isActive: plan.isActive !== false,
      weeklySchedule: schedule,
    });
    setBuilderDay("monday");
    setIsWorkoutModalOpen(true);
  };

  const addExerciseToDay = () => {
    setWorkoutForm((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [builderDay]: [
          ...prev.weeklySchedule[builderDay],
          { name: "", sets: "3", reps: "12", duration: "", restTime: "60", notes: "" },
        ],
      },
    }));
  };

  const updateExerciseField = (index, field, value) => {
    setWorkoutForm((prev) => {
      const dayList = [...prev.weeklySchedule[builderDay]];
      dayList[index] = { ...dayList[index], [field]: value };
      return {
        ...prev,
        weeklySchedule: { ...prev.weeklySchedule, [builderDay]: dayList },
      };
    });
  };

  const removeExerciseFromDay = (index) => {
    setWorkoutForm((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [builderDay]: prev.weeklySchedule[builderDay].filter((_, i) => i !== index),
      },
    }));
  };

  const handleSaveWorkout = async (e) => {
    e.preventDefault();
    if (!workoutForm.title.trim()) {
      showToast("Workout plan title is required.", "error");
      return;
    }

    const sanitizedSchedule = {};
    for (const day of WEEKDAYS) {
      sanitizedSchedule[day.key] = (workoutForm.weeklySchedule[day.key] || [])
        .filter((ex) => ex.name.trim())
        .map((ex) => ({
          name: ex.name.trim(),
          sets: Number(ex.sets || 1),
          reps: ex.reps !== "" ? Number(ex.reps) : null,
          duration: ex.duration !== "" ? Number(ex.duration) : null,
          restTime: ex.restTime !== "" ? Number(ex.restTime) : 60,
          notes: ex.notes.trim(),
        }));
    }

    setIsSavingWorkout(true);
    try {
      const payload = {
        title: workoutForm.title.trim(),
        description: workoutForm.description.trim(),
        goal: workoutForm.goal,
        durationWeeks: Number(workoutForm.durationWeeks || 4),
        weeklySchedule: sanitizedSchedule,
      };

      if (editingWorkoutId) {
        await workoutService.updateWorkoutPlan(editingWorkoutId, {
          ...payload,
          isActive: workoutForm.isActive,
        });
        showToast("Workout plan updated!");
      } else {
        await workoutService.createWorkOutPlan({
          ...payload,
          assignedTo: id,
        });
        showToast("Workout plan assigned to member!");
      }
      setIsWorkoutModalOpen(false);
      await loadMemberData();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to save workout plan."), "error");
    } finally {
      setIsSavingWorkout(false);
    }
  };

  // Diet Modal Helpers
  const openNewDiet = () => {
    setEditingDietId(null);
    setDietForm(EMPTY_DIET_FORM());
    setIsDietModalOpen(true);
  };

  const openEditDiet = (plan) => {
    setEditingDietId(plan._id);
    setDietForm({
      title: plan.title || "",
      goal: plan.goal || "Weight_loss",
      dailyCalorieTarget: String(plan.dailyCalorieTarget || 2000),
      restrictionsText: (plan.restrictions || []).join(", "),
      notes: plan.notes || "",
      isActive: plan.isActive !== false,
      dailyMeals:
        plan.dailyMeals?.length > 0
          ? plan.dailyMeals.map((m) => ({
              mealType: m.mealType || "breakfast",
              time: m.time || "",
              notes: m.notes || "",
              items:
                m.items?.length > 0
                  ? m.items.map((it) => ({
                      name: it.name || "",
                      quantity: it.quantity || "",
                      calories: it.calories ?? "",
                      protein: it.protein ?? "",
                      carbs: it.carbs ?? "",
                      fats: it.fats ?? "",
                    }))
                  : [EMPTY_MEAL_ITEM()],
            }))
          : [EMPTY_MEAL()],
    });
    setIsDietModalOpen(true);
  };

  const addMeal = () => {
    setDietForm((prev) => ({
      ...prev,
      dailyMeals: [...prev.dailyMeals, EMPTY_MEAL()],
    }));
  };

  const removeMeal = (mealIdx) => {
    setDietForm((prev) => ({
      ...prev,
      dailyMeals: prev.dailyMeals.filter((_, i) => i !== mealIdx),
    }));
  };

  const updateMealField = (mealIdx, field, value) => {
    setDietForm((prev) => {
      const nextMeals = [...prev.dailyMeals];
      nextMeals[mealIdx] = { ...nextMeals[mealIdx], [field]: value };
      return { ...prev, dailyMeals: nextMeals };
    });
  };

  const addItemToMeal = (mealIdx) => {
    setDietForm((prev) => {
      const nextMeals = [...prev.dailyMeals];
      nextMeals[mealIdx] = {
        ...nextMeals[mealIdx],
        items: [...nextMeals[mealIdx].items, EMPTY_MEAL_ITEM()],
      };
      return { ...prev, dailyMeals: nextMeals };
    });
  };

  const removeItemFromMeal = (mealIdx, itemIdx) => {
    setDietForm((prev) => {
      const nextMeals = [...prev.dailyMeals];
      nextMeals[mealIdx] = {
        ...nextMeals[mealIdx],
        items: nextMeals[mealIdx].items.filter((_, i) => i !== itemIdx),
      };
      return { ...prev, dailyMeals: nextMeals };
    });
  };

  const updateMealItemField = (mealIdx, itemIdx, field, value) => {
    setDietForm((prev) => {
      const nextMeals = [...prev.dailyMeals];
      const nextItems = [...nextMeals[mealIdx].items];
      nextItems[itemIdx] = { ...nextItems[itemIdx], [field]: value };
      nextMeals[mealIdx] = { ...nextMeals[mealIdx], items: nextItems };
      return { ...prev, dailyMeals: nextMeals };
    });
  };

  const handleSaveDiet = async (e) => {
    e.preventDefault();
    if (!dietForm.title.trim() || !dietForm.dailyCalorieTarget) {
      showToast("Diet plan title and calorie target are required.", "error");
      return;
    }

    const sanitizedMeals = dietForm.dailyMeals
      .map((meal) => ({
        mealType: meal.mealType,
        time: meal.time.trim(),
        notes: meal.notes.trim(),
        items: meal.items
          .filter((it) => it.name.trim() && it.quantity.trim())
          .map((it) => ({
            name: it.name.trim(),
            quantity: it.quantity.trim(),
            calories: it.calories !== "" ? Number(it.calories) : 0,
            protein: it.protein !== "" ? Number(it.protein) : 0,
            carbs: it.carbs !== "" ? Number(it.carbs) : 0,
            fats: it.fats !== "" ? Number(it.fats) : 0,
          })),
      }))
      .filter((m) => m.items.length > 0);

    const restrictions = dietForm.restrictionsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSavingDiet(true);
    try {
      const payload = {
        title: dietForm.title.trim(),
        goal: dietForm.goal,
        dailyCalorieTarget: Number(dietForm.dailyCalorieTarget),
        dailyMeals: sanitizedMeals,
        restrictions,
        notes: dietForm.notes.trim(),
      };

      if (editingDietId) {
        await dietplanServices.updateDietPlan(editingDietId, {
          ...payload,
          isActive: dietForm.isActive,
        });
        showToast("Diet plan updated!");
      } else {
        await dietplanServices.createDietPlan({
          ...payload,
          assignedTo: id,
        });
        showToast("Diet plan assigned to member!");
      }

      setIsDietModalOpen(false);
      await loadMemberData();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to save diet plan."), "error");
    } finally {
      setIsSavingDiet(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "workout") {
        await workoutService.deleteWorkoutPlan(deleteTarget.item._id);
        showToast("Workout plan deleted.");
      } else {
        await dietplanServices.deleteDietPlan(deleteTarget.item._id);
        showToast("Diet plan deleted.");
      }
      setDeleteTarget(null);
      await loadMemberData();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete plan."), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const bmi = member ? calculateBMI(member.weight, member.height) : null;

  const dietDraftCalories = dietForm.dailyMeals.reduce(
    (sum, m) =>
      sum + m.items.reduce((s, it) => s + Number(it.calories || 0), 0),
    0
  );

  return (
    <DashboardLayout
      title={member?.user?.name ? `Coaching — ${member.user.name}` : "Client Coaching"}
      subtitle="Build customized weekly workouts, macro nutrition, and track attendance"
      actions={
        <Link
          to="/trainer/members"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Roster
        </Link>
      }
    >
      {isLoading ? (
        <LoadingState label="Loading client workspace..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadMemberData} />
      ) : !member ? (
        <ErrorBanner message="Member not found." onRetry={loadMemberData} />
      ) : (
        <div className="space-y-6">
          {/* Client Snapshot */}
          <div className="glass-card rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <Avatar
                src={member.user?.profileImage}
                name={member.user?.name}
                size="xl"
              />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold text-white">
                    {member.user?.name}
                  </h2>
                  <StatusBadge status={member.membershipStatus} />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {member.user?.email} {member.user?.phone ? `· ${member.user.phone}` : ""}
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-200 font-medium">
                    Goal: {formatGoal(member.fitnessGoal)}
                  </span>
                  {member.age && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200">
                      Age: {member.age}
                    </span>
                  )}
                  {member.weight && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200">
                      Weight: {member.weight} kg
                    </span>
                  )}
                  {member.height && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200">
                      Height: {member.height} cm
                    </span>
                  )}
                  {bmi && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-200">
                      BMI: {bmi.value} ({bmi.category})
                    </span>
                  )}
                </div>
                {member.healthConditions && (
                  <p className="text-xs text-amber-200 mt-2.5 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-1.5 inline-block">
                    Medical / Health Note: {member.healthConditions}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={openNewWorkout}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                <PlusIcon className="w-4 h-4" />
                New Workout Plan
              </button>
              <button
                type="button"
                onClick={openNewDiet}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                <PlusIcon className="w-4 h-4" />
                New Diet Plan
              </button>
            </div>
          </div>

          {/* Workspace Tabs */}
          <div
            role="tablist"
            aria-label="Coaching sections"
            className="flex border-b border-slate-800 gap-6 overflow-x-auto"
          >
            {[
              { id: "workouts", label: `Workout Plans (${workouts.length})`, icon: DumbbellIcon },
              { id: "diets", label: `Diet Plans (${diets.length})`, icon: UtensilsIcon },
              { id: "attendance", label: "Attendance History", icon: CalendarCheckIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative pb-3 pt-1 inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition ${
                    selected
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {selected && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-400 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Panel: Workouts */}
          {activeTab === "workouts" && (
            <div role="tabpanel" className="space-y-5">
              {workouts.length === 0 ? (
                <EmptyState
                  icon={DumbbellIcon}
                  title="No workout plans yet"
                  description="Create a structured 7-day exercise routine tailored to this member's fitness goal."
                  action={
                    <button
                      type="button"
                      onClick={openNewWorkout}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Create Workout Plan
                    </button>
                  }
                />
              ) : (
                workouts.map((plan) => {
                  const dayExercises = plan.weeklySchedule?.[selectedViewDay] || [];
                  return (
                    <div key={plan._id} className="glass-card rounded-2xl p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-lg font-bold text-white">
                              {plan.title}
                            </h3>
                            <StatusBadge
                              status={plan.isActive ? "active" : "inactive"}
                            />
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                              {formatGoal(plan.goal)} · {plan.durationWeeks} wk(s)
                            </span>
                          </div>
                          {plan.description && (
                            <p className="text-sm text-slate-300 mt-1.5">
                              {plan.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditWorkout(plan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({ type: "workout", item: plan })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-xs font-semibold text-rose-300 transition"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Weekday Selector */}
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {WEEKDAYS.map((day) => {
                          const count = plan.weeklySchedule?.[day.key]?.length || 0;
                          const isSelected = selectedViewDay === day.key;
                          return (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => setSelectedViewDay(day.key)}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition flex items-center gap-1.5 ${
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-500"
                                  : "bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white"
                              }`}
                            >
                              <span>{day.short}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {dayExercises.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                          Rest / Recovery day on{" "}
                          {WEEKDAYS.find((d) => d.key === selectedViewDay)?.label}.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {dayExercises.map((ex, idx) => (
                            <div
                              key={`${ex.name}-${idx}`}
                              className="rounded-xl bg-slate-900/75 border border-slate-800 p-4 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-white">
                                  {idx + 1}. {ex.name}
                                </p>
                                <span className="text-xs font-mono text-indigo-300">
                                  {ex.sets} sets
                                  {ex.reps ? ` × ${ex.reps} reps` : ""}
                                  {ex.duration ? ` · ${ex.duration}s` : ""}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">
                                Rest: {ex.restTime ?? 60}s
                                {ex.notes ? ` · ${ex.notes}` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab Panel: Diet Plans */}
          {activeTab === "diets" && (
            <div role="tabpanel" className="space-y-5">
              {diets.length === 0 ? (
                <EmptyState
                  icon={UtensilsIcon}
                  title="No diet plans yet"
                  description="Design a personalized nutrition plan with daily calorie targets and meal macros."
                  action={
                    <button
                      type="button"
                      onClick={openNewDiet}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Create Diet Plan
                    </button>
                  }
                />
              ) : (
                diets.map((plan) => {
                  const totals = (plan.dailyMeals || []).reduce(
                    (acc, meal) => {
                      for (const item of meal.items || []) {
                        acc.calories += Number(item.calories || 0);
                        acc.protein += Number(item.protein || 0);
                        acc.carbs += Number(item.carbs || 0);
                        acc.fats += Number(item.fats || 0);
                      }
                      return acc;
                    },
                    { calories: 0, protein: 0, carbs: 0, fats: 0 }
                  );

                  return (
                    <div key={plan._id} className="glass-card rounded-2xl p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-lg font-bold text-white">
                              {plan.title}
                            </h3>
                            <StatusBadge
                              status={plan.isActive ? "active" : "inactive"}
                            />
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                              {formatGoal(plan.goal)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-300">
                            <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                              <FlameIcon className="w-4 h-4" />
                              Target: {plan.dailyCalorieTarget} kcal (Planned:{" "}
                              {totals.calories} kcal)
                            </span>
                            <span>
                              P: <strong className="text-white">{totals.protein}g</strong> ·
                              C: <strong className="text-white">{totals.carbs}g</strong> ·
                              F: <strong className="text-white">{totals.fats}g</strong>
                            </span>
                          </div>
                          {plan.restrictions?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {plan.restrictions.map((r) => (
                                <span
                                  key={r}
                                  className="text-[11px] bg-rose-500/10 text-rose-200 border border-rose-500/20 px-2 py-0.5 rounded-md"
                                >
                                  Avoid: {r}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditDiet(plan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({ type: "diet", item: plan })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-xs font-semibold text-rose-300 transition"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(plan.dailyMeals || []).map((meal, idx) => (
                          <div
                            key={`${meal.mealType}-${idx}`}
                            className="rounded-xl bg-slate-900/75 border border-slate-800 p-4 space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white">
                                {formatMealType(meal.mealType)}
                              </h4>
                              {meal.time && (
                                <span className="text-xs text-slate-400">
                                  {meal.time}
                                </span>
                              )}
                            </div>

                            <div className="divide-y divide-slate-800/80">
                              {(meal.items || []).map((it, i) => (
                                <div
                                  key={`${it.name}-${i}`}
                                  className="py-1.5 flex items-center justify-between gap-2 text-xs"
                                >
                                  <div>
                                    <span className="text-slate-100 font-medium">
                                      {it.name}
                                    </span>{" "}
                                    <span className="text-slate-400">
                                      ({it.quantity})
                                    </span>
                                  </div>
                                  <span className="text-slate-300 font-mono shrink-0">
                                    {it.calories ? `${it.calories} kcal` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab Panel: Attendance */}
          {activeTab === "attendance" && (
            <div role="tabpanel" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label htmlFor="att-month" className="sr-only">
                    Month
                  </label>
                  <select
                    id="att-month"
                    value={attFilter.month}
                    onChange={(e) =>
                      setAttFilter((p) => ({ ...p, month: e.target.value }))
                    }
                    className="input-field w-auto"
                  >
                    {Array.from({ length: 12 }, (_, idx) => (
                      <option key={idx + 1} value={String(idx + 1)}>
                        {new Date(2026, idx, 1).toLocaleString("en-US", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="att-year" className="sr-only">
                    Year
                  </label>
                  <select
                    id="att-year"
                    value={attFilter.year}
                    onChange={(e) =>
                      setAttFilter((p) => ({ ...p, year: e.target.value }))
                    }
                    className="input-field w-auto"
                  >
                    {[2025, 2026, 2027].map((yr) => (
                      <option key={yr} value={String(yr)}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {attendance.summary && (
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                      Total: <strong>{attendance.summary.totalDays}</strong>
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
                      Present: <strong>{attendance.summary.presentDays}</strong>
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-300">
                      Absent: <strong>{attendance.summary.absentDays}</strong>
                    </span>
                  </div>
                )}
              </div>

              {attendance.records.length === 0 ? (
                <EmptyState
                  icon={CalendarCheckIcon}
                  title="No attendance logs for this month"
                  description="Check-in records for this client will appear here once logged."
                />
              ) : (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div
                    tabIndex={0}
                    role="region"
                    aria-label="Member attendance history"
                    className="overflow-x-auto"
                  >
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-900/90 border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Date
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Check In
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Check Out
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Duration
                          </th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {attendance.records.map((rec) => (
                          <tr key={rec._id} className="hover:bg-slate-800/40">
                            <td className="px-6 py-3.5 text-sm text-white">
                              {formatDate(rec.date)}
                            </td>
                            <td className="px-6 py-3.5 text-sm font-mono text-slate-300">
                              {formatTime(rec.checkIn)}
                            </td>
                            <td className="px-6 py-3.5 text-sm font-mono text-slate-300">
                              {formatTime(rec.checkOut)}
                            </td>
                            <td className="px-6 py-3.5 text-sm font-mono text-slate-300">
                              {formatDuration(
                                computeDurationMinutes(
                                  rec.checkIn,
                                  rec.checkOut,
                                  rec.sessionDuration
                                )
                              )}
                            </td>
                            <td className="px-6 py-3.5">
                              <StatusBadge status={rec.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Workout Plan Builder Modal */}
      <Modal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        title={editingWorkoutId ? "Edit Workout Plan" : "Build Workout Plan"}
        subtitle={`Assigned to ${member?.user?.name || "Member"}`}
        size="xl"
        closedBy={isSavingWorkout ? "none" : "closerequest"}
      >
        <form onSubmit={handleSaveWorkout} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="wo-title"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Plan Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="wo-title"
                type="text"
                autoFocus
                required
                value={workoutForm.title}
                onChange={(e) =>
                  setWorkoutForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Hypertrophy Push/Pull/Legs Split"
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="wo-weeks"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Duration (Weeks) <span className="text-rose-400">*</span>
              </label>
              <input
                id="wo-weeks"
                type="number"
                min="1"
                required
                value={workoutForm.durationWeeks}
                onChange={(e) =>
                  setWorkoutForm((p) => ({ ...p, durationWeeks: e.target.value }))
                }
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="wo-goal"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Training Goal
              </label>
              <select
                id="wo-goal"
                value={workoutForm.goal}
                onChange={(e) =>
                  setWorkoutForm((p) => ({ ...p, goal: e.target.value }))
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

            {editingWorkoutId && (
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workoutForm.isActive}
                    onChange={(e) =>
                      setWorkoutForm((p) => ({ ...p, isActive: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-600"
                  />
                  Mark plan as active
                </label>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="wo-desc"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Coach Description
            </label>
            <textarea
              id="wo-desc"
              rows={2}
              value={workoutForm.description}
              onChange={(e) =>
                setWorkoutForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Focus on progressive overload and controlled tempo..."
              className="input-field"
            />
          </div>

          {/* 7-Day Exercise Editor */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Weekly Exercise Schedule
              </p>
              <button
                type="button"
                onClick={addExerciseToDay}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add Exercise to{" "}
                {WEEKDAYS.find((d) => d.key === builderDay)?.short}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {WEEKDAYS.map((day) => {
                const count = workoutForm.weeklySchedule[day.key]?.length || 0;
                const active = builderDay === day.key;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setBuilderDay(day.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 shrink-0 ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{day.short}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-black/25 text-[10px] tabular-nums">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {workoutForm.weeklySchedule[builderDay].length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-800 rounded-xl">
                No exercises scheduled for{" "}
                {WEEKDAYS.find((d) => d.key === builderDay)?.label}. Click &ldquo;Add
                Exercise&rdquo; above or leave empty as a rest day.
              </p>
            ) : (
              <div className="space-y-3">
                {workoutForm.weeklySchedule[builderDay].map((ex, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-indigo-300">
                        Exercise #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExerciseFromDay(idx)}
                        className="text-xs text-rose-300 hover:text-rose-200 inline-flex items-center gap-1"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <div className="col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="Exercise name (e.g. Bench Press)"
                          value={ex.name}
                          onChange={(e) =>
                            updateExerciseField(idx, "name", e.target.value)
                          }
                          className="input-field"
                        />
                      </div>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Sets"
                        title="Sets"
                        value={ex.sets}
                        onChange={(e) =>
                          updateExerciseField(idx, "sets", e.target.value)
                        }
                        className="input-field"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Reps"
                        title="Reps"
                        value={ex.reps}
                        onChange={(e) =>
                          updateExerciseField(idx, "reps", e.target.value)
                        }
                        className="input-field"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Rest (sec)"
                        title="Rest time in seconds"
                        value={ex.restTime}
                        onChange={(e) =>
                          updateExerciseField(idx, "restTime", e.target.value)
                        }
                        className="input-field"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="number"
                        min="0"
                        placeholder="Duration sec (optional)"
                        value={ex.duration}
                        onChange={(e) =>
                          updateExerciseField(idx, "duration", e.target.value)
                        }
                        className="input-field"
                      />
                      <input
                        type="text"
                        placeholder="Form cues or notes (optional)"
                        value={ex.notes}
                        onChange={(e) =>
                          updateExerciseField(idx, "notes", e.target.value)
                        }
                        className="input-field sm:col-span-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSavingWorkout}
              onClick={() => setIsWorkoutModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingWorkout}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              {isSavingWorkout
                ? "Saving..."
                : editingWorkoutId
                ? "Update Workout Plan"
                : "Assign Workout Plan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Diet Plan Builder Modal */}
      <Modal
        isOpen={isDietModalOpen}
        onClose={() => setIsDietModalOpen(false)}
        title={editingDietId ? "Edit Diet Plan" : "Build Nutrition Plan"}
        subtitle={`Planned calories: ${dietDraftCalories} kcal / Target: ${
          dietForm.dailyCalorieTarget || 0
        } kcal`}
        size="xl"
        closedBy={isSavingDiet ? "none" : "closerequest"}
      >
        <form onSubmit={handleSaveDiet} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="diet-title"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Diet Plan Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="diet-title"
                type="text"
                autoFocus
                required
                value={dietForm.title}
                onChange={(e) =>
                  setDietForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Lean Cut 2200 kcal High Protein"
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="diet-cals"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Daily Calorie Target <span className="text-rose-400">*</span>
              </label>
              <input
                id="diet-cals"
                type="number"
                min="800"
                required
                value={dietForm.dailyCalorieTarget}
                onChange={(e) =>
                  setDietForm((p) => ({
                    ...p,
                    dailyCalorieTarget: e.target.value,
                  }))
                }
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="diet-goal"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Nutrition Goal <span className="text-rose-400">*</span>
              </label>
              <select
                id="diet-goal"
                required
                value={dietForm.goal}
                onChange={(e) =>
                  setDietForm((p) => ({ ...p, goal: e.target.value }))
                }
                className="input-field"
              >
                {DIET_GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="diet-restrict"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Restrictions (comma separated)
              </label>
              <input
                id="diet-restrict"
                type="text"
                value={dietForm.restrictionsText}
                onChange={(e) =>
                  setDietForm((p) => ({
                    ...p,
                    restrictionsText: e.target.value,
                  }))
                }
                placeholder="Lactose free, No peanuts"
                className="input-field"
              />
            </div>
          </div>

          {editingDietId && (
            <div>
              <label className="inline-flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dietForm.isActive}
                  onChange={(e) =>
                    setDietForm((p) => ({ ...p, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-600"
                />
                Mark diet plan as active
              </label>
            </div>
          )}

          {/* Daily Meals Builder */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Daily Meals &amp; Macros
              </p>
              <button
                type="button"
                onClick={addMeal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add Meal Slot
              </button>
            </div>

            <div className="space-y-4">
              {dietForm.dailyMeals.map((meal, mIdx) => (
                <div
                  key={mIdx}
                  className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <select
                        aria-label="Meal type"
                        value={meal.mealType}
                        onChange={(e) =>
                          updateMealField(mIdx, "mealType", e.target.value)
                        }
                        className="input-field w-auto"
                      >
                        {MEAL_TYPES.map((mt) => (
                          <option key={mt.value} value={mt.value}>
                            {mt.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Time (e.g. 08:30 AM)"
                        value={meal.time}
                        onChange={(e) =>
                          updateMealField(mIdx, "time", e.target.value)
                        }
                        className="input-field w-40"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addItemToMeal(mIdx)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 transition"
                      >
                        + Food Item
                      </button>
                      {dietForm.dailyMeals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMeal(mIdx)}
                          className="p-1.5 rounded-lg text-rose-300 hover:bg-rose-500/15 transition"
                          aria-label="Remove meal"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {meal.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="grid grid-cols-2 sm:grid-cols-7 gap-2 items-center"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Food item"
                          value={item.name}
                          onChange={(e) =>
                            updateMealItemField(mIdx, iIdx, "name", e.target.value)
                          }
                          className="input-field col-span-2"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Qty (e.g. 150g)"
                          value={item.quantity}
                          onChange={(e) =>
                            updateMealItemField(mIdx, iIdx, "quantity", e.target.value)
                          }
                          className="input-field"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="kcal"
                          value={item.calories}
                          onChange={(e) =>
                            updateMealItemField(mIdx, iIdx, "calories", e.target.value)
                          }
                          className="input-field"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="P (g)"
                          value={item.protein}
                          onChange={(e) =>
                            updateMealItemField(mIdx, iIdx, "protein", e.target.value)
                          }
                          className="input-field"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="C (g)"
                          value={item.carbs}
                          onChange={(e) =>
                            updateMealItemField(mIdx, iIdx, "carbs", e.target.value)
                          }
                          className="input-field"
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            placeholder="F (g)"
                            value={item.fats}
                            onChange={(e) =>
                              updateMealItemField(mIdx, iIdx, "fats", e.target.value)
                            }
                            className="input-field"
                          />
                          {meal.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemFromMeal(mIdx, iIdx)}
                              className="p-1.5 rounded-lg text-rose-300 hover:bg-rose-500/15 shrink-0"
                              aria-label="Remove item"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="diet-notes"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Coach Nutrition Notes
            </label>
            <textarea
              id="diet-notes"
              rows={2}
              value={dietForm.notes}
              onChange={(e) =>
                setDietForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Hydration target: 3.5L water daily..."
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSavingDiet}
              onClick={() => setIsDietModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingDiet}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              {isSavingDiet
                ? "Saving..."
                : editingDietId
                ? "Update Diet Plan"
                : "Assign Diet Plan"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeletePlan}
        title={`Delete ${
          deleteTarget?.type === "workout" ? "Workout" : "Diet"
        } Plan`}
        message={`Are you sure you want to delete "${deleteTarget?.item?.title}"?`}
        confirmLabel="Delete Plan"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
};

export default MemberCoachingPage;
