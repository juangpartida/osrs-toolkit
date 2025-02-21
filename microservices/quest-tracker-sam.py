from urllib.parse import quote
from bs4 import BeautifulSoup
import zmq
import time
import requests

class QuestTracker:
    def __init__(self):
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REP)
        self.socket.bind("tcp://*:5556")
        self.userData = None
    
    def main(self):
        
        while True:
            #Wait for user name to come in
            print('Quest Tracker running...')
            print('Waiting for request...')
            
            #Receive input from the Client
            message = self.socket.recv_json()
            self.userName = message['userName']
            requestType = message['requestType']
            
            print(f'Username {self.userName} recieved.')
            questsURL = f'https://apps.runescape.com/runemetrics/quests?user={self.userName}'
            print('Getting user data...')
            statusCode = requests.get(questsURL)
            print('checking user data...')
            #----------------------------------------------------------------------------------
            # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP 
            # message = {
            #     'userName': 'Prenzlauer',
            #     'requestType': 'eligibility',
            #     'questName': "Cook's Assistant"
            # }
            # self.userName = message['userName']
            # requestType = message['requestType']
            # questName = message['questName']
            
            # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP # TEMP 
            #----------------------------------------------------------------------------------
            
            #server is running and User name is valid
            if statusCode.status_code == 200 and statusCode.text != '{"quests":[],"loggedIn":"false"}':
                
                match requestType:
                    case 'all quests':
                        self.getAllQuests(statusCode)
                        print('Sending all quests...')
                        ##recieve the quest choice or a cancel
                        message = self.socket.recv_json()
                        if message['questName'] is not None:
                            questName = message['questName']
                            self.getQuestDetails(questName, statusCode)
                            
                    # case 'quest details':

                    # case 'eligibility':
                    #     self.userIsEligible(questName)
                    # case _:
                    #     #return JSON with message of Invalid input
                    #     pass

            else:
                #username doesn't exist or status code is not OK
                print(f'Error finding the username\nStatus Code: {statusCode.status_code}\nUser name: self.userName: {self.userName}')
                if statusCode.text == '{"quests":[],"loggedIn":"false"}':
                    self.userName = 'Not Found'

                outputJson = {
                    'userName' : self.userName,
                    'statusCode' : statusCode.status_code
                }
                self.socket.send_json(outputJson)
                continue
    
    def getAllQuests(self, statusCode):
        questJson = statusCode.json()
        questList = []
        
        for quest in range(len(questJson['quests'])):
            questTitle = questJson['quests'][quest]['title']
            questList.append(questTitle)
        
        quests = {'questList': questList}    
        self.socket.send_json(quests)
                
    def getQuestDetails(self, questName, statusCode):
        questDetails = {}
        questJson = statusCode.json()
        
        #look for quest by name
        for quest in range(len(questJson['quests'])):
            if questJson['quests'][quest]['title'] == questName:
                index = quest
                break
        
        #add details to dictionary to send as JSON
        questDetails.update({'title': questName,
                             'status':questJson['quests'][index]['status'],
                             'difficulty':questJson['quests'][index]['difficulty'],
                             'questPoints':questJson['quests'][index]['questPoints'],
                             'membersOnly':questJson['quests'][index]['members'],
                             'eligible':questJson['quests'][index]['userEligible'],
                             'message':None
                                 })
        
        #ask the user if they want to find out more details if they are eligible for the quest
        if questJson['quests'][index]['userEligible'] is True:
            questDetails['message'] = 'You are eligible to start this quest. Do you want to know what to do next?'
            
            #send/recieve
            self.socket.send_json(questDetails)
            message = self.socket.recv_json()
            
            if message['answer'] == 'yes':
                self.userIsEligible(questName)
        else:
            questDetails['eligible'] = 'You are NOT eligible to start this quest, yet.'
        
    
    def userIsEligible(self, questName):
        #For reference: https://www.crummy.com/software/BeautifulSoup/bs4/doc/
        
        questName = quote(questName)
        questName = questName.replace(' ', '_')
        url = f'https://oldschool.runescape.wiki/api.php?action=parse&page={questName}&format=json'
        response = requests.get(url)
        
        data = response.json()['parse']['text']['*']
        soup = BeautifulSoup(data, 'html.parser')
        
        
        questDetailsHeaders = [th.get_text(strip=True) for th in soup.find_all("th", class_="questdetails-header")]
        questDetailsinfo = [td.get_text(strip=True) for td in soup.find_all("td", class_="questdetails-info")]

        quest = {}

        for item in range(len(questDetailsHeaders)):
            quest.update({questDetailsHeaders[item] : questDetailsinfo[item]})
            
        self.socket.send_json(quest)
    

    
if __name__ == '__main__':
    tracker = QuestTracker()
    tracker.main()
# false user: vcx
# test user: Prenzlauer

# User Story 1: Retrieve Completed and Uncompleted Quests
    # As a player, I want to retrieve my completed and uncompleted quests so that I can plan my next adventure in Old School RuneScape.


# User Story 2: Fetch Quest Requirements for a Specific Quest
    # As a player, I want to check the requirements for a specific quest so that I can see what skills, items, and prerequisites I need before starting it.


# User Story 3: 
    # As a player, I want to check which quests I am eligible to start so that I can decide what to do next.