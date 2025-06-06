const { loginHandler } = require('../../controllers/loginController')

jest.mock('../../db/queries', () => ({
  getUserByUsername: jest.fn(),
  storeSession: jest.fn(),
}))
jest.mock('argon2', () => ({ verify: jest.fn() }))

const db = require('../../db/queries')
const argon2 = require('argon2')

function mockRes() {
  const res = {}
  res.cookie = jest.fn()
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn()
  return res
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('loginHandler Unit Testing for Crucial Functions ', () => {
  test('valid credentials → sets cookie, stores session, returns 201', async () => {
    db.getUserByUsername.mockResolvedValue({
      id: 42,
      username: 'Alice',
      password: 'hashed-pw',
    })
    argon2.verify.mockResolvedValue(true)

    const req = { body: { username: 'Alice', password: 'secret' } }
    const res = mockRes()

    await loginHandler(req, res)

    expect(argon2.verify).toHaveBeenCalledWith('hashed-pw', 'secret')
    expect(db.storeSession).toHaveBeenCalledWith(42, expect.any(String))
    expect(res.cookie).toHaveBeenCalledWith(
      'sessionToken',
      expect.stringContaining('"sessionID":'),
      expect.objectContaining({ httpOnly: true }),
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ id: 42, username: 'Alice' })
  })

  test('wrong password → 401 & “Incorrect Password”', async () => {
    db.getUserByUsername.mockResolvedValue({
      id: 7,
      username: 'Bob',
      password: 'hashed-pw',
    })
    argon2.verify.mockResolvedValue(false)

    const req = { body: { username: 'Bob', password: 'bad' } }
    const res = mockRes()

    await loginHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Incorrect Password' })

    expect(db.storeSession).not.toHaveBeenCalled()
    expect(res.cookie).not.toHaveBeenCalled()
  })

  test('unknown user → 404', async () => {
    db.getUserByUsername.mockResolvedValue(undefined)

    const req = { body: { username: 'Ghost', password: 'foo' } }
    const res = mockRes()

    await loginHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Sorry there is no user that matches those credentials',
    })
  })
})
