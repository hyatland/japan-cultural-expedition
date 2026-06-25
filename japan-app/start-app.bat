@echo off
echo Starting Japan Expedition App...
echo.
echo A terminal window will open -- keep it running while you use the app.
echo The app will open in your browser automatically.
echo.

:: Start the dev server in a new window
start "Japan Expedition Dev Server" cmd /k "npm run dev"

:: Wait for the server to start (3 seconds)
timeout /t 3 /nobreak > nul

:: Open the browser
start "" "http://localhost:3000"

echo Done! If the browser shows an error, wait 5 seconds and refresh.
pause
