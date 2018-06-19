@echo Off
pushd %~dp0
setlocal

:Build

call gem install bundler
if %ERRORLEVEL% neq 0 goto BuildFail

call bundle install
if %ERRORLEVEL% neq 0 goto BuildFail

call npm install
if %ERRORLEVEL% neq 0 goto BuildFail

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
