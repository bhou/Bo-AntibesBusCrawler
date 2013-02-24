from scrapy.spider import BaseSpider
from scrapy.selector import HtmlXPathSelector
from scrapy.http import Request
from scrapy import log
from urlparse import urlparse

from AntibesBusCrawler.items import LinePDFItem

class LinePDFSpider(BaseSpider):
	name = "LinePDFSpider"
	allowed_domains = ["envibus.fr"]
	start_urls = [
		"http://envibus.fr/ligne_ville.asp?id=1"
	]

	def parse(self, response):
		# the html selector
		hxs = HtmlXPathSelector(response)

		links = hxs.select('//table[@class="texte"]/tr/td/a')
		#self.log(links.extract())

		for link in links:
			detailLink = link.select('.//@href')[0]

			if detailLink.extract()[:12] == 'ligne_detail':
				#self.log(detailLink.extract())
				# process the link page
				self.log('http://envibus.fr/'+detailLink.extract())
				yield Request('http://envibus.fr/'+detailLink.extract(), callback=self.parse_ligne)

	def parse_ligne(self, response):
		### parse the line details
		hxs = HtmlXPathSelector(response)
		
		# parse the line name
		lineName = hxs.select('//option[@selected]/text()')
		self.log(lineName[0].extract())
		
		# parse the pdf link
		pdfLink = hxs.select('//table[@class="texte"]/tr/td/a/@href')
		self.log(pdfLink[0].extract())

		linePDFItem = LinePDFItem()
		linePDFItem['name'] = lineName[0].extract()
		linePDFItem['url'] = 'http://envibus.fr/'+pdfLink[0].extract()
		yield linePDFItem