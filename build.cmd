@echo Off
pushd %~dp0
setlocal

:Build

:: https://stackoverflow.com/a/27014081 answering https://stackoverflow.com/questions/10686737/check-whether-command-is-available-in-batch-file/27014081#27014081
call where yarn >nul 2>nul
if %ERRORLEVEL% == 1 (
  call npm install
) else (
  call yarn install
)

call npm run validate
if %ERRORLEVEL% neq 0 goto BuildFail

goto BuildSuccess

:BuildFail
echo.
echo *** BUILD FAILED ***
goto End

:BuildSuccess
echo.
echo *** BUILD SUCCEEDED ***
goto End

:End
echo.
popd
exit /B %ERRORLEVEL%
