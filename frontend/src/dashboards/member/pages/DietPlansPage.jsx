import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import { FlameIcon, UtensilsIcon } from "../../../components/ui/Icons";
import memberService from "../../../services/member.service";
import dietplanServices from "../../../services/dietplan.service";
import {
  formatGoal,
  formatMealType,
  getErrorMessage,
} from "../../../utils/formatters";

const DietPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    const profileRes = await memberService.getMyMemberProfile();
    const me = profileRes?.member;
    if (!me?._id) return [];
    const res = await dietplanServices.getMemberDiet(me._id);
    return res?.dietPlans || [];
  }, []);

  const loadDiets = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const list = await fetchAll();
      setPlans(list);
      const preferred = list.find((p) => p.isActive) || list[0];
      if (preferred) setSelectedPlanId(preferred._id);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load your diet plans."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((list) => {
        if (!active) return;
        setPlans(list);
        const preferred = list.find((p) => p.isActive) || list[0];
        if (preferred) setSelectedPlanId(preferred._id);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load your diet plans."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const activePlan = plans.find((p) => p._id === selectedPlanId) || plans[0] || null;

  const macroTotals = (activePlan?.dailyMeals || []).reduce(
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

  const caloriePct = activePlan?.dailyCalorieTarget
    ? Math.min(100, Math.round((macroTotals.calories / activePlan.dailyCalorieTarget) * 100))
    : 0;

  return (
    <DashboardLayout
      title="Nutrition & Diet Plans"
      subtitle="Daily meal structure, macro breakdown, and calorie goals"
    >
      {isLoading ? (
        <LoadingState label="Loading your nutrition plans..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadDiets} />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={UtensilsIcon}
          title="No diet plans assigned yet"
          description="Your coach's meal and macro guidance will show up here once created."
        />
      ) : (
        <div className="space-y-6">
          {plans.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {plans.map((plan) => (
                <button
                  key={plan._id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan._id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border transition shrink-0 flex items-center gap-2 ${
                    activePlan?._id === plan._id
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white"
                  }`}
                >
                  <span>{plan.title}</span>
                  {plan.isActive && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {activePlan && (
            <div className="space-y-6">
              {/* Plan Summary & Macros */}
              <div className="glass-card rounded-3xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-bold text-white">
                        {activePlan.title}
                      </h2>
                      <StatusBadge
                        status={activePlan.isActive ? "active" : "inactive"}
                      />
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                        {formatGoal(activePlan.goal)}
                      </span>
                    </div>
                    {activePlan.notes && (
                      <p className="text-sm text-slate-300 mt-2">
                        {activePlan.notes}
                      </p>
                    )}
                    {activePlan.restrictions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {activePlan.restrictions.map((r) => (
                          <span
                            key={r}
                            className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-200"
                          >
                            Restriction: {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 px-5 py-3.5 text-left sm:text-right shrink-0">
                    <p className="text-xs text-slate-400 flex items-center sm:justify-end gap-1.5">
                      <FlameIcon className="w-4 h-4 text-amber-400" />
                      Daily Calorie Target
                    </p>
                    <p className="text-2xl font-extrabold text-white font-mono tabular-nums mt-0.5">
                      {activePlan.dailyCalorieTarget} kcal
                    </p>
                    <p className="text-xs text-emerald-300 mt-0.5">
                      Planned: {macroTotals.calories} kcal ({caloriePct}%)
                    </p>
                  </div>
                </div>

                {/* Macro Tiles */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/25 p-4 text-center">
                    <p className="text-xs text-indigo-200 font-medium">Protein</p>
                    <p className="text-xl font-bold text-white font-mono tabular-nums mt-1">
                      {macroTotals.protein}g
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 text-center">
                    <p className="text-xs text-amber-200 font-medium">Carbs</p>
                    <p className="text-xl font-bold text-white font-mono tabular-nums mt-1">
                      {macroTotals.carbs}g
                    </p>
                  </div>
                  <div className="rounded-2xl bg-sky-500/10 border border-sky-500/25 p-4 text-center">
                    <p className="text-xs text-sky-200 font-medium">Fats</p>
                    <p className="text-xl font-bold text-white font-mono tabular-nums mt-1">
                      {macroTotals.fats}g
                    </p>
                  </div>
                </div>
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(activePlan.dailyMeals || []).map((meal, idx) => {
                  const mealCals = (meal.items || []).reduce(
                    (s, i) => s + Number(i.calories || 0),
                    0
                  );
                  return (
                    <div
                      key={`${meal.mealType}-${idx}`}
                      className="glass-card rounded-2xl p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-white">
                            {formatMealType(meal.mealType)}
                          </h3>
                          {meal.time && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {meal.time}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25">
                          {mealCals} kcal
                        </span>
                      </div>

                      <div className="divide-y divide-slate-800/80">
                        {(meal.items || []).map((item, i) => (
                          <div key={`${item.name}-${i}`} className="py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-white">
                                {item.name}{" "}
                                <span className="text-xs font-normal text-slate-400">
                                  · {item.quantity}
                                </span>
                              </p>
                              <span className="text-xs font-mono text-slate-200">
                                {item.calories ? `${item.calories} kcal` : "—"}
                              </span>
                            </div>
                            {(item.protein || item.carbs || item.fats) ? (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                P: {item.protein || 0}g · C: {item.carbs || 0}g · F:{" "}
                                {item.fats || 0}g
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      {meal.notes && (
                        <p className="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                          {meal.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DietPlansPage;
