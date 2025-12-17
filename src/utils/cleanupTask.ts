import { ScheduledTask } from "node-cron";
import cron from "node-cron"
import {cleanupSchedule} from "../db/queries"

let cleanupTask : ScheduledTask | null = null
//Database Query to clean up expired sessions

export function sessionCleanup(){
    if(!cleanupTask){
        cleanupTask = cron.schedule("* * * * *", cleanupSchedule);
    }
}