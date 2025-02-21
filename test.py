# import requests
# from urllib.parse import quote
# from bs4 import BeautifulSoup

# questName = quote("Cook's Assistant")

# questName = questName.replace(' ', '_')

# url = f'https://oldschool.runescape.wiki/api.php?action=parse&page={questName}&format=json'
# response = requests.get(url)

# data = response.json()['parse']['text']['*']
# soup = BeautifulSoup(data, 'html.parser')

# #https://www.crummy.com/software/BeautifulSoup/bs4/doc/
# questDetailsHeaders = [th.get_text(strip=True) for th in soup.find_all("th", class_="questdetails-header")]
# questDetailsinfo = [td.get_text(strip=True) for td in soup.find_all("td", class_="questdetails-info")]

# quest = {}

# for item in range(len(questDetailsHeaders)):
#     quest.update({questDetailsHeaders[item] : questDetailsinfo[item]})

# print(quest)

import zmq

class questTester():
    def __init__(self):
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REQ)
        self.socket.connect("tcp://localhost:5556")
        
    def main(self):
        data = {}
        data.update({'userName': input('Enter user name:'), 'requestType':'all quests'})
        self.socket.send_json(data)
        
        data = self.socket.recv_json()
        
        for quest in range(len(data['questList'])):
            print(f"{quest} - {data['questList'][quest]}")
            
        userInput =int(input('Enter a quest number:'))
        if userInput >= 0 or userInput <= len(data['questList']):
            data.update({'questName': data['questList'][userInput]})
        else:
            data.update({'questName': None})
            
        self.socket.send_json(data)
        
        
        message = self.socket.recv_json()
        if message['eligible'] is True:
            print(message['message'])
            userInput = int(input('1-Yes\n2-No\n'))
            if userInput == 1:
                data.update({'answer':'yes'})
                #send/receive                
                self.socket.send_json(data)
                message = self.socket.recv_json()
            else:
                data.update({'answer':'no'})
                self.socket.send_json(data) 
                

        
        print(message)
        



if __name__ == '__main__':
    tester = questTester()
    tester.main()
    # string = "Witch's Potion (miniquest)"
    # string = 'Vengeance (saga)'
    # print(len('(miniquest)'))
    # print(string[-7:len(string)])
    # print(string[:-7])