import cron from "node-cron";
import Member from "../models/member.model.js"
import Attendance from "../models/attendance.model.js";
import Notification from "../models/notification.model.js";


const memberShipExpiryAlertJob = () => {
    cron.schedule("0 0 * * *", async () => {
        console.log("⏰ Running membership expiry check...");

        try{
            const today = new Date();
            today.setHours(0,0,0,0);

            const alertDate = new Date(today);
            alertDate.setDate(today.getDate() + 7);

            const expiringMembers = await Member.find({
                membershipEnd : { $gte : today, $lte : alertDate},
                membershipStatus : "active",
                expiryAlertSent : false,
            }).populate("user", "name");

            for(const member of expiringMembers) {
                const dayLeft = Math.ceil(
                    (member.membershipEnd - today)/(1000 * 60 * 60 * 24)
                );

                await Notification.create({
                    recipient : member.user._id,
                    type : "membership_expiry",
                    title : "Membership Expiring soon",
                    message : `Your Membership expires in ${dayLeft} day ${dayLeft > 1 ? "s" : ""}. Renew now to avoid interruption.`,
                });

                member.expiryAlertSent = true;
                await member.save();
                
                console.log(`Expiry alert sent to ${member.user.name}`);
            }

            console.log(`Expiry check done. ${expiringMembers.length} alert(s) sent.`);
        }catch (error) {
            console.error("Membership ExpiryDate job failed", error.message);
        }
    })
   
}


const markExpiredMembershipsJob = () => {
  cron.schedule("5 0 * * *", async () => {
    console.log("⏰ Running expired membership update...");
 
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
 
      // Find members who are still marked "active" but their end date has passed
      const expiredMembers = await Member.find({
        membershipEnd: { $lt: today },
        membershipStatus: "active",
      }).populate("user", "name");
 
      for (const member of expiredMembers) {
        member.membershipStatus = "expired";
        await member.save();
 
        // Notify them that membership has now expired
        await Notification.create({
          recipient: member.user._id,
          type: "membership_expired",
          title: "Membership Expired",
          message: "Your membership has expired. Please renew to continue using the gym.",
          link: "/membership/renew",
        });
 
        console.log(`✅ Marked ${member.user.name}'s membership as expired`);
      }
 
      console.log(`✅ Expiry update done. ${expiredMembers.length} membership(s) expired.`);
    } catch (err) {
      console.error("❌ Mark expired memberships job failed:", err.message);
    }
  });
};

const missedSessionAlertJob = () => {
  cron.schedule("0 23 * * *", async () => {
    console.log("⏰ Running missed session check...");
 
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
 
      // Get IDs of all members who DID check in today
      const presentToday = await Attendance.find({ date: today }).select("member");
      const presentMemberIds = presentToday.map((a) => a.member.toString());
 
      // Find all active members who are NOT in the present list
      // $nin = "not in" — MongoDB operator for "not in this array"
      const absentMembers = await Member.find({
        membershipStatus: "active",
        _id: { $nin: presentMemberIds },
      }).populate("user", "name");
 
      for (const member of absentMembers) {
        // Create an absence record for today
        // This lets trainers see attendance history even for days with no check-in
        const existingRecord = await Attendance.findOne({
          member: member._id,
          date: today,
        });
 
        // Only create if no record exists yet (avoid duplicates)
        if (!existingRecord) {
          await Attendance.create({
            member: member._id,
            date: today,
            status: "absent",
            missedAlertSent: true, // mark alert as sent immediately
          });
        }
 
        // Notify the member
        await Notification.create({
          recipient: member.user._id,
          type: "missed_session",
          title: "Missed Workout Today",
          message: "You missed your workout today. Stay consistent to reach your goals!",
        });
 
        console.log(`✅ Missed session alert sent to ${member.user.name}`);
      }
 
      console.log(`✅ Missed session check done. ${absentMembers.length} alert(s) sent.`);
    } catch (err) {
      console.error("❌ Missed session job failed:", err.message);
    }
  });
};

const initScheduledJobs = () => {
  memberShipExpiryAlertJob();
  markExpiredMembershipsJob();
  missedSessionAlertJob();
  console.log("✅ Scheduled jobs initialized");
};
 
export default initScheduledJobs;
 
