import { useMemo, useState } from "react";

export type MessageAction = "list_users" | "broadcast_server" |"broadcast_client";
 export type UserMessage = {
    user: string,
    message: string

}
export type JsonPayload = {
    message: string,
    user_message: UserMessage,
    action: MessageAction,
    message_type: string,
    connected_users: string[]
}
const isBrowser = typeof window !== "undefined";

export const wsInstance = () => {
    const instance = useMemo(() => isBrowser ? new WebSocket("ws://127.0.0.1:8000/ws") : null, []);
    return [instance] as const;
} 
