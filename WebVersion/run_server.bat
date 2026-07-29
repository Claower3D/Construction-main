@echo off
pushd "%~dp0"
:: Try to use Python if available
python -c "import sys; sys.exit(0)" 2>nul && (
    echo Starting Python HTTP server on port 8000...
    python -m http.server 8000
) || (
    echo Python not found. Trying Node.js serve...
    npx -y serve . -l 8000
)
popd
