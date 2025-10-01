@echo off
REM Complete cleanup for RawaLite builds
echo Starting complete cleanup...

echo 1/3 - Stopping processes...
call scripts\clean-processes.cmd

echo 2/3 - Cleaning build artifacts...
call pnpm clean

echo 3/3 - Cleaning release directory...
call pnpm clean:release

echo Complete cleanup finished!
exit /b 0