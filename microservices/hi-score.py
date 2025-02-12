import requests
import zmq

# OSRS HiScores API Skill and Activity order
SKILLS = [
    "Overall", "Attack", "Defence", "Strength", "Hitpoints", "Ranged",
    "Prayer", "Magic", "Cooking", "Woodcutting", "Fletching", "Fishing",
    "Firemaking", "Crafting", "Smithing", "Mining", "Herblore", "Agility",
    "Thieving", "Slayer", "Farming", "Runecraft", "Hunter", "Construction"
]

ACTIVITIES = [
    "League Points", "Deadman Points", "Bounty Hunter - Hunter", "Bounty Hunter - Rogue",
    "Bounty Hunter (Legacy) - Hunter", "Bounty Hunter (Legacy) - Rogue", "Clue Scrolls (all)",
    "Clue Scrolls (beginner)", "Clue Scrolls (easy)", "Clue Scrolls (medium)", "Clue Scrolls (hard)",
    "Clue Scrolls (elite)", "Clue Scrolls (master)", "LMS - Rank", "PvP Arena - Rank",
    "Soul Wars Zeal", "Rifts closed", "Colosseum Glory", "Collections Logged",
    "Abyssal Sire", "Alchemical Hydra", "Artio", "Barrows Chests", "Bryophyta", "Callisto",
    "Cerberus", "Chambers of Xeric", "Chambers of Xeric: Challenge Mode", "Chaos Elemental",
    "Chaos Fanatic", "Commander Zilyana", "Corporeal Beast", "Crazy Archaeologist",
    "Dagannoth Prime", "Dagannoth Rex", "Dagannoth Supreme", "Deranged Archaeologist",
    "Duke Sucellus", "General Graardor", "Giant Mole", "Grotesque Guardians", "Hespori",
    "Kalphite Queen", "King Black Dragon", "Kraken", "Kree'Arra", "K'ril Tsutsaroth",
    "Lunar Chests", "Mimic", "Nex", "Nightmare", "Phosani's Nightmare", "Obor",
    "Phantom Muspah", "Sarachnis", "Scorpia", "Scurrius", "Skotizo", "Sol Heredit",
    "Spindel", "Tempoross", "The Gauntlet", "The Corrupted Gauntlet", "The Hueycoatl",
    "The Leviathan", "The Royal Titans", "The Whisperer", "Theatre of Blood",
    "Theatre of Blood: Hard Mode", "Thermonuclear Smoke Devil", "Tombs of Amascut",
    "Tombs of Amascut: Expert Mode", "TzKal-Zuk", "TzTok-Jad", "Vardorvis", "Venenatis",
    "Vet'ion", "Vorkath", "Wintertodt", "Zalcano", "Zulrah"
]

def fetch_hiscore_ranking(username):
    """Fetch OSRS HiScores for the given username."""
    encoded_username = username.replace(" ", "_")
    url = f"https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player={encoded_username}"
    
    response = requests.get(url)
    if response.status_code != 200:
        print(f"❌ Error fetching HiScores for {username}: {response.status_code}")
        return None

    hiscore_lines = response.text.strip().split("\n")
    if len(hiscore_lines) < len(SKILLS) + len(ACTIVITIES):
        print(f"⚠️ Incomplete HiScore data for {username}.")
        return None

    skills = {}
    for i in range(len(SKILLS)):
        try:
            _, level, xp = hiscore_lines[i].split(",")  # Ignore rank
            skills[SKILLS[i]] = {
                "Level": int(level),
                "Experience": int(xp)
            }
        except ValueError:
            print(f"⚠️ Error parsing skill {SKILLS[i]}: {hiscore_lines[i]}")
            skills[SKILLS[i]] = {
                "Level": 0,
                "Experience": 0
            }

    activities = {}
    for i in range(len(SKILLS), len(SKILLS) + len(ACTIVITIES)):
        try:
            _, score = hiscore_lines[i].split(",")  # Ignore rank
            activities[ACTIVITIES[i - len(SKILLS)]] = int(score)
        except ValueError:
            print(f"⚠️ Error parsing activity {ACTIVITIES[i - len(SKILLS)]}: {hiscore_lines[i]}")
            activities[ACTIVITIES[i - len(SKILLS)]] = 0

    return {"skills": skills, "activities": activities}

# ZeroMQ Setup
context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://127.0.0.1:5558")

print("🟢 Hi-Score Microservice Running on port 5558...")

while True:
    try:
        message = socket.recv_json()
        username = message.get("username", "").strip()

        print(f"📡 Received request for: {username}")

        if not username:
            response = {"error": "Invalid username"}
        else:
            ranking_data = fetch_hiscore_ranking(username)
            response = ranking_data if ranking_data else {"error": "No ranking data found"}

        socket.send_json(response)
    except Exception as e:
        print(f"❌ ZeroMQ Error: {e}")
        socket.send_json({"error": "Internal server error"})


# import requests
# import zmq

# # OSRS HiScores API Skill and Activity order

# ACTIVITIES = [
#     "League Points", "Deadman Points", "Bounty Hunter - Hunter", "Bounty Hunter - Rogue",
#     "Bounty Hunter (Legacy) - Hunter", "Bounty Hunter (Legacy) - Rogue", "Clue Scrolls (all)",
#     "Clue Scrolls (beginner)", "Clue Scrolls (easy)", "Clue Scrolls (medium)", "Clue Scrolls (hard)",
#     "Clue Scrolls (elite)", "Clue Scrolls (master)", "LMS - Rank", "PvP Arena - Rank",
#     "Soul Wars Zeal", "Rifts closed", "Colosseum Glory", "Collections Logged",
#     "Abyssal Sire", "Alchemical Hydra", "Artio", "Barrows Chests", "Bryophyta", "Callisto",
#     "Cerberus", "Chambers of Xeric", "Chambers of Xeric: Challenge Mode", "Chaos Elemental",
#     "Chaos Fanatic", "Commander Zilyana", "Corporeal Beast", "Crazy Archaeologist",
#     "Dagannoth Prime", "Dagannoth Rex", "Dagannoth Supreme", "Deranged Archaeologist",
#     "Duke Sucellus", "General Graardor", "Giant Mole", "Grotesque Guardians", "Hespori",
#     "Kalphite Queen", "King Black Dragon", "Kraken", "Kree'Arra", "K'ril Tsutsaroth",
#     "Lunar Chests", "Mimic", "Nex", "Nightmare", "Phosani's Nightmare", "Obor",
#     "Phantom Muspah", "Sarachnis", "Scorpia", "Scurrius", "Skotizo", "Sol Heredit",
#     "Spindel", "Tempoross", "The Gauntlet", "The Corrupted Gauntlet", "The Hueycoatl",
#     "The Leviathan", "The Royal Titans", "The Whisperer", "Theatre of Blood",
#     "Theatre of Blood: Hard Mode", "Thermonuclear Smoke Devil", "Tombs of Amascut",
#     "Tombs of Amascut: Expert Mode", "TzKal-Zuk", "TzTok-Jad", "Vardorvis", "Venenatis",
#     "Vet'ion", "Vorkath", "Wintertodt", "Zalcano", "Zulrah"
# ]

# SKILLS = [
#     "Overall", "Attack", "Defence", "Strength", "Hitpoints", "Ranged",
#     "Prayer", "Magic", "Cooking", "Woodcutting", "Fletching", "Fishing",
#     "Firemaking", "Crafting", "Smithing", "Mining", "Herblore", "Agility",
#     "Thieving", "Slayer", "Farming", "Runecraft", "Hunter", "Construction"
# ]

# def fetch_hiscore_ranking(username):
#     """Fetch OSRS HiScores for the given username."""
#     encoded_username = username.replace(" ", "_")
#     url = f"https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player={encoded_username}"
    
#     response = requests.get(url)
#     if response.status_code != 200:
#         print(f"❌ Error fetching HiScores for {username}: {response.status_code}")
#         return None

#     hiscore_lines = response.text.strip().split("\n")
#     if len(hiscore_lines) < len(SKILLS) + len(ACTIVITIES):
#         print(f"⚠️ Incomplete HiScore data for {username}.")
#         return None

#     skills = []
#     for i in range(len(SKILLS)):
#         try:
#             rank, level, xp = hiscore_lines[i].split(",")
#             skills.append({
#                 "name": SKILLS[i],
#                 "rank": int(rank),
#                 "level": int(level),
#                 "xp": int(xp)
#             })
#         except ValueError:
#             print(f"⚠️ Error parsing skill {SKILLS[i]}: {hiscore_lines[i]}")
#             skills.append({
#                 "name": SKILLS[i],
#                 "rank": -1,
#                 "level": 0,
#                 "xp": 0
#             })

#     activities = []
#     for i in range(len(SKILLS), len(SKILLS) + len(ACTIVITIES)):
#         try:
#             rank, score = hiscore_lines[i].split(",")
#             activities.append({
#                 "name": ACTIVITIES[i - len(SKILLS)],
#                 "rank": int(rank),
#                 "score": int(score)
#             })
#         except ValueError:
#             print(f"⚠️ Error parsing activity {ACTIVITIES[i - len(SKILLS)]}: {hiscore_lines[i]}")
#             activities.append({
#                 "name": ACTIVITIES[i - len(SKILLS)],
#                 "rank": -1,
#                 "score": 0
#             })

#     return {"activities": activities, "skills": skills}

# # ZeroMQ Setup
# context = zmq.Context()
# socket = context.socket(zmq.REP)
# socket.bind("tcp://127.0.0.1:5558")

# print("🟢 Hi-Score Microservice Running on port 5558...")

# while True:
#     try:
#         message = socket.recv_json()
#         username = message.get("username", "").strip()

#         print(f"📡 Received request for: {username}")

#         if not username:
#             response = {"error": "Invalid username"}
#         else:
#             ranking_data = fetch_hiscore_ranking(username)
#             response = ranking_data if ranking_data else {"error": "No ranking data found"}

#         socket.send_json(response)
#     except Exception as e:
#         print(f"❌ ZeroMQ Error: {e}")
#         socket.send_json({"error": "Internal server error"})

# -------------------------------------------------------------------------

# import requests
# import urllib.parse
# import zmq

# def fetch_hiscore_ranking(username):
#     encoded_username = username.replace(" ", "+")
#     url = f"https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player={encoded_username}"
#     response = requests.get(url)
#     return response.json() if response.status_code == 200 and response.text.strip() else None

# def display_hiscore_ranking(data, username):
#     if not isinstance(data, dict) or "skills" not in data:
#         print(f"⚠️ No valid Hiscore data found for {username}.")
#         return
    
#     print(f"\n🏆 OSRS Hiscore Ranking for {username}\n")
    
#     for skill in data["skills"]:
#         skill_name = skill["name"]
#         rank = skill["rank"]
#         level = skill["level"]
#         xp = skill["xp"]
        
#         print(f"🔹 {skill_name}: Rank {rank} | Level {level} | XP: {xp}")

# context = zmq.Context()
# socket = context.socket(zmq.REP)
# socket.bind("tcp://127.0.0.1:5558")

# while True:
#     message = socket.recv_json()
#     username = message.get("username", "")
#     data = fetch_hiscore_ranking(username)
#     response = data if data else {"error": "No ranking data found"}
#     socket.send_json(response)

# import requests
# import urllib.parse

# def fetch_hiscore_ranking(username):
#     encoded_username = username.replace(" ", "+")  # Encode spaces correctly
#     url = f"https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player={encoded_username}"
#     response = requests.get(url)

#     if response.status_code == 200 and response.text.strip():  # Ensure data exists
#         return response.json()
#     else:
#         print(f"⚠️ No Hiscore ranking data available for {username}.")
#         return None

# def display_hiscore_ranking(data, username):
#     if not isinstance(data, dict) or "skills" not in data:
#         print(f"⚠️ No valid Hiscore data found for {username}.")
#         return
    
#     print(f"\n🏆 OSRS Hiscore Ranking for {username}\n")
    
#     for skill in data["skills"]:
#         skill_name = skill["name"]
#         rank = skill["rank"]
#         level = skill["level"]
#         xp = skill["xp"]
        
#         print(f"🔹 {skill_name}: Rank {rank} | Level {level} | XP: {xp}")

# # Fetch and display Hiscore ranking for "Its Yami"
# username = "Its Yami"
# hiscore_data = fetch_hiscore_ranking(username)

# if hiscore_data:
#     display_hiscore_ranking(hiscore_data, username)
