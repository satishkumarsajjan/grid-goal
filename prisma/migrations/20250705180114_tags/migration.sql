-- CreateEnum
CREATE TYPE "TimerMode" AS ENUM ('STOPWATCH', 'POMODORO');

-- CreateEnum
CREATE TYPE "PomodoroCycle" AS ENUM ('WORK', 'SHORT_BREAK', 'LONG_BREAK');

-- AlterTable
ALTER TABLE "FocusSession" ADD COLUMN     "mode" "TimerMode" NOT NULL DEFAULT 'STOPWATCH',
ADD COLUMN     "pomodoroCycle" "PomodoroCycle";
