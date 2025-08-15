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
    user_id: number | null;
    blocked_id: number | null;
}

export interface ConversationParticipantsRow{
    id: number;
    conversation_id: number | null;
    user_id: number | null;
    added_at: Date | null;
}



