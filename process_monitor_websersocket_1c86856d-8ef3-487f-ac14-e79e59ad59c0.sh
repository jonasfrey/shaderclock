pid_websersocket=$(pgrep -f "websersocket_1c86856d-8ef3-487f-ac14-e79e59ad59c0.js")
watch -n 1 ps -p $pid_websersocket -o pid,etime,%cpu,%mem,cmd