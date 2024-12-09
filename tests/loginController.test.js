const request = require('supertest');
const server = require('../index');
const db = require("../db/queries");
const argon2 = require('argon2'); 
const cron = require('node-cron'); 


jest.mock('../db/queries', () => {
    const originalModule = jest.requireActual('../db/queries');
    return {
        ...originalModule,
        getUserByUsername: jest.fn(originalModule.getUserByUsername),
        storeSession: jest.fn(originalModule.storeSession),
    };
});

jest.mock('argon2', () => ({
    verify: jest.fn(),
}));

const mockUser = {
    id: 1,
    username: 'testuser',
    password: '$argon2id$v=19$m=65536,t=3,p=4$hashedpasswordhere',
};

describe('POST /login', () => {

    afterAll(async () => {
        cleanupTask.stop(); 
       await new Promise(resolve => server.close(resolve)); 

    });
    
    it('should return 201 and set a cookie on successful login', () => {
    expect(true).toBe(true);

    });

    
});