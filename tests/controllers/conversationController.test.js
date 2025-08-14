const {
  checkDirectMessageConversation,
  addMessageToConversations,
  getOnlineUsers,
} = require('../../controllers/conversationController')

jest.mock('../../db/queries', () => ({
  checkIfPublic: jest.fn(),
  checkIfFriends: jest.fn(),
  checkDirectMessageConversationExists: jest.fn(),
  getUserByUsername: jest.fn(),
  checkIfBlocked: jest.fn(),
  addMessageToConversations: jest.fn(),
  setIsRead: jest.fn(),
}))

jest.mock('../../redisClient', () => ({
  redisPublisher: { hGet: jest.fn() },
  redisSubscriber: {},
}))

const db = require('../../src/db/queries')
const { redisPublisher } = require('../../src/redisClient')

function makeRes() {
  const json = jest.fn()
  const status = jest.fn(() => ({ json }))
  return { status, json }
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('conversationController Unit Testing for Crucial Functions', () => {
  test('returns 200 + id when profile is public', async () => {
    db.checkIfPublic.mockResolvedValue(true)
    db.checkDirectMessageConversationExists.mockResolvedValue(77)

    const req = { query: { userID: '1', profileID: '2' } }
    const res = makeRes()

    await checkDirectMessageConversation(req, res)

    expect(db.checkDirectMessageConversationExists).toHaveBeenCalledWith(
      '1',
      '2',
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.status().json).toHaveBeenCalledWith({ conversation_id: 77 })
  })

  test('blocks message when recipient has blocked the sender', async () => {
    db.getUserByUsername.mockResolvedValue({ id: 5 })
    db.checkIfBlocked.mockResolvedValue(true)

    const req = {
      body: {
        reciever: ['bob'],
        userID: 9,
        message: 'hi!',
      },
    }
    const res = makeRes()

    await addMessageToConversations(req, res)

    expect(db.addMessageToConversations).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  test('stores message when not blocked', async () => {
    db.getUserByUsername.mockResolvedValue({ id: 5 })
    db.checkIfBlocked.mockResolvedValue(false)
    db.addMessageToConversations.mockResolvedValue()

    const body = { reciever: ['bob'], userID: 9, message: 'hi!' }
    const req = { body }
    const res = makeRes()

    await addMessageToConversations(req, res)

    expect(db.addMessageToConversations).toHaveBeenCalledWith(
      JSON.stringify(body),
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('maps userList → online status from Redis', async () => {
    redisPublisher.hGet
      .mockResolvedValueOnce('true')
      .mockResolvedValueOnce('false')

    const req = { query: { userList: 'alice,bob' } }
    const res = makeRes()

    await getOnlineUsers(req, res)

    expect(redisPublisher.hGet).toHaveBeenCalledTimes(2)
    expect(redisPublisher.hGet).toHaveBeenNthCalledWith(
      1,
      'activeUsers',
      'alice',
    )
    expect(redisPublisher.hGet).toHaveBeenNthCalledWith(2, 'activeUsers', 'bob')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.status().json).toHaveBeenCalledWith({
      activeUsers: { alice: true, bob: false },
    })
  })
})
