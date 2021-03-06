# Define here the models for your scraped items
#
# See documentation in:
# http://doc.scrapy.org/topics/items.html

from scrapy.item import Item, Field

class LinePDFItem(Item):
	# define the fields for your item here like:
	name = Field()
	url = Field()

class StopItem(Item):
	# define the fields for the Stop
	name = Field()
	code = Field()
	directions = Field()