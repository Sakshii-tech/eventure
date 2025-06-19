#!/bin/bash

# Default values
ALICE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsImVtYWlsIjoidGVzdDNAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTAzMTI3MjAsImV4cCI6MTc1MDkxNzUyMH0.1p7Epccnq3T-tPeInjz60dk9HJ-0lLxVCY59MkiB-fg"
BOB_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsImVtYWlsIjoiZnJpZW5kQGV4YW1wbGUuY29tIiwiaWF0IjoxNzUwMzEzMzAzLCJleHAiOjE3NTA5MTgxMDN9.zptepfiShQ4xCiAIEDHO8pbTVUcT4ELhTqkmRmYpkVg"

# Function to create an event
create_event() {
    local title="$1"
    local image_path="$2"
    
    echo "Creating event: $title"
    echo "Using image: $image_path"
    
    curl -X POST http://localhost:3000/events \
        -H "Authorization: Bearer $ALICE_TOKEN" \
        -F "title=$title" \
        -F "media=@$image_path"
    
    echo -e "\n"
}

# Function to acknowledge an event
acknowledge_event() {
    local event_id="$1"
    
    echo "Acknowledging event: $event_id"
    
    curl -X POST "http://localhost:3000/events/$event_id/open" \
        -H "Authorization: Bearer $BOB_TOKEN"
    
    echo -e "\n"
}

# Check command line arguments
case "$1" in
    "create")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 create <title> <image_path>"
            exit 1
        fi
        create_event "$2" "$3"
        ;;
    "acknowledge")
        if [ -z "$2" ]; then
            echo "Usage: $0 acknowledge <event_id>"
            exit 1
        fi
        acknowledge_event "$2"
        ;;
    *)
        echo "Usage: $0 <command> [args]"
        echo "Commands:"
        echo "  create <title> <image_path>    Create a new event"
        echo "  acknowledge <event_id>         Acknowledge an event"
        exit 1
        ;;
esac
