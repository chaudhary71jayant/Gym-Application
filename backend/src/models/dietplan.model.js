import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
    mealType : {
        type : String,
        enum : ["breakfast", "morning_snack","lunch", "evening_snack", " dinner", "pre_workout", "post_workout"],
        required : true,
    },
    items : [
        {
            name : {type : String, required : true},
            quantity : { type : String, required : true},
            calories : { type : Number},
            protein : {type : Number},
            carbs : {type : Number},
            fats : {type : Number},
        },
    ],
    time : {
        type : String,
        default : "",
    },
    notes : {
        type : String,
        defautl : "",
    },
});

const dietPlanSchema = new mongoose.Schema({
    title : {
        type : String,
        required : [true, " Diet plan title is required"],
        trim : true,
    },
    createdBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Trainer",
        required : true,
    },
    assignedTo : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Member",
        required : true,
    },
    goal : {
        type : String,
        enum : ["Weight_loss", "muscle_gain", "endurance","maintainance"],
        required : true,
    },
    dailyCalorieTarget : {
        type : Number,
        required : true,
    },
    dailyMeals : [mealSchema],
    restrictions : {
        type : [String],
        default : [],
    },
    notes : {
        type : String,
        default : "",
    },
    isActive : {
        type : Boolean,
        default : true,
    },

}, { timestamps : true });

dietPlanSchema.virtual("totalCalories").get(function () {
    return this.dailyMeals.reduce((total, meal) => {
        const mealCalories = meal.items.reduce((sum, item) => sum + (item.calories || 0), 0);
        return total + mealCalories;
    }, 0);
});

const DietPlan = mongoose.model("DietPlan", dietPlanSchema);

export default DietPlan;
