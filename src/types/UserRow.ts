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

