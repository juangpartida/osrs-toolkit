import requests
import urllib.parse
import zmq

def fetch_quest_data(username):
    """ Fetches quest data from the OSRS API for a given username. """
    encoded_username = urllib.parse.quote(username)
    url = f"https://apps.runescape.com/runemetrics/quests?user={encoded_username}"
    response = requests.get(url)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching quest data: {response.status_code}")
        return None

def format_quest_data(data):
    """ Formats the fetched quest data into a clean structure. """
    if "quests" in data and isinstance(data["quests"], list):
        formatted_quests = []
        for quest in data["quests"]:
            formatted_quests.append({
                "Title": quest.get("title", "Unknown"),
                "Status": quest.get("status", "Unknown"),
                "Difficulty": quest.get("difficulty", "N/A"),
                "Quest Points": quest.get("questPoints", 0),
                "Members Only": "Yes" if quest.get("members", False) else "No",
                "Eligible to Start": "Yes" if quest.get("userEligible", False) else "No"
            })
        return formatted_quests
    return {"error": "No quest data available."}

# ZeroMQ Setup
context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://127.0.0.1:5556")

print("Quest Tracker Microservice is running on port 5556...")

while True:
    # Receive request from Electron
    message = socket.recv_json()
    username = message.get("username", "")

    print(f"Received quest request for: {username}")

    # Fetch and format quest data
    raw_data = fetch_quest_data(username)
    formatted_data = format_quest_data(raw_data) if raw_data else {"error": "No quest data found"}

    # Send response back to Electron
    socket.send_json(formatted_data)

print(f"Received quest request for: {username}")

