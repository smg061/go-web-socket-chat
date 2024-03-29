package main

import (
	"log"
	"net/http"
	"os"
	"socket-go-stuff/cmd/internal/handlers"
)

type application struct {
	errorLog *log.Logger
	infoLog *log.Logger
}

func main() {
	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate | log.Ltime| log.Lshortfile)
	app := &application{
		errorLog: errorLog,
		infoLog: infoLog,
	}
	app.infoLog.Println("Starting channel listener")
	go handlers.ListenToWsChannel()
	app.infoLog.Println("Starting web server on port :8000")
	
	routes  := routes()
	err := http.ListenAndServe(":8000", routes)
	log.Fatal(err)
}