@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo    DEPLOIEMENT PGM
echo ============================================
echo.

REM 1. Lever un eventuel verrou git laisse par un autre outil
if exist ".git\index.lock" del ".git\index.lock"

REM 2. Se placer sur la branche de production
git checkout main
if errorlevel 1 goto erreur

REM 3. Ajouter toutes les modifications preparees (Mobilic, docs, etc.)
git add -A
if errorlevel 1 goto erreur

REM 4. Enregistrer (si rien a committer, on continue quand meme vers le push)
git commit -m "feat: onglet Mobilic (acces par utilisateur) + docs agence"

REM 5. Envoyer vers GitHub -> Vercel deploie automatiquement
git push
if errorlevel 1 goto erreur

echo.
echo ============================================
echo    OK ! Deploiement envoye.
echo    Va voir l'onglet Deployments sur Vercel.
echo ============================================
echo.
pause
exit /b 0

:erreur
echo.
echo ============================================
echo    Une commande a echoue. Copie le message
echo    ci-dessus et envoie-le a l'assistant.
echo ============================================
echo.
pause
exit /b 1
