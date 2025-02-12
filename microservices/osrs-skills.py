
import requests
import json
import zmq

def fetch_hiscores(username):
    """Fetch OSRS Hiscores for a given username."""
    url = f"https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player={username}"
    response = requests.get(url)

    if response.status_code == 200:
        try:
            return response.json()  # If the API returns JSON
        except json.JSONDecodeError:
            return response.text  # If the API returns CSV
    else:
        print(f"Error fetching Hiscores: {response.status_code}")
        return None

def parse_hiscores(data):
    """Determine whether the response is CSV or JSON and parse accordingly."""
    if isinstance(data, str):  # CSV Format
        return parse_csv_hiscores(data)
    elif isinstance(data, dict) and "stats" in data:  # JSON Format
        return parse_json_hiscores(data)
    else:
        return {"error": "Unexpected data format received."}

def parse_csv_hiscores(data):
    """Parse OSRS Hiscores from CSV format."""
    skills = [
        "Overall", "Attack", "Defence", "Strength", "Hitpoints", "Ranged",
        "Prayer", "Magic", "Cooking", "Woodcutting", "Fletching", "Fishing",
        "Firemaking", "Crafting", "Smithing", "Mining", "Herblore", "Agility",
        "Thieving", "Slayer", "Farming", "Runecrafting", "Hunter", "Construction"
    ]
    
    hiscores = {}
    lines = data.splitlines()
    
    for i, skill in enumerate(skills):
        try:
            rank, level, xp = lines[i].split(",")
            hiscores[skill] = {
                "Rank": int(rank),
                "Level": int(level),
                "Experience": int(xp)
            }
        except ValueError:
            return {"error": f"Error parsing CSV data for {skill}"}
    
    return hiscores

def parse_json_hiscores(data):
    """Parse OSRS Hiscores from JSON format."""
    hiscores = {}
    for skill, stats in data["stats"].items():
        hiscores[skill] = {
            "Rank": stats.get("rank", -1),
            "Level": stats.get("level", 0),
            "Experience": stats.get("xp", 0)
        }
    return hiscores

def zmq_server():
    """ZeroMQ Server to listen for username requests and return OSRS Hiscores."""
    context = zmq.Context()
    socket = context.socket(zmq.REP)  # Reply socket
    socket.bind("tcp://*:5555")  # Bind to port 5555

    print("OSRS Skills Service Running on port 5555...")

    while True:
        username = socket.recv_string()  # Receive username
        print(f"Received request for username: {username}")

        data = fetch_hiscores(username)

        if data:
            hiscores = parse_hiscores(data)
        else:
            hiscores = {"error": "Failed to fetch Hiscores"}

        socket.send_json(hiscores)  # Send parsed Hiscores data back

if __name__ == "__main__":
    zmq_server()

# import requests
# import zmq
# import json

# def fetch_hiscores(username):
#     url = f"https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player={username}"
#     response = requests.get(url)

#     if response.status_code == 200:
#         return response.text
#     else:
#         print(f"[SKILLS] Error fetching Hiscores: {response.status_code}")
#         return None

# def parse_hiscores(data):
#     skills = [
#         "Overall", "Attack", "Defence", "Strength", "Hitpoints", "Ranged",
#         "Prayer", "Magic", "Cooking", "Woodcutting", "Fletching", "Fishing",
#         "Firemaking", "Crafting", "Smithing", "Mining", "Herblore", "Agility",
#         "Thieving", "Slayer", "Farming", "Runecrafting", "Hunter", "Construction"
#     ]

#     hiscores = {}
#     lines = data.splitlines()

#     for i, skill in enumerate(skills):
#         try:
#             rank, level, xp = lines[i].split(",")
#             hiscores[skill] = {
#                 "level": int(level),
#                 "xp": int(xp),
#                 "rank": int(rank)
#             }
#         except ValueError:
#             print(f"[SKILLS] Error parsing skill {skill}: {lines[i]}")

#     return {"stats": hiscores}

# # ZeroMQ Server Setup
# context = zmq.Context()
# socket = context.socket(zmq.REP)
# socket.bind("tcp://127.0.0.1:5557")

# print("[SKILLS] Skill Tracker Microservice running on port 5557...")

# while True:
#     message = socket.recv_json()
#     username = message.get("username", "")
#     print(f"[SKILLS] Received request for username: {username}")

#     raw_data = fetch_hiscores(username)
#     if raw_data:
#         parsed_data = parse_hiscores(raw_data)
#         print(f"[SKILLS] Sending response: {json.dumps(parsed_data, indent=2)}")
#         socket.send_json(parsed_data)
#     else:
#         socket.send_json({"error": "Failed to fetch skill data"})





# # Fetch and display Hiscores
# username = "Its Yami"
# data = fetch_hiscores(username)

# if data:
#     hiscores = parse_hiscores(data)
#     display_hiscores(hiscores)
