#!/bin/bash

# Twirp Proto Tester Service Management Script

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

case "$1" in
    start)
        echo "Starting Twirp Proto Tester service..."
        cd "$SCRIPT_DIR"
        pm2 start ecosystem.config.js
        ;;
    stop)
        echo "Stopping Twirp Proto Tester service..."
        pm2 stop twirp-proto-tester
        ;;
    restart)
        echo "Restarting Twirp Proto Tester service..."
        pm2 restart twirp-proto-tester
        ;;
    status)
        echo "Twirp Proto Tester service status:"
        pm2 status twirp-proto-tester
        ;;
    logs)
        echo "Showing Twirp Proto Tester service logs..."
        pm2 logs twirp-proto-tester
        ;;
    monitor)
        echo "Opening PM2 monitor..."
        pm2 monit
        ;;
    reload)
        echo "Reloading service without downtime..."
        pm2 reload twirp-proto-tester
        ;;
    info)
        echo "Service information:"
        pm2 describe twirp-proto-tester
        ;;
    open)
        echo "Opening service in browser..."
        open http://localhost:8765
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|monitor|reload|info|open}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the service"
        echo "  stop     - Stop the service"
        echo "  restart  - Restart the service"
        echo "  status   - Show service status"
        echo "  logs     - Show service logs"
        echo "  monitor  - Open PM2 monitor"
        echo "  reload   - Reload service without downtime"
        echo "  info     - Show detailed service information"
        echo "  open     - Open service in browser"
        exit 1
        ;;
esac

exit 0
