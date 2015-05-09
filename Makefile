PORT ?= 80
build:; docker build -t bed .
run:; docker rm -f bed && docker run -d --name bed -p $(PORT):80 bed

