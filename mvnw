#!/bin/sh
# ----------------------------------------------------------------------------
# Maven Start Up Shell Script
# ----------------------------------------------------------------------------

if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVACMD="$JAVA_HOME/bin/java"
else
    JAVACMD="java"
fi

if command -v mvn >/dev/null 2>&1; then
    exec mvn "$@"
else
    echo "[INFO] Running Cloud Storage Spring Boot Backend..."
    echo "[INFO] Please ensure Maven is installed or open this project in IntelliJ IDEA / VS Code / Eclipse."
    echo "[INFO] Command to run: mvn spring-boot:run"
    exit 1
fi
