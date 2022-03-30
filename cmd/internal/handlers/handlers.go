package handlers

import (
	"fmt"
	"log"
	"net/http"
	"sort"
	"github.com/CloudyKit/jet/v6"
	"github.com/gorilla/websocket"
)


var wsChan = make(chan WsPayload)

var clients = make(map[WebSocketConnection]string)


var views = jet.NewSet(
	jet.NewOSFileSystemLoader("./html"),
	jet.InDevelopmentMode(),
)

func Home(w http.ResponseWriter, r *http.Request) {
	err := renderPage(w, "home.jet", nil)
	if err != nil {
		log.Println(err)
	}
}

var upgradeConnection = websocket.Upgrader {
	ReadBufferSize: 1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},	
}

type WsJsonResponse struct {
	Action string `json:"action"`
	Message string `json:"message"`
	MessageType string `json:"message_type"`
	UserMessage UserMessage `json:"user_message"`
	ConnectedUsers []string `json:"connected_users"`
}

type UserMessage struct {
	MessageBody string `json:"message"`
	User string `json:"user"`
}

type WebSocketConnection struct {
	*websocket.Conn
}

type WsPayload struct {
	Action	string		`json:"action"`
	Username string		`json:"username"`
	Message string		`json:"message"`
	MessageType string	`json:"message_type"`
	Conn WebSocketConnection `json:"-"`
}

func WsEndpoint(w http.ResponseWriter, r *http.Request) {
	ws, err := upgradeConnection.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}
	log.Println("Client connected to endpoint")
	var response WsJsonResponse
	response.Message = `<em><small> Connected to server </small> </em>`
	conn := WebSocketConnection  {Conn: ws}
	err = ws.WriteJSON(response)
	if err != nil{
		log.Println(err)
	}
	go ListenForWs(&conn)
}

func ListenForWs(conn *WebSocketConnection) {
	defer func() {
		if r := recover(); r !=nil {
			log.Println("Error", fmt.Sprintf("%v",r))
		}
	}()
	var payload WsPayload
	for {
		err := conn.ReadJSON(&payload)
		if err != nil {
			// do nothing
		} else {
			payload.Conn = *conn
			wsChan <- payload
		}
	}
}

func ListenToWsChannel() {
	var response WsJsonResponse
	for {
		e := <- wsChan
		fmt.Println(e.Action)
		switch e.Action {
		case "username":
			// get a list of all user and send it back via broadcast
			clients[e.Conn] = e.Username
			users := getUserList()
			response.Action = "list_users"
			response.ConnectedUsers = users
			broadcastToAll(response)
		case "left":
			response.Action = "list_users"
			delete(clients, e.Conn)
			users:= getUserList()
			response.ConnectedUsers = users
			broadcastToAll(response)
		case "broadcast_client":
			response.Action = "broadcast_server"
			response.Message = fmt.Sprintf("user: %s message: %s", e.Username, e.Message)
			response.UserMessage.MessageBody = e.Message
			response.UserMessage.User = e.Username
			broadcastToAll(response)
		}
		// response.Message = fmt.Sprintf("Some message and action was %s", e.Action)
		// broadcastToAll(response)
	}
}

func getUserList() []string {
	var userList []string
	for _, val := range clients {
		if val == "" {
			continue;
		}
		userList = append(userList, val)
	}
	sort.Strings(userList)
	return userList
}
func broadcastToAll(response WsJsonResponse) {
	for client := range clients {
		err:= client.WriteJSON(response)
		if err!=nil {
			log.Println("websocket err")
			_= client.Close()
			delete(clients, client)
		}
	}
}

func renderPage(w http.ResponseWriter, tmpl string, data jet.VarMap) error { 
	view, err := views.GetTemplate(tmpl)

	if err != nil {
		log.Println(err)
		return err
	}
	err = view.Execute(w, data, nil)
	if err != nil {
		log.Println(err)
		return err
	}

	return nil
}