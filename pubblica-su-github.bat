@echo off
cd /d "%~dp0"

set "GIT_EXE=git"
where git >nul 2>nul
if errorlevel 1 (
  if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe" (
    set "GIT_EXE=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe"
  ) else (
    echo Git non trovato su questo PC.
    pause
    exit /b 1
  )
)

echo ========================================================
echo   PUBBLICAZIONE APP ISTRUTTORI SU GITHUB
echo ========================================================
echo.

if not exist ".git" (
  echo Inizializzazione repository Git locale...
  "%GIT_EXE%" init -b main
)

echo Preparazione file...
"%GIT_EXE%" add -A
"%GIT_EXE%" diff --cached --quiet
if errorlevel 1 (
  "%GIT_EXE%" commit -m "Aggiornamento App Staff Istruttori"
)

"%GIT_EXE%" remote get-url origin >nul 2>nul
if errorlevel 1 (
  echo.
  echo NOTA: Il repository remoto GitHub non e ancora collegato.
  echo Crea un nuovo repository su GitHub (es. dinamica-sport-istruttori)
  echo ed esegui una volta sola questo comando:
  echo.
  echo git remote add origin https://github.com/Lucapp86/dinamica-sport-istruttori.git
  echo.
  pause
  exit /b 0
)

echo Invio aggiornamenti su GitHub...
"%GIT_EXE%" push -u origin main
echo.
if errorlevel 1 (
  echo Si e verificato un problema durante il push. Controlla il messaggio qui sopra.
) else (
  echo Pubblicazione completata con successo!
  echo Entro 1 minuto il sito online sara aggiornato e accessibile a tutti gli istruttori.
)
pause
