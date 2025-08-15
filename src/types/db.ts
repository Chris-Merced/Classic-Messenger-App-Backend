export interface UserRow {
    id: number;
    username: string;
    password: string; //hashed
    email: string | null;
    is_admin: boolean | null;
    created_at: Date | null;
    is_public: boolean | null;
    profile_picture: string | null;
    about_me: string | null;
}

export interface BlockedRow{
    user_id: number;
    blocked_id: number;
}

export interface ConversationParticipantsRow{
    id: number;
    conversation_id: number | null;
    user_id: number | null;
    added_at: Date | null;
}

export interface ConversationsRow{
    id: number;
    name: string | null;
    is_group: boolean | null;
    created_at: Date;
}

export interface FriendRequestsRow{
    user_id: number;
    request_id: number;
    status: string | null;
}

export interface FriendsRow{
    user_id: number;
    friend_id: number;
}








