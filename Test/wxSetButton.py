import json,configparser,os,re
import urllib.request

def getConfig(section, key):
    config = configparser.ConfigParser()
    path = os.path.split(os.path.realpath(__file__))[0] + '/url.conf'
    config.read(path)
    return config.get(section, key)

PUBLIC = {
    "req_url" : getConfig("url","req_url")
}

buttonJson = {
    "button":[
        {    
            "type":"view",
            "name":"颜值打分",
            "url":PUBLIC["req_url"] + "py/static/face/faceGradeGuide.html",
        }
    ]
}

class wxSetButton(object):
    def __init__(self):
        self.getAssessToken()
    def getAssessToken(self):
        req = urllib.request.Request("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx73648417a7f020b2&secret=99c1a2788f166198b991c688bc19bd8c")
        res = urllib.request.urlopen(req)
        res_data =  json.loads(res.read())
        self.assess_token = res_data['access_token']
        self.setButton()
    def setButton(self):
        data = re.sub(r'\'', "\"",str(buttonJson)).encode("utf-8")
        req = urllib.request.Request("https://api.weixin.qq.com/cgi-bin/menu/create?access_token="+self.assess_token,data)
        res = urllib.request.urlopen(req)
        res_data = json.loads(res.read())
        print(res_data)

wxSetButton()