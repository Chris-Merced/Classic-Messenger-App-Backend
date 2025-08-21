export interface Message{
    type: string;
    message: string;
    registration: boolean;
    conversationName: string | null;
    conversationID: number;
    user: string;
    userID: number;
    reciever: string[];
    time: string;
}