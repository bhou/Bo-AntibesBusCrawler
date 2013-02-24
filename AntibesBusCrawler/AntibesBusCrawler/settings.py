# Scrapy settings for AntibesBusCrawler project
#
# For simplicity, this file contains only the most important settings by
# default. All the other settings are documented here:
#
#     http://doc.scrapy.org/topics/settings.html
#

BOT_NAME = 'AntibesBusCrawler'
BOT_VERSION = '1.0'

SPIDER_MODULES = ['AntibesBusCrawler.spiders']
NEWSPIDER_MODULE = 'AntibesBusCrawler.spiders'
USER_AGENT = '%s/%s' % (BOT_NAME, BOT_VERSION)

