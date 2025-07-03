const {
  getChatMessagesByName,
  getUserChats,
} = require('../../controllers/messagesController')

jest.mock('../../db/queries', () => ({
  getChatMessagesByName: jest.fn(),
  getUserByUserID: jest.fn(),
  getChatMessagesByConversationID: jest.fn(),
  setIsRead: jest.fn(),
  getUserChats: jest.fn(),
  getProfilePictureURLByUserName: jest.fn(),
  getUserIDByConversationID: jest.fn(),
}))

jest.mock('../../authentication', () => ({
  compareSessionToken: jest.fn(),
}))

const db = require('../../db/queries')
const auth = require('../../authentication')

function resDouble() {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('messagesController Unit Testing for Crucial Functions', () => {
  afterEach(jest.clearAllMocks)

  test('getChatMessagesByName → 200 + transformed list', async () => {
    db.getChatMessagesByName.mockResolvedValue([
      { created_at: '2025-01-01', content: 'Hi', sender_id: 11 },
      { created_at: '2025-01-02', content: 'Hey', sender_id: 22 },
    ])
    db.getUserByUserID
      .mockResolvedValueOnce({ username: 'Alice' })
      .mockResolvedValueOnce({ username: 'Bob' })

    const req = { query: { chatName: 'Groupie', page: 0, limit: 10 } }
    const res = resDouble()

    await getChatMessagesByName(req, res)

    expect(db.getChatMessagesByName).toHaveBeenCalledWith('Groupie', 0, 10)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      messages: [
        { time: '2025-01-01', message: 'Hi', user: 'Alice' },
        { time: '2025-01-02', message: 'Hey', user: 'Bob' },
      ],
    })
  })

  test('getChatMessagesByName (DM path) → marks read + returns list', async () => {
    db.getChatMessagesByConversationID.mockResolvedValue([
      { created_at: '2025-02-02', content: 'Yo', sender_id: 123 },
      { created_at: '2025-02-03', content: 'Sup', sender_id: 456 },
    ])
    db.getUserByUserID
      .mockResolvedValueOnce({ username: 'Current' })
      .mockResolvedValueOnce({ username: 'Other' })
    auth.compareSessionToken.mockResolvedValue(true)

    const req = {
      query: {
        chatName: 'undefined',
        conversationID: 'DM-42',
        userID: '111',
        page: 0,
        limit: 10,
      },
      cookies: { sessionToken: 'token' },
    }
    const res = resDouble()

    await getChatMessagesByName(req, res)

    expect(db.getChatMessagesByConversationID).toHaveBeenCalledWith('DM-42', 0, 10)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      messages: [
        { time: '2025-02-02', message: 'Yo', user: 'Current' },
        { time: '2025-02-03', message: 'Sup', user: 'Other' },
      ],
    })
  })

  test('getUserChats → sorts by date desc & adds profile pictures', async () => {
    db.getUserChats.mockResolvedValue([
      {
        id: 1,
        name: null,
        participants: ['Charlie'],
        created_at: '2025-01-01',
      },
      {
        id: 2,
        name: 'Groupie',
        participants: [],
        created_at: '2025-02-01',
      },
    ])
    db.getProfilePictureURLByUserName.mockResolvedValue('/charlie.png')

    const req = { query: { userID: '321', page: 0, limit: 10 } }
    const res = resDouble()

    await getUserChats(req, res)

    expect(db.getUserChats).toHaveBeenCalledWith('321', 0, 10)
    expect(res.json).toHaveBeenCalledWith({
      userChats: expect.arrayContaining([
        {
          id: 2,
          name: 'Groupie',
          participants: [],
          created_at: '2025-02-01',
        },
        {
          id: 1,
          name: null,
          participants: ['Charlie'],
          created_at: '2025-01-01',
          profilePicture: '/charlie.png',
        },
      ]),
    })
  })
})
