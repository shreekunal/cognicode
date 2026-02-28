#!/bin/bash

# =============================================
# CogniCode — Start All Servers
# =============================================
# Starts: Next.js  |  Python AI Backend
#
# Usage:
#   ./start-all.sh          Start all servers
#   ./start-all.sh --stop   Stop all servers
#   ./start-all.sh --status Check running servers
# =============================================

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

stop_servers() {
  echo -e "${RED}Stopping all servers...${NC}"
  pkill -f "next dev" 2>/dev/null
  pkill -f "python3 main.py" 2>/dev/null
  echo -e "${GREEN}All servers stopped.${NC}"
}

check_status() {
  echo -e "${BLUE}Server Status:${NC}"
  echo -n "  Next.js        : "
  pgrep -f "next dev" >/dev/null && echo -e "${GREEN}RUNNING${NC}" || echo -e "${RED}STOPPED${NC}"
  echo -n "  Python Backend : "
  pgrep -f "python3 main.py" >/dev/null && echo -e "${GREEN}RUNNING${NC}" || echo -e "${RED}STOPPED${NC}"
}

start_servers() {
  echo -e "${BLUE}==============================================${NC}"
  echo -e "${BLUE}  CogniCode — Starting All Servers${NC}"
  echo -e "${BLUE}==============================================${NC}"
  echo ""

  # ------ Python AI Backend ------
  echo -e "${YELLOW}[1/2] Starting Python AI Backend (port 8000)...${NC}"
  cd "$ROOT_DIR/python-backend"
  if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
  fi
  python3 main.py &
  PYTHON_PID=$!
  sleep 1

  if kill -0 $PYTHON_PID 2>/dev/null; then
    echo -e "${GREEN}  ✓ Python backend running (PID: $PYTHON_PID)${NC}"
  else
    echo -e "${RED}  ✗ Python backend failed to start${NC}"
    echo -e "${RED}    Run: cd python-backend && pip3 install -r requirements.txt --break-system-packages${NC}"
  fi

  # ------ Next.js ------
  echo -e "${YELLOW}[2/2] Starting Next.js dev server (port 3000)...${NC}"
  cd "$ROOT_DIR"
  npx next dev &
  NEXT_PID=$!
  sleep 2

  if kill -0 $NEXT_PID 2>/dev/null; then
    echo -e "${GREEN}  ✓ Next.js dev server running (PID: $NEXT_PID)${NC}"
  else
    echo -e "${RED}  ✗ Next.js dev server failed to start${NC}"
  fi

  echo ""
  echo -e "${BLUE}==============================================${NC}"
  echo -e "${GREEN}  All servers started!${NC}"
  echo -e "${BLUE}==============================================${NC}"
  echo ""
  echo -e "  ${GREEN}Next.js${NC}          → http://localhost:3000"
  echo -e "  ${GREEN}Python Backend${NC}   → http://localhost:8000"
  echo ""
  echo -e "  Stop all:  ${YELLOW}./start-all.sh --stop${NC}"
  echo -e "  Status:    ${YELLOW}./start-all.sh --status${NC}"
  echo ""

  # Wait for all background processes so Ctrl+C kills them together
  trap "stop_servers; exit 0" INT TERM
  wait
}

# ------ Parse arguments ------
case "${1}" in
  --stop)
    stop_servers
    ;;
  --status)
    check_status
    ;;
  *)
    start_servers
    ;;
esac
