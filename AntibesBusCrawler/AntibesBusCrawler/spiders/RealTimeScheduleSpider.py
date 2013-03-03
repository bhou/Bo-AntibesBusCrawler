from scrapy.spider import BaseSpider
from scrapy.selector import HtmlXPathSelector
from scrapy.http import Request
from scrapy import log
from urlparse import urlparse
import string


from AntibesBusCrawler.items import StopItem

class RealTimeScheduleSpider(BaseSpider):
	name = "RealTimeScheduleSpider"
	allowed_domains = ["tempsreel.envibus.fr"]

	def __init__(self, *args, **kwargs):
		super(RealTimeScheduleSpider, self).__init__(*args, **kwargs)
		self.start_urls = [kwargs.get('start_url')]

	# start_urls = [
	# 	# Antibes
	# 	"http://tempsreel.envibus.fr/list/?com_id=1&letter=*",
	# 	# Valbonne
	# 	"http://tempsreel.envibus.fr/list/?com_id=3&letter=*"
	# 	# "http://tempsreel.envibus.fr/?ptano=453$454$AMPHORES"
	# ]

	def parse(self, response):
		# the html selector
		hxs = HtmlXPathSelector(response)
		stopList = hxs.select('//div[@class="list"]/a')

		for stop in stopList:
			# process the stop 
			name = stop.select('.//text()')[0]
			link = stop.select('.//@href')[0]
			code = link.extract()[10:]

			self.log(name.extract())

			stopItem = StopItem()
			stopItem['name'] = name.extract()
			stopItem['code'] = code
			stopItem['directions'] = []

			request = Request('http://tempsreel.envibus.fr'+string.replace(link.extract(),'..', ''), callback=self.parseDirection)
			request.meta['item'] = stopItem
			yield request

	def parseDirection(self, response):
		# the html selector
		stopItem = response.meta['item']

		hxs = HtmlXPathSelector(response)

		lines = hxs.select('//div[@class="formulaire"]/table/tr')

		for line in lines:
			inputTag = line.select('.//input[@type="checkbox"]')
			if inputTag.select('.//@name')[0].extract() == 'ligno':
				code = inputTag.select('.//@value')[0].extract()

				lineNo = line.select('.//img//@alt')[0].extract()

				name = line.select('.//b/text()')
				if len(name) != 0:
					name = name[0].extract()
				else:
					name = ''

				self.log("code = "+code)
				self.log("lineNo = "+lineNo)
				self.log("name = "+name)

				direction = {}
				direction['name'] = name
				direction['lineNo'] = lineNo[6:]
				direction['code'] = code
				stopItem['directions'].append(direction)
			else:
				continue

		yield stopItem
