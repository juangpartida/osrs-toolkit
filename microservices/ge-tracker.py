import requests
import json
import zmq

def fetch_ge_item(item_id):
    """Fetch item details from the Grand Exchange API using item ID."""
    url = f"https://services.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item={item_id}"
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f"\u274c Error fetching GE data: {response.status_code}")
        return {"error": f"Failed to fetch item data for ID {item_id}"}

    try:
        data = response.json()
        if "item" not in data:
            return {"error": "Invalid item data received"}
            
        return format_ge_data(data["item"])
    except json.JSONDecodeError:
        return {"error": "Invalid response from GE API"}

def format_ge_data(item):
    """Format the Grand Exchange data into a structured response."""
    return {
        "ID": item.get("id", "N/A"),
        "Name": item.get("name", "N/A"),
        "Description": item.get("description", "N/A"),
        "Type": item.get("type", "N/A"),
        "Members Only": item.get("members", "unknown") == "true",
        "Icon": item.get("icon_large", ""),
        "Current Price": item.get("current", {}).get("price", "N/A"),
        "Today's Change": item.get("today", {}).get("price", "0"),
        "30-Day Trend": item.get("day30", {}).get("change", "0%"),
        "90-Day Trend": item.get("day90", {}).get("change", "0%"),
        "180-Day Trend": item.get("day180", {}).get("change", "0%")
    }

# ZeroMQ Server Setup
context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://127.0.0.1:5559")

print("\U0001F7E2 GE Tracker Microservice running on port 5559...")

while True:
    try:
        message = socket.recv_json()
        print(f"🔍 Received JSON message: {json.dumps(message, indent=2)}")  # Debugging log

        item_id = message.get("item_id", "").strip()
        print(f"📡 Extracted item_id: '{item_id}'")

        if not item_id:
            response = {"error": "No item ID provided"}
        elif not item_id.isdigit():
            response = {"error": "Invalid item ID"}
        else:
            response = fetch_ge_item(item_id)
            
        print(f"📤 FINAL RESPONSE SENT:\n{json.dumps(response, indent=2)}")  
        socket.send_json(response)

    except json.JSONDecodeError:
        print("❌ Error: Failed to decode JSON message")
        socket.send_json({"error": "Invalid JSON format received"})
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        socket.send_json({"error": f"Internal server error: {str(e)}"})

# import requests
# import json
# import zmq

# def fetch_ge_item(item_id):
#     """Fetch item details from the Grand Exchange API using item ID."""
#     url = f"https://services.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item={item_id}"
#     response = requests.get(url)
    
#     if response.status_code != 200:
#         print(f"\u274c Error fetching GE data: {response.status_code}")
#         return {"error": f"Failed to fetch item data for ID {item_id}"}

#     try:
#         data = response.json()
#         if "item" not in data:
#             return {"error": "Invalid item data received"}
            
#         return format_ge_data(data["item"])
#     except json.JSONDecodeError:
#         return {"error": "Invalid response from GE API"}

# def format_ge_data(item):
#     """Format the Grand Exchange data into a structured response."""
#     return {
#         "ID": item.get("id", "N/A"),
#         "Name": item.get("name", "N/A"),
#         "Description": item.get("description", "N/A"),
#         "Type": item.get("type", "N/A"),
#         "Members Only": item.get("members", "unknown") == "true",
#         "Icon": item.get("icon_large", ""),
#         "Current Price": item.get("current", {}).get("price", "N/A"),
#         "Today's Trend": {
#             "Trend": item.get("today", {}).get("trend", "neutral"),
#             "Change": item.get("today", {}).get("price", "0")
#         },
#         "30-Day Trend": {
#             "Trend": item.get("day30", {}).get("trend", "neutral"),
#             "Change": item.get("day30", {}).get("change", "0%")
#         },
#         "90-Day Trend": {
#             "Trend": item.get("day90", {}).get("trend", "neutral"),
#             "Change": item.get("day90", {}).get("change", "0%")
#         },
#         "180-Day Trend": {
#             "Trend": item.get("day180", {}).get("trend", "neutral"),
#             "Change": item.get("day180", {}).get("change", "0%")
#         }
#     }

# # ZeroMQ Server Setup
# context = zmq.Context()
# socket = context.socket(zmq.REP)
# socket.bind("tcp://127.0.0.1:5559")

# print("\U0001F7E2 GE Tracker Microservice running on port 5559...")

# while True:
#     try:
#         message = socket.recv_json()
#         print(f"🔍 Received request: {message}")

#         item_id = message.get("item_id", "").strip()
#         if not item_id:
#             response = {"error": "No item ID provided"}
#         elif not item_id.isdigit():
#             response = {"error": "Invalid item ID"}
#         else:
#             response = fetch_ge_item(item_id)
            
#         print(f"📤 Sending response: {json.dumps(response, indent=2)}")
#         socket.send_json(response)

#     except json.JSONDecodeError:
#         print("❌ Error: Failed to decode JSON message")
#         socket.send_json({"error": "Invalid JSON format received"})
#     except Exception as e:
#         print(f"❌ Error: {str(e)}")
#         socket.send_json({"error": f"Internal server error: {str(e)}"})
