@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0%"=="" (SET "__MVNW_ARG0=%~0")

@SETLOCAL
@SET ERROR_CODE=0

@REM Set local scope for the variables with windows NT shell
@IF "%OS%"=="Windows_NT" @SETLOCAL

@REM ==== START VALIDATION ====
@IF NOT "%JAVA_HOME%"=="" GOTO OkJHome

@FOR %%i IN (java.exe) DO @SET JAVACMD=%%~$PATH:i
@IF NOT "%JAVACMD%"=="" GOTO OkJHome

@ECHO Error: JAVA_HOME is not set and no 'java' command could be found in your PATH.
@ECHO Please set the JAVA_HOME variable in your environment to match a valid JDK.
@GOTO error

:OkJHome
@IF "%JAVACMD%"=="" SET "JAVACMD=%JAVA_HOME%\bin\java.exe"

@IF EXIST "%JAVACMD%" GOTO OkJava
@ECHO Error: JAVA_HOME is set to an invalid directory.
@ECHO JAVA_HOME = "%JAVA_HOME%"
@GOTO error

:OkJava
@SET "MAVEN_PROJECTBASEDIR=%~dp0"
@IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

@REM Fallback: if standard mvn exists in path, execute it
@FOR %%i IN (mvn.cmd) DO @SET MVNCMD=%%~$PATH:i
@IF NOT "%MVNCMD%"=="" (
    "%MVNCMD%" %*
    @GOTO end
)

@FOR %%i IN (mvn.bat) DO @SET MVNCMD=%%~$PATH:i
@IF NOT "%MVNCMD%"=="" (
    "%MVNCMD%" %*
    @GOTO end
)

@FOR %%i IN (mvn) DO @SET MVNCMD=%%~$PATH:i
@IF NOT "%MVNCMD%"=="" (
    "%MVNCMD%" %*
    @GOTO end
)

@ECHO [INFO] Running Maven Wrapper...
@ECHO [INFO] To run the application, install Maven or run via your preferred IDE (e.g. IntelliJ IDEA, Eclipse, VS Code).
@ECHO [INFO] Alternatively run: mvn spring-boot:run

:error
@SET ERROR_CODE=1

:end
@EXIT /B %ERROR_CODE%
