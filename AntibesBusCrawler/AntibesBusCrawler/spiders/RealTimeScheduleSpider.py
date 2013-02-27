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
	start_urls = [
		# Antibes
		"http://tempsreel.envibus.fr/list/?com_id=1&letter=*",
		# Valbonne
		"http://tempsreel.envibus.fr/list/?com_id=3&letter=*"
	]

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

		for i in range(1, 3):
			direction = {}
			direction['name'] = 'testName'
			direction['lineNo'] = '1'
			direction['code'] = 'codeQQQ'

			stopItem['directions'].append(direction)
		#hxs = HtmlXPathSelector(response)
		#self.log("parse direction "+stopItem['name'])

		yield stopItem
