const express = require('express')
const axios = require('axios')
const app = express()

app.use(express.json())

const TOKEN = "fapd1GKA21TkpSGxhZtNryXL6MPpBL1/XcvWcDqRS0L6Sj044v6dJOreQpgfgOpHso1lGS0/tekAoKNZqReLzIaXSo0fqzetClOabzoHfddFB0P/fqWO5yBbEpKO6svvgzOYRO6KyIbL1L2BDSoR4gdB04t89/1O/w1cDnyilFU="

// ===== DATABASE =====
let groups = {}

function getGroup(id) {
  if (!groups[id]) {
    groups[id] = {
      antiLink: false,
      owner: null,
      admins: {
        high: [], // แอดมินระดับสูง
        mid: [],  // แอดมินทั่วไป
        low: []   // แอดมินระดับล่าง
      }
    }
  }
  return groups[id]
}

// ===== WEBHOOK =====
app.post('/webhook', async (req, res) => {
  const events = req.body.events

  for (let e of events) {

    if (e.type !== 'message') continue

    const text = e.message.text
    const replyToken = e.replyToken
    const groupId = e.source.groupId || e.source.roomId
    const userId = e.source.userId

    if (!groupId) continue

    const group = getGroup(groupId)

    // ตั้ง owner ครั้งแรก
    if (!group.owner) group.owner = userId

    const isOwner = userId === group.owner
    const isHigh = group.admins.high.includes(userId)
    const isMid = group.admins.mid.includes(userId)
    const isLow = group.admins.low.includes(userId)

    const isAdmin = isOwner || isHigh || isMid || isLow

    // ===== กันลิงก์ =====
    if (group.antiLink && text.includes('http')) {
      await reply(replyToken, '🚫 ห้ามส่งลิงก์')
      continue
    }

    // ===== สถานะ =====
    if (text === 'สถานะ') {
      await reply(replyToken, JSON.stringify(group))
    }

    // ===== เปิด/ปิดกันลิงก์ =====
    if (text === 'เปิดกันลิงก์') {
      if (!isOwner && !isHigh) {
        await reply(replyToken, '❌ เฉพาะเจ้าของ/แอดมินสูง')
        continue
      }
      group.antiLink = true
      await reply(replyToken, '🔒 เปิดกันลิงก์แล้ว')
    }

    if (text === 'ปิดกันลิงก์') {
      if (!isOwner && !isHigh) {
        await reply(replyToken, '❌ เฉพาะเจ้าของ/แอดมินสูง')
        continue
      }
      group.antiLink = false
      await reply(replyToken, '🔓 ปิดกันลิงก์แล้ว')
    }

    // ===== ตั้งแอดมินระดับ =====
    if (text.startsWith('ตั้งสูง')) {
      if (!isOwner) return reply(replyToken, '❌ เฉพาะเจ้าของ')

      const target = text.split(' ')[1]
      group.admins.high.push(target)

      await reply(replyToken, '👑 ตั้งแอดมินสูงแล้ว')
    }

    if (text.startsWith('ตั้งกลาง')) {
      if (!isOwner && !isHigh) return reply(replyToken, '❌ ต้องเป็นระดับสูง')

      const target = text.split(' ')[1]
      group.admins.mid.push(target)

      await reply(replyToken, '⭐ ตั้งแอดมินกลางแล้ว')
    }

    if (text.startsWith('ตั้งล่าง')) {
      if (!isOwner && !isHigh && !isMid) return reply(replyToken, '❌ ต้องเป็นระดับสูง/กลาง')

      const target = text.split(' ')[1]
      group.admins.low.push(target)

      await reply(replyToken, '🔹 ตั้งแอดมินล่างแล้ว')
    }

    // ===== ลบแอดมิน =====
    if (text.startsWith('ลบแอดมิน')) {
      if (!isOwner) return reply(replyToken, '❌ เฉพาะเจ้าของ')

      const target = text.split(' ')[1]

      group.admins.high = group.admins.high.filter(a => a !== target)
      group.admins.mid = group.admins.mid.filter(a => a !== target)
      group.admins.low = group.admins.low.filter(a => a !== target)

      await reply(replyToken, '🗑️ ลบแอดมินแล้ว')
    }

    // ===== เตะ =====
    if (text.startsWith('เตะ')) {
      if (!isAdmin) {
        await reply(replyToken, '❌ เฉพาะแอดมิน')
        continue
      }

      const target = text.split(' ')[1]
      await kick(groupId, target)

      await reply(replyToken, '👢 เตะแล้ว')
    }

  }

  res.sendStatus(200)
})

// ===== REPLY =====
async function reply(replyToken, text) {
  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    {
      replyToken,
      messages: [{ type: 'text', text }]
    },
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  )
}

// ===== KICK =====
async function kick(groupId, userId) {
  await axios.post(
    `https://api.line.me/v2/bot/group/${groupId}/members/${userId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    }
  )
}

// ===== START =====
app.listen(3000, () => {
  console.log('🔥 BOT เทพขั้นสุดพร้อมใช้งาน')
})