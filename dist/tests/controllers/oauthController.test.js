"use strict";
const { oauthLogin, oauthSignup } = require('../../controllers/oauthController');
jest.mock('../../db/queries', () => ({
    checkEmailExists: jest.fn(),
    storeSession: jest.fn(),
    checkUsernameExists: jest.fn(),
    addUserOAuth: jest.fn(),
}));
const db = require('../../src/db/queries');
jest.mock('crypto', () => ({ randomUUID: () => 'uuid-123' }));
global.fetch = jest.fn();
function resDouble() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
}
afterEach(() => {
    jest.clearAllMocks();
    fetch.mockReset();
});
describe('OAuth Controller Unit Testing for Crucial Functions', () => {
    test('oauthLogin → 400 when no “code” is supplied', async () => {
        const req = { body: {} };
        const res = resDouble();
        await oauthLogin(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing Code' });
    });
    test('oauthLogin → existing user ⇒ sets cookie & 201', async () => {
        fetch
            .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue({ access_token: 'token-abc' }),
        })
            .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue({ email: 'alice@mail.com' }),
        });
        db.checkEmailExists.mockResolvedValue({ id: 42, username: 'Alice' });
        const req = { body: { code: 'oauth-code' } };
        const res = resDouble();
        await oauthLogin(req, res);
        expect(res.cookie).toHaveBeenCalledWith('sessionToken', JSON.stringify({ sessionID: 'uuid-123' }), expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ username: 'Alice', id: 42 });
        expect(db.storeSession).toHaveBeenCalledWith(42, 'uuid-123');
    });
    test('oauthLogin → “signup incomplete” when e-mail not found', async () => {
        fetch
            .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue({ access_token: 'tok' }),
        })
            .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue({ email: 'new@mail.com' }),
        });
        db.checkEmailExists.mockResolvedValue(false);
        const req = { body: { code: 'x' } };
        const res = resDouble();
        await oauthLogin(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: 'signup incomplete',
            message: 'Authentication passed but user is not in the system',
            email: 'new@mail.com',
        });
    });
    test('oauthSignup → 409 when username already exists', async () => {
        db.checkUsernameExists.mockResolvedValue(true);
        const req = { body: { username: 'Alice', email: 'alice@mail.com' } };
        const res = resDouble();
        await oauthSignup(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: 'Username already exists' });
    });
    test('oauthSignup → happy path ⇒ stores session & 201', async () => {
        db.checkUsernameExists.mockResolvedValue(false);
        db.addUserOAuth.mockResolvedValue(99);
        const req = { body: { username: 'Bob', email: 'bob@mail.com' } };
        const res = resDouble();
        await oauthSignup(req, res);
        expect(db.addUserOAuth).toHaveBeenCalledWith('bob@mail.com', 'Bob');
        expect(db.storeSession).toHaveBeenCalledWith(99, 'uuid-123');
        expect(res.cookie).toHaveBeenCalledWith('sessionToken', JSON.stringify({ sessionID: 'uuid-123' }), expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            username: 'Bob',
            id: 99,
            message: 'User Successfully Added',
        });
    });
});
//# sourceMappingURL=oauthController.test.js.map