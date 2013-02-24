#!/bin/bash

LINE_PDF_LIST=linePDFs.json

cd ./AntibesBusCrawler
rm $LINE_PDF_LIST

# get the bus line pdf link
scrapy crawl LinePDFSpider -o $LINE_PDF_LIST -t json

# push the result to the git repository
pwd
git add ./$LINE_PDF_LIST
git commit -m "bus line pdf list crawled in $(date +%s)"
git push