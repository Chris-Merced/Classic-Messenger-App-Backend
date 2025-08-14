"use strict";
const { signupHandler } = require('../../controllers/signupController');
jest.mock('../../db/queries', () => ({
    addUser: jest.fn(),
}));
jest.mock('argon2', () => ({
    hash: jest.fn(),
}));
const db = require('../../db/queries');
const argon2 = require('argon2');
function resDouble() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}
describe('signupController Unit Testing for Crucial Functions', () => {
    afterEach(jest.clearAllMocks);
    test('happy path → hashes pwd, inserts user, returns 201', async () => {
        argon2.hash.mockResolvedValue('hashed-pw');
        db.addUser.mockResolvedValue();
        const req = {
            body: { username: 'Alice', password: 'pa$$', email: 'a@b.c' },
        };
        const res = resDouble();
        await signupHandler(req, res);
        expect(argon2.hash).toHaveBeenCalledWith('pa$$');
        expect(db.addUser).toHaveBeenCalledWith({
            username: 'Alice',
            email: 'a@b.c',
            password: 'hashed-pw',
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'User Created Successfully',
        });
    });
    test('duplicate username → catches error and returns 409', async () => {
        argon2.hash.mockResolvedValue('hashed-pw');
        db.addUser.mockRejectedValue(new Error('Username already exists'));
        const req = {
            body: { username: 'Bob', password: 'pw', email: 'b@c.d' },
        };
        const res = resDouble();
        await signupHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Username already exists',
        });
    });
});
//# sourceMappingURL=signupController.test.js.map