import requests
from urllib.parse import quote
from bs4 import BeautifulSoup

questName = quote("Cook's Assistant")

questName = questName.replace(' ', '_')

url = f'https://oldschool.runescape.wiki/api.php?action=parse&page={questName}&format=json'
response = requests.get(url)

data = response.json()['parse']['text']['*']
soup = BeautifulSoup(data, 'html.parser')

#https://www.crummy.com/software/BeautifulSoup/bs4/doc/
questDetailsHeaders = [th.get_text(strip=True) for th in soup.find_all("th", class_="questdetails-header")]
questDetailsinfo = [td.get_text(strip=True) for td in soup.find_all("td", class_="questdetails-info")]

quest = {}

for item in range(len(questDetailsHeaders)):
    quest.update({questDetailsHeaders[item] : questDetailsinfo[item]})

print(quest)