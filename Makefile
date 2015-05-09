PORT ?= 80
SERVER ?= swa.sh
BED ?= /usr/local/bed
build:; docker build -t bed .
run:; docker rm -f bed && docker run -d --name bed -p $(PORT):80 bed
push:; git push
deploy: build push; ssh -A swa.sh "cd $(BED) && git pull && make build run"
