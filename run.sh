#!/bin/bash

LINE_PDF_LIST=linePDFs.json
STOP_LINE_LIST=stopLines.json

cd ./AntibesBusCrawler
rm $LINE_PDF_LIST
rm $STOP_LINE_LIST

# get the bus line pdf link
scrapy crawl LinePDFSpider -o $LINE_PDF_LIST -t json

# push the result to the git repository
pwd
git add ./$LINE_PDF_LIST
git commit -m "bus line pdf list crawled in $(date +%s)"
git push

# get the bus stop and bus lines pass it
scrapy crawl RealTimeScheduleSpider -o $STOP_LINE_LIST -t json
# push the result to the git repository
pwd
git add ./$STOP_LINE_LIST
git commit -m "bus stop line list crawled in $(date +%s)"
git push